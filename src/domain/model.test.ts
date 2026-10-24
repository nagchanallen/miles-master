import { describe, expect, it } from 'vitest';
import {
  calculate,
  initialState,
  newOption,
  parseBackup,
  serializeBackup,
  switchFeeMode,
} from './model';

describe('award ticket calculations', () => {
  const option = () => ({ ...newOption(), cash: 50000, miles: 20000, total: 5000 });
  it('subtracts all award charges before valuing miles', () => {
    expect(calculate(option(), 2)).toMatchObject({
      fees: 5000,
      value: 2.25,
      estimated: 45000,
      recommendation: 'useMiles',
    });
  });
  it.each([
    [40000, 'useCash'],
    [45000, 'equal'],
    [50000, 'useMiles'],
  ] as const)('compares a ¥%i fare with the target', (cash, recommendation) => {
    expect(calculate({ ...option(), cash }, 2).recommendation).toBe(recommendation);
  });
  it('estimates ticket value without a known cash fare', () => {
    expect(calculate({ ...option(), cash: '' }, 2)).toMatchObject({
      value: null,
      estimated: 45000,
      recommendation: null,
    });
  });
  it('includes fuel surcharge, taxes, and other fees', () => {
    expect(
      calculate({ ...option(), feeMode: 'detail', fuel: 3000, taxes: 1500, other: 500 }, 2).value,
    ).toBe(2.25);
  });
  it('distinguishes unknown charges from explicitly zero charges', () => {
    expect(calculate({ ...option(), total: '' }, 2).estimated).toBeNull();
    expect(calculate({ ...option(), total: 0 }, 2).value).toBe(2.5);
    expect(
      calculate({ ...option(), feeMode: 'detail', fuel: 0, taxes: '', other: 0 }, 2).fees,
    ).toBeNull();
  });
  it.each([0, -1, Infinity, NaN, 1.5])(
    'does not calculate with invalid required miles: %s',
    (miles) => {
      expect(calculate({ ...option(), miles }, 2).value).toBeNull();
    },
  );
  it('shows negative value if award cash charges exceed the cash fare', () => {
    expect(calculate({ ...option(), cash: 1000 }, 2).value).toBe(-0.2);
  });
  it.each([0, -1, Infinity, 10001])('rejects an invalid target %s for estimates', (target) => {
    expect(calculate(option(), target).estimated).toBeNull();
    expect(calculate(option(), target).value).toBe(2.25);
  });
  it('requires targets to use hundredths of a yen consistently in calculations and backups', () => {
    expect(calculate(option(), 0.001).estimated).toBeNull();
    expect(calculate(option(), 1.001).estimated).toBeNull();
    expect(calculate(option(), 1.1).estimated).toBe(27000);
    const state = initialState();
    state.targets.JAL.domestic = 1.001;
    expect(() => parseBackup(JSON.stringify(state))).toThrow();
  });
  it('does not create an unimportable total when detailed fees exceed the input limit', () => {
    const detail = { ...option(), feeMode: 'detail' as const, fuel: 1e12, taxes: 1, other: 0 };
    expect(calculate(detail, 2).fees).toBeNull();
    expect(switchFeeMode(detail).total).toBe('');
  });
  it('switches fee modes without losing the total cash payment', () => {
    const detail = switchFeeMode(option());
    expect(detail).toMatchObject({ feeMode: 'detail', fuel: 0, taxes: 0, other: 5000 });
    expect(calculate(detail, 2).fees).toBe(5000);
    expect(switchFeeMode({ ...detail, fuel: 3000, taxes: 1500, other: 500 })).toMatchObject({
      feeMode: 'total',
      total: 5000,
    });
    expect(switchFeeMode(newOption())).toMatchObject({ fuel: '', taxes: '', other: '' });
    expect(switchFeeMode({ ...detail, taxes: '' }).total).toBe('');
  });
});

describe('versioned JSON backups', () => {
  it('round-trips all comparison settings and labels', () => {
    const state = initialState();
    state.groups[0].name = '冬の札幌 / Winter';
    state.groups[0].options[0].cash = 50000;
    expect(parseBackup(serializeBackup(state))).toEqual(state);
  });
  it('provides four independent, editable example targets', () => {
    expect(initialState().targets).toEqual({
      JAL: { domestic: 1.5, international: 2 },
      ANA: { domestic: 1.5, international: 2 },
    });
  });
  it.each(['bad json', 'null', '{}', '{"version":2}'])(
    'rejects malformed or unsupported data',
    (json) => {
      expect(() => parseBackup(json)).toThrow();
    },
  );
  it('rejects invalid amounts, enumerations, and identifiers', () => {
    const changes = [
      (s: ReturnType<typeof initialState>) => {
        s.selected = 'missing';
      },
      (s: ReturnType<typeof initialState>) => {
        s.groups.push(s.groups[0]);
      },
      (s: ReturnType<typeof initialState>) => {
        s.groups[0].options.push(s.groups[0].options[0]);
      },
      (s: ReturnType<typeof initialState>) => {
        s.groups[0].options[0].cash = -1;
      },
      (s: ReturnType<typeof initialState>) => {
        s.targets.ANA.international = 0;
      },
      (s: ReturnType<typeof initialState>) => {
        s.groups[0].options[0].route = 'x'.repeat(301);
      },
      (s: ReturnType<typeof initialState>) => {
        s.groups = [];
      },
    ];
    for (const change of changes) {
      const state = initialState();
      change(state);
      expect(() => parseBackup(JSON.stringify(state))).toThrow();
    }
    const invalid = JSON.parse(serializeBackup(initialState()));
    invalid.groups[0].options[0].airline = 'OTHER';
    expect(() => parseBackup(JSON.stringify(invalid))).toThrow();
    invalid.groups[0].options[0].airline = 'JAL';
    invalid.groups[0].options[0].cash = '5000';
    expect(() => parseBackup(JSON.stringify(invalid))).toThrow();
  });
  it('discards unknown properties without treating labels as markup', () => {
    const state = initialState();
    state.groups[0].name = '<img src=x onerror=alert(1)>';
    const result = parseBackup(JSON.stringify({ ...state, unexpected: 1 }));
    expect(result).not.toHaveProperty('unexpected');
    expect(result.groups[0].name).toBe(state.groups[0].name);
  });
  it('limits backup size and comparison counts', () => {
    expect(() => parseBackup(' '.repeat(5 * 1024 * 1024 + 1))).toThrow();
    const state = initialState();
    state.groups = Array.from({ length: 101 }, () => ({
      ...state.groups[0],
      id: crypto.randomUUID(),
    }));
    expect(() => parseBackup(JSON.stringify(state))).toThrow();
    const other = initialState();
    other.groups[0].options = Array.from({ length: 101 }, newOption);
    expect(() => parseBackup(JSON.stringify(other))).toThrow();
  });
});
