import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard';

/*
 * SAFETY: the whole API surface is stubbed - no request reaches the backend.
 *   - `@/api/urls`   list/create/delete/toggle are vi.fn()s
 *   - `@/lib/sync`   syncPendingUrl (real one calls createUrl -> DB)
 *   - `@/socket/useSocket`  no real socket connection
 * Heavy child components are replaced with no-ops so the assertions target
 * Dashboard's own logic (states, form validation, feedback).
 */
vi.mock('@/api/urls', () => ({
  listUrls: vi.fn(),
  createUrl: vi.fn(),
  deleteUrl: vi.fn(),
  toggleUrl: vi.fn(),
}));
vi.mock('@/lib/sync', () => ({ syncPendingUrl: vi.fn() }));
vi.mock('@/socket/useSocket', () => ({ default: () => ({ socket: null, isConnected: false }) }));
vi.mock('@/lib/auth/owner', () => ({ isOwner: vi.fn(() => false) }));
vi.mock('@/lib/auth/premium', () => ({
  hasUnlimitedLinks: vi.fn(() => false),
  linkLimitFor: (unlimited) => (unlimited ? Infinity : 1),
  isSubscriptionExpired: () => false,
  FREE_LINK_LIMIT: 1,
}));
vi.mock('@/config/shortener', () => ({
  SHORTENER_DOMAIN: 'https://sho.rt',
  generateSlug: () => 'abc1234',
}));

vi.mock('@/components/Sidebar', () => ({ default: () => null }));
vi.mock('@/components/MobileLinkList', () => ({ default: () => null }));
vi.mock('@/components/LinkShareModal', () => ({ default: () => null }));
vi.mock('@/components/LabelCell', () => ({ default: () => null }));
vi.mock('@/components/AddToCampaignModal', () => ({ default: () => null }));
vi.mock('@/components/PlanUpgradeModal', () => ({ default: () => null }));
vi.mock('@/components/ui/QrModal', () => ({ default: () => null }));

import { listUrls, createUrl } from '@/api/urls';
import { hasUnlimitedLinks } from '@/lib/auth/premium';

const makeUrl = (over = {}) => ({
  _id: '1',
  shortCode: 'promo',
  originalUrl: 'https://example.com/landing',
  clicks: 42,
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  clickLogs: [],
  labels: [],
  campaigns: [],
  ...over,
});

const listOk = (urls = []) => ({
  success: true,
  urls,
  unlimitedLinks: false,
  subscriptionStatus: 'none',
  labels: {},
});

const renderDashboard = () => render(<MemoryRouter><Dashboard /></MemoryRouter>);

const openCreateForm = () =>
  fireEvent.click(screen.getByRole('button', { name: /new link/i }));

const destinationInput = () =>
  screen.getByPlaceholderText('https://your-long-url.com/...');

const submitCreateForm = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Create Link' }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('apiToken', 'test-token');
  localStorage.setItem('LoginUser', JSON.stringify({ name: 'Test User', email: 't@example.com' }));
  hasUnlimitedLinks.mockReturnValue(false);
  listUrls.mockResolvedValue(listOk());
  createUrl.mockResolvedValue({ success: true, url: { _id: 'new-link' } });
});

