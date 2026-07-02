# Episode 2 「궤짝 속 여름」 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 다락방 궤짝에서 진입하는 추리 방탈출 에피소드 2 (과거/현재 시점 전환, 진실 조각 5개, 타임라인 재구성 엔딩)를 기존 게임에 추가한다.

**Architecture:** 리듀서를 EpisodeConfig 주입형 팩토리로 일반화(본편 동작 불변). ep2는 자체 퍼즐 데이터·저장 키·장면 세트를 갖고, 시점(era) 플래그로 과거/현재를 분기 렌더링한다.

**Tech Stack:** 기존과 동일 (Next.js 16 + TS + Vitest, Web Audio, SVG). 외부 라이브러리 없음.

**스펙:** `docs/superpowers/specs/2026-07-02-ep2-summer-in-the-chest-design.md` — 퍼즐 표(§5)의 단서→추론→답이 원본. 장면 구현 시 반드시 대조할 것.

---

### Task 1: 에피소드 일반화 리팩터링 (본편 회귀 없이)

**Files:** Create `lib/episode.ts` / Modify `lib/gameState.ts`, `lib/types.ts`, `lib/save.ts` / Test: 기존 18개 전부 통과 + `tests/episode.test.ts`

- [ ] **Step 1:** `lib/types.ts` — `RoomId`에 ep2 방 추가가 아니라, 상태의 방 표현을 문자열로 일반화:
```ts
export type RoomId = 'attic' | 'home' | 'class' | 'store';           // ep1 (기존 유지)
export type Ep2RoomId = 'ep2-attic' | 'sarangbang' | 'anbang' | 'heotgan' | 'reservoir';
export type AnyRoomId = RoomId | Ep2RoomId;
export type Era = 'past' | 'present';
```
`Puzzle`에 선택 필드 추가: `era?: Era;` (지정 시 해당 시점에서만 canAttempt 통과)

- [ ] **Step 2:** `lib/episode.ts`:
```ts
import { Puzzle, Item, AnyRoomId } from './types';
export interface EpisodeConfig {
  id: 'ep1' | 'ep2';
  saveKey: string;
  puzzles: Puzzle[];
  items: Record<string, Item>;
  /** 방별 최종 퍼즐 (풀면 기억 조각/진행). ep2는 reservoir→ep2-timeline 하나 */
  finalPuzzles: Record<string, string>;
  /** 이 개수의 조각(=finalPuzzles 해결 수)이 모이면 phase='epilogue' */
  epilogueAt: number;
  /** 최종 퍼즐 해결 후 복귀할 허브 방 */
  hubRoom: AnyRoomId;
}
```

- [ ] **Step 3:** `lib/gameState.ts` — 팩토리로 변환하되 기존 export 유지:
  - `GameState`: `room: AnyRoomId`, 새 필드 `era: Era` (initialState는 'present'), 나머지 동일
  - `Action`에 `{ type: 'TOGGLE_ERA' }` 추가
  - `createGameReducer(config: EpisodeConfig)` 팩토리: 내부에서 config.puzzles 기반 `getPuzzle`, config.finalPuzzles/epilogueAt/hubRoom 사용. `canAttempt(config, s, id)`도 config 주입형으로 변경하고 era 검사 추가: `if (p.era && p.era !== s.era) return false;`
  - **호환 export**: `EP1_CONFIG`(puzzles.ts 기반, saveKey 'memory-box-save', finalPuzzles 기존 FINAL_PUZZLE, epilogueAt 3, hubRoom 'attic')와 `export const reducer = createGameReducer(EP1_CONFIG)`, `export const canAttempt = (s, id) => canAttemptWith(EP1_CONFIG, s, id)` — 기존 컴포넌트/테스트 수정 불필요
  - TOGGLE_ERA: `{ ...s, era: s.era === 'past' ? 'present' : 'past', lastResult: null }`

- [ ] **Step 4:** `lib/save.ts` — `saveGame(s, key = 'memory-box-save')`, `loadGame(key = ...)`, `clearSave(key = ...)` 기본 인자로 하위 호환

