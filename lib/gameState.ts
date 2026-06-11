import { RoomId, ItemId } from './types';
import { getPuzzle, FINAL_PUZZLE } from './puzzles';

export type Phase = 'title' | 'prologue' | 'playing' | 'memory' | 'epilogue';

export interface GameState {
  phase: Phase;
  room: RoomId;
  solved: string[];
  inventory: ItemId[];
  memoryShards: RoomId[];          // 'home' | 'class' | 'store'
  selectedItem: ItemId | null;     // 인벤토리에서 선택 중인 아이템
  lastResult: 'correct' | 'wrong' | null;
  hintsUsed: Record<string, number>; // puzzleId -> 0|1|2
}

export const initialState: GameState = {
  phase: 'title', room: 'attic', solved: [], inventory: [],
  memoryShards: [], selectedItem: null, lastResult: null, hintsUsed: {},
};

export type Action =
  | { type: 'START'; resume?: GameState }
  | { type: 'ENTER_ROOM'; room: RoomId }
  | { type: 'PICKUP'; itemId: ItemId }
  | { type: 'SELECT_ITEM'; itemId: ItemId | null }
  | { type: 'ATTEMPT'; puzzleId: string; answer: string }
  | { type: 'SOLVE'; puzzleId: string }
  | { type: 'USE_HINT'; puzzleId: string }
  | { type: 'MEMORY_DONE' }
  | { type: 'RESET' };

export function canAttempt(s: GameState, puzzleId: string): boolean {
  const p = getPuzzle(puzzleId);
  if (s.solved.includes(puzzleId)) return false;
  if (!p.requires.every((r) => s.solved.includes(r))) return false;
  if (p.requiresItem && !s.inventory.includes(p.requiresItem)) return false;
  return true;
}

function applySolve(s: GameState, puzzleId: string): GameState {
  const p = getPuzzle(puzzleId);
  let next: GameState = {
    ...s,
    solved: [...s.solved, puzzleId],
    inventory: p.rewardItem && !s.inventory.includes(p.rewardItem)
      ? [...s.inventory, p.rewardItem] : s.inventory,
    selectedItem: null,
    lastResult: 'correct',
  };
  // 최종 퍼즐 → 기억 조각 + 다락방 복귀(연출은 phase: 'memory'로)
  if (FINAL_PUZZLE[p.room] === puzzleId) {
    const shards = [...next.memoryShards, p.room] as RoomId[];
    next = { ...next, memoryShards: shards, room: 'attic',
      phase: shards.length >= 3 ? 'epilogue' : 'memory' };
  }
  return next;
}

export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'START': return a.resume ?? { ...initialState, phase: 'prologue' };
    case 'ENTER_ROOM': return { ...s, room: a.room, phase: 'playing', lastResult: null };
    case 'PICKUP':
      return s.inventory.includes(a.itemId) ? s : { ...s, inventory: [...s.inventory, a.itemId] };
    case 'SELECT_ITEM': return { ...s, selectedItem: a.itemId };
    case 'SOLVE': return applySolve(s, a.puzzleId);
    case 'ATTEMPT': {
      if (!canAttempt(s, a.puzzleId)) return s;
      const p = getPuzzle(a.puzzleId);
      if (p.answer !== undefined && p.answer !== a.answer)
        return { ...s, lastResult: 'wrong' };
      return applySolve(s, a.puzzleId);
    }
    case 'USE_HINT': {
      const used = s.hintsUsed[a.puzzleId] ?? 0;
      return used >= 2 ? s : { ...s, hintsUsed: { ...s.hintsUsed, [a.puzzleId]: used + 1 } };
    }
    case 'MEMORY_DONE': return { ...s, phase: 'playing', room: 'attic' };
    case 'RESET': return { ...initialState, phase: 'prologue' };
    default: return s;
  }
}
