import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { getApiToken, isLoggedIn, redirectToLogin } from './session';

describe('auth/session', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getApiToken', () => {
    test('returns null when no token has been stored', () => {
      expect(getApiToken()).toBeNull();
    });

    test('returns the stored token verbatim', () => {
      localStorage.setItem('apiToken', 'header.payload.sig');
      expect(getApiToken()).toBe('header.payload.sig');
    });
  });

  describe('isLoggedIn', () => {
    test('is false when there is no token', () => {
      expect(isLoggedIn()).toBe(false);
    });

    test('is false when the token is an empty string', () => {
      localStorage.setItem('apiToken', '');
      expect(isLoggedIn()).toBe(false);
    });

    test('is true when a non-empty token is present', () => {
      localStorage.setItem('apiToken', 'abc.def.ghi');
      expect(isLoggedIn()).toBe(true);
    });
  });

  describe('redirectToLogin', () => {
    let hrefSpy;

    beforeEach(() => {
      hrefSpy = '';
      Object.defineProperty(window, 'location', {
        configurable: true,
        get: () => ({
          get href() {
            return hrefSpy;
          },
          set href(v) {
            hrefSpy = v;
          },
        }),
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('clears the session keys and sends the browser to /login', () => {
      localStorage.setItem('apiToken', 'abc.def.ghi');
      localStorage.setItem('userEmail', 'user@example.com');
      localStorage.setItem('userName', 'Test User');

      redirectToLogin();

      expect(localStorage.getItem('apiToken')).toBeNull();
      expect(localStorage.getItem('userEmail')).toBeNull();
      expect(localStorage.getItem('userName')).toBeNull();
      expect(hrefSpy).toBe('/login');
    });

    test('does not throw when the session keys are already absent', () => {
      expect(() => redirectToLogin()).not.toThrow();
      expect(hrefSpy).toBe('/login');
    });

    test('leaves unrelated localStorage keys untouched', () => {
      localStorage.setItem('apiToken', 'abc.def.ghi');
      localStorage.setItem('LoginUser', JSON.stringify({ name: 'Test User' }));
      localStorage.setItem('pending_url', 'https://example.com');

      redirectToLogin();

      expect(localStorage.getItem('LoginUser')).toBe(JSON.stringify({ name: 'Test User' }));
      expect(localStorage.getItem('pending_url')).toBe('https://example.com');
    });
  });
});
