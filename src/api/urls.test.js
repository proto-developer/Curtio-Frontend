import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({ apiRequest: vi.fn() }));

import { apiRequest } from './client';
import {
  listUrls,
  createUrl,
  deleteUrl,
  toggleUrl,
  updateUrlLabels,
  updateUrlCampaigns,
  deleteCampaign,
  renameCampaign,
} from './urls';

const ok = (data) => apiRequest.mockResolvedValue({ status: 200, data, redirected: false });

beforeEach(() => {
  vi.clearAllMocks();
  ok({ success: true });
});

describe('urls API - listUrls', () => {
  test('reads /urls with the 401 redirect enabled by default', async () => {
    ok({ success: true, urls: [] });

    const out = await listUrls();

    expect(apiRequest).toHaveBeenCalledWith('/urls', { token: undefined, redirectOn401: true });
    expect(out).toEqual({ success: true, urls: [] });
  });

  test('forwards an explicit token and redirect preference', async () => {
    await listUrls({ token: 'jwt', redirectOn401: false });

    expect(apiRequest).toHaveBeenCalledWith('/urls', { token: 'jwt', redirectOn401: false });
  });

  test('returns null (not the payload) when the request was redirected', async () => {
    apiRequest.mockResolvedValue({ status: 401, data: null, redirected: true });

    expect(await listUrls()).toBeNull();
  });
});

describe('urls API - mutations', () => {
  test('createUrl POSTs the payload to /urls without the auto 401 redirect', async () => {
    const payload = { originalUrl: 'https://example.com', customAlias: 'promo' };
    await createUrl(payload);

    expect(apiRequest).toHaveBeenCalledWith('/urls', {
      method: 'POST',
      body: payload,
      token: undefined,
      redirectOn401: false,
    });
  });

  test('deleteUrl DELETEs /urls/:slug', async () => {
    await deleteUrl('promo');

    expect(apiRequest).toHaveBeenCalledWith('/urls/promo', {
      method: 'DELETE',
      token: undefined,
      redirectOn401: false,
    });
  });

  test('toggleUrl PATCHes /urls/:slug/toggle', async () => {
    await toggleUrl('promo');

    expect(apiRequest).toHaveBeenCalledWith('/urls/promo/toggle', {
      method: 'PATCH',
      token: undefined,
      redirectOn401: false,
    });
  });

  test('updateUrlLabels PATCHes /urls/:slug/labels with the labels array', async () => {
    await updateUrlLabels('promo', ['red', 'blue'], { token: 'jwt' });

    expect(apiRequest).toHaveBeenCalledWith('/urls/promo/labels', {
      method: 'PATCH',
      body: { labels: ['red', 'blue'] },
      token: 'jwt',
      redirectOn401: false,
    });
  });

  test('updateUrlCampaigns PATCHes /urls/:slug/campaigns with the campaigns array', async () => {
    await updateUrlCampaigns('promo', ['launch'], { token: 'jwt' });

    expect(apiRequest).toHaveBeenCalledWith('/urls/promo/campaigns', {
      method: 'PATCH',
      body: { campaigns: ['launch'] },
      token: 'jwt',
      redirectOn401: false,
    });
  });
});

describe('urls API - campaign endpoints encode the name', () => {
  test('deleteCampaign URL-encodes the campaign name in the path', async () => {
    await deleteCampaign('summer sale/2026');

    expect(apiRequest).toHaveBeenCalledWith('/urls/campaign/summer%20sale%2F2026', {
      method: 'DELETE',
      token: undefined,
      redirectOn401: false,
    });
  });

  test('renameCampaign URL-encodes the old name and sends the new name in the body', async () => {
    await renameCampaign('old name', 'new name', { token: 'jwt' });

    expect(apiRequest).toHaveBeenCalledWith('/urls/campaign/old%20name', {
      method: 'PATCH',
      body: { newName: 'new name' },
      token: 'jwt',
      redirectOn401: false,
    });
  });
});
