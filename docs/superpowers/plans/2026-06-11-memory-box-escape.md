# 「기억의 상자」 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 감동·추억 키워드의 반응형 웹 방탈출 게임 (방 3개 + 프롤로그/에필로그)을 Next.js로 구현하고 Vercel에 배포한다.

**Architecture:** 전부 클라이언트 사이드. 퍼즐 로직은 `lib/puzzles.ts`에 선언적 데이터로, 게임 상태는 `lib/gameState.ts`의 useReducer 리듀서로 관리. 장면은 SVG 컴포넌트, 사운드는 Web Audio 합성, 저장은 localStorage.

**Tech Stack:** Next.js 15 (App Router) + TypeScript + Vitest. 외부 런타임 라이브러리 없음.

**스펙:** `docs/superpowers/specs/2026-06-11-memory-box-escape-design.md` — 퍼즐 내용·연출·UI 규칙의 원본. 각 태스크에서 해당 스펙 섹션을 따른다.

---

### Task 1: Next.js 프로젝트 스캐폴드

**Files:** Create: 프로젝트 루트 전체 (create-next-app), `vitest.config.ts`

- [ ] **Step 1:** 스캐폴드 생성 (기존 docs/.git 보존을 위해 임시 폴더에서 생성 후 병합하거나 `--no-git`으로 현재 폴더에 생성)

```bash
npx create-next-app@latest . --typescript --app --no-tailwind --no-eslint --src-dir=false --import-alias "@/*" --use-npm
```
주의: 폴더가 비어있지 않다는 경고가 나오면 임시 폴더에 생성 후 내용물을 복사한다. `.gitignore`는 기존 내용(`.superpowers/` 포함)과 병합.

- [ ] **Step 2:** Vitest 설치 및 설정

```bash
npm i -D vitest
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname) } },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
```
`package.json` scripts에 `"test": "vitest run"` 추가.

- [ ] **Step 3:** 검증 — `npm run build` 성공, `npm run dev` 후 http://localhost:3000 응답 확인
- [ ] **Step 4:** Commit: `git add -A; git commit -m "chore: Next.js + Vitest 스캐폴드"`

---

### Task 2: 게임 타입 & 퍼즐 데이터

**Files:** Create: `lib/types.ts`, `lib/puzzles.ts` / Test: `tests/puzzles.test.ts`

- [ ] **Step 1:** `lib/types.ts` 작성

```ts
export type RoomId = 'attic' | 'home' | 'class' | 'store';
export type ItemId =
  | 'photo' | 'backscratcher' | 'sewingbox-key' | 'memo-anniversary'
  | 'pencilcase' | 'sheet-music' | 'chalk' | 'diary'
  | 'capsule' | 'coin-100' | 'coin-gacha';

export interface Item { id: ItemId; name: string; icon: string; desc: string; }

export interface Puzzle {
  id: string;
  room: RoomId;
  /** 이 퍼즐을 시도하려면 먼저 풀려 있어야 하는 퍼즐 id들 */
  requires: string[];
  /** 사용해야 하는 인벤토리 아이템 (없으면 undefined) */
  requiresItem?: ItemId;
  /** 입력형 퍼즐의 정답 (클릭형이면 undefined) */
  answer?: string;
  /** 풀면 얻는 아이템 */
  rewardItem?: ItemId;
  hints: [string, string];
}
```

- [ ] **Step 2:** `lib/puzzles.ts` 작성 — 스펙 §3의 15개 퍼즐을 데이터로 정의. 정답값:

