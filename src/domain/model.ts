import type { AwardLookup } from './awardChart';
export const LANGUAGES = ['ja', 'en', 'zh-HK'] as const;
export type Language = (typeof LANGUAGES)[number];
export type Airline = 'JAL' | 'ANA';
export type Region = 'domestic' | 'international';
export type Amount = number | '';
export const CABINS = ['economy', 'business', 'first'] as const;
export type Cabin = (typeof CABINS)[number];
// Keep stored cabin keys compatible with v3 backups. Domestic business denotes
// JAL Class J or ANA Premium Class; ANA's old first slot is retained only as data.
export const cabinsFor = (airline: Airline, region: Region): readonly Cabin[] =>
  airline === 'ANA' && region === 'domestic' ? ['economy', 'business'] : CABINS;
export const cabinLabel = (airline: Airline, region: Region, cabin: Cabin) =>
  region === 'domestic' && cabin === 'business'
    ? airline === 'JAL'
      ? 'classJ'
      : 'premiumClass'
    : cabin;
export function normalizeCabin(option: FlightOption): FlightOption {
  return option.airline === 'ANA' && option.region === 'domestic' && option.awardCabin === 'first'
    ? { ...option, awardCabin: 'business' }
    : option;
}
export type Targets = Record<Airline, Record<Region, Record<Cabin, number>>>;
export interface FlightDetails {
  route: string;
  departure: string;
  returning: string;
  cabin: string;
  flightNumbers: string;
}
export interface FlightOption {
  id: string;
  airline: Airline;
  awardCabin: Cabin;
  awardLookup: AwardLookup;
  region: Region;
  trip: 'one' | 'round';
  cashAirline: Airline | '';
  cashFlight: FlightDetails;
  awardFlight: FlightDetails;
  cash: Amount;
  miles: Amount;
  feeMode: 'total' | 'detail';
  total: Amount;
  fuel: Amount;
  taxes: Amount;
  other: Amount;
}
export interface Comparison {
  id: string;
  name: string;
  options: FlightOption[];
}
export interface AppState {
  version: 3;
  language: Language;
  targets: Targets;
  groups: Comparison[];
  selected: string;
}
export const MAX_ITEMS = 100;
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
export const newId = () => crypto.randomUUID();
const newFlightDetails = (): FlightDetails => ({
  route: '',
  departure: '',
  returning: '',
  cabin: '',
  flightNumbers: '',
});
export function newOption(): FlightOption {
  return {
    id: newId(),
    airline: 'JAL',
    awardCabin: 'economy',
    awardLookup: { origin: '', destination: '', outbound: '', inbound: '' },
    region: 'domestic',
    trip: 'round',
    cashAirline: '',
    cashFlight: newFlightDetails(),
    awardFlight: newFlightDetails(),
    cash: '',
    miles: '',
    feeMode: 'total',
    total: '',
    fuel: '',
    taxes: '',
    other: '',
  };
}
export function newComparison(): Comparison {
  return { id: newId(), name: '', options: [newOption()] };
}
const defaultCabinTargets = () => ({ economy: 2, business: 4, first: 6 });
export const targetFor = (option: FlightOption, targets: Targets) =>
  targets[option.airline][option.region][option.awardCabin];
export function defaultTargets(): Targets {
  return {
    JAL: {
      domestic: { economy: 1.5, business: 2, first: 3 },
      international: defaultCabinTargets(),
    },
    ANA: {
      domestic: { economy: 1.5, business: 2.5, first: 3 },
      international: defaultCabinTargets(),
    },
  };
}
export function initialState(): AppState {
  const group = newComparison();
  return {
    version: 3,
    language: 'ja',
    targets: defaultTargets(),
    groups: [group],
    selected: group.id,
  };
}
export function validAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 1e12;
}
export function validTarget(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0.01 &&
    value <= 10000 &&
    Math.abs(value * 100 - Math.round(value * 100)) < 1e-8
  );
}
const numberOrNull = (value: Amount) => (validAmount(value) ? value : null);
export function calculate(option: FlightOption, target: number) {
  const enteredFees =
    option.feeMode === 'detail'
      ? [option.fuel, option.taxes, option.other]
          .map(numberOrNull)
          .reduce<number | null>((sum, n) => (sum === null || n === null ? null : sum + n), 0)
      : numberOrNull(option.total);
  const fees = validAmount(enteredFees) ? enteredFees : null;
  const miles = numberOrNull(option.miles),
    cash = numberOrNull(option.cash);
  const usable = miles !== null && miles > 0 && fees !== null;
  const estimated = usable && validTarget(target) ? miles * target + fees : null;
  const value = usable && cash !== null ? (cash - fees) / miles : null;
  const recommendation =
    estimated === null || cash === null
      ? null
      : Math.abs(cash - estimated) < 0.005
        ? 'equal'
        : cash > estimated
          ? 'useMiles'
          : 'useCash';
  const difference = cash !== null && estimated !== null ? cash - estimated : null;
  return { fees, miles, cash, estimated, value, recommendation, difference };
}
export function switchFeeMode(option: FlightOption): FlightOption {
  if (option.feeMode === 'detail')
    return { ...option, feeMode: 'total', total: calculate(option, 1).fees ?? '' };
  // The total cannot reveal the actual fuel/tax split. Preserve it under Other
  // fees until the user supplies a breakdown, rather than inventing a surcharge.
  return {
    ...option,
    feeMode: 'detail',
    fuel: option.total === '' ? '' : 0,
    taxes: option.total === '' ? '' : 0,
    other: option.total,
  };
}

