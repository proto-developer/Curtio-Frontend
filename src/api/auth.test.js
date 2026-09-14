import { describe, test, expect, vi, beforeEach } from 'vitest';

// The wrapper is exercised in client.test.js; here we only check that each
// helper shapes its call and unwraps `.data`.
vi.mock('./client', () => ({ apiRequest: vi.fn() }));

import { apiRequest } from './client';
import {
  login,
  googleLogin,
  register,
  verifyOtp,
  sendResetOtp,
  resetPassword,
  updateProfile,
  updateAccountLabels,
} from './auth';

const resolveWith = (data) =>
  apiRequest.mockResolvedValue({ status: 200, data, redirected: false });

beforeEach(() => {
  vi.clearAllMocks();
  resolveWith({ success: true });
});

describe('auth API - unauthenticated endpoints', () => {
  test('login posts credentials to /auth/login without auth', async () => {
    resolveWith({ success: true, apiToken: 'jwt' });

    const out = await login('user@example.com', 'secret');

    expect(apiRequest).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { email: 'user@example.com', password: 'secret' },
      auth: false,
    });
    expect(out).toEqual({ success: true, apiToken: 'jwt' });
  });

  test('googleLogin posts the access token to /auth/google without auth', async () => {
    await googleLogin('ya29.token');

    expect(apiRequest).toHaveBeenCalledWith('/auth/google', {
      method: 'POST',
      body: { token: 'ya29.token' },
      auth: false,
    });
  });

  test('register posts the whole form to /auth/register without auth', async () => {
    const form = { name: 'Jane', email: 'jane@example.com', password: 'secret12' };
    await register(form);

    expect(apiRequest).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: form,
      auth: false,
    });
  });

  test('verifyOtp posts email + otp to /auth/verify-otp without auth', async () => {
    await verifyOtp('jane@example.com', '123456');

    expect(apiRequest).toHaveBeenCalledWith('/auth/verify-otp', {
      method: 'POST',
      body: { email: 'jane@example.com', otp: '123456' },
      auth: false,
    });
  });

  test('sendResetOtp posts the email to /auth/send-reset-otp without auth', async () => {
    await sendResetOtp('jane@example.com');

    expect(apiRequest).toHaveBeenCalledWith('/auth/send-reset-otp', {
      method: 'POST',
      body: { email: 'jane@example.com' },
      auth: false,
    });
  });

  test('resetPassword posts email + otp + password to /auth/reset-password without auth', async () => {
    await resetPassword({ email: 'jane@example.com', otp: '123456', password: 'newpass12' });

    expect(apiRequest).toHaveBeenCalledWith('/auth/reset-password', {
      method: 'POST',
      body: { email: 'jane@example.com', otp: '123456', password: 'newpass12' },
      auth: false,
    });
  });

  test('returns the failure payload untouched when the server rejects', async () => {
    resolveWith({ success: false, message: 'Incorrect password.' });

    const out = await login('user@example.com', 'wrong');

    expect(out).toEqual({ success: false, message: 'Incorrect password.' });
  });
});

describe('auth API - authenticated profile endpoints', () => {
  test('updateProfile PATCHes /auth/update-profile with the caller token, no auto-redirect', async () => {
    await updateProfile({ name: 'New Name' }, { token: 'jwt' });

    expect(apiRequest).toHaveBeenCalledWith('/auth/update-profile', {
      method: 'PATCH',
      body: { name: 'New Name' },
      token: 'jwt',
      redirectOn401: false,
    });
  });

  test('updateAccountLabels PUTs /auth/labels with the labels wrapped in an object', async () => {
    const labels = { red: 'Urgent', blue: 'Later' };
    await updateAccountLabels(labels, { token: 'jwt' });

    expect(apiRequest).toHaveBeenCalledWith('/auth/labels', {
      method: 'PUT',
      body: { labels },
      token: 'jwt',
      redirectOn401: false,
    });
  });

  test('profile endpoints can opt into the 401 redirect', async () => {
    await updateProfile({ name: 'X' }, { token: 'jwt', redirectOn401: true });

    expect(apiRequest).toHaveBeenCalledWith(
      '/auth/update-profile',
      expect.objectContaining({ redirectOn401: true }),
    );
  });
});