```ts
import { Puzzle, Item, ItemId } from './types';

export const ITEMS: Record<ItemId, Item> = {
  photo: { id: 'photo', name: '빛바랜 가족사진', icon: '📷', desc: '뒷면에 "채널 7"이라 적혀 있다.' },
  'memo-anniversary': { id: 'memo-anniversary', name: '기념일 메모', icon: '📝', desc: '5월 8일에 동그라미. "0508"' },
  backscratcher: { id: 'backscratcher', name: '효자손', icon: '🪵', desc: '할머니의 효자손. 손이 닿지 않는 곳에 쓰자.' },
  'sewingbox-key': { id: 'sewingbox-key', name: '작은 열쇠', icon: '🔑', desc: '반짇고리에서 나온 자개장 열쇠.' },
  pencilcase: { id: 'pencilcase', name: '몽당연필 필통', icon: '✏️', desc: '달그락거리는 양철 필통.' },
  'sheet-music': { id: 'sheet-music', name: '풍금 악보', icon: '🎼', desc: '도-미-솔-미-도. 어디서 많이 듣던 멜로디.' },
  chalk: { id: 'chalk', name: '분필', icon: '🖍️', desc: '몽당분필. 칠판에 문지를 수 있겠다.' },
  diary: { id: 'diary', name: '교환일기', icon: '📔', desc: '"우리의 비밀번호는 졸업하는 해" — 2002' },
  capsule: { id: 'capsule', name: '뽑기 캡슐', icon: '🔮', desc: '동전을 쥐고 있으면 그 시절이 떠오른다.' },
  'coin-100': { id: 'coin-100', name: '100원 동전', icon: '🪙', desc: '오락기에 넣을 수 있다.' },
  'coin-gacha': { id: 'coin-gacha', name: '뽑기 동전', icon: '🟡', desc: '뽑기 기계 전용 동전.' },
};

export const PUZZLES: Puzzle[] = [
  // 방 1 — 안방
  { id: 'home-calendar', room: 'home', requires: [], rewardItem: 'memo-anniversary',
    hints: ['벽에 걸린 것들을 살펴보자.', '달력의 동그라미 친 날짜를 확인해.'] },
  { id: 'home-phone', room: 'home', requires: ['home-calendar'], answer: '0508',
    hints: ['전화를 걸 번호가 어딘가에 적혀 있을 텐데.', '기념일 메모의 날짜 0508을 다이얼로 돌려봐.'] },
  { id: 'home-tv', room: 'home', requires: ['home-phone'], answer: '7',
    hints: ['수화기 속 목소리가 TV를 켜보라고 했다.', '가족사진 뒷면의 채널 7을 맞춰봐.'] },
  { id: 'home-sewingbox', room: 'home', requires: [], requiresItem: 'backscratcher', rewardItem: 'sewingbox-key',
    hints: ['장롱 위에 뭔가 있는데 손이 닿지 않아.', '긴 막대기 같은 것... 효자손을 써보자.'] },
  { id: 'home-final', room: 'home', requires: ['home-tv', 'home-sewingbox'], answer: '1987', requiresItem: 'sewingbox-key',
    hints: ['자개장은 열쇠와 숫자 둘 다 필요해 보인다.', 'TV 화면에 떠 있던 숫자 1987을 입력해.'] },
  // 방 2 — 교실
  { id: 'class-timetable', room: 'class', requires: [],
    hints: ['칠판 옆 시간표가 이상하다.', '색칠된 칸: 수요일 3교시 → 사물함 번호의 단서.'] },
  { id: 'class-locker', room: 'class', requires: ['class-timetable'], answer: '33', rewardItem: 'sheet-music',
    hints: ['시간표의 좌표가 사물함 번호.', '수요일(3)+3교시 → 33번 사물함.'] },
  { id: 'class-organ', room: 'class', requires: ['class-locker'], answer: 'C-E-G-E-C', rewardItem: 'chalk',
    hints: ['악보를 풍금 앞에서 펼쳐보자.', '도-미-솔-미-도 순서로 건반을 눌러.'] },
  { id: 'class-board', room: 'class', requires: ['class-organ'], requiresItem: 'chalk', rewardItem: 'diary',
    hints: ['칠판에 희미하게 뭔가 적혀 있던 자국이.', '분필로 칠판을 문질러봐. (화분 아래도 확인!)'] },
  { id: 'class-final', room: 'class', requires: ['class-board'], answer: '2002',
    hints: ['교환일기에 비밀번호 힌트가 있다.', '"졸업하는 해" — 2002를 입력해.'] },
  // 방 3 — 문방구
  { id: 'store-snacks', room: 'store', requires: [], rewardItem: 'coin-100', answer: '100+150+50',
    hints: ['쪽지: "300원어치 골라줘".', '아폴로(100)+쫀드기(150)+캐러멜(50)을 골라.'] },
  { id: 'store-arcade', room: 'store', requires: ['store-snacks'], requiresItem: 'coin-100',
    hints: ['오락기가 동전을 기다린다.', '100원을 넣고 두더지 5마리를 잡아!'] },
  { id: 'store-paperdoll', room: 'store', requires: ['store-arcade'], answer: '24', rewardItem: 'coin-gacha',
    hints: ['오락기 화면의 코드는 페이지 번호다.', '종이인형 책 24쪽을 펼쳐.'] },
  { id: 'store-final', room: 'store', requires: ['store-paperdoll'], requiresItem: 'coin-gacha',
    hints: ['이제 마지막 하나.', '뽑기 기계에 동전을 넣고 돌려!'] },
];

export const ROOM_ORDER: RoomId[] = ['home', 'class', 'store'];
export const FINAL_PUZZLE: Record<string, string> = { home: 'home-final', class: 'class-final', store: 'store-final' };

export function getPuzzle(id: string): Puzzle {
  const p = PUZZLES.find((p) => p.id === id);
  if (!p) throw new Error(`unknown puzzle: ${id}`);
  return p;
}
```
(방 3 퍼즐은 4단계 + 진열대가 동전을 직접 보상하도록 단순화 — 돼지저금통 단계를 진열대 보상에 합침. 총 14개.)

- [ ] **Step 3:** 실패하는 테스트 작성 `tests/puzzles.test.ts`

```ts
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
```

- [ ] **Step 4:** `npm test` → 파일 없을 때 FAIL 확인 → 구현 후 PASS 확인
- [ ] **Step 5:** Commit: `git commit -m "feat: 퍼즐 데이터 및 타입 정의"`

