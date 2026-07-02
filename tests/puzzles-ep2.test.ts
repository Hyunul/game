import { describe, it, expect } from 'vitest';
import { EP2_PUZZLES, EP2_ITEMS, EP2_CONFIG } from '@/lib/puzzles-ep2';

describe('ep2 puzzles data', () => {
  it('모든 requires가 실제 ep2 퍼즐을 가리킨다', () => {
    const ids = new Set(EP2_PUZZLES.map((p) => p.id));
    for (const p of EP2_PUZZLES) for (const r of p.requires) expect(ids.has(r)).toBe(true);
  });

  it('모든 rewardItem/requiresItem이 EP2_ITEMS에 존재한다', () => {
    for (const p of EP2_PUZZLES) {
      if (p.rewardItem) expect(EP2_ITEMS[p.rewardItem as keyof typeof EP2_ITEMS]).toBeDefined();
      if (p.requiresItem) expect(EP2_ITEMS[p.requiresItem as keyof typeof EP2_ITEMS]).toBeDefined();
    }
  });

  it('힌트는 항상 2단계', () => {
    for (const p of EP2_PUZZLES) expect(p.hints).toHaveLength(2);
  });

  it('ep2-timeline의 requires에 조각 5개 지급 퍼즐과 ep2-lantern이 모두 포함된다', () => {
    const timeline = EP2_PUZZLES.find((p) => p.id === 'ep2-timeline');
    expect(timeline).toBeDefined();
    const evidencePuzzleIds = EP2_PUZZLES
      .filter((p) => p.rewardItem?.startsWith('ev-'))
      .map((p) => p.id);
    expect(evidencePuzzleIds).toHaveLength(5);
    for (const id of evidencePuzzleIds) expect(timeline!.requires).toContain(id);
    expect(timeline!.requires).toContain('ep2-lantern');
  });

  it('EP2_CONFIG는 reservoir 방을 ep2-timeline에 매핑하고 저장 키는 memory-box-save-ep2', () => {
    expect(EP2_CONFIG.finalPuzzles.reservoir).toBe('ep2-timeline');
    expect(EP2_CONFIG.saveKey).toBe('memory-box-save-ep2');
  });
});
