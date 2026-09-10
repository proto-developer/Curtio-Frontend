import { test, expect, routes } from './fixtures';

const CREATE_FORM = /create your tracked link/i;
const upgradeDialog = (page) => page.getByRole('dialog', { name: 'Upgrade plan' });
const planCard = (page, name) =>
  page.locator('article').filter({ has: page.getByRole('heading', { name, exact: true }) });

/** Open the create/limit flow from a rendered dashboard (waits for hydration). */
async function clickNewLink(page) {
  await expect(page.getByRole('heading', { name: 'My Links' })).toBeVisible();
  await page.getByRole('button', { name: /new link/i }).click();
}

/* ────────────────────────────────────────────────────────────────
 * Dashboard — hitting the free link limit
 * ──────────────────────────────────────────────────────────────── */
test.describe('Dashboard link limit', () => {
  test('a free user at their link limit gets the limit modal, not the create form', async ({ page, app }) => {
    await app.signIn('freeUser'); // fixture default: 1 existing link == the free cap
    await app.goto(routes.links);

    await clickNewLink(page);

    await expect(page.getByRole('heading', { name: 'Link Limit Reached' })).toBeVisible();
    await expect(
      page.getByText('Free includes 1 tracked link. Upgrade to Plus to create unlimited tracked links.'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: CREATE_FORM })).toHaveCount(0);
  });

  test('the limit modal "View Plans" button opens the upgrade modal', async ({ page, app }) => {
    await app.signIn('freeUser');
    await app.goto(routes.links);

    await clickNewLink(page);
    await page.getByRole('button', { name: 'View Plans' }).click();

    await expect(page.getByRole('heading', { name: 'Link Limit Reached' })).toHaveCount(0);
    await expect(upgradeDialog(page)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Upgrade your plan' })).toBeVisible();
  });

  test('the limit modal "Not now" button dismisses it without upgrading', async ({ page, app }) => {
    await app.signIn('freeUser');
    await app.goto(routes.links);

    await clickNewLink(page);
    await page.getByRole('button', { name: 'Not now' }).click();

    await expect(page.getByRole('heading', { name: 'Link Limit Reached' })).toHaveCount(0);
    await expect(upgradeDialog(page)).toHaveCount(0);
  });

  test('a lapsed subscriber at the limit sees the expired copy', async ({ page, app }) => {
    await app.signIn('freeUser');
    app.api.plan.subscriptionStatus = 'past_due'; // record exists but has lapsed

    await app.goto(routes.links);
    await clickNewLink(page);

    await expect(page.getByRole('heading', { name: 'Plus Plan Expired' })).toBeVisible();
    await expect(
      page.getByText('Your Plus plan has expired, so you are back to 1 tracked link. Subscribe again to create more links.'),
    ).toBeVisible();
  });

  test('a server-side plan-limit rejection surfaces the limit modal', async ({ page, app }) => {
    await app.signIn('freeUser');
    app.api.urls = []; // form opens (client thinks there is room)…
    app.api.createResult = { success: false, planLimitReached: true }; // …server disagrees

    await app.goto(routes.links);
    await clickNewLink(page);
    await page.getByPlaceholder('https://your-long-url.com/...').fill('https://example.com/late');
    await page.getByRole('button', { name: 'Create Link' }).click();

    await expect(page.getByRole('heading', { name: 'Link Limit Reached' })).toBeVisible();
    await expect(page.getByRole('heading', { name: CREATE_FORM })).toHaveCount(0);
  });

  test('an owner never hits a link limit', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);

    await clickNewLink(page);

    await expect(page.getByRole('heading', { name: CREATE_FORM })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Link Limit Reached' })).toHaveCount(0);
  });
});

/* ────────────────────────────────────────────────────────────────
 * Sidebar — plan usage card
 * ──────────────────────────────────────────────────────────────── */
