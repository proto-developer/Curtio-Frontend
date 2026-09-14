import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Campaigns from './Campaigns';

/*
 * SAFETY: the whole API surface is stubbed - no request reaches the backend.
 * Charts + heavy child components are no-ops; the real Filter is kept so the
 * campaign-detail filter panel can be exercised.
 */
vi.mock('@/api/urls', () => ({
  listUrls: vi.fn(),
  createUrl: vi.fn(),
  deleteUrl: vi.fn(),
  toggleUrl: vi.fn(),
  updateUrlCampaigns: vi.fn(),
  deleteCampaign: vi.fn(),
}));
vi.mock('@/socket/useSocket', () => ({ default: () => ({ socket: null, isConnected: false }) }));
vi.mock('@/lib/auth/owner', () => ({ isOwner: vi.fn(() => false) }));
vi.mock('@/lib/auth/premium', () => ({
  hasUnlimitedLinks: vi.fn(() => false),
  linkLimitFor: (u) => (u ? Infinity : 1),
  campaignLimitFor: (u) => (u ? Infinity : 1),
  isSubscriptionExpired: () => false,
  FREE_LINK_LIMIT: 1,
  FREE_CAMPAIGN_LIMIT: 1,
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
  const P = () => null;
  return {
    ResponsiveContainer: P, AreaChart: P, Area: P, XAxis: P, YAxis: P, CartesianGrid: P,
    Tooltip: P, PieChart: P, Pie: P, Cell: P, BarChart: P, Bar: P,
  };
});
vi.mock('@/components/Sidebar', () => ({ default: () => null }));
vi.mock('@/components/LinkShareModal', () => ({ default: () => null }));
vi.mock('@/components/LabelCell', () => ({ default: () => null }));
vi.mock('@/components/MobileLinkList', () => ({ default: () => null }));
vi.mock('@/components/ui/QrModal', () => ({ default: () => null }));
vi.mock('@/components/PlanUpgradeModal', () => ({ default: () => null }));

import { listUrls, createUrl, updateUrlCampaigns, deleteCampaign } from '@/api/urls';
import { isOwner } from '@/lib/auth/owner';
import { hasUnlimitedLinks } from '@/lib/auth/premium';

const makeUrl = (over = {}) => ({
  _id: 'a',
  shortCode: 'promo',
  originalUrl: 'https://example.com/a',
  clicks: 0,
  preClicks: 0,
  active: true,
  createdAt: '2020-01-01T00:00:00.000Z',
  clickLogs: [],
  preClickLogs: [],
  labels: [],
  campaigns: [],
  ...over,
});

const listOk = (urls = [], over = {}) => ({
  success: true,
  urls,
  labels: {},
  unlimitedLinks: false,
  subscriptionStatus: 'none',
  ...over,
});

// One campaign ("summer") holding two links: A (via utm_campaign) + B (via the
// campaigns array). C is untagged.
const SUMMER = () => [
  makeUrl({
    _id: 'a', shortCode: 'promo',
    originalUrl: 'https://example.com/a?utm_campaign=summer&utm_source=fb',
    clicks: 10, preClicks: 2, active: true, createdAt: '2020-02-01T00:00:00.000Z',
  }),
  makeUrl({
    _id: 'b', shortCode: 'sale', originalUrl: 'https://example.com/b',
    clicks: 5, preClicks: 1, active: false,
    campaigns: [{ name: 'summer', source: '', medium: '' }],
    createdAt: '2020-01-01T00:00:00.000Z',
  }),
  makeUrl({ _id: 'c', shortCode: 'free', originalUrl: 'https://example.com/c', clicks: 3, active: true }),
];

const renderPage = () => render(<MemoryRouter><Campaigns /></MemoryRouter>);

const openCampaign = async (name) => {
  fireEvent.click(screen.getAllByText(name)[1]); // desktop table row
  await screen.findByRole('heading', { name: `Campaign: ${name}` });
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('apiToken', 'test-token');
  localStorage.setItem('LoginUser', JSON.stringify({ name: 'Test User', email: 't@example.com' }));
  isOwner.mockReturnValue(false);
  hasUnlimitedLinks.mockReturnValue(false);
  listUrls.mockResolvedValue(listOk(SUMMER()));
  createUrl.mockResolvedValue({ success: true, url: { _id: 'new' } });
  updateUrlCampaigns.mockResolvedValue({ success: true });
  deleteCampaign.mockResolvedValue({ success: true });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn() },
  });
});

