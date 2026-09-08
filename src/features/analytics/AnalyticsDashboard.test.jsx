import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import AnalyticsDashboard from './AnalyticsDashboard';

/*
 * SAFETY: the API surface is stubbed - no request reaches the backend.
 * Charts (recharts) and the heavy child components are replaced with no-ops so
 * the assertions target this page's stats, states, filters and navigation.
 */
vi.mock('@/api/urls', () => ({
  listUrls: vi.fn(),
  deleteUrl: vi.fn(),
  toggleUrl: vi.fn(),
}));
vi.mock('@/socket/useSocket', () => ({ default: () => ({ socket: null, isConnected: false }) }));
vi.mock('@/lib/auth/premium', () => ({
  hasUnlimitedLinks: vi.fn(() => false),
  linkLimitFor: (unlimited) => (unlimited ? Infinity : 100),
  isSubscriptionExpired: () => false,
}));
vi.mock('@/config/shortener', () => ({ SHORTENER_DOMAIN: 'https://sho.rt', generateSlug: () => 'x' }));
vi.mock('@/lib/sourceDetection', () => ({
  detectSource: () => 'Direct',
  platformIconMap: {},
  REFERER_RULES: [],
  BROWSER_RULES: [],
  ALL_RULES: [],
}));
vi.mock('recharts', () => {
  // Render nothing - none of the assertions look inside a chart, and rendering
  // the chart's <defs>/<linearGradient> subtree trips React casing warnings.
  const P = () => null;
  return {
    ResponsiveContainer: P, AreaChart: P, Area: P, XAxis: P, YAxis: P,
    CartesianGrid: P, Tooltip: P, PieChart: P, Pie: P, Cell: P, BarChart: P, Bar: P,
  };
});
vi.mock('@/components/Sidebar', () => ({ default: () => null }));
vi.mock('@/components/LinkShareModal', () => ({ default: () => null }));
vi.mock('@/components/LabelCell', () => ({ default: () => null }));
vi.mock('@/components/AddToCampaignModal', () => ({ default: () => null }));
vi.mock('@/components/MobileLinkList', () => ({ default: () => null }));
vi.mock('@/components/ui/QrModal', () => ({ default: () => null }));

import { listUrls } from '@/api/urls';

const makeUrl = (over = {}) => ({
  _id: '1',
  shortCode: 'promo',
  originalUrl: 'https://example.com/a',
  clicks: 5,
  active: true,
  createdAt: '2020-02-01T00:00:00.000Z',
  clickLogs: [],
  labels: [],
  campaigns: [],
  ...over,
});

const listOk = (urls = []) => ({
  success: true,
  urls,
  labels: {},
  unlimitedLinks: false,
  subscriptionStatus: 'none',
});

const renderPage = () => render(<MemoryRouter><AnalyticsDashboard /></MemoryRouter>);
const statCard = (label) => screen.getByText(label).closest('a');

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('apiToken', 'test-token');
  localStorage.setItem('LoginUser', JSON.stringify({ name: 'Test User', email: 't@example.com' }));
  listUrls.mockResolvedValue(listOk());
});

describe('AnalyticsDashboard - loading / empty / error', () => {
  test('shows the loading state while the data is in flight', async () => {
    listUrls.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(await screen.findByText(/loading user analytics/i)).toBeInTheDocument();
  });

  test('renders the stat labels and empty sections for an account with no clicks', async () => {
    renderPage();

    expect(await screen.findByText('No links created yet.')).toBeInTheDocument();
    expect(screen.getByText('Total Links')).toBeInTheDocument();
    expect(screen.getByText('Redirected Clicks')).toBeInTheDocument();
    expect(screen.getByText('Active Links')).toBeInTheDocument();
    expect(screen.getByText('Inactive Links')).toBeInTheDocument();
    expect(screen.getByText('No referrer data yet')).toBeInTheDocument();
    expect(screen.getByText('No device data yet')).toBeInTheDocument();
    expect(screen.getByText('No geographic data yet')).toBeInTheDocument();
  });

  test('shows the server message when the list request fails', async () => {
    listUrls.mockResolvedValue({ success: false, message: 'Could not load analytics.' });
    renderPage();

    expect(await screen.findByText('Could not load analytics.')).toBeInTheDocument();
  });

  test('shows a network error when the list request throws', async () => {
    listUrls.mockRejectedValue(new Error('offline'));
    renderPage();

    expect(
      await screen.findByText('Network error. Could not retrieve link statistics.'),
    ).toBeInTheDocument();
  });
});

describe('AnalyticsDashboard - populated data', () => {
  beforeEach(() => {
    listUrls.mockResolvedValue(
      listOk([
        makeUrl({ _id: '1', shortCode: 'promo', clicks: 5, active: true, createdAt: '2020-02-01T00:00:00.000Z' }),
        makeUrl({ _id: '2', shortCode: 'sale', clicks: 3, active: false, createdAt: '2020-01-01T00:00:00.000Z' }),
      ]),
    );
  });

  test('renders a row per link with its short URL and click count', async () => {
    renderPage();

    expect(await screen.findByText('https://sho.rt/promo')).toBeInTheDocument();
    expect(screen.getByText('https://sho.rt/sale')).toBeInTheDocument();
  });

  test('aggregates the stat cards across all links', async () => {
    renderPage();
    await screen.findByText('https://sho.rt/promo');

    expect(within(statCard('Total Links')).getByText('2')).toBeInTheDocument();
    expect(within(statCard('Redirected Clicks')).getByText('8')).toBeInTheDocument(); // 5 + 3
    expect(within(statCard('Active Links')).getByText('1')).toBeInTheDocument();
    expect(within(statCard('Inactive Links')).getByText('1')).toBeInTheDocument();
  });

  test('each link row links to its detailed analytics page', async () => {
    renderPage();
    await screen.findByText('https://sho.rt/promo');

    const detailLinks = screen.getAllByTitle('Detailed Analytics');
    expect(detailLinks[0]).toHaveAttribute('href', '/analytics/1'); // promo sorts first (newest)
  });
});

describe('AnalyticsDashboard - navigation', () => {
  test('stat cards link to the expected routes', async () => {
    renderPage();
    await screen.findByText('No links created yet.');

    expect(statCard('Total Links')).toHaveAttribute('href', '/dashboard');
    expect(statCard('Redirected Clicks')).toHaveAttribute('href', '/dashboard/analytics');
  });
});

describe('AnalyticsDashboard - filters', () => {
  test('the Filters button opens the panel, and Apply closes it', async () => {
    renderPage();
    await screen.findByText('No links created yet.');

    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('Clear All also closes the panel', async () => {
    renderPage();
    await screen.findByText('No links created yet.');

    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    await screen.findByRole('dialog');

    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
