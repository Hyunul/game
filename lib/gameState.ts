import { AnyRoomId, RoomId, Era } from './types';
import { PUZZLES, FINAL_PUZZLE, ITEMS } from './puzzles';
import { EpisodeConfig } from './episode';

export type Phase = 'title' | 'prologue' | 'playing' | 'memory' | 'epilogue';

export interface GameState {
  phase: Phase;
  room: AnyRoomId;
  solved: string[];
  inventory: string[];
  memoryShards: AnyRoomId[];          // 'home' | 'class' | 'store'
  selectedItem: string | null;     // 인벤토리에서 선택 중인 아이템
  lastResult: 'correct' | 'wrong' | null;
  hintsUsed: Record<string, number>; // puzzleId -> 0|1|2
  era: Era;
}

export const initialState: GameState = {
  phase: 'title', room: 'attic', solved: [], inventory: [],
  memoryShards: [], selectedItem: null, lastResult: null, hintsUsed: {},
  era: 'present',
};

export type Action =
  | { type: 'START'; resume?: GameState }
  | { type: 'ENTER_ROOM'; room: AnyRoomId }
  | { type: 'PICKUP'; itemId: string }
  | { type: 'SELECT_ITEM'; itemId: string | null }
  | { type: 'ATTEMPT'; puzzleId: string; answer: string }
  | { type: 'SOLVE'; puzzleId: string }
  | { type: 'USE_HINT'; puzzleId: string }
  | { type: 'MEMORY_DONE' }
  | { type: 'TOGGLE_ERA' }
  | { type: 'RESET' };

export function canAttemptWith(config: EpisodeConfig, s: GameState, puzzleId: string): boolean {
  const p = getPuzzleFrom(config, puzzleId);
  if (s.solved.includes(puzzleId)) return false;
  if (!p.requires.every((r) => s.solved.includes(r))) return false;
  if (p.requiresItem && !s.inventory.includes(p.requiresItem)) return false;
  if (p.era && p.era !== s.era) return false;
  return true;
}

function getPuzzleFrom(config: EpisodeConfig, id: string) {
  const p = config.puzzles.find((p) => p.id === id);
  if (!p) throw new Error(`unknown puzzle: ${id}`);
  return p;
}

function applySolve(config: EpisodeConfig, s: GameState, puzzleId: string): GameState {
  const p = getPuzzleFrom(config, puzzleId);
  let next: GameState = {
    ...s,
    solved: [...s.solved, puzzleId],
    inventory: p.rewardItem && !s.inventory.includes(p.rewardItem)
      ? [...s.inventory, p.rewardItem] : s.inventory,
    selectedItem: null,
    lastResult: 'correct',
  };
  // 최종 퍼즐 → 기억 조각 + 허브 복귀(연출은 phase: 'memory'로)
  if (config.finalPuzzles[p.room] === puzzleId) {
    const shards = [...next.memoryShards, p.room];
    next = { ...next, memoryShards: shards, room: config.hubRoom,
      phase: shards.length >= config.epilogueAt ? 'epilogue' : 'memory' };
  }
  return next;
}

export function createGameReducer(config: EpisodeConfig) {
  return function reducer(s: GameState, a: Action): GameState {
    switch (a.type) {
      case 'START': return a.resume ?? { ...initialState, room: config.hubRoom, phase: 'prologue' };
      case 'ENTER_ROOM': return { ...s, room: a.room, phase: 'playing', lastResult: null };
      case 'PICKUP':
        return s.inventory.includes(a.itemId) ? s : { ...s, inventory: [...s.inventory, a.itemId] };
      case 'SELECT_ITEM': return { ...s, selectedItem: a.itemId };
      case 'SOLVE': return applySolve(config, s, a.puzzleId);
      case 'ATTEMPT': {
        if (!canAttemptWith(config, s, a.puzzleId)) return s;
        const p = getPuzzleFrom(config, a.puzzleId);
        if (p.answer !== undefined && p.answer !== a.answer)
          return { ...s, lastResult: 'wrong' };
        return applySolve(config, s, a.puzzleId);
      }
      case 'USE_HINT': {
        const used = s.hintsUsed[a.puzzleId] ?? 0;
        return used >= 2 ? s : { ...s, hintsUsed: { ...s.hintsUsed, [a.puzzleId]: used + 1 } };
      }
      case 'MEMORY_DONE': return { ...s, phase: 'playing', room: config.hubRoom };
      case 'TOGGLE_ERA': return { ...s, era: s.era === 'past' ? 'present' : 'past', lastResult: null };
      case 'RESET': return { ...initialState, room: config.hubRoom, phase: 'prologue' };
      default: return s;
    }
  };
}

export const EP1_CONFIG: EpisodeConfig = {
  id: 'ep1',
  saveKey: 'memory-box-save',
  puzzles: PUZZLES,
  items: ITEMS,
  finalPuzzles: FINAL_PUZZLE,
  epilogueAt: 3,
  hubRoom: 'attic' as RoomId,
};

export const reducer = createGameReducer(EP1_CONFIG);
export const canAttempt = (s: GameState, puzzleId: string): boolean =>
  canAttemptWith(EP1_CONFIG, s, puzzleId);