test.describe('Sidebar plan card', () => {
  test('a free user sees the Free Plan meter with their usage', async ({ page, app }) => {
    await app.signIn('freeUser'); // 1 link by default
    await app.goto(routes.links);

    await expect(page.getByText('Free Plan', { exact: true })).toBeVisible();
    await expect(page.getByText('1/1 links used')).toBeVisible();
    await expect(page.getByText('0/1 campaigns used')).toBeVisible();
  });

  test('a free user who has spent both quotas gets the sidebar Upgrade button', async ({ page, app }) => {
    await app.signIn('freeUser');
    app.api.plan.campaignsCount = 1; // link quota is already 1/1 from the default data

    await app.goto(routes.links);

    const upgrade = page.getByRole('button', { name: 'Upgrade to Plus' });
    await expect(upgrade).toBeVisible();
    await upgrade.click();
    await expect(upgradeDialog(page)).toBeVisible();
  });

  test('a lapsed subscriber sees the "Plus Plan Expired" card and can re-open checkout', async ({ page, app }) => {
    await app.signIn('freeUser');
    app.api.plan.subscriptionStatus = 'canceled';

    await app.goto(routes.links);

    await expect(page.getByText('Plus Plan Expired')).toBeVisible();
    await page.getByRole('button', { name: 'Subscribe Again' }).click();
    await expect(upgradeDialog(page)).toBeVisible();
  });

  test('an active Plus subscriber sees the Plus Plan card and no upgrade button', async ({ page, app }) => {
    await app.signIn('premiumUser');
    await app.goto(routes.links);

    await expect(page.getByText('Plus Plan', { exact: true })).toBeVisible();
    await expect(page.getByText(/\/Unlimited links used/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upgrade to Plus' })).toHaveCount(0);
  });

  test('an owner sees no plan card at all', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);

    await expect(page.getByText('Admin', { exact: true })).toBeVisible();
    await expect(page.getByText('Free Plan', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Plus Plan', { exact: true })).toHaveCount(0);
  });
});

/* ────────────────────────────────────────────────────────────────
 * Pricing page — plan info matches the signed-in user
 * ──────────────────────────────────────────────────────────────── */
test.describe('Pricing page', () => {
  test('a logged-out visitor sees no current-plan badge and the sign-up CTA', async ({ page, app }) => {
    await app.goto(routes.pricing);

    await expect(page.getByRole('heading', { name: 'Pricing Plan' })).toBeVisible();
    await expect(page.getByText('Current Plan')).toHaveCount(0);
    await expect(planCard(page, 'Free').getByRole('link', { name: /get started free/i })).toBeVisible();
    await expect(planCard(page, 'Plus').getByText('Coming soon', { exact: true })).toBeVisible();
    await expect(planCard(page, 'Plus').getByRole('button', { name: /coming soon/i })).toBeDisabled();
  });

  test('a free user sees Free marked as their current plan', async ({ page, app }) => {
    await app.signIn('freeUser');
    await app.goto(routes.pricing);

    await expect(planCard(page, 'Free').getByText('Current Plan')).toBeVisible();
    await expect(planCard(page, 'Free').getByRole('link', { name: /continue to dashboard/i })).toBeVisible();
    await expect(planCard(page, 'Plus').getByText('Current Plan')).toHaveCount(0);
    await expect(planCard(page, 'Plus').getByText('Coming soon', { exact: true })).toBeVisible();
  });

  test('an active Plus subscriber sees Plus marked as their current plan', async ({ page, app }) => {
    await app.signIn('premiumUser');
    await app.goto(routes.pricing);

    await expect(planCard(page, 'Plus').getByText('Current Plan')).toBeVisible();
    await expect(planCard(page, 'Plus').getByRole('link', { name: /continue to dashboard/i })).toBeVisible();
    await expect(planCard(page, 'Free').getByText('Current Plan')).toHaveCount(0);
  });

  test('a lapsed subscriber falls back to Free as their current plan', async ({ page, app }) => {
    await app.signIn('premiumUser');
    app.api.plan.unlimitedLinks = false;
    app.api.plan.subscriptionStatus = 'past_due';

    await app.goto(routes.pricing);

    await expect(planCard(page, 'Free').getByText('Current Plan')).toBeVisible();
    await expect(planCard(page, 'Plus').getByText('Coming soon', { exact: true })).toBeVisible();
  });

  test('an owner visiting /pricing is redirected to the dashboard', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.pricing);

    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
