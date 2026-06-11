import { GameState } from './gameState';

const KEY = 'memory-box-save';

export function saveGame(s: GameState): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 사파리 프라이빗 등 */ }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (typeof s !== 'object' || !Array.isArray(s.solved)) return null;
    return s as GameState;
  } catch { return null; }
}

export function clearSave(): void {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
