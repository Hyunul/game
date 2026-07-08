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
    if (typeof s !== 'object' || s === null || !Array.isArray(s.solved)) return null;
    // 구버전·손상 저장 방어: 이후 도입된 필드와 필수 컬렉션에 기본값을 채운다
    return {
      ...s,
      inventory: Array.isArray(s.inventory) ? s.inventory : [],
      memoryShards: Array.isArray(s.memoryShards) ? s.memoryShards : [],
      hintsUsed: s.hintsUsed && typeof s.hintsUsed === 'object' ? s.hintsUsed : {},
      wrongAttempts: typeof s.wrongAttempts === 'number' ? s.wrongAttempts : 0,
      era: s.era === 'past' ? 'past' : 'present',
      selectedItem: s.selectedItem ?? null,
      prevRoom: s.prevRoom ?? null,
      lastResult: null,
    } as GameState;
  } catch { return null; }
}

export function clearSave(key: string = KEY): void {
  try { localStorage.removeItem(key); } catch { /* noop */ }
}