- [ ] **Step 5:** `tests/episode.test.ts` (신규, 먼저 작성해 FAIL 확인):
```ts
import { describe, it, expect } from 'vitest';
import { createGameReducer, initialState, canAttemptWith } from '@/lib/gameState';
import { EpisodeConfig } from '@/lib/episode';

const TEST_CONFIG: EpisodeConfig = {
  id: 'ep2', saveKey: 'test-save',
  puzzles: [
    { id: 'p-past', room: 'sarangbang', requires: [], era: 'past', hints: ['h1', 'h2'] },
    { id: 'p-final', room: 'reservoir', requires: ['p-past'], answer: 'ok', hints: ['h1', 'h2'] },
  ],
  items: {}, finalPuzzles: { reservoir: 'p-final' }, epilogueAt: 1, hubRoom: 'ep2-attic',
};
const reduce = createGameReducer(TEST_CONFIG);

describe('episode-generalized reducer', () => {
  it('era가 다르면 시도 불가, TOGGLE_ERA 후 가능', () => {
    let s = { ...initialState, room: 'sarangbang' as const, phase: 'playing' as const };
    expect(canAttemptWith(TEST_CONFIG, s, 'p-past')).toBe(false); // present
    s = reduce(s, { type: 'TOGGLE_ERA' });
    expect(s.era).toBe('past');
    expect(canAttemptWith(TEST_CONFIG, s, 'p-past')).toBe(true);
  });
  it('epilogueAt=1이면 최종 퍼즐 하나로 epilogue', () => {
    let s = { ...initialState, room: 'reservoir' as const, phase: 'playing' as const,
      solved: ['p-past'], era: 'present' as const };
    s = reduce(s, { type: 'ATTEMPT', puzzleId: 'p-final', answer: 'ok' });
    expect(s.phase).toBe('epilogue');
    expect(s.room).toBe('ep2-attic');
  });
});
```

- [ ] **Step 6:** `npm test` — 기존 18 + 신규 전부 PASS, `npm run build` 클린
- [ ] **Step 7:** Commit `refactor: 리듀서를 에피소드 설정 주입형으로 일반화`

---

### Task 2: ep2 퍼즐 데이터

**Files:** Create `lib/puzzles-ep2.ts` / Test: `tests/puzzles-ep2.test.ts`

