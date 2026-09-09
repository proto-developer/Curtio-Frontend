import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import ComparisonSection from './Comparison';

// Static marketing section - no props, no data, no router.
describe('ComparisonSection', () => {
  test('renders the section heading and intro', () => {
    render(<ComparisonSection />);

    expect(
      screen.getByRole('heading', { name: /a bitly and cuttly alternative built on honest numbers/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/here is what changes when you switch/i)).toBeInTheDocument();
  });

  test('labels both comparison columns', () => {
    render(<ComparisonSection />);

    // Each label appears in both the mobile-card and desktop-table layouts.
    expect(screen.getAllByText('The usual shorteners').length).toBeGreaterThan(0);
    expect(screen.getAllByText('curtio.').length).toBeGreaterThan(0);
  });

  test('renders every feature row from the comparison data', () => {
    render(<ComparisonSection />);

    for (const feature of [
      'Click counts',
      'Analytics on the free tier',
      'Credit card to start',
      'The redirect',
      'The feel',
    ]) {
      expect(screen.getAllByText(feature).length).toBeGreaterThan(0);
    }
  });

  test('shows the "other shortener" vs curtio values for a row', () => {
    render(<ComparisonSection />);

    expect(screen.getAllByText('Padded by bots and previews').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Counted once, real visitors only').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Never').length).toBeGreaterThan(0);
  });
});
