import { describe, test, expect, vi, beforeEach } from 'vitest';

// Stable backend URL + a spyable session module.
vi.mock('@/config/env', () => ({ default: { BACKEND_URL: 'https://api.test' } }));
vi.mock('@/lib/auth/session', () => ({
  getApiToken: vi.fn(() => null),
  redirectToLogin: vi.fn(),
}));

import { apiRequest } from './client';
import { getApiToken, redirectToLogin } from '@/lib/auth/session';

const jsonResponse = (body, status = 200) => ({
  status,
  json: () => Promise.resolve(body),
});

const lastInit = () => global.fetch.mock.calls.at(-1)[1];
const lastUrl = () => global.fetch.mock.calls.at(-1)[0];

beforeEach(() => {
  vi.clearAllMocks();
  getApiToken.mockReturnValue(null);
  global.fetch = vi.fn().mockResolvedValue(jsonResponse({}));
});

describe('apiRequest - request shaping', () => {
  test('issues a GET to BACKEND_URL + path with no body and no Content-Type', async () => {
    await apiRequest('/urls');

    expect(lastUrl()).toBe('https://api.test/urls');
    expect(lastInit().method).toBe('GET');
    expect(lastInit().body).toBeUndefined();
    expect(lastInit().headers['Content-Type']).toBeUndefined();
  });

  test('serializes a JSON body and sets Content-Type', async () => {
    await apiRequest('/urls', { method: 'POST', body: { a: 1 }, auth: false });

    expect(lastInit().method).toBe('POST');
    expect(lastInit().body).toBe(JSON.stringify({ a: 1 }));
    expect(lastInit().headers['Content-Type']).toBe('application/json');
  });

  test('does not override a caller-supplied Content-Type', async () => {
    await apiRequest('/x', {
      method: 'POST',
      body: 'raw',
      auth: false,
      headers: { 'Content-Type': 'text/plain' },
    });

    expect(lastInit().headers['Content-Type']).toBe('text/plain');
  });

  test('merges caller-supplied headers', async () => {
    await apiRequest('/x', { auth: false, headers: { 'X-Trace': 'abc' } });
    expect(lastInit().headers['X-Trace']).toBe('abc');
  });
});

describe('apiRequest - auth headers', () => {
  test('attaches a Bearer token from the session on an authed request', async () => {
    getApiToken.mockReturnValue('session-token');
    await apiRequest('/urls'); // auth defaults to true

    expect(lastInit().headers.Authorization).toBe('Bearer session-token');
  });

  test('omits Authorization on an authed request when there is no session token', async () => {
    getApiToken.mockReturnValue(null);
    await apiRequest('/urls');

    expect(lastInit().headers.Authorization).toBeUndefined();
  });

  test('omits Authorization when auth:false even if a session token exists', async () => {
    getApiToken.mockReturnValue('session-token');
    await apiRequest('/urls', { auth: false });

    expect(lastInit().headers.Authorization).toBeUndefined();
  });

  test('an explicit token overrides the session token and ignores the auth flag', async () => {
    getApiToken.mockReturnValue('session-token');
    await apiRequest('/x', { auth: false, token: 'explicit-token' });

    expect(lastInit().headers.Authorization).toBe('Bearer explicit-token');
  });

  test('an explicit token of null sends no Authorization header', async () => {
    getApiToken.mockReturnValue('session-token');
    await apiRequest('/x', { token: null });

    expect(lastInit().headers.Authorization).toBeUndefined();
  });
});

describe('apiRequest - response handling', () => {
  test('returns { status, data, redirected:false } for a successful JSON response', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ success: true, value: 42 }, 200));

    const result = await apiRequest('/urls', { auth: false });

    expect(result).toEqual({ status: 200, data: { success: true, value: 42 }, redirected: false });
  });

  test('returns data:null (no throw) when the body is not valid JSON', async () => {
    global.fetch.mockResolvedValue({
      status: 204,
      json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
    });

    const result = await apiRequest('/urls', { auth: false });

    expect(result).toEqual({ status: 204, data: null, redirected: false });
  });

  test('a non-OK status still resolves with the parsed body instead of throwing', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ message: 'Server error' }, 500));

    const result = await apiRequest('/urls', { auth: false });

    expect(result).toEqual({ status: 500, data: { message: 'Server error' }, redirected: false });
  });
});

describe('apiRequest - 401 handling', () => {
  test('a 401 on an authed request redirects to login and reports redirected:true', async () => {
    getApiToken.mockReturnValue('stale-token');
    const json = vi.fn();
    global.fetch.mockResolvedValue({ status: 401, json });

    const result = await apiRequest('/urls');

    expect(redirectToLogin).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 401, data: null, redirected: true });
    expect(json).not.toHaveBeenCalled(); // returns before reading the body
  });

  test('a 401 does not redirect when redirectOn401 is false', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, 401));

    const result = await apiRequest('/public/thing', { auth: false, redirectOn401: false });

    expect(redirectToLogin).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 401,
      data: { message: 'Unauthorized' },
      redirected: false,
    });
  });

  test('redirectOn401 defaults to the auth flag (auth:false => no redirect on 401)', async () => {
    global.fetch.mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, 401));

    const result = await apiRequest('/public/thing', { auth: false });

    expect(redirectToLogin).not.toHaveBeenCalled();
    expect(result.redirected).toBe(false);
  });
});