- [ ] **Step 1:** 스펙 §5 표를 그대로 데이터화. 아이템:
```ts
// ItemId 문자열 리터럴 (ep2 전용, types.ts ItemId와 별도 유니온으로 두거나 string 확장 — Task 1에서 Item.id를 string으로 완화)
export const EP2_ITEMS = {
  'family-photo':  { name: '흑백 가족사진', icon: '🖼️', desc: '큰집 마당. 네 식구가 웃고 있다. 뒷면: "무진년 여름"' },
  'news-clip':     { name: '신문 스크랩', icon: '📰', desc: '1978.8.16. "15일 밤 저수지에서 청년 익사… 타살 의혹". 뒷면은 라디오 편성표: 저녁종합뉴스 711kHz' },
  'pocket-watch':  { name: '멈춘 회중시계', icon: '⌚', desc: '11시 40분에 멈춰 있다. 태엽을 감으면… (사용: 시점 전환)' },
  'empty-envelope':{ name: '빈 편지봉투', icon: '✉️', desc: '"아버지께". 본문이 없다 — 어딘가에 숨겨져 있을 것이다.' },
  'matches':       { name: '성냥갑', icon: '🔥', desc: '다방 성냥. 아직 쓸 수 있다.' },
  'oil-bottle':    { name: '호롱 기름병', icon: '🛢️', desc: '등잔용 기름. 굳은 경첩에도 쓸 수 있겠다.' },
  'brass-key':     { name: '놋쇠 열쇠', icon: '🗝️', desc: '반짇고리에 있던 열쇠. 헛간 자물쇠 크기다.' },
  'ev-letter':     { name: '형의 편지', icon: '📜', desc: '진실 조각 ① — "동생을 탓하지 마세요. 그 아이 잘못이 아닙니다."' },
  'ev-note':       { name: '동생의 쪽지', icon: '📄', desc: '진실 조각 ② — "8월 15일 보름, 밤낚시. 형한테는 비밀."' },
  'ev-gear':       { name: '장비의 정황', icon: '🎣', desc: '진실 조각 ③ — 낚싯대 1개와 양동이만 비어 있다. 간 사람은 한 명.' },
  'ev-watch':      { name: '시계의 증언', icon: '🕰️', desc: '진실 조각 ④ — 물때, 11:40, 새김 "아우와 함께 — 아버지가".' },
  'ev-diary':      { name: '어머니의 일기', icon: '📖', desc: '진실 조각 ⑤ — "16일 새벽. 막내가 젖어 돌아왔다. 아무에게도 말하지 않았다."' },
} as const;
```
퍼즐 (스펙 표의 answer/gating 그대로):
```ts
export const EP2_PUZZLES: Puzzle[] = [
  { id: 'ep2-calendar',   room: 'sarangbang', era: 'past',    requires: [], hints: ['벽에 걸린 것을 살펴보자.', '달력 8월 15일에 동그라미 — 아버지의 경고 메모.'] },
  { id: 'ep2-drawer',     room: 'sarangbang', era: 'present', requires: ['ep2-calendar'], answer: '0815', rewardItem: 'empty-envelope',
    hints: ['서랍 위 손글씨 "잊지 말자" — 무엇을?', '신문 기사와 달력이 가리키는 날짜, 0815.'] },
  { id: 'ep2-frame',      room: 'sarangbang', era: 'present', requires: ['ep2-drawer'], rewardItem: 'ev-letter',
    hints: ['과거와 현재, 액자의 모습이 다르다.', '기울어진 가훈 액자를 들춰보자.'] },
  { id: 'ep2-radio',      room: 'sarangbang', era: 'past',    requires: [], answer: '711', rewardItem: 'matches',
    hints: ['라디오 주파수를 어디서 알 수 있을까.', '신문 스크랩 뒷면 — 편성표에 711kHz.'] },
  { id: 'ep2-column',     room: 'anbang',     era: 'past',    requires: [], hints: ['기둥에 아이들의 흔적이 있다.', '키재기 눈금: 큰애 175, 막내 168.'] },
  { id: 'ep2-closet',     room: 'anbang',     era: 'present', requires: ['ep2-column'], answer: '175', rewardItem: 'oil-bottle',
    hints: ['자물쇠의 태그: "네가 자란 만큼".', '과거 기둥의 형의 키 — 175.'] },
  { id: 'ep2-sewingbox',  room: 'anbang',     era: 'past',    requires: ['ep2-closet'], answer: 'R-Y-B-Y', rewardItem: 'brass-key',
    hints: ['단추 잠금 — 어머니의 물건에 순서가 새겨져 있다.', '벽장 방석의 자수 꽃 색: 빨강-노랑-파랑-노랑.'] },
  { id: 'ep2-floor-creak',room: 'anbang',     era: 'past',    requires: [], hints: ['마루를 걸어보자.', '동쪽 세 번째 널만 삐걱이고, 틈새가 반짝인다.'] },
  { id: 'ep2-floorboard', room: 'anbang',     era: 'present', requires: ['ep2-floor-creak'], rewardItem: 'ev-diary',
    hints: ['과거에 삐걱이던 그 자리.', '낡아 헐거워진 널빤지를 들추자.'] },
  { id: 'ep2-shed-door',  room: 'heotgan',    era: 'past',    requires: [], requiresItem: 'brass-key',
    hints: ['헛간이 잠겨 있다.', '시골집 열쇠는 어머니의 반짇고리에.'] },
  { id: 'ep2-toolwall',   room: 'heotgan',    era: 'past',    requires: ['ep2-shed-door'], rewardItem: 'ev-gear',
    hints: ['벽의 흰 윤곽선과 걸린 도구를 비교해보자.', '낚싯대 하나와 양동이만 없다 — 간 사람은 한 명.'] },
  { id: 'ep2-toolbox',    room: 'heotgan',    era: 'present', requires: [], rewardItem: 'ev-note',
    hints: ['녹슨 도구함 — 자물쇠가 부서져 있다.', '안에 삭은 쪽지가 남아 있다.'] },
  { id: 'ep2-watch-lid',  room: 'heotgan',    requires: ['ep2-closet'], requiresItem: 'oil-bottle', rewardItem: 'ev-watch',
    hints: ['회중시계 뚜껑이 굳어 열리지 않는다.', '경첩에 기름을 쳐보자.'] },   // era 무관, 어느 방에서든 시계 조사 — room은 대표값
  { id: 'ep2-lantern',    room: 'heotgan',    era: 'past',    requires: ['ep2-radio', 'ep2-shed-door'], requiresItem: 'oil-bottle',
    hints: ['밤길에는 불이 필요하다.', '랜턴에 기름을 채우고 성냥으로 켜자.'] },
  { id: 'ep2-timeline',   room: 'reservoir',  era: 'past',    requires: ['ep2-frame','ep2-toolbox','ep2-toolwall','ep2-watch-lid','ep2-floorboard','ep2-lantern'],
    answer: '1-2-3-4-5',
    hints: ['다섯 조각을 시간 순서대로.', '다툼 → 몰래 출발 → 형이 뒤따름 → 11:40 구조 → 새벽 귀가.'] },
];
export const EP2_CONFIG: EpisodeConfig = { id: 'ep2', saveKey: 'memory-box-save-ep2',
  puzzles: EP2_PUZZLES, items: EP2_ITEMS, finalPuzzles: { reservoir: 'ep2-timeline' }, epilogueAt: 1, hubRoom: 'ep2-attic' };
```
주의: `ep2-watch-lid`의 room은 대표값이지만 **장면 구현에서는 인벤토리의 시계에 기름병을 사용하면 어느 방에서든 시도** 가능하게 한다 (canAttempt는 room을 검사하지 않으므로 데이터상 문제 없음).

