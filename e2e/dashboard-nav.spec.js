import { test, expect, routes } from './fixtures';

/** A sidebar nav link, matched exactly (so "Redirected Clicks Dashboard" does
 *  not also match "Non-Redirected Clicks Dashboard"). */
const navLink = (page, name) => page.getByRole('link', { name, exact: true });
const preClickNav = (page) => page.getByRole('link', { name: /non-redirected clicks dashboard/i });

const ANALYTICS_HEADING = 'Redirected Link Dashboard';
const PRECLICK_HEADING = 'Non-Redirected Analytics';

test.describe('Moving between dashboard sections', () => {
  test('the sidebar walks through all four sections and marks the current one', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);

    await expect(page.getByRole('heading', { name: 'My Links' })).toBeVisible();
    await expect(navLink(page, 'Links')).toHaveAttribute('aria-current', 'page');

    await navLink(page, 'Redirected Clicks Dashboard').click();
    await expect(page).toHaveURL(/\/dashboard\/analytics$/);
    await expect(page.getByRole('heading', { name: ANALYTICS_HEADING })).toBeVisible();
    await expect(navLink(page, 'Redirected Clicks Dashboard')).toHaveAttribute('aria-current', 'page');
    await expect(navLink(page, 'Links')).not.toHaveAttribute('aria-current', 'page');

    await navLink(page, 'Campaigns').click();
    await expect(page).toHaveURL(/\/dashboard\/campaigns$/);
    await expect(page.getByRole('heading', { name: 'Campaigns Manager' })).toBeVisible();
    await expect(navLink(page, 'Campaigns')).toHaveAttribute('aria-current', 'page');

    await navLink(page, 'Links').click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'My Links' })).toBeVisible();
    await expect(navLink(page, 'Links')).toHaveAttribute('aria-current', 'page');
  });

  test('deep-linking to a section marks that section active', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.campaigns);

    await expect(page.getByRole('heading', { name: 'Campaigns Manager' })).toBeVisible();
    await expect(navLink(page, 'Campaigns')).toHaveAttribute('aria-current', 'page');
    await expect(navLink(page, 'Links')).not.toHaveAttribute('aria-current', 'page');
  });

  test('a dashboard stat card links through to the analytics dashboard', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);
    await expect(page.getByRole('heading', { name: 'My Links' })).toBeVisible();

    await page.getByRole('main').getByRole('link', { name: /^Redirected Clicks/ }).click();

    await expect(page).toHaveURL(/\/dashboard\/analytics$/);
    await expect(page.getByRole('heading', { name: ANALYTICS_HEADING })).toBeVisible();
  });

  test('the sidebar logo returns to the analytics dashboard', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.campaigns);
    await expect(page.getByRole('heading', { name: 'Campaigns Manager' })).toBeVisible();

    await page.getByRole('link', { name: /curtio/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/analytics$/);
    await expect(page.getByRole('heading', { name: ANALYTICS_HEADING })).toBeVisible();
  });

  test('Edit Profile opens the profile page', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);

    await page.getByRole('link', { name: /edit profile/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/editprofile$/);
    await expect(page.getByRole('heading', { name: /profile settings/i })).toBeVisible();
  });

  test('Logout ends the session and returns to login', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);

    await page.getByRole('button', { name: /logout/i }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('apiToken')))
      .toBeNull();
  });
});

test.describe('Owner-only route access', () => {
  test('an owner reaches Non-Redirected analytics from the sidebar', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.analytics);

    const link = preClickNav(page);
    await expect(link).toBeVisible();
    await link.click();

    await expect(page).toHaveURL(/\/dashboard\/preclick$/);
    await expect(page.getByRole('heading', { name: PRECLICK_HEADING })).toBeVisible();
    await expect(preClickNav(page)).toHaveAttribute('aria-current', 'page');
  });

  test('an owner can deep-link straight to /dashboard/preclick', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.preClick);

    await expect(page).toHaveURL(/\/dashboard\/preclick$/);
    await expect(page.getByRole('heading', { name: PRECLICK_HEADING })).toBeVisible();
  });

  test('the owner dashboard shows a Non-Redirected Clicks card that opens pre-click', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);
    await expect(page.getByRole('heading', { name: 'My Links' })).toBeVisible();

    await page.getByRole('main').getByRole('link', { name: /^Non-Redirected Clicks/ }).click();

    await expect(page).toHaveURL(/\/dashboard\/preclick$/);
    await expect(page.getByRole('heading', { name: PRECLICK_HEADING })).toBeVisible();
  });

  test('a free user has no pre-click link in the sidebar', async ({ page, app }) => {
    await app.signIn('freeUser');
    await app.goto(routes.analytics);

    await expect(navLink(page, 'Redirected Clicks Dashboard')).toBeVisible();
    await expect(preClickNav(page)).toHaveCount(0);
  });

  test('a free user hitting /dashboard/preclick lands on the analytics dashboard', async ({ page, app }) => {
    await app.signIn('freeUser');
    await app.goto(routes.preClick);

    await expect(page).toHaveURL(/\/dashboard\/analytics$/);
    await expect(page.getByRole('heading', { name: ANALYTICS_HEADING })).toBeVisible();
  });

  test('a paying (non-owner) user is also kept out of pre-click analytics', async ({ page, app }) => {
    await app.signIn('premiumUser');
    await app.goto(routes.preClick);

    await expect(page).toHaveURL(/\/dashboard\/analytics$/);
    await expect(preClickNav(page)).toHaveCount(0);
  });

  test('the free-user dashboard omits the Non-Redirected Clicks stat card', async ({ page, app }) => {
    await app.signIn('freeUser');
    await app.goto(routes.links);
    await expect(page.getByRole('heading', { name: 'My Links' })).toBeVisible();

    await expect(page.getByRole('main').getByText('Non-Redirected Clicks')).toHaveCount(0);
  });
});
