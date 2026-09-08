import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({ apiRequest: vi.fn() }));

import { apiRequest } from './client';
import { verifyPublicLink } from './public';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('public API - verifyPublicLink', () => {
  test('POSTs the body to /public/verify/:shortCode without auth', async () => {
    apiRequest.mockResolvedValue({ status: 200, data: { success: true }, redirected: false });

    await verifyPublicLink('abc123', { password: 'hunter2' });

    expect(apiRequest).toHaveBeenCalledWith('/public/verify/abc123', {
      method: 'POST',
      body: { password: 'hunter2' },
      auth: false,
    });
  });

  test('returns the full wrapper result (status/data/redirected), not just data', async () => {
    const wrapper = { status: 401, data: { message: 'Wrong password' }, redirected: false };
    apiRequest.mockResolvedValue(wrapper);

    const out = await verifyPublicLink('abc123', { password: 'nope' });

    expect(out).toBe(wrapper);
  });
});