- [ ] **Step 2:** `tests/puzzles-ep2.test.ts` — 본편 puzzles.test와 동일한 무결성 검사(requires 유효성, 아이템 존재, 힌트 2개) + "타임라인 퍼즐은 조각 5개 지급 퍼즐을 모두 requires에 포함한다" 검사. TDD 순서 준수.
- [ ] **Step 3:** `npm test` 전부 PASS → Commit `feat: ep2 퍼즐 데이터`

---

### Task 3: ep2 진입 배선 (허브·컨텍스트·라우팅·저장)

**Files:** Modify `lib/GameContext.tsx`, `app/page.tsx`, `components/scenes/Attic.tsx`, `components/GameShell.tsx`

- [ ] **Step 1:** `GameContext` — `GameProvider({ episode = EP1_CONFIG })`: reducer를 `useMemo(() => createGameReducer(episode))`로 생성, 저장을 `saveGame(state, episode.saveKey)`로. `useGame()`이 `episode`도 노출.
- [ ] **Step 2:** `app/page.tsx` — 최상위에 `activeEpisode: 'ep1' | 'ep2'` 로컬 상태. ep1은 기존 플로우 그대로. `ep2` 선택 시 별도 `<GameProvider episode={EP2_CONFIG}>` 트리 렌더 (컴포넌트 분리: `Ep1App`, `Ep2App`). ep2의 phase 라우팅: prologue→Ep2Prologue(다락 궤짝 연출), playing→방별 장면, epilogue→Ep2Epilogue.
- [ ] **Step 3:** `Attic.tsx` 궤짝 카드 — "Coming Soon" 대신: `loadGame('memory-box-save-ep2')` 존재 시 "이어하기", 항상 "처음부터 시작" 버튼. 클릭 → 상위로 콜백(onStartEp2) → page.tsx가 activeEpisode='ep2'로 전환. 명패 "(준비 중)" 제거, ep2 클리어 저장이 있으면 "완료" 표기.
- [ ] **Step 4:** `GameShell` — ep2일 때 방 이름 맵(사랑방/안방과 마루/헛간과 마당/저수지 가는 길/다락방), ⚙️ 메뉴에 "허브(다락방)로 나가기" 추가 (ep2 저장 유지한 채 activeEpisode='ep1' 허브 복귀). 상단바에 시점 표시 배지("1978년 여름" / "현재").
- [ ] **Step 5:** 수동 스모크: 궤짝 → ep2 시작 → 빈 장면 placeholder 확인, 허브 복귀, 이어하기. `npm run build` + 기존 테스트 PASS.
- [ ] **Step 6:** Commit `feat: ep2 진입 배선 (허브 카드·컨텍스트·라우팅·저장 분리)`

---

### Task 4: 사운드 확장

**Files:** Modify `lib/audio.ts`

- [x] **Step 1:** `playBgm`에 'ep2-past'(따뜻한 여름 오후 풍 5음계), 'ep2-present'(낮고 느린 단조 아르페지오), 'ep2-night'(낮은 드론 + 드문 벨 톤) 3곡 추가. `playSfx`에 'tick'(시계 태엽: 짧은 틱톡 2회) 추가 — 시점 전환용.
- [x] **Step 2:** 빌드/테스트 통과 → Commit `feat: ep2 BGM 3곡과 태엽 효과음`

---

### Task 5: ep2 프롤로그 + 시점 전환 공통 장치

