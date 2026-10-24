import { describe, expect, it } from 'vitest';
import { estimateAward } from './awardChart';
const input = {
  airline: 'ANA',
  region: 'international',
  cabin: 'business',
  origin: 'TYO',
  destination: 'HKG',
  trip: 'one',
  outbound: 'regular',
  inbound: 'high',
} as const;
describe('published award chart estimates', () => {
  it('uses current ANA one-way values and independently prices return seasons', () => {
    expect(estimateAward(input)).toBe(26500);
    expect(estimateAward({ ...input, trip: 'round' })).toBe(59000);
    expect(estimateAward({ ...input, origin: 'HKG', destination: 'TYO', outbound: 'low' })).toBe(
      24000,
    );
  });
  it('uses JAL base miles, with seasonal first class', () => {
    expect(estimateAward({ ...input, airline: 'JAL' })).toBe(26000);
    expect(estimateAward({ ...input, airline: 'JAL', trip: 'round' })).toBe(52000);
    expect(estimateAward({ ...input, airline: 'JAL', cabin: 'first', trip: 'round' })).toBe(93000);
  });
  it('requires explicit seasons only where the chart needs them', () => {
    expect(estimateAward({ ...input, outbound: '' })).toBeNull();
    expect(estimateAward({ ...input, trip: 'round', inbound: '' })).toBeNull();
    expect(estimateAward({ ...input, airline: 'JAL', outbound: '', inbound: '' })).toBe(26000);
  });
  it('does not invent prices for unsupported routes or cabins', () => {
    expect(estimateAward({ ...input, cabin: 'first' })).toBeNull();
    expect(estimateAward({ ...input, region: 'domestic' })).toBeNull();
    expect(estimateAward({ ...input, origin: 'HKG', destination: 'SIN' })).toBeNull();
    expect(estimateAward({ ...input, origin: 'TYO', destination: 'TYO' })).toBeNull();
    expect(estimateAward({ ...input, destination: '' })).toBeNull();
  });
  it.each([
    ['SIN', 17500, 42500, null],
    ['HNL', 20000, 42500, 70000],
    ['SYD', 22500, 45000, null],
    ['LHR', 27500, 57500, 95000],
    ['NYC', 25000, 52500, 85000],
  ] as const)('prices supported ANA destination %s', (destination, economy, business, first) => {
    for (const [cabin, expected] of [
      ['economy', economy],
      ['business', business],
      ['first', first],
    ] as const)
      expect(estimateAward({ ...input, destination, cabin })).toBe(expected);
  });
});
