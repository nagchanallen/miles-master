import { describe, expect, it } from 'vitest';
import { calculate, initialState, newOption, parseBackup, serializeBackup } from './model';

describe('cash versus miles for the same trip', () => {
  it.each([
    [50000, 5000],
    [40000, -5000],
    [45000, 0],
  ])('reports the valuation difference for a ¥%i cash alternative', (cash, difference) => {
    expect(calculate({ ...newOption(), cash, miles: 20000, total: 5000 }, 2)).toMatchObject({
      estimated: 45000,
      difference,
    });
  });
  it('does not invent a difference when either alternative is incomplete', () => {
    expect(calculate({ ...newOption(), miles: 20000, total: 5000 }, 2).difference).toBeNull();
    expect(
      calculate({ ...newOption(), cash: 50000, miles: 0, total: 5000 }, 2).difference,
    ).toBeNull();
  });
  it('round-trips distinct flight details for each alternative', () => {
    const state = initialState();
    Object.assign(state.groups[0].options[0], {
      cashAirline: 'ANA',
      cashFlight: {
        route: 'HND → CTS',
        departure: '2026-12-10',
        returning: '2026-12-12',
        cabin: 'Economy',
        flightNumbers: 'NH55',
      },
      awardFlight: {
        route: 'NRT → CTS',
        departure: '2026-12-11',
        returning: '2026-12-13',
        cabin: 'Business',
        flightNumbers: 'JL3049',
      },
    });
    expect(parseBackup(serializeBackup(state))).toEqual(state);
    expect(JSON.parse(serializeBackup(state)).version).toBe(3);
  });
  it('migrates shared flight labels in a v1 backup without changing prices or targets', () => {
    const legacy = JSON.parse(serializeBackup(initialState()));
    legacy.version = 1;
    legacy.targets = {
      JAL: { domestic: 1.5, international: 2 },
      ANA: { domestic: 1.5, international: 2 },
    };
    const option = legacy.groups[0].options[0];
    delete option.cashFlight;
    delete option.awardFlight;
    delete option.cashAirline;
    Object.assign(option, {
      route: 'Tokyo → Sapporo',
      departure: '2026-12-10',
      returning: '2026-12-12',
      cabin: 'Economy',
      cash: 40000,
      miles: 15000,
      total: 2000,
    });
    const migrated = parseBackup(JSON.stringify(legacy));
    expect(migrated.version).toBe(3);
    expect(migrated.targets.JAL.domestic.economy).toBe(legacy.targets.JAL.domestic);
    const next = migrated.groups[0].options[0];
    expect(next).toMatchObject({ cash: 40000, miles: 15000, total: 2000, cashAirline: '' });
    expect(next.cashFlight).toEqual({
      route: option.route,
      departure: option.departure,
      returning: option.returning,
      cabin: option.cabin,
      flightNumbers: '',
    });
    expect(next.awardFlight).toEqual(next.cashFlight);
    next.cashFlight.route = 'Different route';
    expect(next.awardFlight.route).toBe('Tokyo → Sapporo');
  });
  it('validates both sets of flight details and the optional cash airline', () => {
    for (const side of ['cashFlight', 'awardFlight']) {
      const state = JSON.parse(serializeBackup(initialState()));
      state.groups[0].options[0][side] = {
        route: 'x'.repeat(301),
        departure: '',
        returning: '',
        cabin: '',
        flightNumbers: '',
      };
      expect(() => parseBackup(JSON.stringify(state))).toThrow();
    }
    const state = JSON.parse(serializeBackup(initialState()));
    state.groups[0].options[0].cashAirline = 'OTHER';
    expect(() => parseBackup(JSON.stringify(state))).toThrow();
  });
});
