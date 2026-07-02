import { GameState } from './gameState';

const KEY = 'memory-box-save';

export function saveGame(s: GameState, key: string = KEY): void {
  try { localStorage.setItem(key, JSON.stringify(s)); } catch { /* 사파리 프라이빗 등 */ }
}

export function loadGame(key: string = KEY): GameState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (typeof s !== 'object' || !Array.isArray(s.solved)) return null;
    return s as GameState;
  } catch { return null; }
}

export function clearSave(key: string = KEY): void {
  try { localStorage.removeItem(key); } catch { /* noop */ }
}
