import { describe, it, expect } from 'vitest';
import { initialState, createGameReducer, canAttemptWith, GameState } from '@/lib/gameState';
import { EP2_CONFIG } from '@/lib/puzzles-ep2';

const reducer = createGameReducer(EP2_CONFIG);
const canAttempt = (s: GameState, puzzleId: string) => canAttemptWith(EP2_CONFIG, s, puzzleId);

describe('ep2 v2 full playthrough', () => {
  it('drives through entire episode start to epilogue', () => {
    // START
    let s = reducer(initialState, { type: 'START' });
    expect(s.phase).toBe('prologue');
    expect(s.room).toBe('ep2-attic');
    expect(s.era).toBe('present');

    s = reducer(s, { type: 'PICKUP', itemId: 'doc-news' });
    s = reducer(s, { type: 'PICKUP', itemId: 'pocket-watch' });
    expect(s.inventory).toContain('doc-news');
    expect(s.inventory).toContain('pocket-watch');

    // ── 사랑방 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'sarangbang' });
    expect(s.room).toBe('sarangbang');

    // era gate
    expect(canAttempt(s, 'ep2-calendar')).toBe(false); // present
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('past');
    expect(canAttempt(s, 'ep2-calendar')).toBe(true);

    s = reducer(s, { type: 'SOLVE', puzzleId: 'ep2-calendar' });
    expect(s.solved).toContain('ep2-calendar');

    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-radio', answer: '711' });
    expect(s.solved).toContain('ep2-radio');
    expect(s.inventory).toContain('matches');

    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-bookchest', answer: 'ㅅ-ㅂ-ㄷ' });
    expect(s.solved).toContain('ep2-bookchest');
    expect(s.inventory).toContain('doc-rumor');
    expect(s.inventory).toContain('doc-jokbo');
    expect(s.inventory).toContain('photo-1');

    // (present) drawer, frame
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('present');

    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-drawer', answer: '5372' });
    expect(s.solved).toContain('ep2-drawer');
    expect(s.inventory).toContain('doc-letter');

    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-frame', answer: '' });
    expect(s.solved).toContain('ep2-frame');
    expect(s.inventory).toContain('empty-envelope');

    // ── 안방과 마루 ──
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('past');
    s = reducer(s, { type: 'SOLVE', puzzleId: 'ep2-column' });
    expect(s.solved).toContain('ep2-column');
    expect(s.inventory).toContain('photo-2');
    expect(s.inventory).toContain('doc-scribble'); // 영호 필적 표본

    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('present');

    // closet requires column + bookchest (jokbo) already solved
    expect(canAttempt(s, 'ep2-closet')).toBe(true);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-closet', answer: '175' });
    expect(s.solved).toContain('ep2-closet');
    expect(s.inventory).toContain('oil-bottle');
    expect(s.inventory).toContain('embroidery');

    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('past');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-sewingbox', answer: '2-3-4-5' });
    expect(s.solved).toContain('ep2-sewingbox');
    expect(s.inventory).toContain('brass-key');

    s = reducer(s, { type: 'SOLVE', puzzleId: 'ep2-floor-creak' });
    expect(s.solved).toContain('ep2-floor-creak');

    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('present');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-floorboard', answer: '' });
    expect(s.solved).toContain('ep2-floorboard');
    expect(s.inventory).toContain('doc-diary');

    // contradiction gated until doc-diary + doc-report + doc-rumor all held
    expect(canAttempt(s, 'ep2-contradiction')).toBe(false); // doc-report not yet obtained

    // ── 헛간과 마당 (early, to obtain doc-report via toolwall) ──
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('past');

    const withoutKey: GameState = { ...s, inventory: s.inventory.filter((i) => i !== 'brass-key') };
    expect(canAttempt(withoutKey, 'ep2-shed-door')).toBe(false);
    expect(canAttempt(s, 'ep2-shed-door')).toBe(true);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-shed-door', answer: '' });
    expect(s.solved).toContain('ep2-shed-door');

    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-toolwall', answer: '' });
    expect(s.solved).toContain('ep2-toolwall');
    expect(s.inventory).toContain('photo-4');
    expect(s.inventory).toContain('doc-report');

    // now contradiction is attemptable (present era)
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('present');
    expect(canAttempt(s, 'ep2-contradiction')).toBe(true);

    // negative: doc-rumor 없이는 시도 불가
    const withoutRumor: GameState = { ...s, inventory: s.inventory.filter((i) => i !== 'doc-rumor') };
    expect(canAttempt(withoutRumor, 'ep2-contradiction')).toBe(false);

    // negative: wrong contradiction pairing
    let wrongContradiction = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-contradiction', answer: 'D4-2|D1-1' });
    expect(wrongContradiction.solved).not.toContain('ep2-contradiction');
    expect(wrongContradiction.lastResult).toBe('wrong');

    // 정답: 조서 "한 사람·맨손"(D5-1) ↔ 벽보 소문 "둘이서·낚시 짐"(D2-2) — id 오름차순 정렬
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-contradiction', answer: 'D2-2|D5-1' });
    expect(s.solved).toContain('ep2-contradiction');
    expect(s.inventory).toContain('photo-3');

    // toolbox (present)
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-toolbox', answer: '345' });
    expect(s.solved).toContain('ep2-toolbox');
    expect(s.inventory).toContain('doc-note');

    // handwriting gated until 표본 3종(doc-note + doc-letter + doc-scribble) held
    const withoutScribble: GameState = { ...s, inventory: s.inventory.filter((i) => i !== 'doc-scribble') };
    expect(canAttempt(withoutScribble, 'ep2-handwriting')).toBe(false);
    expect(canAttempt(s, 'ep2-handwriting')).toBe(true);
    let wrongHandwriting = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-handwriting', answer: 'youngsu' });
    expect(wrongHandwriting.solved).not.toContain('ep2-handwriting');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-handwriting', answer: 'youngho' });
    expect(s.solved).toContain('ep2-handwriting');

    // watch-lid requires oil-bottle (still in inventory — lantern not solved yet)
    expect(s.inventory).toContain('oil-bottle');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-watch-lid', answer: '' });
    expect(s.solved).toContain('ep2-watch-lid');
    expect(s.inventory).toContain('watch-open');
    expect(s.inventory).toContain('oil-bottle'); // lantern still needs it

    // lantern (past)
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('past');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-lantern', answer: '' });
    expect(s.solved).toContain('ep2-lantern');
    expect(s.inventory).not.toContain('oil-bottle');
    expect(s.inventory).not.toContain('matches');

    // ── 사진 조립: 조각이 모두 모일 때까지 불가 ──
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('present');
    expect(s.inventory).toEqual(
      expect.arrayContaining(['photo-1', 'photo-2', 'photo-3', 'photo-4']),
    );
    expect(canAttempt(s, 'ep2-photo')).toBe(true);

    // negative: missing a piece → cannot attempt
    const missingPiece: GameState = { ...s, inventory: s.inventory.filter((i) => i !== 'photo-2') };
    expect(canAttempt(missingPiece, 'ep2-photo')).toBe(false);

    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-photo', answer: 'assembled' });
    expect(s.solved).toContain('ep2-photo');
    expect(s.inventory).toContain('photo-full');
    expect(s.inventory).not.toContain('photo-1');
    expect(s.inventory).not.toContain('photo-2');
    expect(s.inventory).not.toContain('photo-3');
    expect(s.inventory).not.toContain('photo-4');

    // ── 저수지: 타임라인 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'reservoir' });
    expect(s.room).toBe('reservoir');
    s = reducer(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('past');
    expect(canAttempt(s, 'ep2-timeline')).toBe(true);

    const missingToolwall: GameState = { ...s, solved: s.solved.filter((id) => id !== 'ep2-toolwall') };
    expect(canAttempt(missingToolwall, 'ep2-timeline')).toBe(false);

    // negative: 타살 배열 (조서의 사람을 밀어 넣은 시점으로 배치) — 풀리지 않는다
    const murderOrder = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-timeline', answer: '1-2-3-6-5-4-7' });
    expect(murderOrder.solved).not.toContain('ep2-timeline');
    expect(murderOrder.lastResult).toBe('wrong');

    // negative: 단순 오답
    const wrongOrder = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-timeline', answer: '1-2-3-4-5-6-7' });
    expect(wrongOrder.solved).not.toContain('ep2-timeline');
    expect(wrongOrder.lastResult).toBe('wrong');

    // positive
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep2-timeline', answer: '1-2-3-6-4-5-7' });
    expect(s.solved).toContain('ep2-timeline');
    expect(s.phase).toBe('epilogue');
  });
});
