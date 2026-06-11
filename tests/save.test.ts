import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveGame, loadGame, clearSave } from '@/lib/save';
import { initialState } from '@/lib/gameState';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

describe('save', () => {
  it('저장 후 불러오면 동일한 상태', () => {
    const s = { ...initialState, solved: ['home-calendar'], phase: 'playing' as const };
    saveGame(s);
    expect(loadGame()).toEqual(s);
  });
  it('저장 없으면 null', () => expect(loadGame()).toBeNull());
  it('깨진 JSON이면 null', () => {
    store.set('memory-box-save', '{broken');
    expect(loadGame()).toBeNull();
  });
  it('clearSave 후 null', () => {
    saveGame(initialState); clearSave();
    expect(loadGame()).toBeNull();
  });
});
