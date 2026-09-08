import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Sidebar from './Sidebar';

// Plan endpoint stubbed; the real `isSubscriptionExpired` is kept.
vi.mock('@/api/plan', () => ({ getPlan: vi.fn() }));
vi.mock('@/lib/auth/owner', () => ({ isOwner: vi.fn(() => false) }));
vi.mock('./PlanUpgradeModal', () => ({
  default: ({ open }) => (open ? 'UPGRADE_MODAL_OPEN' : null),
}));

import { getPlan } from '@/api/plan';
import { isOwner } from '@/lib/auth/owner';

const renderSidebar = (props = {}) =>
  render(
    <MemoryRouter>
      <Sidebar sidebarOpen={false} setSidebarOpen={() => {}} {...props} />
    </MemoryRouter>,
  );

const freePlan = (over = {}) => ({
  success: true,
  unlimitedLinks: false,
  subscriptionStatus: 'none',
  freeLinkLimit: 1,
  freeCampaignLimit: 1,
  linksCount: 0,
  campaignsCount: 0,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('apiToken', 'test-token');
  localStorage.setItem('LoginUser', JSON.stringify({ name: 'Dana Lee', email: 'dana@example.com' }));
  isOwner.mockReturnValue(false);
  getPlan.mockResolvedValue(freePlan());
});

describe('Sidebar - navigation', () => {
  test('always renders the core nav links', async () => {
    renderSidebar({ linksCount: 0 });

    expect(screen.getByRole('link', { name: /redirected clicks dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^links$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /campaigns/i })).toBeInTheDocument();
    // Let the async getPlan() -> setPlan settle inside act().
    await waitFor(() => expect(getPlan).toHaveBeenCalled());
  });

  test('hides the owner-only pre-click nav for a normal user', async () => {
    renderSidebar({ linksCount: 0 });
    expect(
      screen.queryByRole('link', { name: /non-redirected clicks dashboard/i }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(getPlan).toHaveBeenCalled());
  });
});

describe('Sidebar - owner / admin', () => {
  test('shows the Admin marker and no plan card, and never calls the plan endpoint', () => {
    isOwner.mockReturnValue(true);
    renderSidebar({ linksCount: 0 });

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.queryByText('Free Plan')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /non-redirected clicks dashboard/i })).toBeInTheDocument();
    expect(getPlan).not.toHaveBeenCalled();
  });
});

describe('Sidebar - free plan meter', () => {
  test('shows the free-plan usage meters below the limit', async () => {
    getPlan.mockResolvedValue(freePlan({ campaignsCount: 0 }));
    renderSidebar({ linksCount: 0 });

    expect(await screen.findByText('Free Plan')).toBeInTheDocument();
    expect(screen.getByText('0/1 links used')).toBeInTheDocument();
    expect(screen.getByText('0/1 campaigns used')).toBeInTheDocument();
    expect(screen.queryByText('Upgrade to Plus')).not.toBeInTheDocument();
  });

  test('offers "Upgrade to Plus" once both quotas are spent, and it opens the modal', async () => {
    getPlan.mockResolvedValue(freePlan({ campaignsCount: 1 }));
    renderSidebar({ linksCount: 1 });

    const upgrade = await screen.findByRole('button', { name: 'Upgrade to Plus' });
    fireEvent.click(upgrade);

    expect(screen.getByText('UPGRADE_MODAL_OPEN')).toBeInTheDocument();
  });

  test('renders no plan card until the link count is known', async () => {
    renderSidebar(); // no linksCount prop
    await waitFor(() => expect(getPlan).toHaveBeenCalled());

    expect(screen.queryByText('Free Plan')).not.toBeInTheDocument();
  });
});

describe('Sidebar - Plus and expired subscribers', () => {
  test('shows the Plus meter with unlimited quotas for an active subscriber', async () => {
    getPlan.mockResolvedValue({
      success: true,
      unlimitedLinks: true,
      subscriptionStatus: 'active',
      linksCount: 5,
      campaignsCount: 3,
    });
    renderSidebar({ linksCount: 5 });

    expect(await screen.findByText('Plus Plan')).toBeInTheDocument();
    expect(screen.getByText('5/Unlimited links used')).toBeInTheDocument();
    expect(screen.getByText('3/Unlimited campaigns used')).toBeInTheDocument();
  });

  test('shows the "Plus Plan Expired" prompt for a lapsed subscriber', async () => {
    getPlan.mockResolvedValue({
      success: true,
      unlimitedLinks: false,
      subscriptionStatus: 'expired',
    });
    renderSidebar({ linksCount: 1 });

    expect(await screen.findByText('Plus Plan Expired')).toBeInTheDocument();
    const subscribeAgain = screen.getByRole('button', { name: 'Subscribe Again' });
    fireEvent.click(subscribeAgain);
    expect(screen.getByText('UPGRADE_MODAL_OPEN')).toBeInTheDocument();
  });
});

describe('Sidebar - plan lookup failure', () => {
  test('renders the nav without a plan card when the plan request throws', async () => {
    getPlan.mockRejectedValue(new Error('offline'));
    renderSidebar({ linksCount: 0 });

    expect(await screen.findByRole('link', { name: /^links$/i })).toBeInTheDocument();
    await waitFor(() => expect(getPlan).toHaveBeenCalled());
    expect(screen.queryByText('Free Plan')).not.toBeInTheDocument();
    expect(screen.queryByText('Plus Plan')).not.toBeInTheDocument();
  });
});
