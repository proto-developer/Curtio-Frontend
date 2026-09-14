import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Analytics from './Analytics';

/*
 * SAFETY: API stubbed - no backend call. Charts + heavy children are no-ops so
 * the assertions target this page's owner/free + redirected/non-redirected
 * branching, its states, filters and navigation.
 */
vi.mock('@/api/urls', () => ({ listUrls: vi.fn() }));
vi.mock('@/lib/auth/owner', () => ({ isOwner: vi.fn(() => false) }));
vi.mock('@/socket/useSocket', () => ({ default: () => ({ socket: null, isConnected: false }) }));
vi.mock('@/config/shortener', () => ({ SHORTENER_DOMAIN: 'https://sho.rt', generateSlug: () => 'x' }));
vi.mock('@/lib/sourceDetection', () => ({
  detectSource: () => 'Direct',
  platformIconMap: {},
  REFERER_RULES: [],
  BROWSER_RULES: [],
  ALL_RULES: [],
}));
vi.mock('recharts', () => {
  const P = () => null;
  return {
    ResponsiveContainer: P, AreaChart: P, Area: P, XAxis: P, YAxis: P, CartesianGrid: P,
    Tooltip: P, PieChart: P, Pie: P, Cell: P, Legend: P, BarChart: P, Bar: P,
  };
});
vi.mock('@/components/LinkShareModal', () => ({ default: () => null }));
vi.mock('@/components/LabelCell', () => ({ default: () => null }));
vi.mock('@/components/AddToCampaignModal', () => ({ default: () => 'CAMPAIGN_MODAL_OPEN' }));

import { listUrls } from '@/api/urls';
import { isOwner } from '@/lib/auth/owner';

const makeUrl = (over = {}) => ({
  _id: 'link-1',
  shortCode: 'promo',
  originalUrl: 'https://example.com/landing',
  clicks: 42,
  preClicks: 9,
  active: true,
  clickLogs: [],
  preClickLogs: [],
  labels: [],
  campaigns: [],
  ...over,
});

const listOk = (urls = [makeUrl()]) => ({ success: true, urls, labels: {} });

function renderAnalytics({ id = 'link-1', view } = {}) {
  const path = `/analytics/${id}${view ? `?view=${view}` : ''}`;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/analytics/:id" element={<Analytics />} />
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('apiToken', 'test-token');
  isOwner.mockReturnValue(false);
  listUrls.mockResolvedValue(listOk());
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn() },
  });
});

