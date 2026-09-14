import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Pricing from './Pricing';

// The plan endpoint is stubbed - no request reaches the backend. The real
// `isSubscriptionExpired` (a pure function) is kept.
vi.mock('@/api/plan', () => ({ getPlan: vi.fn() }));
vi.mock('@/lib/auth/owner', () => ({ isOwner: vi.fn(() => false) }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));

import { getPlan } from '@/api/plan';
import { isOwner } from '@/lib/auth/owner';

function renderPricing() {
  return render(
    <MemoryRouter initialEntries={['/pricing']}>
      <Routes>
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/dashboard" element={<div>Dashboard redirect target</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const login = () => localStorage.setItem('apiToken', 'test-token');

// "Coming soon" / "Current Plan" also appear in the comparison table, so scope
// plan-badge assertions to the Plus pricing card itself.
const plusCard = () => screen.getByRole('heading', { name: 'Plus' }).closest('article');

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  isOwner.mockReturnValue(false);
  getPlan.mockResolvedValue({ success: true, unlimitedLinks: false, subscriptionStatus: 'none' });
});

describe('Pricing - logged-out visitor', () => {
  test('shows the page with a "Get Started Free" call to action to register', () => {
    renderPricing();

    expect(screen.getByRole('heading', { name: 'Pricing Plan' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Free' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Plus' })).toBeInTheDocument();

    const cta = screen.getByRole('link', { name: 'Get Started Free' });
    expect(cta).toHaveAttribute('href', '/register');
  });

  test('does not mark any plan as the current plan', () => {
    renderPricing();

    expect(screen.queryByText('Current Plan')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Continue to Dashboard' })).not.toBeInTheDocument();
  });

  test('Plus is shown as coming soon with a disabled action', () => {
    renderPricing();

    expect(within(plusCard()).getByText('Coming soon')).toBeInTheDocument();
    const plusCta = screen.getByRole('button', { name: 'Coming Soon' });
    expect(plusCta).toBeDisabled();
  });

  test('never calls the plan endpoint for an anonymous visitor', () => {
    renderPricing();
    expect(getPlan).not.toHaveBeenCalled();
  });
});

describe('Pricing - logged-in Free user', () => {
  beforeEach(() => {
    login();
    getPlan.mockResolvedValue({ success: true, unlimitedLinks: false, subscriptionStatus: 'none' });
  });

  test('marks Free as the current plan and offers "Continue to Dashboard"', async () => {
    renderPricing();

    expect(await screen.findByText('Current Plan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue to Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(screen.queryByRole('link', { name: 'Get Started Free' })).not.toBeInTheDocument();
  });

  test('still shows Plus as coming soon', async () => {
    renderPricing();
    await screen.findByText('Current Plan');

    expect(within(plusCard()).getByText('Coming soon')).toBeInTheDocument();
  });
});

describe('Pricing - active Plus subscriber', () => {
  beforeEach(() => {
    login();
    getPlan.mockResolvedValue({ success: true, unlimitedLinks: true, subscriptionStatus: 'active' });
  });

  test('marks Plus as the current plan and drops the "coming soon" badge', async () => {
    renderPricing();

    expect(await screen.findByText('Current Plan')).toBeInTheDocument();
    expect(within(plusCard()).queryByText('Coming soon')).not.toBeInTheDocument();
    expect(within(plusCard()).getByText('Current Plan')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Coming Soon' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue to Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });
});

describe('Pricing - lapsed Plus subscriber', () => {
  test('an expired subscription is treated as Free, not as active Plus', async () => {
    login();
    getPlan.mockResolvedValue({ success: true, unlimitedLinks: true, subscriptionStatus: 'expired' });
    renderPricing();

    expect(await screen.findByText('Current Plan')).toBeInTheDocument();
    // Plus is not current -> its coming-soon badge is still there.
    expect(within(plusCard()).getByText('Coming soon')).toBeInTheDocument();
  });
});

describe('Pricing - owner and error handling', () => {
  test('an owner visiting /pricing is redirected to the dashboard', async () => {
    isOwner.mockReturnValue(true);
    login();
    renderPricing();

    expect(await screen.findByText('Dashboard redirect target')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pricing Plan' })).not.toBeInTheDocument();
  });

  test('renders the page without a current-plan badge when the plan lookup fails', async () => {
    login();
    getPlan.mockRejectedValue(new Error('offline'));
    renderPricing();

    expect(await screen.findByRole('heading', { name: 'Pricing Plan' })).toBeInTheDocument();
    await waitFor(() => expect(getPlan).toHaveBeenCalled());
    expect(screen.queryByText('Current Plan')).not.toBeInTheDocument();
  });
});

describe('Pricing - comparison and FAQ', () => {
  test('always renders the Free-vs-Plus comparison with the link limits', () => {
    renderPricing();

    expect(screen.getByRole('heading', { name: /free and plus side by side/i })).toBeInTheDocument();
    // "Tracked links" row: 1 vs Unlimited (rendered in both the mobile and desktop layouts).
    expect(screen.getAllByText('Tracked links').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Unlimited').length).toBeGreaterThan(0);
  });

  test('a closed FAQ question expands when clicked', () => {
    renderPricing();

    const question = screen.getByRole('button', { name: /when do i need to upgrade/i });
    expect(question).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(question);
    expect(question).toHaveAttribute('aria-expanded', 'true');
  });
});
