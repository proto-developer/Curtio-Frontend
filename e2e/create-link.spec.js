import { test, expect, routes } from './fixtures';

const DESTINATION = 'https://example.com/product-launch';
const FORM_HEADING = /create your tracked link/i;

/** Count POST /urls attempts so "did not submit" can be asserted directly. */
function trackCreateRequests(page) {
  const state = { count: 0 };
  page.on('request', (req) => {
    if (req.method() === 'POST' && /\/api\/urls(\?|$)/.test(req.url())) state.count += 1;
  });
  return state;
}

async function openCreateForm(page) {
  // Wait for the dashboard to actually render before driving it — under
  // --headed with parallel workers the SPA can take a moment to hydrate.
  await expect(page.getByRole('heading', { name: 'My Links' })).toBeVisible();
  await page.getByRole('button', { name: /new link/i }).click();
  await expect(page.getByRole('heading', { name: FORM_HEADING })).toBeVisible();
}

const destinationInput = (page) => page.getByPlaceholder('https://your-long-url.com/...');
const createButton = (page) => page.getByRole('button', { name: 'Create Link' });

test.describe('Create link — valid input', () => {
  test.beforeEach(async ({ app }) => {
    // Start from an empty dashboard so the create form (not the quota modal)
    // opens and the new row is unambiguous.
    app.api.urls = [];
  });

  test('an owner creates a link and sees it appear in the table', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);
    await expect(page.getByText('No links yet')).toBeVisible();

    await openCreateForm(page);
    await destinationInput(page).fill(DESTINATION);
    await createButton(page).click();

    // Form closes on success…
    await expect(page.getByRole('heading', { name: FORM_HEADING })).toHaveCount(0);
    // …and the link is now a real row, flagged NEW.
    const row = page.getByRole('row', { name: /product-launch/ });
    await expect(row).toBeVisible();
    await expect(row.getByText(/NEW/)).toBeVisible();
    await expect(page.getByText('No links yet')).toHaveCount(0);
  });

  test('a free user can create their first link', async ({ page, app }) => {
    await app.signIn('freeUser');
    await app.goto(routes.links);

    await openCreateForm(page);
    await destinationInput(page).fill(DESTINATION);
    await createButton(page).click();

    await expect(page.getByRole('row', { name: /product-launch/ })).toBeVisible();
  });

  test('a custom alias becomes the short code', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);

    await openCreateForm(page);
    await destinationInput(page).fill(DESTINATION);
    await page.getByPlaceholder('my-link').fill('spring-sale');
    await createButton(page).click();

    await expect(page.getByRole('row', { name: /spring-sale/ })).toBeVisible();
  });

  test('advanced UTM parameters are appended to the destination', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);

    await openCreateForm(page);
    await destinationInput(page).fill(DESTINATION);
    await page.getByRole('button', { name: /show advanced options/i }).click();
    await page.getByPlaceholder('twitter').fill('newsletter');
    await createButton(page).click();

    await expect(page.getByRole('row', { name: /utm_source=newsletter/ })).toBeVisible();
  });

  test('the form is cleared after a successful create', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);

    await openCreateForm(page);
    await destinationInput(page).fill(DESTINATION);
    await createButton(page).click();
    await expect(page.getByRole('row', { name: /product-launch/ })).toBeVisible();

    await openCreateForm(page);
    await expect(destinationInput(page)).toHaveValue('');
    await expect(page.getByPlaceholder('my-link')).toHaveValue('');
  });
});

test.describe('Create link — invalid input', () => {
  test.beforeEach(async ({ app }) => {
    app.api.urls = [];
  });

  test('an empty destination shows a required error and does not submit', async ({ page, app }) => {
    await app.signIn('owner');
    const creates = trackCreateRequests(page);
    await app.goto(routes.links);

    await openCreateForm(page);
    await createButton(page).click();

    await expect(page.getByText('Destination URL is required.')).toBeVisible();
    await expect(page.getByRole('heading', { name: FORM_HEADING })).toBeVisible();
    await expect(destinationInput(page)).toHaveAttribute('aria-invalid', 'true');
    expect(creates.count).toBe(0);
  });

  test('free text that is not a URL is rejected', async ({ page, app }) => {
    await app.signIn('owner');
    const creates = trackCreateRequests(page);
    await app.goto(routes.links);

    await openCreateForm(page);
    await destinationInput(page).fill('just some text');
    await createButton(page).click();

    await expect(page.getByText(/valid URL including https/i)).toBeVisible();
    expect(creates.count).toBe(0);
  });

  test('a bare domain with no protocol is rejected', async ({ page, app }) => {
    await app.signIn('owner');
    const creates = trackCreateRequests(page);
    await app.goto(routes.links);

    await openCreateForm(page);
    await destinationInput(page).fill('example.com/pricing');
    await createButton(page).click();

    await expect(page.getByText(/valid URL including https/i)).toBeVisible();
    await expect(page.getByRole('row', { name: /pricing/ })).toHaveCount(0);
    expect(creates.count).toBe(0);
  });

  test('the error clears once the destination is corrected, then the create succeeds', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);

    await openCreateForm(page);
    await createButton(page).click();
    await expect(page.getByText('Destination URL is required.')).toBeVisible();

    await destinationInput(page).fill(DESTINATION);
    await expect(page.getByText('Destination URL is required.')).toHaveCount(0);

    await createButton(page).click();
    await expect(page.getByRole('row', { name: /product-launch/ })).toBeVisible();
  });

  test('a server-side rejection surfaces its message and keeps the form open', async ({ page, app }) => {
    app.api.createResult = { success: false, message: 'That custom alias is already taken.' };
    await app.signIn('owner');
    await app.goto(routes.links);

    await openCreateForm(page);
    await destinationInput(page).fill(DESTINATION);
    await page.getByPlaceholder('my-link').fill('taken');
    await createButton(page).click();

    await expect(page.getByText('That custom alias is already taken.')).toBeVisible();
    await expect(page.getByRole('heading', { name: FORM_HEADING })).toBeVisible();
  });
});

test.describe('Create link — form behaviour', () => {
  test.beforeEach(async ({ app }) => {
    app.api.urls = [];
  });

  test('the New Link button toggles the form open and closed', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);

    await expect(page.getByRole('heading', { name: 'My Links' })).toBeVisible();
    const toggle = page.getByRole('button', { name: /new link/i });
    await toggle.click();
    await expect(page.getByRole('heading', { name: FORM_HEADING })).toBeVisible();
    await toggle.click();
    await expect(page.getByRole('heading', { name: FORM_HEADING })).toHaveCount(0);
  });

  test('Cancel closes the form without creating a link', async ({ page, app }) => {
    await app.signIn('owner');
    const creates = trackCreateRequests(page);
    await app.goto(routes.links);

    await openCreateForm(page);
    await destinationInput(page).fill(DESTINATION);
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: FORM_HEADING })).toHaveCount(0);
    await expect(page.getByText('No links yet')).toBeVisible();
    expect(creates.count).toBe(0);
  });

  test('advanced options can be revealed and hidden again', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);

    await openCreateForm(page);
    await expect(page.getByPlaceholder('twitter')).toHaveCount(0);

    await page.getByRole('button', { name: /show advanced options/i }).click();
    await expect(page.getByPlaceholder('twitter')).toBeVisible();

    await page.getByRole('button', { name: /hide advanced options/i }).click();
    await expect(page.getByPlaceholder('twitter')).toHaveCount(0);
  });
});
