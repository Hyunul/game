import { describe, it, expect } from 'vitest';
import { initialState, createGameReducer, canAttemptWith, GameState } from '@/lib/gameState';
import { EP2_CONFIG } from '@/lib/puzzles-ep2';

const reducer = createGameReducer(EP2_CONFIG);
const canAttempt = (s: GameState, puzzleId: string) => canAttemptWith(EP2_CONFIG, s, puzzleId);

describe('ep2 full playthrough', () => {
  it('drives through entire episode start to epilogue', () => {
    // START
    let s = reducer(initialState, { type: 'START' });
    expect(s.phase).toBe('prologue');
    expect(s.room).toBe('ep2-attic');
    expect(s.era).toBe('present');

    // PICKUP prologue items
    s = reducer(s, { type: 'PICKUP', itemId: 'family-photo' });
    s = reducer(s, { type: 'PICKUP', itemId: 'news-clip' });
    s = reducer(s, { type: 'PICKUP', itemId: 'pocket-watch' });
    expect(s.inventory).toContain('family-photo');
    expect(s.inventory).toContain('news-clip');
    expect(s.inventory).toContain('pocket-watch');

    // ENTER sarangbang
    s = reducer(s, { type: 'ENTER_ROOM', room: 'sarangbang' });
    expect(s.phase).toBe('playing');
    expect(s.room).toBe('sarangbang');

    // era gate: ep2-calendar is 'past', current era 'present' → cannot attempt
    expect(canAttempt(s, 'ep2-calendar')).toBe(false);
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('past');
    expect(canAttempt(s, 'ep2-calendar')).toBe(true);

    // (past) SOLVE ep2-calendar
    s = reducer(s, { type: 'SOLVE', puzzleId: 'ep2-calendar' });
    expect(s.solved).toContain('ep2-calendar');

    // (past) ATTEMPT ep2-radio '711'
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-radio', answer: '711' });
    expect(s.solved).toContain('ep2-radio');
    expect(s.inventory).toContain('matches');

    // (present) TOGGLE_ERA, ATTEMPT ep2-drawer '0815'
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('present');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-drawer', answer: '0815' });
    expect(s.solved).toContain('ep2-drawer');
    expect(s.inventory).toContain('empty-envelope');

    // ATTEMPT ep2-frame ''
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-frame', answer: '' });
    expect(s.solved).toContain('ep2-frame');
    expect(s.inventory).toContain('ev-letter');

    // (past) SOLVE ep2-column
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('past');
    s = reducer(s, { type: 'SOLVE', puzzleId: 'ep2-column' });
    expect(s.solved).toContain('ep2-column');

    // (present) ATTEMPT ep2-closet '175'
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('present');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-closet', answer: '175' });
    expect(s.solved).toContain('ep2-closet');
    expect(s.inventory).toContain('oil-bottle');

    // (past) ATTEMPT ep2-sewingbox 'R-Y-B-Y'
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('past');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-sewingbox', answer: 'R-Y-B-Y' });
    expect(s.solved).toContain('ep2-sewingbox');
    expect(s.inventory).toContain('brass-key');

    // SOLVE ep2-floor-creak
    s = reducer(s, { type: 'SOLVE', puzzleId: 'ep2-floor-creak' });
    expect(s.solved).toContain('ep2-floor-creak');

    // (present) ATTEMPT ep2-floorboard ''
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('present');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-floorboard', answer: '' });
    expect(s.solved).toContain('ep2-floorboard');
    expect(s.inventory).toContain('ev-diary');

    // (past) ep2-shed-door needs brass-key — negative sub-check without item
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('past');
    const withoutKey: GameState = { ...s, inventory: s.inventory.filter((i) => i !== 'brass-key') };
    expect(canAttempt(withoutKey, 'ep2-shed-door')).toBe(false);

    // proceed with brass-key in inventory
    expect(canAttempt(s, 'ep2-shed-door')).toBe(true);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-shed-door', answer: '' });
    expect(s.solved).toContain('ep2-shed-door');

    // ATTEMPT ep2-toolwall ''
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-toolwall', answer: '' });
    expect(s.solved).toContain('ep2-toolwall');
    expect(s.inventory).toContain('ev-gear');

    // (present) ATTEMPT ep2-toolbox ''
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('present');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-toolbox', answer: '' });
    expect(s.solved).toContain('ep2-toolbox');
    expect(s.inventory).toContain('ev-note');

    // ATTEMPT ep2-watch-lid ''
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-watch-lid', answer: '' });
    expect(s.solved).toContain('ep2-watch-lid');
    expect(s.inventory).toContain('ev-watch');

    // (past) ATTEMPT ep2-lantern ''
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('past');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-lantern', answer: '' });
    expect(s.solved).toContain('ep2-lantern');

    // all 5 ev-* items present before timeline attempt
    expect(s.inventory).toContain('ev-letter');
    expect(s.inventory).toContain('ev-note');
    expect(s.inventory).toContain('ev-gear');
    expect(s.inventory).toContain('ev-watch');
    expect(s.inventory).toContain('ev-diary');

    // ENTER reservoir
    s = reducer(s, { type: 'ENTER_ROOM', room: 'reservoir' });
    expect(s.room).toBe('reservoir');

    // negative: wrong order
    let wrong = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-timeline', answer: '2-1-3-4-5' });
    expect(wrong.solved).not.toContain('ep2-timeline');
    expect(wrong.lastResult).toBe('wrong');

    // positive: correct order → epilogue
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-timeline', answer: '1-2-3-4-5' });
    expect(s.phase).toBe('epilogue');
    expect(s.solved).toContain('ep2-timeline');
  });
});
