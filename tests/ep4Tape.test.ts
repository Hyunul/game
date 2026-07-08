import { describe, it, expect } from 'vitest';
import { TAPE_SEGMENTS, isSegmentUnlocked, isCleanMode, segmentLines } from '../lib/ep4Tape';

describe('ep4Tape', () => {
  it('구간은 unlockedBy 퍼즐이 풀려야 해금된다', () => {
    expect(isSegmentUnlocked('seg-042', [])).toBe(false);
    expect(isSegmentUnlocked('seg-042', ['ep4-counter'])).toBe(true);
  });

  it('클린 모드는 ep4-eq 해결로 켜진다', () => {
    expect(isCleanMode([])).toBe(false);
    expect(isCleanMode(['ep4-eq'])).toBe(true);
  });

  it('클린 모드에서만 cleanInserts 줄이 합쳐진다 (F2 회수)', () => {
    const base = segmentLines('seg-042', ['ep4-counter']);
    const clean = segmentLines('seg-042', ['ep4-counter', 'ep4-eq']);
    expect(base.length).toBeGreaterThan(0);
    expect(clean.length).toBeGreaterThan(base.length);
    expect(clean.join(' ')).toContain('숨');
  });

  it('해금 안 된 구간의 자막은 빈 배열', () => {
    expect(segmentLines('seg-042', [])).toEqual([]);
    expect(segmentLines('no-such-seg', ['ep4-counter'])).toEqual([]);
  });

  it('모든 구간의 unlockedBy는 비어 있지 않고 counter는 세 자리다', () => {
    for (const s of TAPE_SEGMENTS) {
      expect(s.unlockedBy.length).toBeGreaterThan(0);
      expect(s.counter).toMatch(/^\d{3}$/);
    }
  });
});
