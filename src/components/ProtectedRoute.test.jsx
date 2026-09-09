import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, beforeEach } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

// JWT-shaped string; ProtectedRoute decodes the middle segment with
// `atob(token.split('.')[1])`.
const makeToken = (payload) => `h.${btoa(JSON.stringify(payload))}.s`;
const nowSec = () => Math.floor(Date.now() / 1000);

const PRIVATE = <div>Dashboard content</div>;

function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route
          path="/dashboard"
          element={<ProtectedRoute>{PRIVATE}</ProtectedRoute>}
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const seesDashboard = () => screen.queryByText('Dashboard content') !== null;
const seesLogin = () => screen.queryByText('Login page') !== null;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('redirects an anonymous visitor to /login', () => {
    renderGuarded();

    expect(seesLogin()).toBe(true);
    expect(seesDashboard()).toBe(false);
  });

  test('renders the private content for a valid, unexpired token', () => {
    localStorage.setItem('apiToken', makeToken({ exp: nowSec() + 3600 }));
    renderGuarded();

    expect(seesDashboard()).toBe(true);
    expect(seesLogin()).toBe(false);
  });

  test('accepts a token stored under the legacy "token" key', () => {
    localStorage.setItem('token', makeToken({ exp: nowSec() + 3600 }));
    renderGuarded();

    expect(seesDashboard()).toBe(true);
  });

  test('redirects to /login and clears the token when it has expired', () => {
    localStorage.setItem('apiToken', makeToken({ exp: nowSec() - 60 }));
    localStorage.setItem('token', makeToken({ exp: nowSec() - 60 }));
    renderGuarded();

    expect(seesLogin()).toBe(true);
    expect(seesDashboard()).toBe(false);
    expect(localStorage.getItem('apiToken')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('redirects to /login when the token is not a decodable JWT', () => {
    localStorage.setItem('apiToken', 'garbage-not-a-jwt');
    renderGuarded();

    expect(seesLogin()).toBe(true);
    expect(seesDashboard()).toBe(false);
  });

  test('redirects to /login when the payload is not valid JSON', () => {
    localStorage.setItem('apiToken', `h.${btoa('not json')}.s`);
    renderGuarded();

    expect(seesLogin()).toBe(true);
  });

  test('does not leave the user on a private screen with an empty token string', () => {
    localStorage.setItem('apiToken', '');
    renderGuarded();

    expect(seesLogin()).toBe(true);
    expect(seesDashboard()).toBe(false);
  });

  // KNOWN GAP: a well-formed token with no `exp` claim currently passes the
  // guard (payload.exp * 1000 is NaN, and `NaN < Date.now()` is false). This
  // test pins today's behaviour — if the guard is hardened to reject tokens
  // without an expiry, flip this expectation.
  test('currently admits a token that has no exp claim', () => {
    localStorage.setItem('apiToken', makeToken({ sub: 'user-123' }));
    renderGuarded();

    expect(seesDashboard()).toBe(true);
  });
});
