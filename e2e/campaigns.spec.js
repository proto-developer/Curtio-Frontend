import { test, expect, routes } from './fixtures';

const MANAGER_HEADING = 'Campaigns Manager';
const FORM_HEADING = /create tracked link for a campaign/i;

const linkInCampaign = (over = {}) => ({
  _id: over._id || 'c1',
  originalUrl: over.originalUrl || 'https://example.com/landing',
  shortCode: over.shortCode || 'camp01',
  clicks: over.clicks ?? 12,
  preClicks: 0,
  active: over.active ?? true,
  createdAt: '2026-02-01T00:00:00.000Z',
  clickLogs: [],
  preClickLogs: [],
  labels: [],
  campaigns: over.campaigns || [],
});

async function openCampaigns(page, app) {
  await app.goto(routes.campaigns);
  await expect(page.getByRole('heading', { name: MANAGER_HEADING })).toBeVisible();
}

function trackUrlWrites(page) {
  const state = { count: 0 };
  page.on('request', (req) => {
    if (/\/api\/urls/.test(req.url()) && ['POST', 'PATCH'].includes(req.method())) state.count += 1;
  });
  return state;
}

test.describe('Campaigns overview', () => {
  test('opens with the manager heading, stat cards and the empty state', async ({ page, app }) => {
    await app.signIn('owner');
    app.api.urls = []; // no campaigns anywhere

    await openCampaigns(page, app);

    await expect(page.getByText('Your Marketing Campaigns')).toBeVisible();
    await expect(page.getByText('Total UTM Campaigns')).toBeVisible();
    await expect(page.getByText('No campaigns detected yet.').filter({ visible: true })).toBeVisible();
  });

  test('lists the campaigns the account already has', async ({ page, app }) => {
    await app.signIn('owner');
    app.api.urls = [
      linkInCampaign({ _id: 'a', shortCode: 'aaa111', clicks: 30, campaigns: [{ name: 'spring-sale', source: 'newsletter', medium: 'email' }] }),
      linkInCampaign({ _id: 'b', shortCode: 'bbb222', clicks: 5, campaigns: [{ name: 'holiday-2026', source: 'twitter', medium: 'social' }] }),
    ];

    await openCampaigns(page, app);

    await expect(page.getByText('No campaigns detected yet.')).toHaveCount(0);
    await expect(page.getByRole('row', { name: /spring-sale/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /holiday-2026/ })).toBeVisible();
  });
});

test.describe('Creating a campaign', () => {
  test('an owner creates a campaign and lands on its detail view', async ({ page, app }) => {
    await app.signIn('owner');
    app.api.urls = [];

    await openCampaigns(page, app);
    await page.getByRole('button', { name: /new campaign/i }).click();
    await expect(page.getByRole('heading', { name: FORM_HEADING })).toBeVisible();

    await page.getByPlaceholder('https://example.com/promo-landing').fill('https://example.com/promo');
    await page.getByPlaceholder('e.g. summer_2026').fill('launchweek');
    await page.getByRole('button', { name: 'Create Link' }).click();

    // The page switches straight to the new campaign's detail view.
    await expect(page.getByRole('heading', { name: 'Campaign: launchweek' })).toBeVisible();
    await expect(page.getByText('Campaign Links', { exact: true })).toBeVisible();

    // …and the created link really carries the utm_campaign tag.
    await expect(page.getByText(/utm_campaign=launchweek/).filter({ visible: true }).first()).toBeVisible();
  });

  test('an incomplete form does not submit', async ({ page, app }) => {
    await app.signIn('owner');
    app.api.urls = [];
    const writes = trackUrlWrites(page);

    await openCampaigns(page, app);
    await page.getByRole('button', { name: /new campaign/i }).click();
    await expect(page.getByRole('heading', { name: FORM_HEADING })).toBeVisible();

    // Campaign name only — the required destination URL is left blank.
    await page.getByPlaceholder('e.g. summer_2026').fill('nodest');
    await page.getByRole('button', { name: 'Create Link' }).click();

    await expect(page.getByRole('heading', { name: FORM_HEADING })).toBeVisible();
    expect(writes.count).toBe(0);
  });

  test('Cancel closes the create form', async ({ page, app }) => {
    await app.signIn('owner');
    app.api.urls = [];

    await openCampaigns(page, app);
    await page.getByRole('button', { name: /new campaign/i }).click();
    await expect(page.getByRole('heading', { name: FORM_HEADING })).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: FORM_HEADING })).toHaveCount(0);
    await expect(page.getByText('No campaigns detected yet.').filter({ visible: true })).toBeVisible();
  });

  test('a free user at the campaign limit gets the limit modal', async ({ page, app }) => {
    await app.signIn('freeUser');
    app.api.urls = [
      linkInCampaign({ campaigns: [{ name: 'only-one', source: '', medium: '' }] }),
    ];

    await openCampaigns(page, app);
    await page.getByRole('button', { name: /new campaign/i }).click();

    await expect(page.getByRole('heading', { name: 'Campaign Limit Reached' })).toBeVisible();
    await expect(page.getByRole('heading', { name: FORM_HEADING })).toHaveCount(0);
  });
});

test.describe('Viewing a campaign', () => {
  test('clicking a campaign opens its detail view and Back returns to the overview', async ({ page, app }) => {
    await app.signIn('owner');
    app.api.urls = [
      linkInCampaign({ shortCode: 'det001', clicks: 21, campaigns: [{ name: 'q1-push', source: 'newsletter', medium: 'email' }] }),
    ];

    await openCampaigns(page, app);
    await page.getByRole('row', { name: /q1-push/ }).click();

    await expect(page.getByRole('heading', { name: 'Campaign: q1-push' })).toBeVisible();
    await expect(page.getByText('Campaign Links', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /back to overview/i }).click();
    await expect(page.getByRole('heading', { name: MANAGER_HEADING })).toBeVisible();
    await expect(page.getByText('Your Marketing Campaigns')).toBeVisible();
  });
});

test.describe('Empty and error states do not crash the page', () => {
  test('an API failure shows an error banner, not a blank page', async ({ page, app }) => {
    await app.signIn('owner');
    await page.route(/\/api\/urls(\?.*)?$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Campaign service is down.' }),
      }),
    );

    await openCampaigns(page, app);

    await expect(page.getByText('Campaign service is down.')).toBeVisible();
    await expect(page.getByText('Your Marketing Campaigns')).toBeVisible();
  });

  test('a network failure is handled without crashing', async ({ page, app }) => {
    await app.signIn('owner');
    await page.route(/\/api\/urls(\?.*)?$/, (route) => route.abort());

    await openCampaigns(page, app);

    await expect(page.getByText(/Network error\. Could not retrieve link statistics\./)).toBeVisible();
    await expect(page.getByRole('heading', { name: MANAGER_HEADING })).toBeVisible();
  });
});
