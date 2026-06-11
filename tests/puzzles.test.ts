import { describe, it, expect } from 'vitest';
import { PUZZLES, ITEMS, getPuzzle } from '@/lib/puzzles';

describe('puzzles data', () => {
  it('모든 requires가 실제 퍼즐을 가리킨다', () => {
    const ids = new Set(PUZZLES.map((p) => p.id));
    for (const p of PUZZLES) for (const r of p.requires) expect(ids.has(r)).toBe(true);
  });
  it('모든 rewardItem/requiresItem이 ITEMS에 존재한다', () => {
    for (const p of PUZZLES) {
      if (p.rewardItem) expect(ITEMS[p.rewardItem]).toBeDefined();
      if (p.requiresItem) expect(ITEMS[p.requiresItem]).toBeDefined();
    }
  });
  it('각 방에 최종 퍼즐이 있다', () => {
    expect(getPuzzle('home-final')).toBeDefined();
    expect(getPuzzle('class-final')).toBeDefined();
    expect(getPuzzle('store-final')).toBeDefined();
  });
  it('힌트는 항상 2단계', () => {
    for (const p of PUZZLES) expect(p.hints).toHaveLength(2);
  });
});
