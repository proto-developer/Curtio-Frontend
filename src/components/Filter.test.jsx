import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Filter from './Filter';

const baseProps = () => ({
  startDate: '',
  endDate: '',
  setStartDate: vi.fn(),
  setEndDate: vi.fn(),
  calendarYear: 2026,
  calendarMonth: 0, // January
  prevMonth: vi.fn(),
  nextMonth: vi.fn(),
  firstDayOfWeek: 4,
  daysInMonth: 31,
  handleDateClick: vi.fn(),
  finalGeoData: [{ country: 'India', flag: '🇮🇳' }],
  finalDeviceData: [{ name: 'Mobile' }],
  referrerData: [{ source: 'Twitter' }],
  onApply: vi.fn(),
  onClear: vi.fn(),
  setFilterOpen: vi.fn(),
  selectedCountry: '',
  setSelectedCountry: vi.fn(),
  selectedDevice: '',
  setSelectedDevice: vi.fn(),
  selectedSource: '',
  setSelectedSource: vi.fn(),
});

let props;
beforeEach(() => {
  props = baseProps();
});

const renderFilter = () => render(<Filter {...props} />);

describe('Filter', () => {
  test('renders as a dialog with the filter controls', () => {
    renderFilter();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply Filters' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear All' })).toBeInTheDocument();
  });

  test('populates the country / device / source selects from the data props', () => {
    renderFilter();
    const [country, device, source] = screen.getAllByRole('combobox');

    expect(within(country).getByRole('option', { name: /India/ })).toBeInTheDocument();
    expect(within(device).getByRole('option', { name: 'Mobile' })).toBeInTheDocument();
    expect(within(source).getByRole('option', { name: 'Twitter' })).toBeInTheDocument();
  });

  test('choosing a country pushes the value up through setSelectedCountry', () => {
    renderFilter();
    const [country] = screen.getAllByRole('combobox');

    fireEvent.change(country, { target: { value: 'India' } });

    expect(props.setSelectedCountry).toHaveBeenCalledWith('India');
  });

  test('"Apply Filters" runs onApply and closes the panel', () => {
    renderFilter();
    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));

    expect(props.onApply).toHaveBeenCalledTimes(1);
    expect(props.setFilterOpen).toHaveBeenCalledWith(false);
  });

  test('"Clear All" runs onClear and closes the panel', () => {
    renderFilter();
    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));

    expect(props.onClear).toHaveBeenCalledTimes(1);
    expect(props.setFilterOpen).toHaveBeenCalledWith(false);
  });

  test('the close (X) button closes the panel', () => {
    renderFilter();
    fireEvent.click(screen.getByRole('button', { name: /close filters/i }));

    expect(props.setFilterOpen).toHaveBeenCalledWith(false);
  });

  test('"Today" sets both the start and end date to today', () => {
    renderFilter();
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));

    const todayStr = new Date().toISOString().slice(0, 10);
    expect(props.setStartDate).toHaveBeenCalledWith(todayStr);
    expect(props.setEndDate).toHaveBeenCalledWith(todayStr);
  });

  test('clicking a calendar day reports the ISO date', () => {
    renderFilter();
    fireEvent.click(screen.getByRole('button', { name: '15' }));

    expect(props.handleDateClick).toHaveBeenCalledWith('2026-01-15');
  });

  test('the month arrows call prevMonth / nextMonth', () => {
    renderFilter();
    // The two icon-only buttons flanking the "January 2026" label.
    fireEvent.click(screen.getByText('January 2026').previousElementSibling);
    fireEvent.click(screen.getByText('January 2026').nextElementSibling);

    expect(props.prevMonth).toHaveBeenCalledTimes(1);
    expect(props.nextMonth).toHaveBeenCalledTimes(1);
  });
});