describe('Campaigns - overview states', () => {
  test('shows the loading state while data is in flight', async () => {
    listUrls.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(await screen.findByText('Loading campaign manager...')).toBeInTheDocument();
  });

  test('shows the empty state when no link carries a campaign', async () => {
    listUrls.mockResolvedValue(listOk([makeUrl({ _id: 'c', campaigns: [] })]));
    renderPage();

    expect(await screen.findAllByText(/no campaigns detected yet/i)).not.toHaveLength(0);
  });

  test('shows the server message when the list request fails', async () => {
    listUrls.mockResolvedValue({ success: false, message: 'Campaign data unavailable.' });
    renderPage();

    expect(await screen.findByText('Campaign data unavailable.')).toBeInTheDocument();
  });

  test('shows a network error when the list request throws', async () => {
    listUrls.mockRejectedValue(new Error('offline'));
    renderPage();

    expect(
      await screen.findByText('Network error. Could not retrieve link statistics.'),
    ).toBeInTheDocument();
  });
});

describe('Campaigns - overview list', () => {
  test('groups tagged links into a campaign and aggregates its totals', async () => {
    renderPage();

    expect(await screen.findByText('Your Marketing Campaigns')).toBeInTheDocument();
    expect(screen.getAllByText('summer').length).toBeGreaterThan(0);
    // "Tagged URLs" stat: 2 of the 3 links carry a campaign.
    expect(screen.getByText('Out of 3 total links')).toBeInTheDocument();
    expect(within(screen.getByText('Total UTM Campaigns').closest('div.bg-white')).getByText('1')).toBeInTheDocument();
    expect(within(screen.getByText('Campaign Redirected Clicks').closest('div.bg-white')).getByText('15')).toBeInTheDocument();
  });

  test('a free user does not see the owner-only non-redirected stat', async () => {
    renderPage();
    await screen.findByText('Your Marketing Campaigns');

    expect(screen.queryByText('Campaign Non-Redirected Clicks')).not.toBeInTheDocument();
  });

  test('an owner sees the campaign non-redirected (pre-click) total', async () => {
    isOwner.mockReturnValue(true);
    renderPage();
    await screen.findByText('Your Marketing Campaigns');

    expect(screen.getByText('Campaign Non-Redirected Clicks')).toBeInTheDocument();
    expect(
      within(screen.getByText('Campaign Non-Redirected Clicks').closest('div.bg-white')).getByText('3'),
    ).toBeInTheDocument();
  });
});