---

### Task 3: 게임 상태 리듀서

**Files:** Create: `lib/gameState.ts` / Test: `tests/gameState.test.ts`

- [ ] **Step 1:** 실패하는 테스트 작성 `tests/gameState.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { initialState, reducer, canAttempt } from '@/lib/gameState';

describe('gameState', () => {
  it('초기 상태는 다락방, 빈 인벤토리', () => {
    expect(initialState.room).toBe('attic');
    expect(initialState.inventory).toEqual([]);
    expect(initialState.solved).toEqual([]);
  });

  it('선행 퍼즐이 안 풀리면 시도 불가', () => {
    expect(canAttempt(initialState, 'home-phone')).toBe(false);
    const s = reducer(initialState, { type: 'SOLVE', puzzleId: 'home-calendar' });
    expect(canAttempt(s, 'home-phone')).toBe(true);
  });

  it('SOLVE 시 보상 아이템이 인벤토리에 들어간다', () => {
    const s = reducer(initialState, { type: 'SOLVE', puzzleId: 'home-calendar' });
    expect(s.solved).toContain('home-calendar');
    expect(s.inventory).toContain('memo-anniversary');
  });

  it('정답 검사: ATTEMPT는 맞으면 SOLVE, 틀리면 무변화 + lastResult=wrong', () => {
    let s = reducer(initialState, { type: 'SOLVE', puzzleId: 'home-calendar' });
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'home-phone', answer: '1234' });
    expect(s.solved).not.toContain('home-phone');
    expect(s.lastResult).toBe('wrong');
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'home-phone', answer: '0508' });
    expect(s.solved).toContain('home-phone');
    expect(s.lastResult).toBe('correct');
  });

  it('requiresItem이 인벤토리에 없으면 시도 불가', () => {
    expect(canAttempt(initialState, 'home-sewingbox')).toBe(false);
    const s = reducer(initialState, { type: 'PICKUP', itemId: 'backscratcher' });
    expect(canAttempt(s, 'home-sewingbox')).toBe(true);
  });

  it('최종 퍼즐 SOLVE 시 기억 조각 획득 + 다락방 복귀', () => {
    let s = { ...initialState, room: 'home' as const,
      solved: ['home-calendar', 'home-phone', 'home-tv', 'home-sewingbox'],
      inventory: ['sewingbox-key' as const] };
    s = reducer(s, { type: 'ATTEMPT', puzzleId: 'home-final', answer: '1987' });
    expect(s.memoryShards).toContain('home');
    expect(s.room).toBe('attic');
  });

  it('기억 조각 3개면 phase=epilogue', () => {
    let s = { ...initialState, memoryShards: ['home', 'class'] as const[] , room: 'store' as const,
      solved: ['store-snacks','store-arcade','store-paperdoll'], inventory: ['coin-gacha' as const] };
    s = reducer(s as any, { type: 'ATTEMPT', puzzleId: 'store-final', answer: '' });
    expect(s.phase).toBe('epilogue');
  });
});
```

- [ ] **Step 2:** `npm test` → FAIL 확인
- [ ] **Step 3:** `lib/gameState.ts` 구현