**Files:** Create `components/scenes/ep2/Ep2Prologue.tsx`, `components/scenes/ep2/EraLayer.tsx`(공통 헬퍼) / Modify `app/page.tsx`

- [ ] **Step 1:** `Ep2Prologue` — 다락방 배경(기존 Attic SVG 요소 재사용 수준의 간단 버전)에서 궤짝 클로즈업: 내레이션 3줄(신문 발견 → 사진 → 시계) 진행하며 유품 3종 PICKUP, 마지막에 "태엽을 감아본다…" → 물결 전환 + tick 사운드 → `ENTER_ROOM sarangbang` (era 'present').
- [ ] **Step 2:** `EraLayer` 헬퍼: `useEraTint()` 훅 또는 래퍼 — era에 따라 SVG 위에 색조 오버레이(현재: 회갈색 반투명, 과거: 따뜻한 노랑 은은) + 전환 시 1s 물결 애니메이션과 tick+BGM 교체(`playBgm(era==='past' ? 'ep2-past' : 'ep2-present')`). **회중시계 사용 규칙**: 인벤토리에서 pocket-watch 선택 후 장면의 어느 곳이든 클릭 → TOGGLE_ERA (각 장면에서 공통 처리할 수 있게 헬퍼 함수 `handleWatchUse(state, dispatch): boolean` 제공 — 처리했으면 true).
- [ ] **Step 3:** 수동 스모크 + 빌드 → Commit `feat: ep2 프롤로그와 시점 전환 장치`

---

### Task 6: 사랑방 장면 (퍼즐 1~4)

**Files:** Create `components/scenes/ep2/Sarangbang.tsx`

- [ ] 스펙 §5 표 1~4행 그대로: 달력(과거 관찰→SOLVE), 서랍 Keypad 4자리 0815(현재), 가훈 액자(현재, ep2-drawer 후 기울어진 것 클릭→ev-letter, 과거엔 반듯하고 클릭 시 "반듯하게 걸린 가훈. 형우제공."), 라디오 Keypad 3자리 711(과거, 정답 시 뉴스 내레이션+matches). era 분기 렌더링(가구 동일, 톤·소품 차이: 현재는 먼지/거미줄/기울어진 액자). 이동: 장면 하단에 방 이동 버튼(사랑방⇄안방⇄헛간) — GameShell 하단 or 장면 내 문 hotspot(문 hotspot 권장, 스펙 무언급이므로 문으로 통일).
- [ ] 검증: era 전환, 퍼즐 4개 체인, 오답 shake. 빌드/테스트 → Commit `feat: ep2 사랑방 장면`

---

### Task 7: 안방과 마루 장면 (퍼즐 5~9)

**Files:** Create `components/scenes/ep2/Anbang.tsx`

- [ ] 스펙 §5 표 5~9행: 기둥 눈금(과거 관찰, 현재는 페인트로 덮여 "페인트 아래 뭔가 있다"), 벽장 Keypad 175(현재, 태그 문구 표기)→기름병+방석(방석은 획득 아님, 벽장 열린 뒤 관찰 가능, 자수 색 표시), 반짇고리 단추 4개 클릭 순서 퍼즐(과거; R-Y-B-Y 순서 맞추면 brass-key; 틀린 단추에서 리셋+wrong, 풍금 시퀀스 패턴 재사용; 본편 이스터에그 대사 "…어딘가 낯익은 반짇고리다"), 마루 삐걱(과거: 널빤지들 클릭 시 각기 다른 소리, 세 번째만 삐걱 효과음+반짝 → SOLVE ep2-floor-creak), 널빤지(현재, floor-creak 후 같은 위치 클릭 → ev-diary).
- [ ] 검증 후 Commit `feat: ep2 안방과 마루 장면`

---

### Task 8: 헛간과 마당 장면 (퍼즐 10~14) + 밤 이벤트

**Files:** Create `components/scenes/ep2/Heotgan.tsx`

