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

describe('consumes — 다 쓴 단서 정리', () => {
  const CONSUME_CONFIG: EpisodeConfig = {
    id: 'ep2', saveKey: 'test-consume',
    puzzles: [
      { id: 'q-single', room: 'sarangbang', requires: [], answer: 'a', consumes: ['clue'], hints: ['h', 'h'] },
      { id: 'q-shared-1', room: 'sarangbang', requires: [], answer: 'b', consumes: ['oil'], hints: ['h', 'h'] },
      { id: 'q-shared-2', room: 'sarangbang', requires: [], answer: 'c', requiresItem: 'oil', consumes: ['oil'], hints: ['h', 'h'] },
      { id: 'q-final', room: 'reservoir', requires: [], answer: 'z', hints: ['h', 'h'] },
    ],
    items: {}, finalPuzzles: { reservoir: 'q-final' }, epilogueAt: 1, hubRoom: 'ep2-attic',
  };
  const cReduce = createGameReducer(CONSUME_CONFIG);
  const base: GameState = { ...initialState, room: 'sarangbang' as AnyRoomId, phase: 'playing',
    inventory: ['clue', 'oil'] };

  it('단일 소비자: 해결 시 아이템 제거', () => {
    const s = cReduce(base, { type: 'ATTEMPT', puzzleId: 'q-single', answer: 'a' });
    expect(s.inventory).not.toContain('clue');
    expect(s.inventory).toContain('oil');
  });

  it('공유 소비자: 마지막 사용처까지 유지 후 제거', () => {
    let s = cReduce(base, { type: 'ATTEMPT', puzzleId: 'q-shared-1', answer: 'b' });
    expect(s.inventory).toContain('oil'); // q-shared-2가 아직 필요
    s = cReduce(s, { type: 'ATTEMPT', puzzleId: 'q-shared-2', answer: 'c' });
    expect(s.inventory).not.toContain('oil');
  });

  it('ep2 실데이터: 기름병은 시계 뚜껑과 랜턴 둘 다 해결돼야 사라진다', async () => {
    const { EP2_CONFIG } = await import('@/lib/puzzles-ep2');
    const r = createGameReducer(EP2_CONFIG);
    let s: GameState = { ...initialState, room: 'heotgan' as AnyRoomId, phase: 'playing', era: 'past',
      solved: ['ep2-calendar', 'ep2-drawer', 'ep2-radio', 'ep2-bookchest', 'ep2-column', 'ep2-closet', 'ep2-sewingbox', 'ep2-shed-door'],
      inventory: ['pocket-watch', 'oil-bottle', 'matches'] };
    s = r(s, { type: 'ATTEMPT', puzzleId: 'ep2-watch-lid', answer: '' });
    expect(s.inventory).toContain('oil-bottle'); // 랜턴이 아직 필요
    s = r(s, { type: 'ATTEMPT', puzzleId: 'ep2-lantern', answer: '' });
    expect(s.inventory).not.toContain('oil-bottle');
    expect(s.inventory).not.toContain('matches');
    expect(s.inventory).toContain('pocket-watch'); // 시계는 도구 — 유지
  });
});

describe('rewardItems / requiresItems — 복수 보상·복수 요구 아이템', () => {
  const MULTI_CONFIG: EpisodeConfig = {
    id: 'ep2', saveKey: 'test-multi',
    puzzles: [
      { id: 'm-multi-reward', room: 'sarangbang', requires: [], answer: 'go',
        rewardItem: 'primary', rewardItems: ['bonus-a', 'bonus-b'], hints: ['h', 'h'] },
      { id: 'm-needs-both', room: 'sarangbang', requires: ['m-multi-reward'],
        requiresItems: ['bonus-a', 'bonus-b'], answer: 'ok', hints: ['h', 'h'] },
    ],
    items: {}, finalPuzzles: {}, epilogueAt: 1, hubRoom: 'ep2-attic',
  };
  const mReduce = createGameReducer(MULTI_CONFIG);
  const base: GameState = { ...initialState, room: 'sarangbang' as AnyRoomId, phase: 'playing' };

  it('rewardItems는 rewardItem과 함께 모두 지급된다', () => {
    const s = mReduce(base, { type: 'ATTEMPT', puzzleId: 'm-multi-reward', answer: 'go' });
    expect(s.inventory).toEqual(expect.arrayContaining(['primary', 'bonus-a', 'bonus-b']));
  });

  it('requiresItems는 모든 아이템을 보유해야 시도 가능하다', () => {
    let s = mReduce(base, { type: 'ATTEMPT', puzzleId: 'm-multi-reward', answer: 'go' });
    const missingOne: GameState = { ...s, inventory: s.inventory.filter((i) => i !== 'bonus-b') };
    expect(canAttemptWith(MULTI_CONFIG, missingOne, 'm-needs-both')).toBe(false);
    expect(canAttemptWith(MULTI_CONFIG, s, 'm-needs-both')).toBe(true);
    s = mReduce(s, { type: 'ATTEMPT', puzzleId: 'm-needs-both', answer: 'ok' });
    expect(s.solved).toContain('m-needs-both');
  });
});
