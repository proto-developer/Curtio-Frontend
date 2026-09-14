import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Login from './Login';

/*
 * SAFETY: no test in this file may reach the real backend or database.
 *   1. `@/api/auth`  -> login / googleLogin are vi.fn() stubs.
 *   2. `@/lib/sync`  -> syncPendingUrl is stubbed (the real one calls createUrl -> DB).
 *   3. global.fetch  -> throws, so any real request fails the test loudly.
 */
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  googleLogin: vi.fn(),
}));

vi.mock('@/lib/sync', () => ({
  syncPendingUrl: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Capture the config passed to useGoogleLogin so the OAuth callbacks can be fired.
const { googleOpts } = vi.hoisted(() => ({ googleOpts: { current: null } }));
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: (opts) => {
    googleOpts.current = opts;
    return vi.fn();
  },
}));

import { login, googleLogin } from '@/api/auth';
import { syncPendingUrl } from '@/lib/sync';

const SESSION = {
  success: true,
  apiToken: 'fake-jwt-token',
  LoginUser: { email: 'user@example.com', name: 'Test User' },
};

const renderPage = () => render(<BrowserRouter><Login /></BrowserRouter>);

const fillCredentials = (email = 'user@example.com', password = 'Password123!') => {
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: password } });
};

const submit = () => fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

// The Google callbacks run outside React's event system, so drive them through
// act() to flush the state updates they trigger.
const fireGoogleSuccess = (token = 'google-access-token') =>
  act(async () => {
    await googleOpts.current.onSuccess({ access_token: token });
  });
const fireGoogleError = () => act(() => googleOpts.current.onError());

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  global.fetch = vi.fn(() => {
    throw new Error('Real network call attempted in a unit test');
  });
});

describe('Login - sign-in journey', () => {
  test('renders every part of the sign-in form', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password');
    expect(screen.getByRole('link', { name: /sign up free/i })).toHaveAttribute('href', '/register');
  });

  test('typing updates the email and password fields', () => {
    renderPage();
    fillCredentials('jane@example.com', 'Secret123!');

    expect(screen.getByPlaceholderText('you@example.com')).toHaveValue('jane@example.com');
    expect(screen.getByPlaceholderText('••••••••')).toHaveValue('Secret123!');
  });

  test('the eye toggle reveals and hides the password', () => {
    renderPage();
    const password = screen.getByPlaceholderText('••••••••');
    const toggle = password.parentElement.querySelector('button');

    expect(password).toHaveAttribute('type', 'password');
    fireEvent.click(toggle);
    expect(password).toHaveAttribute('type', 'text');
    fireEvent.click(toggle);
    expect(password).toHaveAttribute('type', 'password');
  });

  test('a valid sign-in stores the session, syncs the pending link and lands on the dashboard', async () => {
    login.mockResolvedValueOnce(SESSION);
    renderPage();

    fillCredentials('user@example.com', 'Password123!');
    submit();

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('user@example.com', 'Password123!');
    });
    expect(localStorage.getItem('apiToken')).toBe('fake-jwt-token');
    expect(localStorage.getItem('LoginUser')).toContain('user@example.com');
    expect(syncPendingUrl).toHaveBeenCalledWith('fake-jwt-token');
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });

  test('wrong credentials show the server message and keep the user on the page', async () => {
    login.mockResolvedValueOnce({ success: false, message: 'Incorrect password.' });
    renderPage();

    fillCredentials('user@example.com', 'WrongPass1!');
    submit();

    expect(await screen.findByText('Incorrect password.')).toBeInTheDocument();
    expect(localStorage.getItem('apiToken')).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('a thrown request surfaces the network error', async () => {
    login.mockRejectedValueOnce(new Error('offline'));
    renderPage();

    fillCredentials();
    submit();

    expect(await screen.findByText('Network error. Is the server running?')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('Google sign-in stores the session and goes to the analytics dashboard', async () => {
    googleLogin.mockResolvedValueOnce(SESSION);
    renderPage();

    await fireGoogleSuccess();

    expect(googleLogin).toHaveBeenCalledWith('google-access-token');
    expect(localStorage.getItem('apiToken')).toBe('fake-jwt-token');
    expect(syncPendingUrl).toHaveBeenCalledWith('fake-jwt-token');
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard/analytics'));
  });

  test('a rejected Google response shows its message', async () => {
    googleLogin.mockResolvedValueOnce({ success: false, message: 'Google account not linked.' });
    renderPage();

    await fireGoogleSuccess();

    expect(await screen.findByText('Google account not linked.')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('a Google network failure shows the Google-specific network error', async () => {
    googleLogin.mockRejectedValueOnce(new Error('offline'));
    renderPage();

    await fireGoogleSuccess();

    expect(await screen.findByText('Network error during Google login.')).toBeInTheDocument();
  });

  test('a cancelled Google popup shows the sign-in failed message', async () => {
    renderPage();

    fireGoogleError();

    expect(await screen.findByText('Google Sign-In failed.')).toBeInTheDocument();
  });
});
