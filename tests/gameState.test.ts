import { describe, it, expect } from 'vitest';
import { initialState, reducer, canAttempt, GameState } from '@/lib/gameState';
import { RoomId, ItemId } from '@/lib/types';

describe('gameState', () => {
  it('초기 상태는 다락방, 빈 인벤토리', () => {
    expect(initialState.room).toBe('attic');
    expect(initialState.inventory).toEqual([]);
    expect(initialState.solved).toEqual([]);
  });

  it('선행 퍼즐이 안 풀리면 시도 불가', () => {
    expect(canAttempt(initialState, 'home-phone')).toBe(false);
    const s = reducer(initialState, { type: 'SOLVE', puzzleId: 'home-calendar' });
    expect(canAttempt(s, 'home-phone')).toBe(true);
  });

  it('SOLVE 시 보상 아이템이 인벤토리에 들어간다', () => {
    const s = reducer(initialState, { type: 'SOLVE', puzzleId: 'home-calendar' });
    expect(s.solved).toContain('home-calendar');
    expect(s.inventory).toContain('memo-anniversary');
  });

  it('정답 검사: ATTEMPT는 맞으면 SOLVE, 틀리면 무변화 + lastResult=wrong', () => {
    let s = reducer(initialState, { type: 'SOLVE', puzzleId: 'home-calendar' });
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'home-phone', answer: '1234' });
    expect(s.solved).not.toContain('home-phone');
    expect(s.lastResult).toBe('wrong');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'home-phone', answer: '0508' });
    expect(s.solved).toContain('home-phone');
    expect(s.lastResult).toBe('correct');
  });

  it('연속 오답마다 wrongAttempts가 증가한다 — 두 번째 오답부터 연출 누락 방지', () => {
    let s = reducer(initialState, { type: 'SOLVE', puzzleId: 'home-calendar' });
    expect(s.wrongAttempts).toBe(0);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'home-phone', answer: '1111' });
    expect(s.wrongAttempts).toBe(1);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'home-phone', answer: '2222' });
    expect(s.wrongAttempts).toBe(2);
    expect(s.lastResult).toBe('wrong');
  });

  it('START resume 시 lastResult가 리셋된다 — 오답 직후 저장 복귀 오발 방지', () => {
    let s = reducer(initialState, { type: 'SOLVE', puzzleId: 'home-calendar' });
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'home-phone', answer: '1234' });
    expect(s.lastResult).toBe('wrong');
    const resumed = reducer(initialState, { type: 'START', resume: s });
    expect(resumed.lastResult).toBeNull();
    expect(resumed.solved).toEqual(s.solved);
  });

  it('requiresItem이 인벤토리에 없으면 시도 불가', () => {
    expect(canAttempt(initialState, 'home-sewingbox')).toBe(false);
    const s = reducer(initialState, { type: 'PICKUP', itemId: 'backscratcher' });
    expect(canAttempt(s, 'home-sewingbox')).toBe(true);
  });

  it('최종 퍼즐 SOLVE 시 기억 조각 획득 + 다락방 복귀', () => {
    const base: GameState = {
      ...initialState,
      room: 'home' as RoomId,
      solved: ['home-calendar', 'home-phone', 'home-tv', 'home-sewingbox'],
      inventory: ['sewingbox-key' as ItemId],
    };
    const s = reducer(base, { type: 'ATTEMPT', puzzleId: 'home-final', answer: '1987' });
    expect(s.memoryShards).toContain('home');
    expect(s.room).toBe('attic');
  });

  it('기억 조각 3개면 phase=epilogue', () => {
    const base: GameState = {
      ...initialState,
      memoryShards: ['home', 'class'] as RoomId[],
      room: 'store' as RoomId,
      solved: ['store-snacks', 'store-arcade', 'store-paperdoll'],
      inventory: ['coin-gacha' as ItemId],
    };
    const s = reducer(base, { type: 'ATTEMPT', puzzleId: 'store-final', answer: '' });
    expect(s.phase).toBe('epilogue');
  });
});
