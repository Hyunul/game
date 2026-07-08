import { describe, it, expect } from 'vitest';
import { EP4_CONFIG, EP4_PUZZLES, EP4_ITEMS } from '../lib/puzzles-ep4';

describe('EP4_CONFIG 불변식', () => {
  it('퍼즐 19개(본편 16+최종 1+줍기 2), finalPuzzles 4방, epilogueAt 4', () => {
    expect(EP4_PUZZLES.length).toBe(19);
    expect(Object.keys(EP4_CONFIG.finalPuzzles)).toEqual(
      expect.arrayContaining(['ep4-anbang', 'ep4-golbang', 'ep4-booth', 'ep4-maru'])
    );
    expect(EP4_CONFIG.epilogueAt).toBe(4);
  });

  it('퍼즐 id는 중복이 없다', () => {
    const ids = EP4_PUZZLES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('requires가 가리키는 퍼즐 id는 모두 실재한다', () => {
    const ids = new Set(EP4_PUZZLES.map((p) => p.id));
    for (const p of EP4_PUZZLES) for (const r of p.requires) expect(ids.has(r), `${p.id} requires ${r}`).toBe(true);
  });

  it('reward/requires 아이템은 모두 EP4_ITEMS에 실재한다', () => {
    for (const p of EP4_PUZZLES) {
      const refs = [p.requiresItem, ...(p.requiresItems ?? []), p.rewardItem, ...(p.rewardItems ?? []), ...(p.consumes ?? [])]
        .filter(Boolean) as string[];
      for (const r of refs) expect(EP4_ITEMS[r], `${p.id}의 ${r}`).toBeTruthy();
    }
  });

  it('모든 퍼즐에 힌트 2단계가 있다', () => {
    for (const p of EP4_PUZZLES) {
      expect(p.hints.length).toBe(2);
      expect(p.hints[0].length).toBeGreaterThan(0);
      expect(p.hints[1].length).toBeGreaterThan(0);
    }
  });

  it('골방·부스 게이트와 fallback', () => {
    expect(EP4_CONFIG.roomGates?.['ep4-golbang']).toEqual({ requires: ['ep4-knock'], fallback: 'ep4-maru' });
    expect(EP4_CONFIG.roomGates?.['ep4-booth']).toEqual({ requires: ['ep4-splice'], fallback: 'ep4-golbang' });
  });

  it('최종 ep4-final은 3막 회수 퍼즐을 전부 선행 요구한다', () => {
    const fin = EP4_PUZZLES.find((p) => p.id === 'ep4-final')!;
    expect(fin.requires).toEqual(expect.arrayContaining(['ep4-relisten', 'ep4-numbers', 'ep4-lasttape']));
  });

  it('테이프 구간의 unlockedBy는 실재하는 ep4 퍼즐이다', async () => {
    const { TAPE_SEGMENTS } = await import('../lib/ep4Tape');
    const ids = new Set(EP4_PUZZLES.map((p) => p.id));
    for (const s of TAPE_SEGMENTS) expect(ids.has(s.unlockedBy), s.id).toBe(true);
  });
});