```ts
import { RoomId, ItemId } from './types';
import { getPuzzle, FINAL_PUZZLE } from './puzzles';

export type Phase = 'title' | 'prologue' | 'playing' | 'memory' | 'epilogue';

export interface GameState {
  phase: Phase;
  room: RoomId;
  solved: string[];
  inventory: ItemId[];
  memoryShards: RoomId[];          // 'home' | 'class' | 'store'
  selectedItem: ItemId | null;     // 인벤토리에서 선택 중인 아이템
  lastResult: 'correct' | 'wrong' | null;
  hintsUsed: Record<string, number>; // puzzleId -> 0|1|2
}

export const initialState: GameState = {
  phase: 'title', room: 'attic', solved: [], inventory: [],
  memoryShards: [], selectedItem: null, lastResult: null, hintsUsed: {},
};

export type Action =
  | { type: 'START'; resume?: GameState }
  | { type: 'ENTER_ROOM'; room: RoomId }
  | { type: 'PICKUP'; itemId: ItemId }
  | { type: 'SELECT_ITEM'; itemId: ItemId | null }
  | { type: 'ATTEMPT'; puzzleId: string; answer: string }
  | { type: 'SOLVE'; puzzleId: string }
  | { type: 'USE_HINT'; puzzleId: string }
  | { type: 'MEMORY_DONE' }
  | { type: 'RESET' };

export function canAttempt(s: GameState, puzzleId: string): boolean {
  const p = getPuzzle(puzzleId);
  if (s.solved.includes(puzzleId)) return false;
  if (!p.requires.every((r) => s.solved.includes(r))) return false;
  if (p.requiresItem && !s.inventory.includes(p.requiresItem)) return false;
  return true;
}

function applySolve(s: GameState, puzzleId: string): GameState {
  const p = getPuzzle(puzzleId);
  let next: GameState = {
    ...s,
    solved: [...s.solved, puzzleId],
    inventory: p.rewardItem && !s.inventory.includes(p.rewardItem)
      ? [...s.inventory, p.rewardItem] : s.inventory,
    selectedItem: null,
    lastResult: 'correct',
  };
  // 최종 퍼즐 → 기억 조각 + 다락방 복귀(연출은 phase: 'memory'로)
  if (FINAL_PUZZLE[p.room] === puzzleId) {
    const shards = [...next.memoryShards, p.room];
    next = { ...next, memoryShards: shards, room: 'attic',
      phase: shards.length >= 3 ? 'epilogue' : 'memory' };
  }
  return next;
}

export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'START': return a.resume ?? { ...initialState, phase: 'prologue' };
    case 'ENTER_ROOM': return { ...s, room: a.room, phase: 'playing', lastResult: null };
    case 'PICKUP':
      return s.inventory.includes(a.itemId) ? s : { ...s, inventory: [...s.inventory, a.itemId] };
    case 'SELECT_ITEM': return { ...s, selectedItem: a.itemId };
    case 'SOLVE': return applySolve(s, a.puzzleId);
    case 'ATTEMPT': {
      if (!canAttempt(s, a.puzzleId)) return s;
      const p = getPuzzle(a.puzzleId);
      if (p.answer !== undefined && p.answer !== a.answer)
        return { ...s, lastResult: 'wrong' };
      return applySolve(s, a.puzzleId);
    }
    case 'USE_HINT': {
      const used = s.hintsUsed[a.puzzleId] ?? 0;
      return used >= 2 ? s : { ...s, hintsUsed: { ...s.hintsUsed, [a.puzzleId]: used + 1 } };
    }
    case 'MEMORY_DONE': return { ...s, phase: 'playing', room: 'attic' };
    case 'RESET': return { ...initialState, phase: 'prologue' };
    default: return s;
  }
}
```

- [ ] **Step 4:** `npm test` → PASS 확인 (테스트의 타입 단언 부분은 구현 타입에 맞게 조정 가능)
- [ ] **Step 5:** Commit: `git commit -m "feat: 게임 상태 리듀서"`

---

### Task 4: 저장/불러오기 (localStorage)

**Files:** Create: `lib/save.ts` / Test: `tests/save.test.ts`

- [ ] **Step 1:** 실패하는 테스트 작성 `tests/save.test.ts` — localStorage 모킹

```ts
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
```

- [ ] **Step 2:** FAIL 확인 → `lib/save.ts` 구현

```ts
import { GameState } from './gameState';

const KEY = 'memory-box-save';

export function saveGame(s: GameState): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 사파리 프라이빗 등 */ }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (typeof s !== 'object' || !Array.isArray(s.solved)) return null;
    return s as GameState;
  } catch { return null; }
}

export function clearSave(): void {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
```

- [ ] **Step 3:** `npm test` → PASS → Commit: `git commit -m "feat: localStorage 저장/불러오기"`

---

### Task 5: 사운드 엔진 (Web Audio 합성)

**Files:** Create: `lib/audio.ts` (브라우저 전용 — 단위 테스트 없음, 수동 검증)

- [ ] **Step 1:** `lib/audio.ts` 구현. 공개 API:

```ts
export type Sfx = 'click' | 'pickup' | 'correct' | 'wrong' | 'door' | 'shard';
export function initAudio(): void;          // 첫 사용자 제스처에서 호출 (AudioContext resume)
export function playSfx(name: Sfx): void;
export function playBgm(room: 'attic' | 'home' | 'class' | 'store'): void; // 루프 멜로디 교체
export function stopBgm(): void;
export function setMuted(m: boolean): void;
export function isMuted(): boolean;
```

구현 지침:
- 모듈 스코프에 단일 `AudioContext` (lazy 생성, `typeof window === 'undefined'`면 모두 no-op).
- **효과음**: OscillatorNode + GainNode 엔벨로프. click=짧은 사인 880Hz 50ms, correct=차임(1318→1568Hz 화음 300ms), wrong=낮은 톱니 150Hz 200ms, pickup=상승 글리산도, shard=긴 잔향 화음(여러 오실레이터 + 느린 감쇠), door=저음 노이즈성 둔탁음.
- **BGM**: 방별 8~16음 멜로디 배열(`{note, dur}`)을 `setInterval` 기반 스케줄러가 아닌 **AudioContext 시간 기반 lookahead 스케줄링**으로 루프 재생. 음색은 사인+약한 배음, 볼륨 0.08 수준으로 잔잔하게. 멜로디 예: home=섬집아기풍 단조 멜로디, class=학교종 변주, store=경쾌한 5음계, attic=느린 아르페지오.
- mute는 마스터 GainNode 0으로.

