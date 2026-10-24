import { describe, expect, it, vi } from 'vitest';
import { initialState } from './domain/model';
import { loadState, saveState, STORAGE_KEY } from './storage';

describe('browser persistence', () => {
  it('starts a new comparison when no saved state exists', () => {
    expect(loadState()).toMatchObject({ error: null, recovery: null, state: { version: 3 } });
  });
  it('loads valid saved comparisons', () => {
    const state = initialState();
    expect(saveState(state)).toBe(true);
    expect(loadState().state).toEqual(state);
  });
  it('preserves corrupt data for recovery', () => {
    localStorage.setItem(STORAGE_KEY, 'broken');
    expect(loadState()).toMatchObject({ error: 'corrupt', recovery: 'broken' });
    expect(localStorage.getItem(STORAGE_KEY)).toBe('broken');
  });
  it('handles disabled browser storage and failed writes', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw Error('disabled');
    });
    expect(loadState().error).toBe('unavailable');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('quota');
    });
    expect(saveState(initialState())).toBe(false);
  });
});