- [ ] 스펙 §5 표 10~14행: 헛간 문(과거, brass-key 선택 사용), 도구 걸이 비교(과거, 입장 후: 윤곽선 하이라이트 → 빈 자리 2곳 클릭 → ev-gear), 도구함(현재, 클릭 → ev-note), 회중시계 뚜껑(시계+기름병: 인벤토리에서 기름병 선택 후 시계 슬롯 클릭… 구현은 "기름병 선택 상태에서 장면의 시계 아이콘/인벤토리 시계 클릭" 대신 **간단하게: 기름병 선택 후 아무 장면의 '회중시계를 살펴본다' hotspot(각 장면 공통 배치 불필요 — 헛간 작업대 위에 시계를 올려놓는 연출)** → 헛간에 작업대 hotspot 두고 처리), 랜턴(과거, 기름병 선택 사용 → 점화 연출).
- [ ] **밤 이벤트**: 조각 5개(ev-*) 보유 + ep2-lantern 해결 + era==='past' 상태에서 마당으로 나가면: 하늘이 남색으로, 보름달, 담을 넘는 실루엣 목격 내레이션 → "따라간다" 버튼 → `ENTER_ROOM reservoir` + playBgm('ep2-night').
- [ ] 검증 후 Commit `feat: ep2 헛간과 마당 장면, 밤 이벤트`

---

### Task 9: 저수지 최종 — 타임라인 재구성 + 회상 + 에필로그

**Files:** Create `components/scenes/ep2/Reservoir.tsx`, `components/scenes/ep2/Ep2Epilogue.tsx`

- [ ] **Reservoir**: 밤 저수지(보름달, 물결, 갈대) 배경. 물가 클릭 → 타임라인 UI: 카드 5장(각 진실 조각의 아이콘+한 줄)이 무작위 순서로 제시, 클릭으로 슬롯 1~5에 배치/회수. "이것이 그날 밤의 진실" 버튼 → 배치 순서를 '1-2-3-4-5' 형식으로 `ATTEMPT ep2-timeline`. 오답: shake + "무언가 앞뒤가 맞지 않는다". 정답: **회상 연출** — 실루엣 애니메이션(물결, 한 손이 한 손을 밀어 올림, 비노골) + 내레이션 3줄 → reducer가 epilogue로 전환.
- [ ] **Ep2Epilogue**: 현재의 다락방. 내레이션: "형은 동생을 살리고, 소문 속에 잠들었다." → 전화 연출(수화기 아이콘, 발신음): "아버지… 큰아버지 이야기, 이제 알 것 같아요." → 아버지의 짧은 답 "…그 밤 이야기를, 이제야 하는구나." → "다락방으로" 버튼: ep2 저장에 완료 플래그(클리어 상태 저장 유지), activeEpisode='ep1' 허브 복귀. 궤짝 명패 "완료" 반영(Task 3의 표기 로직 활용).
- [ ] 검증 후 Commit `feat: ep2 저수지 최종 퍼즐과 에필로그`

---

### Task 10: ep2 플레이스루 테스트 + 마감 + 배포

**Files:** Create `tests/playthrough-ep2.test.ts` / Modify 필요 파일

- [ ] **Step 1:** ep2 리듀서 풀 플레이스루 테스트: 프롤로그 아이템 → era 게이트 확인(현재에서 ep2-calendar 시도 불가) → 표 순서대로 14퍼즐 → 타임라인 오답('2-1-3-4-5') 무변화 → 정답 → epilogue. 본편 회귀 포함 전체 PASS.
- [ ] **Step 2:** 마감: ep2 장면 두 번 탭(useTwoTap) 적용, 힌트 모달이 ep2 퍼즐(era 고려: 현재 시점에서 과거 퍼즐 힌트가 첫 번째로 잡히지 않게 — canAttempt가 era를 거르므로 자동), 모바일 뷰포트 점검, README에 ep2 소개 추가.
- [ ] **Step 3:** `npm test` + `npm run build` → main 푸시(Vercel 자동 배포).
- [ ] **Step 4:** Commit `feat: Episode 2 궤짝 속 여름 완성` (마감 잔여분) + push

---

## Self-Review
- 스펙 §5 표 14퍼즐 ↔ Task 2 데이터 ↔ Task 6~8 장면 배선 1:1 대응 확인.
- 아이템 흐름: oil-bottle(6)→watch-lid(13)·lantern(14), matches(4)→lantern(14, requires ep2-radio로 게이트), brass-key(7)→shed-door(10). 순환 없음.
- ep2-timeline의 requires 6개 = 조각 5개 지급 퍼즐 + lantern. 스펙의 "조각 5 + 랜턴" 진입 조건과 일치.
- 본편 호환: Task 1에서 기존 export 시그니처 유지, 기존 18 테스트 무수정 통과가 회귀 기준.
