import { describe, it, expect } from 'vitest';
import { createGameReducer, initialState, canAttemptWith, GameState } from '@/lib/gameState';
import { EpisodeConfig } from '@/lib/episode';
import { AnyRoomId } from '@/lib/types';

const TEST_CONFIG: EpisodeConfig = {
  id: 'ep2', saveKey: 'test-save',
  puzzles: [
    { id: 'p-past', room: 'sarangbang', requires: [], era: 'past', hints: ['h1', 'h2'] },
    { id: 'p-final', room: 'reservoir', requires: ['p-past'], answer: 'ok', hints: ['h1', 'h2'] },
  ],
  items: {}, finalPuzzles: { reservoir: 'p-final' }, epilogueAt: 1, hubRoom: 'ep2-attic',
};
const reduce = createGameReducer(TEST_CONFIG);

describe('episode-generalized reducer', () => {
  it('era가 다르면 시도 불가, TOGGLE_ERA 후 가능', () => {
    let s: GameState = { ...initialState, room: 'sarangbang' as AnyRoomId, phase: 'playing' };
    expect(canAttemptWith(TEST_CONFIG, s, 'p-past')).toBe(false); // present
    s = reduce(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('past');
    expect(canAttemptWith(TEST_CONFIG, s, 'p-past')).toBe(true);
  });
  it('epilogueAt=1이면 최종 퍼즐 하나로 epilogue', () => {
    let s: GameState = { ...initialState, room: 'reservoir' as AnyRoomId, phase: 'playing',
      solved: ['p-past'], era: 'present' };
    s = reduce(s, { type: 'ATTEMPT', puzzleId: 'p-final', answer: 'ok' });
    expect(s.phase).toBe('epilogue');
    expect(s.room).toBe('ep2-attic');
  });
});
