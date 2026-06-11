import { describe, it, expect } from 'vitest';
import { initialState, reducer, canAttempt, GameState } from '@/lib/gameState';
import { RoomId } from '@/lib/types';

describe('full playthrough', () => {
  it('drives through entire game start to epilogue', () => {
    // START
    let s = reducer(initialState, { type: 'START' });
    expect(s.phase).toBe('prologue');

    // ENTER home
    s = reducer(s, { type: 'ENTER_ROOM', room: 'home' });
    expect(s.phase).toBe('playing');
    expect(s.room).toBe('home');

    // SOLVE home-calendar (click-type, no answer)
    s = reducer(s, { type: 'SOLVE', puzzleId: 'home-calendar' });
    expect(s.solved).toContain('home-calendar');
    expect(s.inventory).toContain('memo-anniversary');

    // ATTEMPT home-phone '0508'
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'home-phone', answer: '0508' });
    expect(s.solved).toContain('home-phone');
    expect(s.lastResult).toBe('correct');

    // ATTEMPT home-tv '7'
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'home-tv', answer: '7' });
    expect(s.solved).toContain('home-tv');

    // PICKUP backscratcher
    s = reducer(s, { type: 'PICKUP', itemId: 'backscratcher' });
    expect(s.inventory).toContain('backscratcher');

    // ATTEMPT home-sewingbox (requiresItem backscratcher, answer='')
    expect(canAttempt(s, 'home-sewingbox')).toBe(true);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'home-sewingbox', answer: '' });
    expect(s.solved).toContain('home-sewingbox');
    expect(s.inventory).toContain('sewingbox-key');

    // home-final requires sewingbox-key in inventory
    expect(s.inventory).toContain('sewingbox-key');
    expect(canAttempt(s, 'home-final')).toBe(true);

    // ATTEMPT home-final '1987'
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'home-final', answer: '1987' });
    expect(s.memoryShards).toContain('home');
    expect(s.phase).toBe('memory');
    expect(s.room).toBe('attic');

    // MEMORY_DONE → back to playing/attic
    s = reducer(s, { type: 'MEMORY_DONE' });
    expect(s.phase).toBe('playing');
    expect(s.room).toBe('attic');

    // ENTER class
    s = reducer(s, { type: 'ENTER_ROOM', room: 'class' });

    // SOLVE class-timetable (click-type)
    s = reducer(s, { type: 'SOLVE', puzzleId: 'class-timetable' });
    expect(s.solved).toContain('class-timetable');

    // ATTEMPT class-locker '33' → rewardItem sheet-music
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'class-locker', answer: '33' });
    expect(s.solved).toContain('class-locker');
    expect(s.inventory).toContain('sheet-music');

    // ATTEMPT class-organ 'C-E-G-E-C' → rewardItem chalk
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'class-organ', answer: 'C-E-G-E-C' });
    expect(s.solved).toContain('class-organ');
    expect(s.inventory).toContain('chalk');

    // ATTEMPT class-board '' (requiresItem chalk, no answer)
    expect(canAttempt(s, 'class-board')).toBe(true);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'class-board', answer: '' });
    expect(s.solved).toContain('class-board');

    // 화분 클릭으로 교환일기 획득 (칠판 글씨가 위치를 알려준 뒤)
    expect(s.inventory).not.toContain('diary');
    s = reducer(s, { type: 'PICKUP', itemId: 'diary' });
    expect(s.inventory).toContain('diary');

    // ATTEMPT class-final '2002'
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'class-final', answer: '2002' });
    expect(s.memoryShards).toHaveLength(2);
    expect(s.phase).toBe('memory');

    // MEMORY_DONE
    s = reducer(s, { type: 'MEMORY_DONE' });

    // ENTER store
    s = reducer(s, { type: 'ENTER_ROOM', room: 'store' });

    // ATTEMPT store-snacks '100+150+50' → rewardItem coin-100
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'store-snacks', answer: '100+150+50' });
    expect(s.solved).toContain('store-snacks');
    expect(s.inventory).toContain('coin-100');

    // ATTEMPT store-arcade '' (requiresItem coin-100)
    expect(canAttempt(s, 'store-arcade')).toBe(true);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'store-arcade', answer: '' });
    expect(s.solved).toContain('store-arcade');

    // ATTEMPT store-paperdoll '24' → rewardItem coin-gacha
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'store-paperdoll', answer: '24' });
    expect(s.solved).toContain('store-paperdoll');
    expect(s.inventory).toContain('coin-gacha');

    // ATTEMPT store-final '' (requiresItem coin-gacha)
    expect(canAttempt(s, 'store-final')).toBe(true);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'store-final', answer: '' });
    expect(s.phase).toBe('epilogue');
    expect(s.memoryShards).toHaveLength(3);
  });

  it('wrong answer leaves puzzle unsolved', () => {
    let s = reducer(initialState, { type: 'SOLVE', puzzleId: 'home-calendar' });
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'home-phone', answer: '9999' });
    expect(s.solved).not.toContain('home-phone');
    expect(s.lastResult).toBe('wrong');
  });

  it('attempting final without prereq items is a no-op', () => {
    // Build state with home-tv and home-sewingbox solved but no sewingbox-key in inventory
    const base: GameState = {
      ...initialState,
      room: 'home' as RoomId,
      solved: ['home-calendar', 'home-phone', 'home-tv', 'home-sewingbox'],
      inventory: [],  // no sewingbox-key
    };
    expect(canAttempt(base, 'home-final')).toBe(false);
    const after = reducer(base, { type: 'ATTEMPT', puzzleId: 'home-final', answer: '1987' });
    expect(after.solved).not.toContain('home-final');
    expect(after.phase).toBe('title'); // unchanged
  });
});
