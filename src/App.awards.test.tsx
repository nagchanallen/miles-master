import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { initialState, parseBackup, serializeBackup } from './domain/model';
import { STORAGE_KEY } from './storage';
const enter = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
function start() {
  const state = initialState();
  state.language = 'en';
  localStorage.setItem(STORAGE_KEY, serializeBackup(state));
  return render(<App />);
}
function openLookup() {
  fireEvent.click(screen.getByText('Estimate miles from an award chart (optional)'));
  enter('Flight type', 'international');
  enter('Award departure city', 'TYO');
  enter('Award destination city', 'HKG');
}
describe('cabin targets and mileage lookup', () => {
  it('changes the decision with the award cabin and edits each target independently', () => {
    start();
    enter('Cash fare (optional)', '50000');
    enter('Miles required', '20000');
    enter('Award ticket cash payment', '5000');
    expect(screen.getByRole('heading', { name: 'Miles favored' })).toBeInTheDocument();
    enter('Award cabin / target', 'business');
    expect(screen.getByText('¥85,000')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cash favored' })).toBeInTheDocument();
    enter('JAL · Domestic · Business', '2.2');
    expect(screen.getByText('¥49,000')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Use ¥2 / ¥4 / ¥6 defaults'));
    expect(screen.getByText('¥85,000')).toBeInTheDocument();
  });
  it('applies an estimate explicitly and preserves editable miles and lookup choices on reload and backup', () => {
    const view = start();
    openLookup();
    enter('Miles required', '30000');
    expect(
      screen.getByText('Chart estimate: 22,000 miles per person for the whole trip'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Use this mileage' }));
    expect(screen.getByLabelText('Miles required')).toHaveValue(22000);
    expect(
      within(screen.getByRole('region', { name: 'Redeem miles' })).getByLabelText('Route'),
    ).toHaveValue('TYO → HKG');
    enter('Miles required', '28000');
    enter('Award destination city', 'SIN');
    expect(screen.getByLabelText('Miles required')).toHaveValue(28000);
    const backup = parseBackup(localStorage.getItem(STORAGE_KEY)!);
    expect(backup.groups[0].options[0]).toMatchObject({
      miles: 28000,
      awardLookup: { destination: 'SIN' },
    });
    view.unmount();
    render(<App />);
    expect(screen.getByLabelText('Miles required')).toHaveValue(28000);
    expect(screen.getByLabelText('Award destination city')).toHaveValue('SIN');
  });
  it('requires separate ANA seasons, handles one-way, and disables unsupported combinations', () => {
    start();
    openLookup();
    enter('Award airline / miles', 'ANA');
    enter('Award cabin / target', 'business');
    const apply = screen.getByRole('button', { name: 'Use this mileage' });
    expect(apply).toBeDisabled();
    enter('Outbound season', 'regular');
    expect(apply).toBeDisabled();
    enter('Return season', 'high');
    fireEvent.click(apply);
    expect(screen.getByLabelText('Miles required')).toHaveValue(59000);
    enter('Journey', 'one');
    fireEvent.click(apply);
    expect(screen.getByLabelText('Miles required')).toHaveValue(26500);
    enter('Award cabin / target', 'first');
    expect(apply).toBeDisabled();
    expect(screen.getByLabelText('Miles required')).toHaveValue(26500);
  });
});
