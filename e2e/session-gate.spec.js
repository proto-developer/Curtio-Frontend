import { test, expect, routes, protectedRoutes, badTokens } from './fixtures';

test.describe('Reaching the authenticated area', () => {
  test('a valid session lets the user deep-link straight to a nested route', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.campaigns);

    await expect(page).toHaveURL(/\/dashboard\/campaigns$/);
    await expect(page.getByRole('heading', { name: 'Campaigns Manager' })).toBeVisible();
  });

  test('the session survives a full page reload', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.analytics);
    await expect(page.getByRole('heading', { name: 'Redirected Link Dashboard' })).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/dashboard\/analytics$/);
    await expect(page.getByRole('heading', { name: 'Redirected Link Dashboard' })).toBeVisible();
  });
});

test.describe('Route protection without a session', () => {
  test('every protected route redirects a signed-out visitor to /login', async ({ page, app }) => {
    for (const path of protectedRoutes) {
      await app.goto(path);
      await expect(page, `${path} should redirect`).toHaveURL(/\/login$/);
    }
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('the redirect replaces history so Back does not re-enter the app', async ({ page, app }) => {
    await app.goto(routes.home);
    await app.goto(routes.dashboard);
    await expect(page).toHaveURL(/\/login$/);

    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(new RegExp(`${routes.home}$`));
  });
});

test.describe('Invalid or expired sessions', () => {
  test('an expired token is rejected and cleared from storage', async ({ page, app }) => {
    await app.signIn('owner', { expiresInSeconds: -600 });

    await app.goto(routes.dashboard);

    await expect(page).toHaveURL(/\/login$/);
    // ProtectedRoute wipes the stale token on the way out.
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('apiToken')))
      .toBeNull();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('token')))
      .toBeNull();
  });

  test('a non-JWT token string is treated as unauthenticated', async ({ page, app }) => {
    await app.seedSession({ token: badTokens.garbage, user: null });
    await app.goto(routes.analytics);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('a token with an undecodable payload is treated as unauthenticated', async ({ page, app }) => {
    await app.seedSession({ token: badTokens.malformedPayload, user: null });
    await app.goto(routes.campaigns);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('a 401 from the backend mid-session bounces the user to /login', async ({ page, app }) => {
    await app.signIn('owner');
    // The token is structurally valid, but the server has revoked the session.
    await page.route(/\/api\/urls(\?.*)?$/, (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Token expired' }) }),
    );

    await app.goto(routes.analytics);

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });
});

test.describe('Owner-only routes', () => {
  test('a free user is redirected away from the pre-click page', async ({ page, app }) => {
    await app.signIn('freeUser');
    await app.goto(routes.preClick);
    await expect(page).toHaveURL(/\/dashboard\/analytics$/);
  });

  test('an owner is allowed onto the pre-click page', async ({ page, app }) => {
    await app.signIn('owner');
    await app.goto(routes.preClick);
    await expect(page).toHaveURL(/\/dashboard\/preclick$/);
    await expect(page.getByRole('heading', { name: 'Non-Redirected Analytics' })).toBeVisible();
  });
});
