import { test, expect, routes } from './fixtures';

const EMAIL = 'reset-me@curtio.test';
const NEW_PASSWORD = 'brand-new-pass-123';

const emailInput = (page) => page.getByPlaceholder('you@example.com');
const otpInput = (page) => page.getByPlaceholder('Enter OTP');
const newPassword = (page) => page.locator('input[name="new-password"]');
const confirmPassword = (page) => page.locator('input[name="confirm-password"]');
const sendOtp = (page) => page.getByRole('button', { name: /send otp/i }).click();
const resetPassword = (page) => page.getByRole('button', { name: /reset password/i }).click();

/** Count POST /auth/reset-password attempts. */
function trackResetRequests(page) {
  const state = { count: 0 };
  page.on('request', (req) => {
    if (req.method() === 'POST' && /\/api\/auth\/reset-password/.test(req.url())) state.count += 1;
  });
  return state;
}

async function reachOtpStep(page, app, email = EMAIL) {
  app.api.sendResetOtpResult = { success: true };
  await app.goto(routes.forgotPassword);
  await emailInput(page).fill(email);
  await sendOtp(page);
  await expect(otpInput(page)).toBeVisible();
}

test.describe('Forgot password — email step', () => {
  test('renders the first step', async ({ page, app }) => {
    await app.goto(routes.forgotPassword);

    await expect(page.getByRole('heading', { name: 'Forgot Password' })).toBeVisible();
    await expect(page.getByText('Enter your email to receive OTP.')).toBeVisible();
    await expect(emailInput(page)).toBeVisible();
  });

  test('a valid email advances to the OTP / new-password step', async ({ page, app }) => {
    app.api.sendResetOtpResult = { success: true };

    await app.goto(routes.forgotPassword);
    await emailInput(page).fill(EMAIL);
    await sendOtp(page);

    await expect(page.getByText('OTP sent successfully')).toBeVisible();
    await expect(page.getByText('Verify OTP and create a new password.')).toBeVisible();
    await expect(otpInput(page)).toBeVisible();
    await expect(newPassword(page)).toBeVisible();
  });

  test('an unknown email shows the server error and stays on step 1', async ({ page, app }) => {
    app.api.sendResetOtpResult = { success: false, message: 'No account found with that email.' };

    await app.goto(routes.forgotPassword);
    await emailInput(page).fill('nobody@curtio.test');
    await sendOtp(page);

    await expect(page.getByText('No account found with that email.')).toBeVisible();
    await expect(otpInput(page)).toHaveCount(0);
    await expect(page.getByText('Enter your email to receive OTP.')).toBeVisible();
  });

  test('a network failure on the email step is reported', async ({ page, app }) => {
    await page.route(/\/api\/auth\/send-reset-otp/, (route) => route.abort());

    await app.goto(routes.forgotPassword);
    await emailInput(page).fill(EMAIL);
    await sendOtp(page);

    await expect(page.getByText('Network error')).toBeVisible();
    await expect(otpInput(page)).toHaveCount(0);
  });
});

test.describe('Forgot password — reset step', () => {
  test('a matching OTP + password resets and sends the user back to login', async ({ page, app }) => {
    await reachOtpStep(page, app);
    app.api.resetPasswordResult = { success: true };

    await otpInput(page).fill('123456');
    await newPassword(page).fill(NEW_PASSWORD);
    await confirmPassword(page).fill(NEW_PASSWORD);
    await resetPassword(page);

    await expect(page.getByText('Password updated successfully')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('mismatched passwords are caught client-side with no API call', async ({ page, app }) => {
    await reachOtpStep(page, app);
    const resets = trackResetRequests(page);

    await otpInput(page).fill('123456');
    await newPassword(page).fill(NEW_PASSWORD);
    await confirmPassword(page).fill('something-else');
    await resetPassword(page);

    await expect(page.getByText('Passwords do not match')).toBeVisible();
    await expect(otpInput(page)).toBeVisible(); // still on step 2
    expect(resets.count).toBe(0);
  });

  test('an invalid or expired OTP shows the server error and keeps the form open', async ({ page, app }) => {
    await reachOtpStep(page, app);
    app.api.resetPasswordResult = { success: false, message: 'OTP is invalid or has expired.' };

    await otpInput(page).fill('000000');
    await newPassword(page).fill(NEW_PASSWORD);
    await confirmPassword(page).fill(NEW_PASSWORD);
    await resetPassword(page);

    await expect(page.getByText('OTP is invalid or has expired.')).toBeVisible();
    await expect(otpInput(page)).toBeVisible();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });
});

test.describe('Forgot password — navigation', () => {
  test('"Back to Login" returns to the login page', async ({ page, app }) => {
    await app.goto(routes.forgotPassword);
    await page.getByRole('link', { name: /back to login/i }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('the login page links to the forgot-password flow', async ({ page, app }) => {
    await app.goto(routes.login);
    await page.getByRole('link', { name: /forgot password/i }).click();

    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole('heading', { name: 'Forgot Password' })).toBeVisible();
  });
});
