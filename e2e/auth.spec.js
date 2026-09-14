import { test, expect, routes, loginSuccessFor } from './fixtures';

test.describe('Authentication', () => {
  test('login page renders and accepts input', async ({ page, app }) => {
    await app.goto(routes.login);

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

    const email = page.getByPlaceholder('you@example.com');
    const password = page.getByPlaceholder('••••••••');

    await email.fill('e2euser@example.com');
    await password.fill('Password123!');

    await expect(email).toHaveValue('e2euser@example.com');
    await expect(password).toHaveValue('Password123!');
  });

  test('wrong credentials keep the user on /login and show the error banner', async ({ page, app }) => {
    app.api.loginResult = { success: false, message: 'Invalid email or password.' };

    await app.goto(routes.login);
    await page.getByPlaceholder('you@example.com').fill('nobody@curtio.test');
    await page.getByPlaceholder('••••••••').fill('wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText('Invalid email or password.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('a successful sign-in lands the user on their links dashboard', async ({ page, app }) => {
    app.api.loginResult = loginSuccessFor('freeUser');

    await app.goto(routes.login);
    await page.getByPlaceholder('you@example.com').fill('free@curtio.test');
    await page.getByPlaceholder('••••••••').fill('correct-horse');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'My Links' })).toBeVisible();
    // The session the app persisted is what protects the route on reload.
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('apiToken')))
      .not.toBeNull();
  });

  test('the Login page links across to a usable Register page', async ({ page, app }) => {
    await app.goto(routes.login);

    await page.getByRole('link', { name: /sign up free/i }).click();

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    await expect(page.getByPlaceholder('Jane Smith')).toBeVisible();
  });
});
