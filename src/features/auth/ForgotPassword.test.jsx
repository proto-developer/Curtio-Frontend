import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ForgotPassword from './ForgotPassword';

/*
 * SAFETY: every network boundary is stubbed so this suite never reaches the
 * real backend or database.
 *   1. `@/api/auth` is fully mocked  -> sendResetOtp / resetPassword are vi.fn()s
 *      that only return whatever a test tells them to.
 *   2. global.fetch is replaced with a throwing stub -> if any code path ever
 *      tries a real HTTP request, the test fails loudly instead of writing data.
 */
vi.mock('@/api/auth', () => ({
  sendResetOtp: vi.fn(),
  resetPassword: vi.fn(),
}));

// Keep real Router behaviour but capture navigation.
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { sendResetOtp, resetPassword } from '@/api/auth';

const renderPage = () => render(<BrowserRouter><ForgotPassword /></BrowserRouter>);

// Move the wizard from step 1 (email) to step 2 (OTP + new password).
async function advanceToStep2(email = 'user@example.com') {
  sendResetOtp.mockResolvedValueOnce({ success: true });
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: /send otp/i }));
  await screen.findByPlaceholderText('Enter OTP');
}

beforeEach(() => {
  vi.clearAllMocks();
  // Any real fetch attempt = test failure, never a silent DB write.
  global.fetch = vi.fn(() => {
    throw new Error('Real network call attempted in a unit test');
  });
});

describe('ForgotPassword - password recovery journey', () => {
  test('starts on the email step', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter OTP')).not.toBeInTheDocument();
  });

  test('sends the reset OTP and advances to the verification step', async () => {
    sendResetOtp.mockResolvedValueOnce({ success: true });
    renderPage();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(sendResetOtp).toHaveBeenCalledWith('user@example.com');
    });
    expect(await screen.findByText('OTP sent successfully')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter OTP')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  test('shows the server error and stays on the email step when the account is unknown', async () => {
    sendResetOtp.mockResolvedValueOnce({ success: false, message: 'No account for that email' });
    renderPage();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'ghost@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    expect(await screen.findByText('No account for that email')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter OTP')).not.toBeInTheDocument();
  });

  test('surfaces a network error if the OTP request throws', async () => {
    sendResetOtp.mockRejectedValueOnce(new Error('boom'));
    renderPage();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });

  test('blocks the reset when the two passwords differ', async () => {
    renderPage();
    await advanceToStep2();

    const [newPassword, confirmPassword] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(screen.getByPlaceholderText('Enter OTP'), { target: { value: '123456' } });
    fireEvent.change(newPassword, { target: { value: 'NewPass123!' } });
    fireEvent.change(confirmPassword, { target: { value: 'Mismatch123!' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  test('resets the password and redirects to login on success', async () => {
    renderPage();
    await advanceToStep2('user@example.com');

    resetPassword.mockResolvedValueOnce({ success: true });

    const [newPassword, confirmPassword] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(screen.getByPlaceholderText('Enter OTP'), { target: { value: '123456' } });
    fireEvent.change(newPassword, { target: { value: 'NewPass123!' } });
    fireEvent.change(confirmPassword, { target: { value: 'NewPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        otp: '123456',
        password: 'NewPass123!',
      });
    });
    expect(await screen.findByText('Password updated successfully')).toBeInTheDocument();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'), { timeout: 2500 });
  });

  test('shows the server error when the OTP is wrong or expired', async () => {
    renderPage();
    await advanceToStep2();

    resetPassword.mockResolvedValueOnce({ success: false, message: 'Invalid or expired OTP' });

    const [newPassword, confirmPassword] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(screen.getByPlaceholderText('Enter OTP'), { target: { value: '000000' } });
    fireEvent.change(newPassword, { target: { value: 'NewPass123!' } });
    fireEvent.change(confirmPassword, { target: { value: 'NewPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText('Invalid or expired OTP')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