const invalid = (): never => {
  throw new Error('Invalid backup');
};
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || value.length > max) return invalid();
  return value;
}
function identifier(value: unknown, used: Set<string>): string {
  const result = text(value, 200);
  if (!result || used.has(result)) return invalid();
  used.add(result);
  return result;
}
function choice<T extends string>(value: unknown, values: readonly T[]): T {
  if (!values.includes(value as T)) return invalid();
  return value as T;
}
function list(value: unknown): unknown[] {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) return invalid();
  return value;
}
function price(value: unknown): Amount {
  if (value !== '' && !validAmount(value)) return invalid();
  return value as Amount;
}
function flightDetails(value: unknown): FlightDetails {
  const details = record(value);
  return {
    route: text(details.route, 300),
    departure: text(details.departure, 300),
    returning: text(details.returning, 300),
    cabin: text(details.cabin, 300),
    flightNumbers: text(details.flightNumbers, 300),
  };
}
function awardLookup(value: unknown): AwardLookup {
  const lookup = record(value);
  return {
    origin: text(lookup.origin, 20),
    destination: text(lookup.destination, 20),
    outbound: choice(lookup.outbound, ['', 'low', 'regular', 'high'] as const),
    inbound: choice(lookup.inbound, ['', 'low', 'regular', 'high'] as const),
  };
}
export function parseBackup(json: string): AppState {
  if (new TextEncoder().encode(json).length > MAX_BACKUP_BYTES) return invalid();
  const raw = record(JSON.parse(json));
  if (raw.version !== 1 && raw.version !== 2 && raw.version !== 3) return invalid();
  const targetData = record(raw.targets);
  function cabinTargets(value: unknown): Record<Cabin, number> {
    if (raw.version !== 3) {
      if (!validTarget(value)) return invalid();
      return { economy: value, business: value, first: value };
    }
    const values = record(value);
    if (!CABINS.every((cabin) => validTarget(values[cabin]))) return invalid();
    return {
      economy: values.economy as number,
      business: values.business as number,
      first: values.first as number,
    };
  }
  function airlineTargets(airline: Airline): Targets[Airline] {
    const values = record(targetData[airline]);
    return {
      domestic: cabinTargets(values.domestic),
      international: cabinTargets(values.international),
    };
  }
  const targets = { JAL: airlineTargets('JAL'), ANA: airlineTargets('ANA') };
  const usedGroups = new Set<string>();
  const groups = list(raw.groups).map((value) => {
    const g = record(value),
      usedOptions = new Set<string>();
    return {
      id: identifier(g.id, usedGroups),
      name: text(g.name, 200),
      options: list(g.options).map((value) => {
        const o = record(value);
        // v1 labels described a shared itinerary. Copy them to both sides, but
        // do not infer the cash airline from the mileage program.
        const legacyDetails = raw.version === 1 ? { ...o, flightNumbers: '' } : undefined;
        return normalizeCabin({
          id: identifier(o.id, usedOptions),
          airline: choice(o.airline, ['JAL', 'ANA'] as const),
          awardCabin: raw.version === 3 ? choice(o.awardCabin, CABINS) : ('economy' as const),
          awardLookup:
            raw.version === 3
              ? awardLookup(o.awardLookup)
              : { origin: '', destination: '', outbound: '' as const, inbound: '' as const },
          region: choice(o.region, ['domestic', 'international'] as const),
          trip: choice(o.trip, ['one', 'round'] as const),
          feeMode: choice(o.feeMode, ['total', 'detail'] as const),
          cashAirline:
            raw.version === 1 ? ('' as const) : choice(o.cashAirline, ['', 'JAL', 'ANA'] as const),
          cashFlight: flightDetails(legacyDetails ?? o.cashFlight),
          awardFlight: flightDetails(legacyDetails ?? o.awardFlight),
          cash: price(o.cash),
          miles: price(o.miles),
          total: price(o.total),
          fuel: price(o.fuel),
          taxes: price(o.taxes),
          other: price(o.other),
        });
      }),
    };
  });
  if (!groups.length || !usedGroups.has(raw.selected as string)) return invalid();
  return {
    version: 3,
    language: choice(raw.language, LANGUAGES),
    targets,
    groups,
    selected: raw.selected as string,
  };
}
export function serializeBackup(state: AppState): string {
  return JSON.stringify(state, null, 2);
}
