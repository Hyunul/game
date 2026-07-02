import { describe, it, expect } from 'vitest';
import { EP2_PUZZLES, EP2_ITEMS, EP2_CONFIG } from '@/lib/puzzles-ep2';

describe('ep2 puzzles data', () => {
  it('모든 requires가 실제 ep2 퍼즐을 가리킨다', () => {
    const ids = new Set(EP2_PUZZLES.map((p) => p.id));
    for (const p of EP2_PUZZLES) for (const r of p.requires) expect(ids.has(r)).toBe(true);
  });

  it('모든 rewardItem/rewardItems/requiresItem/requiresItems이 EP2_ITEMS에 존재한다', () => {
    for (const p of EP2_PUZZLES) {
      if (p.rewardItem) expect(EP2_ITEMS[p.rewardItem]).toBeDefined();
      if (p.rewardItems) for (const it of p.rewardItems) expect(EP2_ITEMS[it]).toBeDefined();
      if (p.requiresItem) expect(EP2_ITEMS[p.requiresItem]).toBeDefined();
      if (p.requiresItems) for (const it of p.requiresItems) expect(EP2_ITEMS[it]).toBeDefined();
    }
  });

  it('힌트는 항상 2단계', () => {
    for (const p of EP2_PUZZLES) expect(p.hints).toHaveLength(2);
  });

  it('힌트 1단계는 정답을 노출하지 않는다 (방향 제시만)', () => {
    for (const p of EP2_PUZZLES) {
      if (!p.answer) continue;
      expect(p.hints[0]).not.toContain(p.answer);
    }
  });

  it('퍼즐 개수는 19개', () => {
    expect(EP2_PUZZLES).toHaveLength(19);
  });

  it('doc 아이템은 docPages를 갖고, 각 페이지는 비어있지 않다', () => {
    for (const item of Object.values(EP2_ITEMS)) {
      if (!item.doc) continue;
      expect(item.docPages).toBeDefined();
      expect(item.docPages!.length).toBeGreaterThan(0);
      for (const page of item.docPages!) expect(page.length).toBeGreaterThan(0);
    }
  });

  it('doc-diary(D4)는 날짜별 3페이지', () => {
    expect(EP2_ITEMS['doc-diary'].docPages).toHaveLength(3);
  });

  it('ep2-timeline은 6개의 게이트 퍼즐(사진 조립·필적 감정·모순 찾기·랜턴·시계·도구걸이)을 모두 requires로 요구한다', () => {
    const timeline = EP2_PUZZLES.find((p) => p.id === 'ep2-timeline');
    expect(timeline).toBeDefined();
    const gates = ['ep2-photo', 'ep2-handwriting', 'ep2-contradiction', 'ep2-lantern', 'ep2-watch-lid', 'ep2-toolwall'];
    for (const g of gates) expect(timeline!.requires).toContain(g);
  });

  it('ep2-photo는 사진 조각 4개를 requiresItems로 요구하고 해결 시 소비한다', () => {
    const photo = EP2_PUZZLES.find((p) => p.id === 'ep2-photo')!;
    expect(photo.requiresItems).toEqual(expect.arrayContaining(['photo-1', 'photo-2', 'photo-3', 'photo-4']));
    expect(photo.consumes).toEqual(expect.arrayContaining(['photo-1', 'photo-2', 'photo-3', 'photo-4']));
    expect(photo.rewardItem).toBe('photo-full');
  });

  it('ep2-contradiction은 doc-diary·doc-report·doc-rumor를 requiresItems로 요구한다', () => {
    const contradiction = EP2_PUZZLES.find((p) => p.id === 'ep2-contradiction')!;
    expect(contradiction.requiresItems).toEqual(
      expect.arrayContaining(['doc-diary', 'doc-report', 'doc-rumor']),
    );
  });

  it('모순 쌍(D2-2|D5-1)의 근거 문장이 실제 문서 전문에 존재한다', () => {
    expect(EP2_ITEMS['doc-report'].docPages![0]).toContain('한 사람');
    expect(EP2_ITEMS['doc-report'].docPages![0]).toContain('맨손');
    expect(EP2_ITEMS['doc-rumor'].docPages![1]).toContain('두 형제가 함께');
    expect(EP2_ITEMS['doc-rumor'].docPages![1]).toContain('낚시 짐');
  });

  it('ep2-handwriting은 필적 표본 3종(doc-note·doc-letter·doc-scribble)을 requiresItems로 요구한다', () => {
    const handwriting = EP2_PUZZLES.find((p) => p.id === 'ep2-handwriting')!;
    expect(handwriting.requiresItems).toEqual(
      expect.arrayContaining(['doc-note', 'doc-letter', 'doc-scribble']),
    );
  });

  it('영호의 필적 표본(doc-scribble)은 ep2-column 보상으로 지급되며 浩 서명을 담는다', () => {
    const column = EP2_PUZZLES.find((p) => p.id === 'ep2-column')!;
    expect(column.rewardItems).toEqual(expect.arrayContaining(['photo-2', 'doc-scribble']));
    expect(EP2_ITEMS['doc-scribble'].doc).toBe(true);
    expect(EP2_ITEMS['doc-scribble'].docPages![0]).toContain('浩');
  });

  it('EP2_CONFIG는 reservoir 방을 ep2-timeline에 매핑하고 저장 키는 memory-box-save-ep2', () => {
    expect(EP2_CONFIG.finalPuzzles.reservoir).toBe('ep2-timeline');
    expect(EP2_CONFIG.saveKey).toBe('memory-box-save-ep2');
    expect(EP2_CONFIG.epilogueAt).toBe(1);
    expect(EP2_CONFIG.hubRoom).toBe('ep2-attic');
  });
});
