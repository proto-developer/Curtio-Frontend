import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import OwnerRoute from './OwnerRoute';

// The owner check itself is unit-tested in src/lib/auth/owner.test.js; here we
// only care that the route sends owners through and everyone else away.
vi.mock('@/lib/auth/owner', () => ({ isOwner: vi.fn() }));
import { isOwner } from '@/lib/auth/owner';

const OWNER_ONLY = <div>Pre-click analytics</div>;

function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/preclick']}>
      <Routes>
        <Route
          path="/dashboard/preclick"
          element={<OwnerRoute>{OWNER_ONLY}</OwnerRoute>}
        />
        <Route path="/dashboard/analytics" element={<div>Analytics page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OwnerRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the owner-only content when isOwner() is true', () => {
    isOwner.mockReturnValue(true);
    renderGuarded();

    expect(screen.getByText('Pre-click analytics')).toBeInTheDocument();
    expect(screen.queryByText('Analytics page')).not.toBeInTheDocument();
  });

  test('redirects a non-owner to the analytics dashboard', () => {
    isOwner.mockReturnValue(false);
    renderGuarded();

    expect(screen.getByText('Analytics page')).toBeInTheDocument();
    expect(screen.queryByText('Pre-click analytics')).not.toBeInTheDocument();
  });

  test('treats any falsy owner result as "not an owner"', () => {
    isOwner.mockReturnValue(undefined);
    renderGuarded();

    expect(screen.getByText('Analytics page')).toBeInTheDocument();
    expect(screen.queryByText('Pre-click analytics')).not.toBeInTheDocument();
  });
});