describe('Analytics - loading and failure states', () => {
  test('shows the redirected-clicks loading text while data is in flight', async () => {
    listUrls.mockReturnValue(new Promise(() => {}));
    renderAnalytics();

    expect(await screen.findByText('Loading click logs...')).toBeInTheDocument();
  });

  test('shows the pre-click loading text for an owner on the pre-click view', async () => {
    isOwner.mockReturnValue(true);
    listUrls.mockReturnValue(new Promise(() => {}));
    renderAnalytics({ view: 'preclick' });

    expect(await screen.findByText('Loading pre-click logs...')).toBeInTheDocument();
  });

  test('shows an auth error when there is no token', async () => {
    localStorage.clear();
    renderAnalytics();

    expect(await screen.findByText('Analytics Unavailable')).toBeInTheDocument();
    expect(
      screen.getByText('Authentication token is missing. Please log in.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute('href', '/dashboard');
  });

  test('shows "Link not found" when the id is not in the account', async () => {
    listUrls.mockResolvedValue(listOk([makeUrl({ _id: 'someone-else' })]));
    renderAnalytics();

    expect(await screen.findByText('Link not found or not owned by you.')).toBeInTheDocument();
  });

  test('shows the server message when the list request fails', async () => {
    listUrls.mockResolvedValue({ success: false, message: 'Analytics unavailable right now.' });
    renderAnalytics();

    expect(await screen.findByText('Analytics unavailable right now.')).toBeInTheDocument();
  });

  test('shows a network error when the list request throws', async () => {
    listUrls.mockRejectedValue(new Error('offline'));
    renderAnalytics();

    expect(
      await screen.findByText('Network error. Could not connect to server.'),
    ).toBeInTheDocument();
  });
});

describe('Analytics - free (non-owner) user', () => {
  test('shows only the redirected metric, with no pre-click controls', async () => {
    renderAnalytics();

    expect(await screen.findByText('Total Redirected Clicks')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('In Range')).toBeInTheDocument(); // non-owner stat pill
    expect(screen.queryByText('Redirected Link Analytics')).not.toBeInTheDocument();
    expect(screen.queryByText('Pre-Clicks')).not.toBeInTheDocument();
  });

  test('ignores ?view=preclick for a non-owner and stays on redirected clicks', async () => {
    renderAnalytics({ view: 'preclick' });

    expect(await screen.findByText('Total Redirected Clicks')).toBeInTheDocument();
    expect(screen.queryByText('Total Non-Redirected Clicks')).not.toBeInTheDocument();
  });
});

describe('Analytics - owner, redirected view', () => {
  beforeEach(() => isOwner.mockReturnValue(true));

  test('shows the redirected banner and a switch pill to the non-redirected total', async () => {
    renderAnalytics();

    expect(await screen.findByText('Redirected Link Analytics')).toBeInTheDocument();
    expect(screen.getByText('Total Redirected Clicks')).toBeInTheDocument();

    const switchPill = screen.getByText('Non-Redirected Clicks').closest('a');
    expect(within(switchPill).getByText('9')).toBeInTheDocument(); // preClicks total
    expect(switchPill).toHaveAttribute('href', '/analytics/link-1?view=preclick');
  });

  test('offers the Pre-Clicks toggle link', async () => {
    renderAnalytics();
    await screen.findByText('Redirected Link Analytics');

    expect(screen.getByText('Pre-Clicks').closest('a')).toHaveAttribute(
      'href',
      '/analytics/link-1?view=preclick',
    );
  });
});

describe('Analytics - owner, non-redirected view', () => {
  beforeEach(() => isOwner.mockReturnValue(true));

  test('shows the non-redirected banner and total', async () => {
    renderAnalytics({ view: 'preclick' });

    expect(await screen.findByText('Non-Redirected Link Analytics')).toBeInTheDocument();
    expect(screen.getByText('Total Non-Redirected Clicks')).toBeInTheDocument();

    const switchPill = screen.getByText('Redirected Clicks').closest('a');
    expect(within(switchPill).getByText('42')).toBeInTheDocument();
  });
});

describe('Analytics - controls', () => {
  test('the Filters button opens the filter panel and Apply closes it', async () => {
    renderAnalytics();
    await screen.findByText('Total Redirected Clicks');

    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('the Copy button writes the short link to the clipboard', async () => {
    renderAnalytics();
    await screen.findByText('Total Redirected Clicks');

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://sho.rt/promo');
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });

  test('"Add to Campaign" opens the campaign modal', async () => {
    renderAnalytics();
    await screen.findByText('Total Redirected Clicks');

    fireEvent.click(screen.getByRole('button', { name: /add to campaign/i }));

    expect(screen.getByText('CAMPAIGN_MODAL_OPEN')).toBeInTheDocument();
  });

  test('renders empty-state messaging for a link with no logs', async () => {
    renderAnalytics();

    expect(await screen.findByText('No browser data yet')).toBeInTheDocument();
    expect(screen.getByText('No device data yet')).toBeInTheDocument();
    expect(screen.getByText('No geographic data yet')).toBeInTheDocument();
  });

  test('the header links back to the dashboard', async () => {
    renderAnalytics();
    await screen.findByText('Total Redirected Clicks');

    expect(screen.getByRole('link', { name: /^dashboard$/i })).toHaveAttribute('href', '/dashboard');
  });
});
