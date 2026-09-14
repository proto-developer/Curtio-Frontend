import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import AddToCampaignModal from './AddToCampaignModal';

// SAFETY: campaign API is stubbed - no request reaches the backend.
vi.mock('@/api/urls', () => ({
  updateUrlCampaigns: vi.fn(),
  renameCampaign: vi.fn(),
}));

import { updateUrlCampaigns, renameCampaign } from '@/api/urls';

const makeLink = (over = {}) => ({
  slug: 'promo',
  short: 'https://sho.rt/promo',
  original: 'https://example.com/landing',
  campaigns: [],
  ...over,
});

const EXISTING = [
  { name: 'summer', linksCount: 3 },
  { name: 'winter', linksCount: 0 },
];

function renderModal(props = {}) {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  render(
    <AddToCampaignModal
      link={makeLink(props.link)}
      existingCampaigns={props.existingCampaigns ?? EXISTING}
      token="jwt"
      onClose={onClose}
      onSuccess={onSuccess}
    />,
  );
  return { onClose, onSuccess };
}

// The row card wrapping a campaign checkbox + its rename/detail controls.
const campaignRow = (name) => screen.getByText(name).closest('div.border');

beforeEach(() => {
  vi.clearAllMocks();
  updateUrlCampaigns.mockResolvedValue({ success: true });
  renameCampaign.mockResolvedValue({ success: true });
});

describe('AddToCampaignModal - campaign list', () => {
  test('lists the existing campaigns with their link counts', () => {
    renderModal();

    expect(screen.getByText('Existing Campaigns')).toBeInTheDocument();
    expect(screen.getByText('summer')).toBeInTheDocument();
    expect(screen.getByText('3 links')).toBeInTheDocument();
    expect(screen.getByText('winter')).toBeInTheDocument();
    expect(screen.getByText('0 links')).toBeInTheDocument();
  });

  test('pre-checks the campaigns the link already belongs to', () => {
    renderModal({ link: { campaigns: [{ name: 'summer', source: 'facebook', medium: 'cpc' }] } });

    const summerCheckbox = within(campaignRow('summer')).getByRole('checkbox');
    expect(summerCheckbox).toBeChecked();
    expect(within(campaignRow('winter')).getByRole('checkbox')).not.toBeChecked();
    // Selected campaigns reveal their source / medium, pre-filled from the link.
    expect(screen.getByDisplayValue('facebook')).toBeInTheDocument();
    expect(screen.getByDisplayValue('cpc')).toBeInTheDocument();
  });

  test('derives the selected campaign from a utm_campaign in the destination URL', () => {
    renderModal({
      link: { original: 'https://example.com/?utm_campaign=spring&utm_source=ig' },
      existingCampaigns: [{ name: 'spring', linksCount: 1 }],
    });

    expect(within(campaignRow('spring')).getByRole('checkbox')).toBeChecked();
  });

  test('toggling a campaign reveals its source/medium inputs and updates the save label', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Remove from All Campaigns' })).toBeInTheDocument();

    fireEvent.click(within(campaignRow('summer')).getByRole('checkbox'));

    expect(screen.getByPlaceholderText('e.g. facebook (optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save (1 Campaign)' })).toBeInTheDocument();

    fireEvent.click(within(campaignRow('winter')).getByRole('checkbox'));
    expect(screen.getByRole('button', { name: 'Save (2 Campaigns)' })).toBeInTheDocument();
  });
});

