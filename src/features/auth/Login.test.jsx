import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Login from './Login';

// Mock @react-oauth/google
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
}));

// Mock sync pending url
vi.mock('../../lib/sync', () => ({
  syncPendingUrl: vi.fn(),
}));

// Helper to render component with router
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Login Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('renders login form elements correctly', () => {
    renderWithRouter(<Login />);

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('updates email and password input values when typed into', () => {
    renderWithRouter(<Login />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

    expect(emailInput.value).toBe('user@example.com');
    expect(passwordInput.value).toBe('Password123!');
  });

  test('handles successful login flow', async () => {
    const mockResponse = {
      success: true,
      apiToken: 'fake-jwt-token',
      LoginUser: { email: 'user@example.com', name: 'Test User' },
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockResponse),
    });

    renderWithRouter(<Login />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('apiToken')).toBe('fake-jwt-token');
      expect(localStorage.getItem('LoginUser')).toContain('user@example.com');
    });
  });

  test('displays error message when login fails', async () => {
    const mockErrorResponse = {
      success: false,
      message: 'Incorrect password.',
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockErrorResponse),
    });

    renderWithRouter(<Login />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'WrongPassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Incorrect password.')).toBeInTheDocument();
    });
  });
});