describe('Dashboard - rendering states', () => {
  test('shows the loading state while the link list is in flight', async () => {
    listUrls.mockReturnValue(new Promise(() => {})); // never resolves
    renderDashboard();

    expect(await screen.findByText(/loading your tracked links/i)).toBeInTheDocument();
  });

  test('shows the empty state once an account with no links loads', async () => {
    listUrls.mockResolvedValue(listOk([]));
    renderDashboard();

    expect(await screen.findByText('No links yet')).toBeInTheDocument();
    expect(screen.getByText(/create your first tracked link/i)).toBeInTheDocument();
  });

  test('renders a row for each link when the account has links', async () => {
    listUrls.mockResolvedValue(
      listOk([
        makeUrl({ _id: '1', shortCode: 'promo', originalUrl: 'https://example.com/a', clicks: 42 }),
        makeUrl({ _id: '2', shortCode: 'sale', originalUrl: 'https://example.com/b', clicks: 7 }),
      ]),
    );
    renderDashboard();

    expect(await screen.findByText('https://sho.rt/promo')).toBeInTheDocument();
    expect(screen.getByText('https://sho.rt/sale')).toBeInTheDocument();
    expect(screen.getByText('https://example.com/a')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  test('shows the server message when the list request fails', async () => {
    listUrls.mockResolvedValue({ success: false, message: 'Session no longer valid.' });
    renderDashboard();

    expect(await screen.findByText('Session no longer valid.')).toBeInTheDocument();
  });

  test('shows a network error when the list request throws', async () => {
    listUrls.mockRejectedValue(new Error('offline'));
    renderDashboard();

    expect(
      await screen.findByText('Network error. Could not connect to server.'),
    ).toBeInTheDocument();
  });
});

describe('Dashboard - create-link flow', () => {
  test('the New Link button reveals the create form', async () => {
    renderDashboard();
    await screen.findByText('No links yet');

    openCreateForm();

    expect(screen.getByText('Create Your Tracked Link')).toBeInTheDocument();
    expect(destinationInput()).toBeInTheDocument();
  });

  test('an empty destination URL is rejected without calling the API', async () => {
    renderDashboard();
    await screen.findByText('No links yet');
    openCreateForm();

    submitCreateForm();

    expect(await screen.findByText('Destination URL is required.')).toBeInTheDocument();
    expect(createUrl).not.toHaveBeenCalled();
  });

  test('a malformed URL is rejected without calling the API', async () => {
    renderDashboard();
    await screen.findByText('No links yet');
    openCreateForm();

    fireEvent.change(destinationInput(), { target: { value: 'not-a-real-url' } });
    submitCreateForm();

    expect(
      await screen.findByText('Enter a valid URL including https://'),
    ).toBeInTheDocument();
    expect(createUrl).not.toHaveBeenCalled();
  });

  test('a valid URL is submitted, then the form closes and the list refreshes', async () => {
    renderDashboard();
    await screen.findByText('No links yet');
    openCreateForm();

    fireEvent.change(destinationInput(), { target: { value: 'https://example.com/page' } });
    submitCreateForm();

    await waitFor(() => {
      expect(createUrl).toHaveBeenCalledWith({
        originalUrl: 'https://example.com/page',
        customAlias: undefined,
        password: undefined,
        expiresAt: undefined,
      });
    });
    await waitFor(() => {
      expect(screen.queryByText('Create Your Tracked Link')).not.toBeInTheDocument();
    });
    // once on mount + once after the successful create
    expect(listUrls).toHaveBeenCalledTimes(2);
  });

  test('a server refusal surfaces its message in the error banner', async () => {
    createUrl.mockResolvedValue({ success: false, message: 'That alias is taken.' });
    renderDashboard();
    await screen.findByText('No links yet');
    openCreateForm();

    fireEvent.change(destinationInput(), { target: { value: 'https://example.com/page' } });
    submitCreateForm();

    expect(await screen.findByText('That alias is taken.')).toBeInTheDocument();
  });

  test('a thrown create request shows a network error', async () => {
    createUrl.mockRejectedValue(new Error('offline'));
    renderDashboard();
    await screen.findByText('No links yet');
    openCreateForm();

    fireEvent.change(destinationInput(), { target: { value: 'https://example.com/page' } });
    submitCreateForm();

    expect(
      await screen.findByText('Network error. Could not create short URL.'),
    ).toBeInTheDocument();
  });

  test('a plan-limit refusal from the server opens the limit modal', async () => {
    createUrl.mockResolvedValue({ success: false, planLimitReached: true });
    renderDashboard();
    await screen.findByText('No links yet');
    openCreateForm();

    fireEvent.change(destinationInput(), { target: { value: 'https://example.com/page' } });
    submitCreateForm();

    expect(await screen.findByText('Link Limit Reached')).toBeInTheDocument();
  });
});

describe('Dashboard - free-plan quota', () => {
  test('at the free limit, New Link opens the limit modal instead of the form', async () => {
    hasUnlimitedLinks.mockReturnValue(false);
    listUrls.mockResolvedValue(listOk([makeUrl()])); // 1 link, free limit is 1
    renderDashboard();
    await screen.findByText('https://sho.rt/promo');

    openCreateForm();

    expect(await screen.findByText('Link Limit Reached')).toBeInTheDocument();
    expect(screen.queryByText('Create Your Tracked Link')).not.toBeInTheDocument();
  });

  test('a paid plan shows the unlimited-links footnote', async () => {
    hasUnlimitedLinks.mockReturnValue(true);
    listUrls.mockResolvedValue({ ...listOk([]), unlimitedLinks: true });
    renderDashboard();

    expect(
      await screen.findByText('Paid plan: unlimited tracked links.'),
    ).toBeInTheDocument();
  });
});