describe('Campaigns - single campaign view', () => {
  test('opening a campaign shows its detail stats and tagged URLs', async () => {
    renderPage();
    await screen.findByText('Your Marketing Campaigns');

    await openCampaign('summer');

    expect(screen.getByText('URLs Tagged in Campaign')).toBeInTheDocument();
    expect(within(screen.getByText('Campaign Links').closest('div.bg-white')).getByText('2')).toBeInTheDocument();
    expect(within(screen.getByText('Campaign Redirected Clicks').closest('div.bg-white')).getByText('15')).toBeInTheDocument();
  });

  test('the back button returns to the overview', async () => {
    renderPage();
    await screen.findByText('Your Marketing Campaigns');
    await openCampaign('summer');

    fireEvent.click(screen.getByRole('button', { name: /back to overview/i }));

    expect(await screen.findByRole('heading', { name: 'Campaigns Manager' })).toBeInTheDocument();
  });

  test('the campaign-detail Filters button opens the filter panel and Apply closes it', async () => {
    renderPage();
    await screen.findByText('Your Marketing Campaigns');
    await openCampaign('summer');

    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('Campaigns - deleting a campaign', () => {
  test('confirms and calls deleteCampaign from the overview', async () => {
    renderPage();
    await screen.findByText('Your Marketing Campaigns');

    fireEvent.click(screen.getAllByTitle('Delete Campaign')[0]);
    expect(await screen.findByText('Delete campaign "summer"?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(deleteCampaign).toHaveBeenCalledWith('summer'));
  });

  test('shows the server message when the campaign delete is refused', async () => {
    deleteCampaign.mockResolvedValue({ success: false, message: 'Cannot delete campaign.' });
    renderPage();
    await screen.findByText('Your Marketing Campaigns');

    fireEvent.click(screen.getAllByTitle('Delete Campaign')[0]);
    fireEvent.click(await screen.findByRole('button', { name: /^delete$/i }));

    expect(await screen.findByText('Cannot delete campaign.')).toBeInTheDocument();
  });
});

describe('Campaigns - removing a link from a campaign', () => {
  test('confirms and patches the link with the campaign removed', async () => {
    renderPage();
    await screen.findByText('Your Marketing Campaigns');
    await openCampaign('summer');

    fireEvent.click(screen.getAllByTitle('Remove from this Campaign')[0]); // link A (newest)
    expect(await screen.findByText('Remove Link from Campaign?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(updateUrlCampaigns).toHaveBeenCalledWith('promo', []));
  });

  test('shows a network error when the removal request throws', async () => {
    updateUrlCampaigns.mockRejectedValue(new Error('offline'));
    renderPage();
    await screen.findByText('Your Marketing Campaigns');
    await openCampaign('summer');

    fireEvent.click(screen.getAllByTitle('Remove from this Campaign')[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));

    expect(
      await screen.findByText('Network error. Could not remove link from campaign.'),
    ).toBeInTheDocument();
  });
});

describe('Campaigns - creating a campaign link', () => {
  beforeEach(() => {
    hasUnlimitedLinks.mockReturnValue(true); // bypass the free quota gates
    listUrls.mockResolvedValue(
      listOk([makeUrl({ _id: 'x', shortCode: 'x', originalUrl: 'https://example.com/x' })], {
        unlimitedLinks: true,
      }),
    );
  });

  test('the New Campaign button reveals the create form', async () => {
    renderPage();
    await screen.findByText('Your Marketing Campaigns');

    fireEvent.click(screen.getByRole('button', { name: 'New Campaign' }));

    expect(
      screen.getByRole('heading', { name: /create tracked link for a campaign/i }),
    ).toBeInTheDocument();
  });

  test('creates a brand-new link tagged with the campaign', async () => {
    listUrls
      .mockResolvedValueOnce(
        listOk([makeUrl({ _id: 'x', shortCode: 'x', originalUrl: 'https://example.com/x' })], { unlimitedLinks: true }),
      )
      .mockResolvedValue(
        listOk([makeUrl({ _id: 'x2', shortCode: 'x2', originalUrl: 'https://example.com/x2?utm_campaign=launch' })], { unlimitedLinks: true }),
      );
    renderPage();
    await screen.findByText('Your Marketing Campaigns');
    fireEvent.click(screen.getByRole('button', { name: 'New Campaign' }));

    fireEvent.change(screen.getByPlaceholderText('https://example.com/promo-landing'), {
      target: { value: 'https://example.com/x2' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. summer_2026'), {
      target: { value: 'launch' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Link' }));

    await waitFor(() => {
      expect(createUrl).toHaveBeenCalledWith(
        expect.objectContaining({ originalUrl: 'https://example.com/x2?utm_campaign=launch' }),
      );
    });
    expect(await screen.findByRole('heading', { name: 'Campaign: launch' })).toBeInTheDocument();
  });

  test('adds an existing link to a campaign via the "Select Existing Link" tab', async () => {
    listUrls
      .mockResolvedValueOnce(
        listOk([makeUrl({ _id: 'x', shortCode: 'x', originalUrl: 'https://example.com/x' })], { unlimitedLinks: true }),
      )
      .mockResolvedValue(
        listOk([makeUrl({ _id: 'x', shortCode: 'x', originalUrl: 'https://example.com/x?utm_campaign=launch' })], { unlimitedLinks: true }),
      );
    renderPage();
    await screen.findByText('Your Marketing Campaigns');
    fireEvent.click(screen.getByRole('button', { name: 'New Campaign' }));

    fireEvent.click(screen.getByRole('button', { name: /select existing link/i }));
    fireEvent.click(screen.getByRole('button', { name: /choose a short link/i }));
    fireEvent.click(screen.getByText('https://sho.rt/x'));
    fireEvent.change(screen.getByPlaceholderText('e.g. summer_2026'), {
      target: { value: 'launch' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Link to Campaign' }));

    await waitFor(() => {
      expect(updateUrlCampaigns).toHaveBeenCalledWith('x', [
        { name: 'launch', source: '', medium: '' },
      ]);
    });
    expect(await screen.findByRole('heading', { name: 'Campaign: launch' })).toBeInTheDocument();
  });

  test('requires an existing link to be picked before submitting that tab', async () => {
    renderPage();
    await screen.findByText('Your Marketing Campaigns');
    fireEvent.click(screen.getByRole('button', { name: 'New Campaign' }));

    fireEvent.click(screen.getByRole('button', { name: /select existing link/i }));
    fireEvent.change(screen.getByPlaceholderText('e.g. summer_2026'), {
      target: { value: 'launch' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Link to Campaign' }));

    expect(await screen.findByText('Please select an existing link.')).toBeInTheDocument();
    expect(updateUrlCampaigns).not.toHaveBeenCalled();
  });

  test('a plan-limit refusal from the server opens the campaign limit modal', async () => {
    createUrl.mockResolvedValue({ success: false, planLimitReached: true });
    renderPage();
    await screen.findByText('Your Marketing Campaigns');
    fireEvent.click(screen.getByRole('button', { name: 'New Campaign' }));

    fireEvent.change(screen.getByPlaceholderText('https://example.com/promo-landing'), {
      target: { value: 'https://example.com/x2' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. summer_2026'), {
      target: { value: 'launch' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Link' }));

    expect(await screen.findByText('Campaign Limit Reached')).toBeInTheDocument();
  });
});

describe('Campaigns - free-plan campaign quota', () => {
  test('at the campaign limit, New Campaign opens the limit modal instead of the form', async () => {
    // Free user already has one campaign ("summer") -> at the limit of 1.
    renderPage();
    await screen.findByText('Your Marketing Campaigns');

    fireEvent.click(screen.getByRole('button', { name: 'New Campaign' }));

    expect(await screen.findByText('Campaign Limit Reached')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /create tracked link for a campaign/i }),
    ).not.toBeInTheDocument();
  });
});
