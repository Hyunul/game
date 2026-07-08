import { describe, it, expect } from 'vitest';
import { initialState, createGameReducer, canAttemptWith, GameState } from '@/lib/gameState';
import { resolveEp3TruthPair } from '@/lib/ep3TruthPair';
import { EP3_CONFIG, EP3_TRUTH_PAIRS } from '@/lib/puzzles-ep3';

const reducer = createGameReducer(EP3_CONFIG);
const canAttempt = (s: GameState, puzzleId: string) => canAttemptWith(EP3_CONFIG, s, puzzleId);

describe('ep3 full playthrough', () => {
  it('drives through entire episode start to epilogue', () => {
    // START
    let s = reducer(initialState, { type: 'START' });
    expect(s.phase).toBe('prologue');
    expect(s.room).toBe('ep3-attic');

    // 프롤로그: 두 권의 기록 획득
    s = reducer(s, { type: 'PICKUP', itemId: 'doc-ledger' });
    s = reducer(s, { type: 'PICKUP', itemId: 'doc-address' });
    expect(s.inventory).toContain('doc-ledger');

    // ── 마당 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'madang' });
    expect(s.room).toBe('madang');

    // 문살 그림자 — 오답 위치
    const wrongSpot = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-sundial', answer: 'jangdok' });
    expect(wrongSpot.solved).not.toContain('ep3-sundial');
    expect(wrongSpot.lastResult).toBe('wrong');

    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-sundial', answer: 'daetdol' });
    expect(s.solved).toContain('ep3-sundial');
    expect(s.inventory).toContain('geon-key');

    // 건넌방 문 — 열쇠 필요
    const withoutKey: GameState = { ...s, inventory: s.inventory.filter((i) => i !== 'geon-key') };
    expect(canAttempt(withoutKey, 'ep3-geon-door')).toBe(false);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-geon-door', answer: '' });
    expect(s.solved).toContain('ep3-geon-door');
    expect(s.inventory).not.toContain('geon-key'); // 소모됨

    // ── 건넌방 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'geonneonbang' });
    // 장독은 뜨개(「돌」 힌트) 전에는 시도 불가
    expect(canAttempt(s, 'ep3-jangdok')).toBe(false);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-knit', answer: 'dol' });
    expect(s.solved).toContain('ep3-knit');
    expect(s.inventory).toContain('letter-1');

    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-cloth', answer: '' });
    expect(s.inventory).toContain('cloth-map');

    // ── 마당: 장독 절기 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'madang' });
    const wrongSolar = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-jangdok', answer: '입춘-동지-곡우-백로' });
    expect(wrongSolar.lastResult).toBe('wrong');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-jangdok', answer: '동지-입춘-곡우-백로' });
    expect(s.inventory).toContain('letter-2');

    // ── 부엌: 됫박 → 아궁이 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'bueok' });
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-doetbak', answer: '4' });
    expect(s.solved).toContain('ep3-doetbak');
    expect(s.inventory).toContain('letter-3');
    expect(s.inventory).toContain('matches');

    // 너무 가까이 대면 오답
    const scorched = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-heat', answer: 'scorched' });
    expect(scorched.solved).not.toContain('ep3-heat');
    expect(scorched.lastResult).toBe('wrong');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-heat', answer: 'revealed' });
    expect(s.solved).toContain('ep3-heat');
    expect(s.inventory).toContain('heat-note');

    // ── 마당: 우물 → 뒷문 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'madang' });
    const tooHeavy = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-well', answer: '3-7' });
    expect(tooHeavy.lastResult).toBe('wrong');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-well', answer: '3-5' });
    expect(s.solved).toContain('ep3-well');
    expect(s.inventory).toContain('backdoor-key');
    expect(s.inventory).toContain('letter-4');

    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-backdoor', answer: '' });
    expect(s.solved).toContain('ep3-backdoor');
    expect(s.inventory).not.toContain('backdoor-key');

    // ── 안방: 벽장 (박음질 평면도 필요) ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'ep3-anbang' });
    const withoutCloth: GameState = { ...s, inventory: s.inventory.filter((i) => i !== 'cloth-map') };
    expect(canAttempt(withoutCloth, 'ep3-closet')).toBe(false);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-closet', answer: '' });
    expect(s.solved).toContain('ep3-closet');
    expect(s.inventory).toContain('letter-5');
    expect(s.inventory).not.toContain('cloth-map'); // 소모됨

    // ── 마당: 빨랫줄 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'madang' });
    const wrongLine = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-clothesline', answer: 'ibul-chima-jeoksam-jeogori' });
    expect(wrongLine.lastResult).toBe('wrong');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-clothesline', answer: 'jeogori-jeoksam-chima-ibul' });
    expect(s.inventory).toContain('letter-6');

    // ── 안방: 소인 연대기 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'ep3-anbang' });
    const wrongPostmark = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-postmark', answer: 'e1-e2-e3-e4-e5-e6' });
    expect(wrongPostmark.lastResult).toBe('wrong');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-postmark', answer: 'e4-e1-e5-e2-e6-e3' });
    expect(s.solved).toContain('ep3-postmark');
    expect(s.inventory).toContain('lullaby');
    expect(s.inventory).toContain('letter-7');

    // ── 대조 뷰어: 진실 조각 5 ──
    // 오답 짝
    const wrongPair = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-truth-1', answer: 'G3|L3' });
    expect(wrongPair.lastResult).toBe('wrong');

    for (const [pid, answer] of Object.entries(EP3_TRUTH_PAIRS)) {
      expect(canAttempt(s, pid)).toBe(true);
      s = reducer(s, { type: 'ATTEMPT', puzzleId: pid, answer });
      expect(s.solved).toContain(pid);
    }

    // ── 최종: 반닫이 이름 ──
    expect(canAttempt(s, 'ep3-name')).toBe(true);
    const wrongName = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-name', answer: '한-솔' });
    expect(wrongName.solved).not.toContain('ep3-name');
    expect(wrongName.lastResult).toBe('wrong');

    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep3-name', answer: '한-별' });
    expect(s.solved).toContain('ep3-name');
    expect(s.phase).toBe('epilogue');
  });

  it('gates the final lock until all five truth pairs are found', () => {
    let s = reducer(initialState, { type: 'START' });
    s = { ...s, phase: 'playing', room: 'ep3-anbang',
      solved: ['ep3-backdoor', 'ep3-truth-1', 'ep3-truth-2', 'ep3-truth-3', 'ep3-truth-4'],
      inventory: ['doc-ledger', 'lullaby'] };
    expect(canAttempt(s, 'ep3-name')).toBe(false);
    s = { ...s, solved: [...s.solved, 'ep3-truth-5'] };
    expect(canAttempt(s, 'ep3-name')).toBe(true);
  });

  it('keeps an already found truth pair from counting as a new wrong attempt', () => {
    // Given: the first truth pair was already found and the next letter is also available.
    const s = {
      ...initialState,
      phase: 'playing' as const,
      room: 'ep3-anbang' as const,
      solved: ['ep3-backdoor', 'ep3-truth-1'],
      inventory: ['doc-ledger', 'letter-1', 'letter-2'],
    };

    // When: the player selects the already found pair again.
    const result = resolveEp3TruthPair(EP3_TRUTH_PAIRS['ep3-truth-1'], s.solved, (pid) => canAttempt(s, pid));

    // Then: the pair is treated as already found instead of being submitted as a wrong answer.
    expect(result).toEqual({ kind: 'already-found', puzzleId: 'ep3-truth-1' });
  });
});
