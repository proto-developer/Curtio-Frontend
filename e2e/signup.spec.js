import { test, expect, routes, personas, otpSuccessFor } from './fixtures';

const NEW_USER = personas.freeUser;

async function fillRegisterForm(page, { name, email, password }) {
  await page.getByPlaceholder('Jane Smith').fill(name);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Min. 8 characters').fill(password);
  await page.locator('#agree').check();
}

const submitRegistration = (page) =>
  page.getByRole('button', { name: 'Create Account', exact: true }).click();

const submitOtp = (page) =>
  page.getByRole('button', { name: /verify & create account/i }).click();

/** The first OTP box accepts the whole code and fans it across the six inputs. */
const enterOtp = (page, code) => page.getByLabel('Digit 1 of 6').fill(code);

test.describe('Sign-up journey', () => {
  test('the register form validates a short password before hitting the API', async ({ page, app }) => {
    let registerCalls = 0;
    await page.route(/\/api\/auth\/register/, (route) => {
      registerCalls += 1;
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await app.goto(routes.register);
    await fillRegisterForm(page, { name: 'Shorty', email: 'shorty@curtio.test', password: 'short' });
    await submitRegistration(page);

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    expect(registerCalls).toBe(0);
    await expect(page).toHaveURL(/\/register$/);
  });

  test('a duplicate email surfaces the server error and stays on step 1', async ({ page, app }) => {
    app.api.registerResult = { success: false, message: 'An account with this email already exists.' };

    await app.goto(routes.register);
    await fillRegisterForm(page, { name: NEW_USER.name, email: NEW_USER.email, password: 'longenough123' });
    await submitRegistration(page);

    await expect(page.getByText('An account with this email already exists.')).toBeVisible();
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /verify your email/i })).toHaveCount(0);
  });

  test('register → OTP → lands in the authenticated area with a session', async ({ page, app }) => {
    app.api.registerResult = { success: true };
    app.api.otpResult = otpSuccessFor('freeUser');

    await app.goto(routes.register);
    await fillRegisterForm(page, { name: NEW_USER.name, email: NEW_USER.email, password: 'longenough123' });
    await submitRegistration(page);

    await expect(page.getByRole('heading', { name: /verify your email/i })).toBeVisible();
    await expect(page.getByText(NEW_USER.email).first()).toBeVisible();
    await expect(page.getByLabel('Digit 1 of 6')).toBeVisible();

    await enterOtp(page, '123456');
    await submitOtp(page);

    await expect(page).toHaveURL(/\/dashboard\/analytics$/);
    await expect(page.getByRole('heading', { name: 'Redirected Link Dashboard' })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('apiToken')))
      .not.toBeNull();
  });

  test('a wrong OTP shows an error and does not sign the user in', async ({ page, app }) => {
    app.api.registerResult = { success: true };
    app.api.otpResult = { success: false, message: 'Invalid or expired code.' };

    await app.goto(routes.register);
    await fillRegisterForm(page, { name: NEW_USER.name, email: NEW_USER.email, password: 'longenough123' });
    await submitRegistration(page);
    await expect(page.getByRole('heading', { name: /verify your email/i })).toBeVisible();

    await enterOtp(page, '000000');
    await submitOtp(page);

    await expect(page.getByText('Invalid or expired code.')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('apiToken')))
      .toBeNull();
  });
});