- [ ] **Step 2:** 수동 검증 — Task 7 이후 게임 화면에서 클릭 시 소리 확인
- [ ] **Step 3:** `npm run build` 통과 확인 (SSR에서 window 참조 에러 없어야 함) → Commit: `git commit -m "feat: Web Audio 사운드 엔진"`

---

### Task 6: 인터랙션 효과 유틸 (마이크로 인터랙션)

**Files:** Create: `lib/effects.ts`, `app/effects.css` (globals.css에서 import)

- [ ] **Step 1:** `app/effects.css` — 스펙 §5의 효과를 CSS 클래스로:

```css
/* 클릭 가능 사물: 호버 글로우 + 확대 */
.hotspot { cursor: zoom-in; transition: transform .15s ease, filter .15s ease; }
.hotspot:hover { transform: scale(1.03); filter: drop-shadow(0 0 6px rgba(255,200,90,.9)); }
/* 정답 펄스 (화면 오버레이) */
@keyframes pulse-warm { from { opacity: .55; } to { opacity: 0; } }
.pulse-warm { position: fixed; inset: 0; pointer-events: none; z-index: 50;
  background: radial-gradient(circle, rgba(255,220,150,.8), transparent 70%);
  animation: pulse-warm .7s ease-out forwards; }
/* 오답 도리도리 */
@keyframes shake-x { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
.shake { animation: shake-x .3s ease-in-out 2; }
/* 사물 바운스 (클릭 시) */
@keyframes squash { 0%{transform:scale(1)} 35%{transform:scale(1.08,.94)} 70%{transform:scale(.97,1.04)} 100%{transform:scale(1)} }
.bounce { animation: squash .35s ease-out; }
/* 빛 입자 (기억 조각) */
@keyframes float-up { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-60vh); opacity: 0; } }
.light-particle { position: fixed; bottom: 10vh; width: 8px; height: 8px; border-radius: 50%;
  background: #ffe9a8; box-shadow: 0 0 12px #ffd24a; pointer-events: none; z-index: 60;
  animation: float-up 2.5s ease-out forwards; }
/* 방 전환 물결 페이드 */
@keyframes wave-fade { 0%{opacity:0; filter:blur(0)} 50%{opacity:1; filter:blur(2px)} 100%{opacity:0; filter:blur(0)} }
.room-transition { position: fixed; inset: 0; z-index: 70; background:#1a1410; animation: wave-fade 1.2s ease-in-out forwards; }
/* 클릭 리플 파티클 */
@keyframes sparkle { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.6); opacity: 0; } }
.sparkle { position: fixed; width: 24px; height: 24px; margin: -12px; border-radius: 50%;
  border: 2px solid #ffd24a; pointer-events: none; z-index: 55; animation: sparkle .45s ease-out forwards; }
```

- [ ] **Step 2:** `lib/effects.ts` — DOM 헬퍼 (클라이언트 전용):

```ts
function spawn(className: string, x?: number, y?: number, ttl = 3000) {
  const el = document.createElement('div');
  el.className = className;
  if (x !== undefined) { el.style.left = `${x}px`; el.style.top = `${y}px`; }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ttl);
}
export const fx = {
  sparkleAt: (x: number, y: number) => spawn('sparkle', x, y, 500),
  correctPulse: () => spawn('pulse-warm', undefined, undefined, 800),
  roomTransition: () => spawn('room-transition', undefined, undefined, 1300),
  shardParticles: () => {
    for (let i = 0; i < 24; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'light-particle';
        el.style.left = `${Math.random() * 100}vw`;
        el.style.animationDuration = `${2 + Math.random() * 2}s`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4500);
      }, i * 80);
    }
  },
};
```

- [ ] **Step 3:** `npm run build` 통과 → Commit: `git commit -m "feat: 마이크로 인터랙션 효과"`

---

### Task 7: 게임 셸 (상단바 + 인벤토리 + 내레이션 + 힌트)

**Files:** Create: `components/GameShell.tsx`, `components/Inventory.tsx`, `components/HintModal.tsx`, `components/Narration.tsx`, `lib/GameContext.tsx` / Modify: `app/page.tsx`, `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1:** `lib/GameContext.tsx` — `useReducer(reducer, initialState)` + Context Provider. 상태 변경 시 `useEffect`로 `saveGame(state)` 호출 (phase가 'title'이 아닐 때만). `dispatch`를 감싸 효과/사운드 트리거:

```tsx
'use client';
import { createContext, useContext, useEffect, useReducer, useCallback, ReactNode } from 'react';
import { reducer, initialState, GameState, Action } from './gameState';
import { saveGame } from './save';
import { playSfx, initAudio } from './audio';
import { fx } from './effects';

const Ctx = createContext<{ state: GameState; dispatch: (a: Action) => void } | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, initialState);
  const dispatch = useCallback((a: Action) => {
    initAudio();
    rawDispatch(a);
  }, []);
  useEffect(() => { if (state.phase !== 'title') saveGame(state); }, [state]);
  useEffect(() => {
    if (state.lastResult === 'correct') { playSfx('correct'); fx.correctPulse(); }
    if (state.lastResult === 'wrong') playSfx('wrong');
  }, [state.lastResult, state.solved.length]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}
