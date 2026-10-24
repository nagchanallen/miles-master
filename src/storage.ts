import { initialState, parseBackup, serializeBackup, type AppState } from './domain/model';

// Keep the original key so existing browser data can be migrated by parseBackup.
export const STORAGE_KEY = 'miles-master.v1';
export interface StoredState {
  state: AppState;
  recovery: string | null;
  error: 'corrupt' | 'unavailable' | null;
}
export function loadState(): StoredState {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { state: initialState(), recovery: null, error: 'unavailable' };
  }
  if (raw === null) return { state: initialState(), recovery: null, error: null };
  try {
    return { state: parseBackup(raw), recovery: null, error: null };
  } catch {
    return { state: initialState(), recovery: raw, error: 'corrupt' };
  }
}
export function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, serializeBackup(state));
    return true;
  } catch {
    return false;
  }
}
