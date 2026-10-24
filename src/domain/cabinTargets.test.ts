import { describe, expect, it } from 'vitest';
import { initialState, parseBackup, serializeBackup, targetFor } from './model';

describe('cabin-specific targets', () => {
  it('uses looser domestic defaults and the award cabin', () => {
    const state = initialState();
    const option = state.groups[0].options[0];
    expect(state.targets.JAL.domestic).toEqual({ economy: 1.5, business: 2, first: 3 });
    expect(targetFor(option, state.targets)).toBe(1.5);
    option.awardCabin = 'business';
    expect(targetFor(option, state.targets)).toBe(2);
    option.awardCabin = 'first';
    expect(targetFor(option, state.targets)).toBe(3);
    state.targets.JAL.domestic.first = 8;
    expect(targetFor(option, state.targets)).toBe(8);
    expect(parseBackup(serializeBackup(state))).toEqual(state);
  });
  it.each([1, 2])('preserves existing numeric targets when upgrading v%i', (version) => {
    const raw = JSON.parse(serializeBackup(initialState()));
    raw.version = version;
    raw.targets = {
      JAL: { domestic: 1.7, international: 2.8 },
      ANA: { domestic: 1.9, international: 3 },
    };
    const option = raw.groups[0].options[0];
    delete option.awardCabin;
    if (version === 1) Object.assign(option, option.awardFlight);
    const result = parseBackup(JSON.stringify(raw));
    expect(result.version).toBe(3);
    expect(result.targets.JAL.domestic).toEqual({ economy: 1.7, business: 1.7, first: 1.7 });
    expect(result.targets.ANA.international.first).toBe(3);
  });
  it('rejects invalid cabins and incomplete cabin targets', () => {
    const raw = JSON.parse(serializeBackup(initialState()));
    raw.groups[0].options[0].awardCabin = 'invalid';
    expect(() => parseBackup(JSON.stringify(raw))).toThrow();
    raw.groups[0].options[0].awardCabin = 'economy';
    delete raw.targets.JAL.domestic.first;
    expect(() => parseBackup(JSON.stringify(raw))).toThrow();
  });
});

it('normalizes a saved ANA domestic first selection to Premium Class without losing targets', () => {
  const state = initialState();
  Object.assign(state.groups[0].options[0], { airline: 'ANA', awardCabin: 'first' });
  state.targets.ANA.domestic.business = 2.75;
  state.targets.ANA.domestic.first = 7;
  const restored = parseBackup(serializeBackup(state));
  expect(restored.groups[0].options[0].awardCabin).toBe('business');
  expect(restored.targets).toEqual(state.targets);
  expect(targetFor(restored.groups[0].options[0], restored.targets)).toBe(2.75);
});