export function useGame() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGame outside provider');
  return v;
}
```

- [ ] **Step 2:** `components/Inventory.tsx` — 하단 고정 바. `state.inventory`를 6칸 그리드로, 클릭 시 `SELECT_ITEM` 토글(선택된 칸은 금색 테두리), 아이템 길게 보기(클릭 시 하단에 `desc` 표시).
- [ ] **Step 3:** `components/HintModal.tsx` — 현재 방에서 `canAttempt`가 true인 퍼즐 중 첫 번째를 대상으로, `USE_HINT` 디스패치 후 `hintsUsed[p.id]` 단계의 힌트 텍스트 표시. 모달은 반투명 오버레이 + 카드.
- [ ] **Step 4:** `components/Narration.tsx` — `text: string | null`을 받아 하단 반투명 박스로 표시, 클릭하면 onDone. (장면들이 조사 텍스트를 띄울 때 사용)
- [ ] **Step 5:** `components/GameShell.tsx` — 상단바(방 이름, 💡힌트, 🔊음소거 토글, ⚙️처음부터=확인 후 `clearSave()`+`RESET`), 가운데 장면 슬롯(children), 하단 인벤토리. 배경색 `#1a1410`, 장면은 `max-width: 960px` 중앙 정렬, `aspect-ratio: 2/1` 유지. 모바일(<640px)에서는 장면 컨테이너 `overflow-x: auto`로 좌우 패닝.
- [ ] **Step 6:** `app/page.tsx` — `'use client'`, GameProvider로 감싸고 phase에 따라 타이틀/장면 분기 (장면은 Task 8~11에서 추가, 일단 placeholder div). 타이틀 화면: 제목 「기억의 상자」 + "처음부터" / 저장 있으면 "이어하기" 버튼(`loadGame()` → `START {resume}`).
- [ ] **Step 7:** `npm run dev`로 타이틀 → 빈 장면 진입, 인벤토리/힌트/음소거 동작 확인. `npm run build` 통과.
- [ ] **Step 8:** Commit: `git commit -m "feat: 게임 셸 (상단바/인벤토리/힌트/내레이션)"`

---

### Task 8: 다락방 장면 (프롤로그)

**Files:** Create: `components/scenes/Attic.tsx` / Modify: `app/page.tsx`

- [ ] **Step 1:** SVG 장면 작화 (viewBox `0 0 800 400`, 플랫 일러스트, 스펙 §1 팔레트 — 따뜻한 갈색/크림 톤). 구성: 어둑한 다락, 창으로 비치는 빛줄기, 가운데 낡은 종이 상자. 상자 클릭 → 열리며 물건 3개 표시.
- [ ] **Step 2:** 물건 클릭 규칙: `memoryShards`에 없는 방의 물건만 활성화하되 **순서 고정** — 사진(home) → 필통(class) → 캡슐(store). 이전 방을 클리어해야 다음 물건이 빛남. 활성 물건은 `.hotspot` 클래스, 비활성은 회색 처리 + 클릭 시 내레이션("아직은 손이 가지 않는다...").
- [ ] **Step 3:** 물건 클릭 시: `fx.roomTransition()` + `playSfx('door')` 후 600ms 뒤 `ENTER_ROOM` 디스패치, `playBgm(room)` 호출.
- [ ] **Step 4:** 프롤로그 내레이션 시퀀스(처음 1회): "이삿짐을 정리하다 다락에서 낡은 상자를 발견했다." → 클릭 → "상자 안에는 어릴 적 물건들이 잠들어 있었다." (Narration 컴포넌트 재사용)
- [ ] **Step 5:** 수동 검증: 타이틀 → 프롤로그 → 사진 클릭 → 방 전환 연출 확인 → Commit: `git commit -m "feat: 다락방 프롤로그 장면"`

---

### Task 9: 방 1 — 안방 장면

**Files:** Create: `components/scenes/Room1Home.tsx`, `components/Keypad.tsx`(공용 숫자 입력) / Modify: `app/page.tsx`

