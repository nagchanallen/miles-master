import type { Airline, Cabin, Region } from './model';

export const CHART_CHECKED = '2026-10-24';
export const CHART_SOURCES = {
  JAL: 'https://www.jal.co.jp/jp/en/jalmile/use/jal/inter/routemiles.html',
  ANA: 'https://www.ana.co.jp/en/de/amc/international-flight-awards/',
};
export const ANA_ONE_WAY_CHART =
  'https://www.ana.co.jp/guide/amc/award/international/usage/images/mileage_chart_int_oneway_en_250325.pdf';
export const CITIES = ['TYO', 'HKG', 'SIN', 'HNL', 'SYD', 'LHR', 'NYC'] as const;
export type Season = '' | 'low' | 'regular' | 'high';
export interface AwardLookup {
  origin: string;
  destination: string;
  outbound: Season;
  inbound: Season;
}
type SeasonalMiles = readonly [number, number, number];
type ChartRow = Partial<Record<Cabin, SeasonalMiles>>;
const fixed = (n: number): SeasonalMiles => [n, n, n];
// One-way miles to/from Tokyo. JAL base chart updated 2026-04-16;
// ANA chart applies to tickets issued from 2025-06-24. Low / regular / high.
// These are chart estimates, not a schedule, seat search, or booking quote.
const charts: Record<Airline, Record<string, ChartRow>> = {
  JAL: {
    HKG: { economy: fixed(11000), business: fixed(26000), first: [36000, 43000, 50000] },
    SIN: { economy: fixed(13000), business: fixed(40000), first: [67500, 75000, 82500] },
    HNL: { economy: fixed(20000), business: fixed(43000), first: [90000, 100000, 110000] },
    SYD: { economy: fixed(23000), business: fixed(45000), first: [90000, 97500, 105000] },
    LHR: { economy: fixed(27000), business: fixed(57000), first: [110000, 125000, 140000] },
    NYC: { economy: fixed(27000), business: fixed(55000), first: [110000, 125000, 140000] },
  },
  ANA: {
    HKG: { economy: [8500, 10000, 15000], business: [24000, 26500, 32500] },
    SIN: { economy: [15000, 17500, 25000], business: [40000, 42500, 47500] },
    HNL: {
      economy: [17500, 20000, 32500],
      business: [40000, 42500, 67500],
      first: [60000, 70000, 120000],
    },
    SYD: { economy: [18500, 22500, 32500], business: [40000, 45000, 67500] },
    LHR: {
      economy: [22500, 27500, 39000],
      business: [55000, 57500, 90000],
      first: [82500, 95000, 165000],
    },
    NYC: {
      economy: [20000, 25000, 36000],
      business: [50000, 52500, 82500],
      first: [75000, 85000, 150000],
    },
  },
};
export const needsSeason = (airline: Airline, cabin: Cabin) =>
  airline === 'ANA' || cabin === 'first';
export function estimateAward(
  input: AwardLookup & { airline: Airline; region: Region; cabin: Cabin; trip: 'one' | 'round' },
): number | null {
  if (input.region !== 'international') return null;
  const city =
    input.origin === 'TYO' ? input.destination : input.destination === 'TYO' ? input.origin : '';
  const row = charts[input.airline][city]?.[input.cabin];
  if (!row) return null;
  const seasonal = needsSeason(input.airline, input.cabin);
  if (seasonal && (!input.outbound || (input.trip === 'round' && !input.inbound))) return null;
  const index = (season: Season) => (season === 'high' ? 2 : season === 'regular' ? 1 : 0);
  return row[index(input.outbound)] + (input.trip === 'round' ? row[index(input.inbound)] : 0);
}
