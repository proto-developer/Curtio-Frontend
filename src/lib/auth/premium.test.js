import { describe, test, expect, beforeEach } from 'vitest';
import {
  isPremium,
  hasUnlimitedLinks,
  linkLimitFor,
  campaignLimitFor,
  isSubscriptionExpired,
  FREE_LINK_LIMIT,
  FREE_CAMPAIGN_LIMIT,
} from './premium';

const makeToken = (payload) => `h.${btoa(JSON.stringify(payload))}.s`;

describe('auth/premium', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isPremium', () => {
    test('is false when the user is logged out', () => {
      expect(isPremium()).toBe(false);
    });

    test('is true when the JWT payload carries isPremium: true', () => {
      localStorage.setItem('apiToken', makeToken({ isPremium: true }));
      expect(isPremium()).toBe(true);
    });

    test('is false when the JWT payload carries isPremium: false', () => {
      localStorage.setItem('apiToken', makeToken({ isPremium: false }));
      localStorage.setItem('LoginUser', JSON.stringify({ isPremium: true }));
      expect(isPremium()).toBe(false);
    });

    test('falls back to LoginUser.isPremium when the token has no premium claim', () => {
      localStorage.setItem('apiToken', makeToken({ sub: '123' }));
      localStorage.setItem('LoginUser', JSON.stringify({ isPremium: true }));
      expect(isPremium()).toBe(true);
    });

    test('falls back to the legacy "user" key', () => {
      localStorage.setItem('user', JSON.stringify({ isPremium: true }));
      expect(isPremium()).toBe(true);
    });

    test('treats the literal string "undefined" in LoginUser as not premium', () => {
      localStorage.setItem('LoginUser', 'undefined');
      expect(isPremium()).toBe(false);
    });

    test('returns false (no crash) for a malformed token and no user object', () => {
      localStorage.setItem('apiToken', 'not-a-jwt');
      expect(isPremium()).toBe(false);
    });

    test('a non-boolean premium claim is ignored and the user object decides', () => {
      localStorage.setItem('apiToken', makeToken({ isPremium: 'yes' }));
      localStorage.setItem('LoginUser', JSON.stringify({ isPremium: false }));
      expect(isPremium()).toBe(false);
    });
  });

  describe('hasUnlimitedLinks', () => {
    test('is true for a premium account', () => {
      localStorage.setItem('apiToken', makeToken({ isPremium: true }));
      expect(hasUnlimitedLinks()).toBe(true);
    });

    test('is true for an owner who is not premium', () => {
      localStorage.setItem('apiToken', makeToken({ isPremium: false, isOwner: true }));
      expect(hasUnlimitedLinks()).toBe(true);
    });

    test('is false for a plain free account', () => {
      localStorage.setItem('apiToken', makeToken({ isPremium: false, isOwner: false }));
      expect(hasUnlimitedLinks()).toBe(false);
    });

    test('is false when logged out', () => {
      expect(hasUnlimitedLinks()).toBe(false);
    });

    test('returns false (no crash) for a malformed token', () => {
      localStorage.setItem('apiToken', 'not-a-jwt');
      expect(hasUnlimitedLinks()).toBe(false);
    });
  });

  describe('quota helpers', () => {
    test('free limits are 1 link and 1 campaign', () => {
      expect(FREE_LINK_LIMIT).toBe(1);
      expect(FREE_CAMPAIGN_LIMIT).toBe(1);
    });

    test('linkLimitFor returns Infinity when unlimited, the free cap otherwise', () => {
      expect(linkLimitFor(true)).toBe(Infinity);
      expect(linkLimitFor(false)).toBe(FREE_LINK_LIMIT);
    });

    test('campaignLimitFor returns Infinity when unlimited, the free cap otherwise', () => {
      expect(campaignLimitFor(true)).toBe(Infinity);
      expect(campaignLimitFor(false)).toBe(FREE_CAMPAIGN_LIMIT);
    });
  });

  describe('isSubscriptionExpired', () => {
    test.each([undefined, null, '', 'none'])(
      'is false for %p (never subscribed / no record)',
      (status) => {
        expect(isSubscriptionExpired(status)).toBe(false);
      },
    );

    test.each(['active', 'trialing'])('is false for a live subscription (%s)', (status) => {
      expect(isSubscriptionExpired(status)).toBe(false);
    });

    test.each(['expired', 'canceled', 'past_due'])(
      'is true for a lapsed subscription (%s)',
      (status) => {
        expect(isSubscriptionExpired(status)).toBe(true);
      },
    );
  });
});