- [ ] **Step 1:** `components/Keypad.tsx` — 공용 입력 모달: `{ title, length, onSubmit(answer) }`. 다이얼/자물쇠/채널 입력에 재사용. 0~9 버튼 + 지우기 + 확인, 터치 영역 48px.
- [ ] **Step 2:** SVG 장면 작화 (viewBox `0 0 800 400`): 장판 바닥, 자개장(+서랍), 브라운관 TV(다리 달린), 다이얼 전화기, 벽걸이 달력, 장롱(위에 반짇고리 살짝 보임), 구석에 효자손. 각 사물은 `<g className="hotspot" onClick=...>`.
- [ ] **Step 3:** 사물별 인터랙션 연결 (모두 `useGame()`의 state/dispatch 사용):
  - **달력** 클릭 → 확대 뷰(동그라미 5월 8일) + `SOLVE home-calendar` (1회) → 메모 아이템이 인벤토리로 날아가는 연출(`playSfx('pickup')`)
  - **효자손** 클릭 → `PICKUP backscratcher`
  - **전화기** 클릭 → `canAttempt('home-phone')`이면 Keypad(4자리) → `ATTEMPT home-phone`. 정답 시 내레이션 "수화기 너머: ...TV를 켜보렴."
  - **장롱 위 반짇고리**: selectedItem이 backscratcher일 때 클릭 → `ATTEMPT home-sewingbox`(answer 없음 → 즉시 해결) → 열쇠 획득. 아니면 내레이션 "손이 닿지 않는다."
  - **TV**: `canAttempt('home-tv')`이면 채널 Keypad(1자리) → 정답 시 TV 화면에 "1987" 표시 (solved 후엔 항상 표시)
  - **자개장**: selectedItem이 sewingbox-key이고 `canAttempt('home-final')`이면 Keypad(4자리) → `ATTEMPT home-final` → 성공 시 `fx.shardParticles()` + `playSfx('shard')` + phase가 'memory'로
- [ ] **Step 4:** 잠긴 사물 클릭 시(선행 미충족) 각각 분위기 있는 내레이션 1줄 표시 (예: TV → "지직... 아무것도 나오지 않는다.")
- [ ] **Step 5:** 수동 검증: 방 1 전체 플레이스루 (정답/오답/힌트/아이템 사용) → Commit: `git commit -m "feat: 방 1 안방 장면과 퍼즐"`

---

### Task 10: 기억 조각 연출 (MemoryScene)

**Files:** Create: `components/MemoryScene.tsx` / Modify: `app/page.tsx`

- [ ] **Step 1:** phase === 'memory'일 때 풀스크린 연출: 어두운 배경 위 세피아 톤 회상 SVG 일러스트 + 내레이션 3줄이 순서대로 페이드인. 방별 콘텐츠:
  - home: 엄마가 이불을 덮어주는 실루엣 / "그날 밤, 엄마의 자장가는 세상에서 제일 따뜻했다."
  - class: 두 아이가 새끼손가락 거는 실루엣 / "꼭 다시 만나자던 약속, 우리는 정말 어른이 되었을까."
  - store: 뽑기 기계 앞에 쪼그려 앉은 아이 / "백 원이면 충분했던, 그 시절의 행복."
- [ ] **Step 2:** 마지막 줄 후 "계속하기" 버튼 → `MEMORY_DONE` → 다락방 복귀 (`playBgm('attic')`)
- [ ] **Step 3:** 수동 검증 → Commit: `git commit -m "feat: 기억 조각 회상 연출"`

---

### Task 11: 방 2 — 교실 장면

**Files:** Create: `components/scenes/Room2Class.tsx` / Modify: `app/page.tsx`

- [ ] **Step 1:** SVG 작화: 녹색 칠판(희미한 자국), 시간표(수요일 3교시 칸 색칠), 사물함 벽(번호 그리드), 풍금(건반 7개 클릭 가능), 교탁(서랍), 창가 화분.
- [ ] **Step 2:** 인터랙션:
  - **시간표** 클릭 → 확대 뷰 → `SOLVE class-timetable`
  - **사물함**: Keypad(2자리) → `ATTEMPT class-locker` (33) → 악보 획득
  - **풍금**: 악보 보유 시 건반 클릭마다 해당 음 재생(`audio.ts`에 `playNote(freq)` 헬퍼 추가), 입력 시퀀스가 `C-E-G-E-C`와 일치하면 `ATTEMPT class-organ` 정답 디스패치(컴포넌트에서 시퀀스 조립). 틀린 음 누르면 시퀀스 리셋 + 가벼운 wrong 사운드.
  - **칠판**: selectedItem이 chalk일 때 클릭 → 문지르는 애니메이션(글씨 점차 드러남) → `ATTEMPT class-board` → 내레이션 "교환일기는 화분 아래에" → **화분** 클릭 활성화 → diary 획득(보상은 class-board의 rewardItem)
  - **교탁 서랍**: Keypad(4자리) → `ATTEMPT class-final` (2002) → 기억 조각 연출
- [ ] **Step 3:** 수동 검증: 방 2 전체 플레이스루 → Commit: `git commit -m "feat: 방 2 교실 장면과 퍼즐"`

---

### Task 12: 방 3 — 문방구 장면 (+두더지 미니게임)

**Files:** Create: `components/scenes/Room3Store.tsx`, `components/Whackamole.tsx` / Modify: `app/page.tsx`

