import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({ apiRequest: vi.fn() }));

import { apiRequest } from './client';
import { getPlan } from './plan';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('plan API - getPlan', () => {
  test('reads /plan with the caller token and no auto 401 redirect, returning the payload', async () => {
    apiRequest.mockResolvedValue({
      status: 200,
      data: { success: true, unlimitedLinks: true },
      redirected: false,
    });

    const out = await getPlan({ token: 'jwt' });

    expect(apiRequest).toHaveBeenCalledWith('/plan', { token: 'jwt', redirectOn401: false });
    expect(out).toEqual({ success: true, unlimitedLinks: true });
  });

  test('works with no arguments (token undefined)', async () => {
    apiRequest.mockResolvedValue({ status: 200, data: { success: true }, redirected: false });

    await getPlan();

    expect(apiRequest).toHaveBeenCalledWith('/plan', { token: undefined, redirectOn401: false });
  });

  test('passes a null/undefined data payload straight through without throwing', async () => {
    apiRequest.mockResolvedValue({ status: 500, data: null, redirected: false });

    await expect(getPlan({ token: 'jwt' })).resolves.toBeNull();
  });
});
