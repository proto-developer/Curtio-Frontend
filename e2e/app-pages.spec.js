import { test, expect, routes } from './fixtures';

// Session gating and route protection live in session-gate.spec.js — these
// specs assume a valid session and check what each page actually renders.

test.describe('Links dashboard', () => {
  test('shows the heading, stat cards and the account\'s link row', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);

    await expect(page.getByRole('heading', { name: 'My Links' })).toBeVisible();
    await expect(page.getByText('Active Links', { exact: true })).toBeVisible();

    // The mocked link actually renders in the table, with its destination and
    // click count.
    const row = page.getByRole('row', { name: /spring-launch/ });
    await expect(row).toBeVisible();
    await expect(row.getByRole('cell', { name: '42', exact: true })).toBeVisible();
  });

  test('a free user sees the 1-link quota notice; an owner does not', async ({ page, app }) => {
    await app.signIn('freeUser');
    await app.goto(routes.links);
    await expect(page.getByText(/Free plan: 1 tracked link/i)).toBeVisible();
  });

  test('an owner sees the unlimited-plan notice instead of a quota', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.links);
    await expect(page.getByText(/unlimited tracked links/i)).toBeVisible();
    await expect(page.getByText(/Free plan:/i)).toHaveCount(0);
  });
});

test.describe('Analytics dashboard', () => {
  test('renders the aggregate view with live totals from the API', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.analytics);

    await expect(page.getByRole('heading', { name: 'Redirected Link Dashboard' })).toBeVisible();
    await expect(page.getByText('Total Links')).toBeVisible();
    // One link, 42 clicks — both come straight from the mocked GET /urls.
    await expect(page.getByText('42', { exact: true }).first()).toBeVisible();
  });

  test('an owner sees the admin badge and pre-click nav in the sidebar', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.analytics);

    await expect(page.getByText('Admin', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Non-Redirected Clicks Dashboard/i }),
    ).toBeVisible();
  });

  test('the pre-click page renders its own heading for an owner', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.preClick);
    await expect(page.getByRole('heading', { name: 'Non-Redirected Analytics' })).toBeVisible();
  });
});

test.describe('Campaigns', () => {
  test('renders the campaign manager once loading resolves', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.campaigns);

    await expect(page.getByRole('heading', { name: 'Campaigns Manager' })).toBeVisible();
    await expect(page.getByText('Loading campaign manager...')).toHaveCount(0);
  });
});

test.describe('Single-link analytics', () => {
  test('shows the selected link, not the "unavailable" error state', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.linkAnalytics('650000000000000000000002'));

    await expect(page.getByRole('heading', { name: 'Analytics Unavailable' })).toHaveCount(0);
    await expect(page.getByText('Redirected Clicks').first()).toBeVisible();
    await expect(page.getByText('https://example.com/spring-launch').first()).toBeVisible();
  });

  test('shows the error state for a link the account does not own', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.linkAnalytics('does-not-exist'));

    await expect(page.getByRole('heading', { name: 'Analytics Unavailable' })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to dashboard/i })).toBeVisible();
  });
});