- [ ] **Step 1:** SVG 작화: 알록달록 진열대(과자들 + 가격표), 오락기, 종이인형 책 더미, 뽑기 기계, "300원어치 골라줘" 쪽지.
- [ ] **Step 2:** **진열대 퍼즐**: 과자 6종(아폴로 100 / 쫀드기 150 / 캐러멜 50 / 라면땅 200 / 쥐포 250 / 껌 30) 클릭으로 장바구니 토글, 합계 표시. "주인 할머니께 드리기" 버튼 → 합계가 300이고 구성이 {아폴로,쫀드기,캐러멜}이면 `ATTEMPT store-snacks` 정답("100+150+50" 문자열로 디스패치) → 100원 획득. 합계만 300이고 구성이 다르면 "음... 쪽지에 적힌 게 아닌데?" 내레이션.
  - 단순화 허용: 구성 검사 대신 합계 300 + 3개면 정답으로 해도 됨 — 구현 시 한 가지로 확정하고 힌트 텍스트와 일치시킬 것.
- [ ] **Step 3:** `components/Whackamole.tsx` — 3×3 구멍, 800ms 간격으로 랜덤 두더지 출현(700ms 후 숨음), 탭하면 잡힘(+bounce, 효과음). 5마리 잡으면 `onClear()`. 오락기에 coin-100 사용 시 모달로 표시, 클리어 시 오락기 화면에 "CODE: 24" 표시 + `SOLVE store-arcade`.
- [ ] **Step 4:** **종이인형 책**: Keypad(2자리) → `ATTEMPT store-paperdoll` (24) → 뽑기 동전 획득. **뽑기 기계**: selectedItem이 coin-gacha면 클릭 → 손잡이 돌아가는 애니메이션 + 캡슐 떨어짐 → `ATTEMPT store-final` → 기억 조각 3 → phase='epilogue'.
- [ ] **Step 5:** 수동 검증: 방 3 전체 플레이스루 → Commit: `git commit -m "feat: 방 3 문방구 장면과 두더지 미니게임"`

---

### Task 13: 에필로그 + 엔딩

**Files:** Create: `components/Epilogue.tsx` / Modify: `app/page.tsx`

- [ ] **Step 1:** phase === 'epilogue': 다락방 배경에서 상자 속 기억 조각 3개가 떠올라 하나의 빛으로 합쳐지는 SVG 애니메이션 + `fx.shardParticles()` + 잔잔한 attic BGM.
- [ ] **Step 2:** 엔딩 내레이션 (페이드인 순차): "방을 탈출한 게 아니었다." → "잊고 있던 나를, 다시 만난 것이었다." → "상자를 닫으며, 나는 조금 울었다. 그리고 웃었다." → 타이틀로 돌아가기 버튼(엔딩 후 `clearSave()`).
- [ ] **Step 3:** 수동 검증: 풀 플레이스루(프롤로그→엔딩) → Commit: `git commit -m "feat: 에필로그 엔딩"`

---

### Task 14: 반응형/모바일 마감 + 전체 검증

**Files:** Modify: `app/globals.css`, 각 장면 (필요 시)

- [ ] **Step 1:** 모바일 점검 (DevTools 390×844): 모든 hotspot 터치 영역 ≥44px (작은 사물은 투명 히트박스 `<rect>` 추가), 인벤토리/키패드 조작성, 장면 좌우 패닝.
- [ ] **Step 2:** 모바일 호버 대응: 터치 디바이스에서 첫 탭 = 사물 이름 툴팁 + 글로우(상태로 관리), 같은 사물 두 번째 탭 = 조사 실행. (`window.matchMedia('(hover: none)')`로 분기)
- [ ] **Step 3:** `npm test` 전체 PASS + `npm run build` 성공 확인.
- [ ] **Step 4:** 풀 플레이스루 2회 (데스크톱/모바일 뷰포트) — 힌트만으로 클리어 가능한지, 이어하기 정상 동작(중간에 새로고침) 확인.
- [ ] **Step 5:** Commit: `git commit -m "polish: 반응형 마감 및 전체 검증"`

---

### Task 15: Vercel 배포

- [ ] **Step 1:** `npx vercel` 로그인/연결 (사용자 계정 필요 — 대화형이므로 사용자에게 안내) 또는 GitHub 저장소 푸시 후 Vercel 대시보드 연동.
- [ ] **Step 2:** `npx vercel --prod` 배포, 발급된 URL에서 풀 플레이스루 1회.
- [ ] **Step 3:** Commit & 최종 정리: README.md에 게임 소개 + 플레이 URL 기재. `git commit -m "docs: README 및 배포"`

---

## Self-Review 결과

- 스펙 §3의 "돼지저금통" 단계는 진열대 퍼즐 보상으로 통합 (방 3은 4퍼즐) — 플레이 흐름 동일, 스펙 대비 의도적 단순화.
- 타입/액션 이름은 Task 2~3에서 정의한 것을 이후 태스크가 그대로 참조 (`ATTEMPT`/`SOLVE`/`PICKUP`/`SELECT_ITEM`, `canAttempt`).
- 장면 작화(SVG)는 코드 전문 대신 구성·팔레트·인터랙션 명세로 정의 — 작화는 구현 시 재량, 인터랙션·정답·연출은 본 계획과 스펙을 따른다.
