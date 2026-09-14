import { test, expect } from './fixtures';

/** Collect uncaught page exceptions (not console noise from aborted assets). */
function trackPageErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

const passwordField = (page) => page.getByLabel('Password', { exact: true });
const continueButton = (page) => page.getByRole('button', { name: /continue/i });

/* ────────────────────────────────────────────────────────────────
 * Marketing / public pages
 * ──────────────────────────────────────────────────────────────── */
const PUBLIC_PAGES = [
  { path: '/', heading: /one visitor/i },
  { path: '/features', heading: /a short link is simple/i },
  { path: '/accuracy', heading: /count clicks the honest way/i },
  { path: '/pricing', heading: 'Pricing Plan' },
  { path: '/terms-of-service', heading: /terms of service/i },
  { path: '/privacy-policy', heading: /privacy policy/i },
  { path: '/refund-policy', heading: /refund & return policy/i },
  { path: '/shipping-policy', heading: /shipping & service policy/i },
  { path: '/blog', heading: /insights on links, analytics & growth/i },
];

test.describe('Public pages load for anonymous visitors', () => {
  for (const { path, heading } of PUBLIC_PAGES) {
    test(`${path} renders its hero with no uncaught errors`, async ({ page, app }) => {
      const errors = trackPageErrors(page);

      await app.goto(path);

      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page.getByRole('contentinfo')).toBeVisible(); // footer
      expect(errors, `page errors on ${path}`).toEqual([]);
    });
  }

  test('the blog page settles instead of hanging on its loader', async ({ page, app }) => {
    await app.goto('/blog');
    await expect(page.getByRole('heading', { level: 1, name: /insights on links/i })).toBeVisible();
    await expect(page.getByText('Loading blog posts...')).toHaveCount(0);
  });

  test('an unknown path redirects to the homepage', async ({ page, app }) => {
    await app.goto('/no-such-page-exists');

    await expect(page).toHaveURL(`${app.baseURL}/`);
    await expect(page.getByRole('heading', { level: 1, name: /one visitor/i })).toBeVisible();
  });

  test('the navbar links between marketing pages', async ({ page, app }) => {
    await app.goto('/');

    await page.getByRole('banner').getByRole('link', { name: 'Pricing' }).click();

    await expect(page).toHaveURL(/\/pricing$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Pricing Plan' })).toBeVisible();
  });
});

/* ────────────────────────────────────────────────────────────────
 * Password-protected link screen — /password/:shortCode
 * ──────────────────────────────────────────────────────────────── */
test.describe('Password-protected link screen', () => {
  test('shows the password prompt', async ({ page, app }) => {
    await app.goto('/password/secret123');

    await expect(page.getByRole('heading', { name: 'This link is protected' })).toBeVisible();
    await expect(page.getByText('Enter the password to continue to the destination.')).toBeVisible();
    await expect(passwordField(page)).toBeVisible();
  });

  test('an empty submit is caught client-side with no API call', async ({ page, app }) => {
    let verifyCalls = 0;
    page.on('request', (req) => {
      if (req.method() === 'POST' && /\/api\/public\/verify\//.test(req.url())) verifyCalls += 1;
    });

    await app.goto('/password/secret123');
    await continueButton(page).click();

    await expect(page.getByText('Please enter the password for this link.')).toBeVisible();
    expect(verifyCalls).toBe(0);
  });

  test('a wrong password shows the error and clears the field', async ({ page, app }) => {
    app.api.publicVerify = {
      status: 401,
      body: { success: false, message: 'Incorrect password. Please try again.' },
    };

    await app.goto('/password/secret123');
    await passwordField(page).fill('wrong-one');
    await continueButton(page).click();

    await expect(page.getByText('Incorrect password. Please try again.')).toBeVisible();
    await expect(passwordField(page)).toHaveValue('');
    await expect(page.getByRole('heading', { name: 'This link is protected' })).toBeVisible();
  });

  test('a server message on a 401 is passed through verbatim', async ({ page, app }) => {
    app.api.publicVerify = {
      status: 401,
      body: { success: false, message: 'Too many attempts — wait 5 minutes.' },
    };

    await app.goto('/password/secret123');
    await passwordField(page).fill('wrong');
    await continueButton(page).click();

    await expect(page.getByText('Too many attempts — wait 5 minutes.')).toBeVisible();
  });

  test('a correct password continues to the destination URL', async ({ page, app }) => {
    app.api.publicVerify = {
      status: 200,
      body: { success: true, redirectUrl: `${app.baseURL}/pricing` },
    };

    await app.goto('/password/secret123');
    await passwordField(page).fill('correct-horse');
    await continueButton(page).click();

    await expect(page).toHaveURL(/\/pricing$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Pricing Plan' })).toBeVisible();
  });

  test('a disabled or missing link shows the Unavailable screen with a way home', async ({ page, app }) => {
    app.api.publicVerify = {
      status: 404,
      body: { success: false, message: 'This link no longer exists.' },
    };

    await app.goto('/password/gone');
    await passwordField(page).fill('anything');
    await continueButton(page).click();

    await expect(page.getByRole('heading', { name: 'Link Unavailable' })).toBeVisible();
    await expect(page.getByText('This link no longer exists.')).toBeVisible();

    const home = page.getByRole('link', { name: /go to curtio homepage/i });
    await expect(home).toBeVisible();
    await home.click();
    await expect(page).toHaveURL(`${app.baseURL}/`);
  });

  test('a network failure is reported to the visitor', async ({ page, app }) => {
    await page.route(/\/api\/public\/verify\//, (route) => route.abort());

    await app.goto('/password/secret123');
    await passwordField(page).fill('correct-horse');
    await continueButton(page).click();

    await expect(page.getByText('Network error. Please try again.')).toBeVisible();
  });
});
