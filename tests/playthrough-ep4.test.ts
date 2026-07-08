import { describe, it, expect } from 'vitest';
import { initialState, createGameReducer, canAttemptWith, GameState } from '@/lib/gameState';
import { EP4_CONFIG } from '@/lib/puzzles-ep4';
import { segmentLines } from '@/lib/ep4Tape';

const reducer = createGameReducer(EP4_CONFIG);
const canAttempt = (s: GameState, puzzleId: string) => canAttemptWith(EP4_CONFIG, s, puzzleId);

describe('ep4 full playthrough', () => {
  it('drives through entire episode start to epilogue', () => {
    // START
    let s = reducer(initialState, { type: 'START' });
    expect(s.phase).toBe('prologue');

    // ── 1막: 마루 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'ep4-maru' });

    // 데크 수리 전에는 카운터 퍼즐 시도 불가 (벨트 선행)
    expect(canAttempt(s, 'ep4-counter')).toBe(false);

    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-belt', answer: 'routed' });
    expect(s.solved).toContain('ep4-belt');
    expect(s.inventory).toContain('note-counter');

    // 엽서 줍기 → 라디오
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-postcards', answer: '' });
    expect(s.inventory).toContain('postcard-pile');
    const wrongFreq = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-radio', answer: '881' });
    expect(wrongFreq.lastResult).toBe('wrong');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-radio', answer: '891' });
    expect(s.solved).toContain('ep4-radio');

    // 전축 33rpm, 카운터 042
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-speed', answer: '33' });
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-counter', answer: '042' });
    expect(s.solved).toContain('ep4-counter');

    // 클린 모드 전: 자장가 구간에 멈춘 숨이 없다 (F2 아직 미회수)
    expect(segmentLines('seg-042', s.solved).join(' ')).not.toContain('멈춘 숨');

    // ── 1막: 안방 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'ep4-anbang' });
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-ring', answer: 'aligned' });
    expect(s.inventory).toContain('photo-audition');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-pillbag', answer: '' });
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-calendar', answer: 'matched' });
    expect(s.solved).toContain('ep4-calendar');

    // 자개장(안방 최종) — 라디오 예명 선행. 풀면 기억 조각 + 허브(마루) 복귀
    const wrongName = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-jagae', answer: '은-구-슬' });
    expect(wrongName.lastResult).toBe('wrong');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-jagae', answer: '은-방-울' });
    expect(s.solved).toContain('ep4-jagae');
    expect(s.inventory).toContain('rx-bundle');
    expect(s.inventory).toContain('knock-note');
    expect(s.memoryShards).toContain('ep4-anbang');
    expect(s.phase).toBe('memory');
    expect(s.room).toBe('ep4-maru');

    // ── 골방 게이트: 노크 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'ep4-maru' });
    const wrongKnock = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-knock', answer: '장-단-장-단-장' });
    expect(wrongKnock.lastResult).toBe('wrong');
    expect(wrongKnock.wrongAttempts).toBe(s.wrongAttempts + 1);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-knock', answer: '장-장-단-단-장' });
    expect(s.solved).toContain('ep4-knock');

    // ── 2막: 골방 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'ep4-golbang' });
    // 이퀄라이저는 벽감(계란판) 전에는 시도 불가
    expect(canAttempt(s, 'ep4-eq')).toBe(false);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-eggwall', answer: '' });
    expect(s.inventory).toContain('tape-scraps');
    expect(s.inventory).toContain('tape-035');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-eq', answer: 'clean' });
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-rx', answer: '1002' });
    expect(s.solved).toContain('ep4-rx');

    // 스플라이스(골방 최종) → 기억 조각 2, 조각이 소모된다
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-splice', answer: '3-1-4-2-5' });
    expect(s.solved).toContain('ep4-splice');
    expect(s.inventory).toContain('audition-tape');
    expect(s.inventory).not.toContain('tape-scraps');
    expect(s.memoryShards).toContain('ep4-golbang');
    expect(s.room).toBe('ep4-maru');

    // ── 부스 회상 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'ep4-booth' });
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-booth', answer: '2-1-3' });
    expect(s.solved).toContain('ep4-booth');
    expect(s.memoryShards).toContain('ep4-booth');

    // ── 3막: 재청취와 회수 ──
    s = reducer(s, { type: 'ENTER_ROOM', room: 'ep4-maru' });
    // 클린 모드: 이제 자장가에 멈춘 숨이 들린다 (F2 회수)
    expect(segmentLines('seg-042', s.solved).join(' ')).toContain('멈춘 숨');

    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-relisten', answer: '' });
    expect(s.solved).toContain('ep4-relisten');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-numbers', answer: 'missing-35' });
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-lasttape', answer: 'restored' });

    // 최종: 올해의 테이프
    expect(canAttempt(s, 'ep4-final')).toBe(true);
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'ep4-final', answer: '035' });
    expect(s.solved).toContain('ep4-final');
    expect(s.memoryShards.length).toBe(4);
    expect(s.phase).toBe('epilogue');
  });

  it('ep4-final은 3막 회수 퍼즐이 다 풀리기 전엔 시도 불가', () => {
    let s = reducer(initialState, { type: 'START' });
    s = {
      ...s, phase: 'playing', room: 'ep4-maru',
      solved: ['ep4-relisten', 'ep4-numbers'], inventory: ['tape-035'],
    };
    expect(canAttempt(s, 'ep4-final')).toBe(false);
    s = { ...s, solved: [...s.solved, 'ep4-lasttape'] };
    expect(canAttempt(s, 'ep4-final')).toBe(true);
  });

  it('저장 복귀 방어: 게이트 미충족 골방 저장은 마루로 되돌린다', () => {
    const badSave: GameState = {
      ...initialState, phase: 'playing', room: 'ep4-golbang', prevRoom: null,
      solved: ['ep4-belt'], inventory: [],
    };
    const s = reducer(initialState, { type: 'START', resume: badSave });
    expect(s.room).toBe('ep4-maru');
  });

  it('저장 복귀 방어: 부스 저장은 splice 미해결 시 골방(게이트 충족)으로', () => {
    const badSave: GameState = {
      ...initialState, phase: 'playing', room: 'ep4-booth', prevRoom: 'ep4-golbang',
      solved: ['ep4-knock'], inventory: [],
    };
    const s = reducer(initialState, { type: 'START', resume: badSave });
    // prevRoom(골방)도 게이트 방이므로 fallback('ep4-golbang')으로 — knock은 풀려 있어 안전
    expect(s.room).toBe('ep4-golbang');
  });
});
