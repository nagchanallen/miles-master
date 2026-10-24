import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { initialState, serializeBackup } from './domain/model';
import i18n from './i18n';
import { STORAGE_KEY } from './storage';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});
const enter = (element: HTMLElement, value: string) =>
  fireEvent.change(element, { target: { value } });
function start() {
  const state = initialState();
  state.language = 'en';
  localStorage.setItem(STORAGE_KEY, serializeBackup(state));
  return render(<App />);
}
describe('trip decision interface', () => {
  it('does not round a small valuation advantage down to zero', () => {
    start();
    enter(screen.getByLabelText('JAL · Domestic'), '0.99');
    enter(screen.getByLabelText('Cash fare (optional)'), '1');
    enter(screen.getByLabelText('Miles required'), '1');
    enter(screen.getByLabelText('Award ticket cash payment'), '0');
    expect(screen.getByText('¥0.01 ahead at your target value')).toBeInTheDocument();
  });
  it('makes the payment decision primary and values the difference without claiming cash savings', () => {
    start();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Cash or miles for this trip?' }),
    ).toBeInTheDocument();
    enter(screen.getByLabelText('Cash fare (optional)'), '50000');
    enter(screen.getByLabelText('Miles required'), '20000');
    enter(screen.getByLabelText('Award ticket cash payment'), '5000');
    enter(screen.getByLabelText('Flight type'), 'international');
    expect(screen.getByRole('heading', { name: 'Miles favored' })).toBeInTheDocument();
    expect(screen.getByText('¥5,000 ahead at your target value')).toBeInTheDocument();
    expect(screen.getByText(/valuation difference, not cash savings/)).toBeInTheDocument();
    expect(screen.getByText('Break-even cash fare')).toBeInTheDocument();
    enter(screen.getByLabelText('Cash fare (optional)'), '40000');
    expect(screen.getByRole('heading', { name: 'Cash favored' })).toBeInTheDocument();
    enter(screen.getByLabelText('Cash fare (optional)'), '45000');
    expect(screen.getByRole('heading', { name: 'Equivalent at your target' })).toBeInTheDocument();
    expect(screen.queryByText(/ahead at your target value/)).not.toBeInTheDocument();
    enter(screen.getByLabelText('Cash fare (optional)'), '');
    expect(
      screen.queryByRole('heading', { name: 'Equivalent at your target' }),
    ).not.toBeInTheDocument();
  });
  it('saves separate cash and award flights and uses only the award airline target', () => {
    const view = start();
    const cash = within(screen.getByRole('region', { name: 'Pay cash' }));
    const award = within(screen.getByRole('region', { name: 'Redeem miles' }));
    enter(cash.getByLabelText('Cash airline (optional)'), 'ANA');
    enter(cash.getByLabelText('Route'), 'HND → CTS');
    enter(cash.getByLabelText('Departure'), '2026-12-10');
    enter(cash.getByLabelText('Flight numbers'), 'NH55');
    enter(award.getByLabelText('Route'), 'NRT → CTS');
    enter(award.getByLabelText('Departure'), '2026-12-11');
    enter(award.getByLabelText('Flight numbers'), 'JL3049');
    enter(screen.getByLabelText('JAL · Domestic'), '2');
    enter(screen.getByLabelText('ANA · Domestic'), '3');
    enter(cash.getByLabelText('Cash fare (optional)'), '50000');
    enter(award.getByLabelText('Miles required'), '20000');
    enter(award.getByLabelText('Award ticket cash payment'), '5000');
    expect(screen.getByRole('heading', { name: 'Miles favored' })).toBeInTheDocument();
    enter(award.getByLabelText('Award airline / miles'), 'ANA');
    expect(screen.getByRole('heading', { name: 'Cash favored' })).toBeInTheDocument();
    view.unmount();
    render(<App />);
    expect(
      within(screen.getByRole('region', { name: 'Pay cash' })).getByLabelText('Route'),
    ).toHaveValue('HND → CTS');
    expect(
      within(screen.getByRole('region', { name: 'Redeem miles' })).getByLabelText('Route'),
    ).toHaveValue('NRT → CTS');
  });
});
