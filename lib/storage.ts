import { SOWState } from './types';
import { STORAGE_KEY_PREFIX } from './constants';

// Save SOW state to localStorage
export function saveSOWState(token: string, state: SOWState): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_KEY_PREFIX}${token}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save SOW state:', error);
  }
}

// Get SOW state from localStorage
export function getSOWState(token: string): SOWState | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = `${STORAGE_KEY_PREFIX}${token}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get SOW state:', error);
    return null;
  }
}

// Clear SOW state from localStorage
export function clearSOWState(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_KEY_PREFIX}${token}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear SOW state:', error);
  }
}

// Clear ALL SOW states from localStorage (for testing)
export function clearAllSOWStates(): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = Object.keys(localStorage);
    const sowKeys = keys.filter((key) => key.startsWith(STORAGE_KEY_PREFIX));
    sowKeys.forEach((key) => localStorage.removeItem(key));
    console.log(`[Testing] Cleared ${sowKeys.length} SOW state(s) from localStorage`);
  } catch (error) {
    console.error('Failed to clear all SOW states:', error);
  }
}
