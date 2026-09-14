import { describe, test, expect, beforeEach } from 'vitest';
import { isOwner } from './owner';

// Build a JWT-shaped string whose payload segment is what the helper decodes
// with `atob(token.split('.')[1])`.
const makeToken = (payload) => `h.${btoa(JSON.stringify(payload))}.s`;

describe('auth/owner - isOwner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('is false when the user is logged out ( ed)', () => {
    expect(isOwner()).toBe(false);
  });

  test('is true when the JWT payload carries isOwner: true', () => {
    localStorage.setItem('apiToken', makeToken({ isOwner: true }));
    expect(isOwner()).toBe(true);
  });

  test('the JWT flag wins over a stale user object', () => {
    localStorage.setItem('apiToken', makeToken({ isOwner: false }));
    localStorage.setItem('LoginUser', JSON.stringify({ isOwner: true }));
    expect(isOwner()).toBe(false);
  });

  test('falls back to LoginUser.isOwner when the token has no owner claim', () => {
    localStorage.setItem('apiToken', makeToken({ sub: '123' }));
    localStorage.setItem('LoginUser', JSON.stringify({ isOwner: true }));
    expect(isOwner()).toBe(true);
  });

  test('falls back to the legacy "user" key when LoginUser is absent', () => {
    localStorage.setItem('user', JSON.stringify({ isOwner: true }));
    expect(isOwner()).toBe(true);
  });

  test('a non-boolean isOwner claim is ignored and the user object decides', () => {
    localStorage.setItem('apiToken', makeToken({ isOwner: 'yes' }));
    localStorage.setItem('LoginUser', JSON.stringify({ isOwner: false }));
    expect(isOwner()).toBe(false);
  });

  test('returns false (no crash) for a malformed token', () => {
    localStorage.setItem('apiToken', 'not-a-jwt');
    expect(isOwner()).toBe(false);
  });

  test('returns false (no crash) when LoginUser holds invalid JSON', () => {
    localStorage.setItem('LoginUser', '{ broken');
    expect(isOwner()).toBe(false);
  });

  test('treats a missing isOwner property as not an owner', () => {
    localStorage.setItem('apiToken', makeToken({ sub: '123' }));
    localStorage.setItem('LoginUser', JSON.stringify({ name: 'Someone' }));
    expect(isOwner()).toBe(false);
  });
});
