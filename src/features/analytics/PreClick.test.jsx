import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import PreClick from './PreClick';

// SAFETY: API stubbed, charts + heavy children replaced with no-ops.
vi.mock('@/api/urls', () => ({
  listUrls: vi.fn(),
  deleteUrl: vi.fn(),
  toggleUrl: vi.fn(),
}));
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
  shortCode: 'one',
  originalUrl: 'https://example.com/a',
  preClicks: 10,
  active: true,
  createdAt: '2020-01-01T00:00:00.000Z',
  preClickLogs: [],
  labels: [],
  campaigns: [],
  ...over,
});

const listOk = (urls = []) => ({ success: true, urls, labels: {} });

const renderPage = () => render(<MemoryRouter><PreClick /></MemoryRouter>);
const statCard = (label) => screen.getByText(label).closest('a');

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('apiToken', 'test-token');
  localStorage.setItem('LoginUser', JSON.stringify({ name: 'Owner', email: 'owner@example.com' }));
  listUrls.mockResolvedValue(listOk());
});

describe('PreClick - loading / empty / error', () => {
  test('shows the pre-click loading state while data is in flight', async () => {
    listUrls.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(await screen.findByText(/loading pre-click analytics/i)).toBeInTheDocument();
  });

  test('renders the stat labels and empty sections when there are no pre-clicks', async () => {
    renderPage();

    expect(await screen.findByText('No links created yet.')).toBeInTheDocument();
    expect(screen.getByText('Total Links')).toBeInTheDocument();
    expect(screen.getByText('Non-Redirected Clicks')).toBeInTheDocument();
    expect(screen.getByText('No referrer data yet')).toBeInTheDocument();
    expect(screen.getByText('No device data yet')).toBeInTheDocument();
    expect(screen.getByText('No geographic data yet')).toBeInTheDocument();
  });

  test('shows the server message when the list request fails', async () => {
    listUrls.mockResolvedValue({ success: false, message: 'No pre-click data.' });
    renderPage();

    expect(await screen.findByText('No pre-click data.')).toBeInTheDocument();
  });

  test('shows a network error when the list request throws', async () => {
    listUrls.mockRejectedValue(new Error('offline'));
    renderPage();

    expect(
      await screen.findByText('Network error. Could not retrieve link statistics.'),
    ).toBeInTheDocument();
  });
});

describe('PreClick - populated data', () => {
  test('aggregates the non-redirected click total across links', async () => {
    listUrls.mockResolvedValue(
      listOk([
        makeUrl({ _id: '1', shortCode: 'one', preClicks: 10, active: true }),
        makeUrl({ _id: '2', shortCode: 'two', preClicks: 4, active: false }),
      ]),
    );
    renderPage();

    expect(await screen.findByText('https://sho.rt/one')).toBeInTheDocument();
    expect(within(statCard('Non-Redirected Clicks')).getByText('14')).toBeInTheDocument();
    expect(screen.getByText('Pre-clicks')).toBeInTheDocument(); // table column header
  });

  test('the Top Performing Links table is limited to the top 5 by pre-clicks', async () => {
    listUrls.mockResolvedValue(
      listOk(
        [60, 50, 40, 30, 20, 10].map((n, i) =>
          makeUrl({ _id: String(i + 1), shortCode: `link${i + 1}`, preClicks: n }),
        ),
      ),
    );
    renderPage();

    expect(await screen.findByText('https://sho.rt/link1')).toBeInTheDocument(); // 60, top
    expect(screen.getByText('https://sho.rt/link5')).toBeInTheDocument(); // 20, 5th
    expect(screen.queryByText('https://sho.rt/link6')).not.toBeInTheDocument(); // 10, cut off
  });
});

describe('PreClick - navigation and filters', () => {
  test('stat cards link to the expected routes', async () => {
    renderPage();
    await screen.findByText('No links created yet.');

    expect(statCard('Total Links')).toHaveAttribute('href', '/dashboard');
    expect(statCard('Non-Redirected Clicks')).toHaveAttribute('href', '/dashboard/preclick');
  });

  test('the Filters button opens the panel and Apply closes it', async () => {
    renderPage();
    await screen.findByText('No links created yet.');

    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
