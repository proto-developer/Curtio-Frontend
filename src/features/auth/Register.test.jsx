import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Register from './Register';

/*
 * SAFETY: no test in this file may reach the real backend or database.
 *   1. `@/api/auth`  -> register / verifyOtp / googleLogin are vi.fn() stubs.
 *   2. `@/lib/sync`  -> syncPendingUrl is stubbed (the real one calls createUrl -> DB).
 *   3. global.fetch  -> throws, so any real request fails the test loudly.
 */
vi.mock('@/api/auth', () => ({
  register: vi.fn(),
  verifyOtp: vi.fn(),
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

const { googleOpts } = vi.hoisted(() => ({ googleOpts: { current: null } }));
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: (opts) => {
    googleOpts.current = opts;
    return vi.fn();
  },
}));

import { register, verifyOtp, googleLogin } from '@/api/auth';
import { syncPendingUrl } from '@/lib/sync';

const SESSION = {
  success: true,
  apiToken: 'fake-jwt-token',
  LoginUser: { email: 'alex@example.com', name: 'Alex Morgan' },
};

const renderPage = () => render(<BrowserRouter><Register /></BrowserRouter>);

const fillForm = (email = 'alex@example.com', password = 'Password123!') => {
  fireEvent.change(screen.getByPlaceholderText('Jane Smith'), { target: { value: 'Alex Morgan' } });
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: password } });
  fireEvent.click(screen.getByRole('checkbox'));
};

// Complete step 1 so the OTP step (step 2) is on screen.
async function goToOtpStep(email = 'alex@example.com') {
  register.mockResolvedValueOnce({ success: true, message: `OTP sent to ${email}` });
  fillForm(email);
  fireEvent.click(screen.getByRole('button', { name: /create account/i }));
  await screen.findByRole('heading', { name: /verify your email/i });
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  global.fetch = vi.fn(() => {
    throw new Error('Real network call attempted in a unit test');
  });
});

describe('Register - sign-up journey', () => {
  test('renders every field of the sign-up form', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min. 8 characters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  test('the submit button is locked until the terms are accepted', () => {
    renderPage();
    const button = screen.getByRole('button', { name: /create account/i });

    expect(button).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(button).toBeEnabled();
  });

  test('a password shorter than 8 characters is rejected before any request', async () => {
    renderPage();
    // Name + email are filled so the browser's required-field check does not
    // block the submit before our length guard runs.
    fireEvent.change(screen.getByPlaceholderText('Jane Smith'), { target: { value: 'Alex Morgan' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Password must be at least 8 characters long.')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  test('a valid form submits the registration and moves to the OTP step', async () => {
    register.mockResolvedValueOnce({ success: true });
    renderPage();

    fillForm('alex@example.com', 'Password123!');
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        name: 'Alex Morgan',
        email: 'alex@example.com',
        password: 'Password123!',
      });
    });
    expect(await screen.findByRole('heading', { name: /verify your email/i })).toBeInTheDocument();
    expect(screen.getByText('alex@example.com')).toBeInTheDocument();
    expect(screen.getByText('OTP sent to alex@example.com')).toBeInTheDocument();
  });

  test('a taken email keeps the user on the form with the server message', async () => {
    register.mockResolvedValueOnce({ success: false, message: 'Email already registered.' });
    renderPage();

    fillForm('taken@example.com');
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Email already registered.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /verify your email/i })).not.toBeInTheDocument();
  });

  test('a thrown registration request surfaces the network error', async () => {
    register.mockRejectedValueOnce(new Error('offline'));
    renderPage();

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Network error. Is the server running?')).toBeInTheDocument();
  });

  test('an incomplete OTP is rejected before any request', async () => {
    renderPage();
    await goToOtpStep();

    fireEvent.change(screen.getByLabelText('Digit 1 of 6'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /verify & create account/i }));

    expect(await screen.findByText('Please enter the full 6-digit code.')).toBeInTheDocument();
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  test('a correct OTP verifies, stores the session and lands on the analytics dashboard', async () => {
    renderPage();
    await goToOtpStep('alex@example.com');

    verifyOtp.mockResolvedValueOnce(SESSION);
    fireEvent.change(screen.getByLabelText('Digit 1 of 6'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verify & create account/i }));

    await waitFor(() => {
      expect(verifyOtp).toHaveBeenCalledWith('alex@example.com', '123456');
    });
    expect(localStorage.getItem('apiToken')).toBe('fake-jwt-token');
    expect(localStorage.getItem('LoginUser')).toContain('alex@example.com');
    expect(syncPendingUrl).toHaveBeenCalledWith('fake-jwt-token');
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard/analytics'));
  });

  test('a wrong OTP shows the server message and does not navigate', async () => {
    renderPage();
    await goToOtpStep();

    verifyOtp.mockResolvedValueOnce({ success: false, message: 'Invalid or expired code.' });
    fireEvent.change(screen.getByLabelText('Digit 1 of 6'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /verify & create account/i }));

    expect(await screen.findByText('Invalid or expired code.')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('resending the OTP calls register again and confirms a new code was sent', async () => {
    renderPage();
    await goToOtpStep();
    expect(register).toHaveBeenCalledTimes(1);

    register.mockResolvedValueOnce({ success: true });
    fireEvent.click(screen.getByRole('button', { name: /resend otp/i }));

    await waitFor(() => expect(register).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('New OTP sent!')).toBeInTheDocument();
  });

  test('"Back to registration" returns to the form step', async () => {
    renderPage();
    await goToOtpStep();

    fireEvent.click(screen.getByRole('button', { name: /back to registration/i }));

    expect(await screen.findByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  });

  test('Google sign-up stores the session and goes to the dashboard', async () => {
    googleLogin.mockResolvedValueOnce(SESSION);
    renderPage();

    // The Google callback runs outside React's event system; act() flushes its updates.
    await act(async () => {
      await googleOpts.current.onSuccess({ access_token: 'google-access-token' });
    });

    expect(googleLogin).toHaveBeenCalledWith('google-access-token');
    expect(localStorage.getItem('apiToken')).toBe('fake-jwt-token');
    expect(syncPendingUrl).toHaveBeenCalledWith('fake-jwt-token');
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });
});