describe('AddToCampaignModal - saving assignments', () => {
  test('saves the selected campaigns for the link, then calls onSuccess and onClose', async () => {
    const { onClose, onSuccess } = renderModal({
      link: { campaigns: [{ name: 'summer', source: 'facebook', medium: 'cpc' }] },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save (1 Campaign)' }));

    await waitFor(() => {
      expect(updateUrlCampaigns).toHaveBeenCalledWith(
        'promo',
        [{ name: 'summer', source: 'facebook', medium: 'cpc' }],
        { token: 'jwt' },
      );
    });
    expect(await screen.findByText('Updated campaign assignments!')).toBeInTheDocument();
    await waitFor(() => expect(onSuccess).toHaveBeenCalled(), { timeout: 2000 });
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 2000 });
  });

  test('"Remove from All Campaigns" saves an empty list', async () => {
    renderModal({ link: { campaigns: [{ name: 'summer' }] } });

    // Uncheck the only selected campaign.
    fireEvent.click(within(campaignRow('summer')).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove from All Campaigns' }));

    await waitFor(() => {
      expect(updateUrlCampaigns).toHaveBeenCalledWith('promo', [], { token: 'jwt' });
    });
  });

  test('shows the server message when the save is refused', async () => {
    updateUrlCampaigns.mockResolvedValue({ success: false, message: 'Campaign limit reached.' });
    renderModal({ link: { campaigns: [{ name: 'summer' }] } });

    fireEvent.click(screen.getByRole('button', { name: 'Save (1 Campaign)' }));

    expect(await screen.findByText('Campaign limit reached.')).toBeInTheDocument();
  });

  test('shows a network error when the save throws', async () => {
    updateUrlCampaigns.mockRejectedValue(new Error('offline'));
    renderModal({ link: { campaigns: [{ name: 'summer' }] } });

    fireEvent.click(screen.getByRole('button', { name: 'Save (1 Campaign)' }));

    expect(
      await screen.findByText('Network error. Could not update link campaigns.'),
    ).toBeInTheDocument();
  });
});

describe('AddToCampaignModal - creating a campaign', () => {
  test('with no existing campaigns the create form is shown straight away', () => {
    renderModal({ existingCampaigns: [] });

    expect(screen.getByText('Create New Campaign')).toBeInTheDocument();
    expect(screen.queryByText('Existing Campaigns')).not.toBeInTheDocument();
  });

  test('adds a brand-new campaign to the list, flags it "New" and selects it', async () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /create new campaign/i }));
    fireEvent.change(screen.getByPlaceholderText('e.g. summer_2026'), {
      target: { value: 'launch' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('launch')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(within(campaignRow('launch')).getByRole('checkbox')).toBeChecked();
  });

  test('rejects a duplicate campaign name', async () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /create new campaign/i }));
    fireEvent.change(screen.getByPlaceholderText('e.g. summer_2026'), {
      target: { value: 'summer' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('A campaign with this name already exists.')).toBeInTheDocument();
  });

  test('the Create button is disabled until a name is typed', () => {
    renderModal({ existingCampaigns: [] });
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });
});

describe('AddToCampaignModal - renaming a campaign', () => {
  const startRename = (name) => {
    fireEvent.click(within(campaignRow(name)).getByTitle('Rename Campaign'));
  };

  test('renames an existing campaign through the API and updates the list', async () => {
    renderModal();
    startRename('summer');

    fireEvent.change(screen.getByDisplayValue('summer'), { target: { value: 'summer2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(renameCampaign).toHaveBeenCalledWith('summer', 'summer2026', { token: 'jwt' });
    });
    expect(await screen.findByText('summer2026')).toBeInTheDocument();
  });

  test('blocks a rename that collides with another campaign', async () => {
    renderModal();
    startRename('summer');

    fireEvent.change(screen.getByDisplayValue('summer'), { target: { value: 'winter' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('A campaign with this name already exists.')).toBeInTheDocument();
    expect(renameCampaign).not.toHaveBeenCalled();
  });

  test('blocks an empty rename', async () => {
    renderModal();
    startRename('summer');

    fireEvent.change(screen.getByDisplayValue('summer'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Campaign name is required.')).toBeInTheDocument();
  });

  test('shows a network error when the rename request throws', async () => {
    renameCampaign.mockRejectedValue(new Error('offline'));
    renderModal();
    startRename('summer');

    fireEvent.change(screen.getByDisplayValue('summer'), { target: { value: 'summer2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Network error. Could not rename campaign.'),
    ).toBeInTheDocument();
  });
});

describe('AddToCampaignModal - dismissal', () => {
  test('the Cancel button calls onClose', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
