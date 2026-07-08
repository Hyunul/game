# EP4 「사라진 목소리」 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스펙 `docs/superpowers/specs/2026-07-08-ep4-vanished-voice-design.md`의 에피소드 4 — 테이프 되감기·재청취 메커니즘과 복선 회수형 서사(퍼즐 16+1) — 를 기존 아키텍처(EpisodeConfig 데이터 주입) 위에 구현한다.

**Architecture:** 퍼즐 로직은 순수 데이터(`lib/puzzles-ep4.ts`), 테이프 구간 해금/클린 모드는 solved 배열 파생 계산(`lib/ep4Tape.ts`, ep3TruthPair 분리 패턴). 장면은 SVG 컴포넌트, 조작형 퍼즐은 answer 문자열 규약으로 리듀서와 통신. 저장 스키마 변경 없음.

**Tech Stack:** Next.js 15 App Router, TypeScript, Vitest, Web Audio 합성 (기존 `lib/audio.ts` 확장), 인라인 스타일 + SVG (기존 컨벤션).

---

## 답 규약 (전 태스크 공통 — 반드시 이 문자열 사용)

```
ep4-belt      : 'routed'            (BeltRouting 완성 시 자동 제출)
ep4-radio     : '891'               (FrequencyDial 89.1MHz 정조준 시 자동 제출)
ep4-speed     : '33'                (SpeedSwitch 33rpm 재생 완료 시 자동 제출)
ep4-counter   : '042'               (TapeDeck 카운터 042 되감기 완료 시 자동 제출)
ep4-ring      : 'aligned'           (PatternRing 3링 정렬 시 자동 제출)
ep4-calendar  : 'matched'           (CalendarMatch 동그라미↔약봉투 3쌍 매칭 시)
ep4-jagae     : '은-방-울'          (NameLock 재사용, 음절 3개)
ep4-knock     : '장-장-단-단-장'    (KnockRhythm — 두드린 리듬 판정)
ep4-eggwall   : answer 없음 (클릭형)
ep4-eq        : 'clean'             (EqualizerBars 3밴드 정합 시 자동 제출)
ep4-rx        : '1002'              (처방전 규칙 → 진단일 10월 2일. Keypad 4자리)
ep4-splice    : '3-1-4-2-5'         (SpliceEditor 조각 접합 순서)
ep4-booth     : '2-1-3'             (부스 녹음 큐 순서 — OrderPicker 재사용)
ep4-relisten  : answer 없음 (클릭형 — 클린 모드로 042 구간 재청취)
ep4-numbers   : 'missing-35'        (NumberBoard — 빠진 나이 발견 시 자동 제출)
ep4-lasttape  : 'restored'          (F7 테이프 복원 — TapeDeck 내 진행)
ep4-final     : '035'               (TapeDeck 카운터 035 되감기 = 최종)
```

서사 고정값: 주인공 생일 **10월 4일**, 진단일 **10월 2일**(생일 이틀 전), 어머니 예명 **은방울**, 테이프 번호 = 생일 나이 `007·010·015·020·025·030·040` + 빠진 **035**(올해 나이), 노크 리듬 **장·장·단·단·장**, 라디오 주파수 **89.1**.

---

### Task 1: 타입·에피소드 프레임 확장

**Files:**
- Modify: `lib/types.ts:1-4` (Ep4RoomId 추가)
- Modify: `lib/episode.ts:4` (id 유니온)
- Modify: `components/GameShell.tsx:9-24` (ROOM_NAMES)

- [ ] **Step 1: 타입 추가**

`lib/types.ts` 1~4행을 다음으로 교체:

```ts
export type RoomId = 'attic' | 'home' | 'class' | 'store';
export type Ep2RoomId = 'ep2-attic' | 'sarangbang' | 'anbang' | 'heotgan' | 'reservoir';
export type Ep3RoomId = 'ep3-attic' | 'madang' | 'geonneonbang' | 'bueok' | 'ep3-anbang';
export type Ep4RoomId = 'ep4-attic' | 'ep4-maru' | 'ep4-anbang' | 'ep4-golbang' | 'ep4-booth';
export type AnyRoomId = RoomId | Ep2RoomId | Ep3RoomId | Ep4RoomId;
```

`lib/episode.ts`의 `id: 'ep1' | 'ep2' | 'ep3'`에 `| 'ep4'` 추가.

- [ ] **Step 2: ROOM_NAMES 추가** — `components/GameShell.tsx`의 ROOM_NAMES에:

```ts
  'ep4-attic': '다락방',
  'ep4-maru': '마루',
  'ep4-anbang': '안방',
  'ep4-golbang': '골방',
  'ep4-booth': '녹음 부스 — 회상',
```

- [ ] **Step 3: 타입체크** — Run: `npx tsc --noEmit` → 에러 0
- [ ] **Step 4: Commit** — `git commit -m "feat: ep4 방 타입·에피소드 id 확장"`

---

### Task 2: lib/ep4Tape.ts — 테이프 구간 데이터·파생 판정 (TDD)

**Files:**
- Create: `lib/ep4Tape.ts`
- Test: `tests/ep4Tape.test.ts`

테이프 구간은 **solved 배열에서 파생**: 구간 해금 = `unlockedBy` 퍼즐 solved, 클린 모드 = `ep4-eq` solved. 스크립트는 `script`(기본) + `cleanScript`(클린 모드에서 추가로 들리는 줄).

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/ep4Tape.test.ts`:

```ts
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
  it('클린 모드에서만 cleanScript 줄이 합쳐진다 (F2 회수)', () => {
    const base = segmentLines('seg-042', ['ep4-counter']);
    const clean = segmentLines('seg-042', ['ep4-counter', 'ep4-eq']);
    expect(clean.length).toBeGreaterThan(base.length);
    expect(clean.join(' ')).toContain('숨');
  });
  it('모든 구간의 unlockedBy는 비어 있지 않다', () => {
    for (const s of TAPE_SEGMENTS) expect(s.unlockedBy.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run tests/ep4Tape.test.ts` → FAIL (모듈 없음)

- [ ] **Step 3: 구현** — `lib/ep4Tape.ts`:

```ts
// ep4 「사라진 목소리」 테이프 구간 — 해금/클린 모드는 solved 배열 파생 (저장 스키마 무변경)
export interface TapeSegment {
  id: string;
  /** 데크 카운터 표시값 (세 자리 문자열) */
  counter: string;
  label: string;
  /** 이 퍼즐이 풀려 있어야 구간 재생 가능 */
  unlockedBy: string;
  /** 기본 재생 자막 (노이즈 낀 상태) */
  script: string[];
  /** 클린 모드(ep4-eq)에서 추가로 들리는 줄 — 삽입 위치는 index */
  cleanInserts?: { at: number; line: string }[];
}

export const TAPE_SEGMENTS: TapeSegment[] = [
  {
    id: 'seg-042', counter: '042', label: '자장가', unlockedBy: 'ep4-counter',
    script: [
      '…(지직)… 자장자장 우리 아가…',
      '(잔기침) …자장자장, 잘도 잔다…',
      '오늘은 여기까지 하자. …(테이프 멈추는 소리)',
    ],
    cleanInserts: [
      { at: 2, line: '(기침 사이 — 길게 멈춘 숨. 노래를 잇기까지 한참이 걸린다)' },
      { at: 3, line: '"…테이프가 모자라네. 다음 장은 더 아껴 불러야겠다."' },
    ],
  },
  {
    id: 'seg-118', counter: '118', label: '골방 이야기', unlockedBy: 'ep4-radio',
    script: [
      '"엄마 골방에 올 땐, 이렇게 두드리렴. 쿵, 쿵, 콩콩, 쿵."',
      '"장, 장, 단, 단, 장 — 우리 둘만의 신호야."',
    ],
  },
  {
    id: 'seg-audition', counter: '203', label: '오디션 녹음 (복원)', unlockedBy: 'ep4-splice',
    script: [
      '"수험번호 열넷, 은방울입니다."',
      '(맑고 또렷한 목소리 — 지금까지 들은 어떤 테이프보다 젊다)',
      '"…비 오는 날의 라디오처럼, 곁에 있는 목소리가 되고 싶습니다."',
    ],
  },
  {
    id: 'seg-last', counter: '387', label: '되감다 만 테이프', unlockedBy: 'ep4-lasttape',
    script: [
      '(테이프 끝, 갈라진 목소리) "…여기까지 남기면… 스물, 서른…"',
      '"다 못 남겨서 미안해."',
      '"나머지 노래는… 네가 불러주렴. 엄마 몫까지."',
    ],
  },
];

export function isCleanMode(solved: string[]): boolean {
  return solved.includes('ep4-eq');
}

export function isSegmentUnlocked(segId: string, solved: string[]): boolean {
  const seg = TAPE_SEGMENTS.find((s) => s.id === segId);
  return !!seg && solved.includes(seg.unlockedBy);
}

/** 현재 solved 상태에서 들리는 자막 줄 (클린 모드면 cleanInserts 병합) */
export function segmentLines(segId: string, solved: string[]): string[] {
  const seg = TAPE_SEGMENTS.find((s) => s.id === segId);
  if (!seg || !isSegmentUnlocked(segId, solved)) return [];
  if (!isCleanMode(solved) || !seg.cleanInserts) return [...seg.script];
  const lines = [...seg.script];
  // at이 큰 것부터 삽입해 인덱스 안 밀리게
  [...seg.cleanInserts].sort((a, b) => b.at - a.at).forEach((ins) => lines.splice(ins.at, 0, ins.line));
  return lines;
}
```

- [ ] **Step 4: 통과 확인** — Run: `npx vitest run tests/ep4Tape.test.ts` → PASS
- [ ] **Step 5: Commit** — `git commit -m "feat: ep4 테이프 구간 데이터·클린모드 파생 판정"`

---

### Task 3: lib/puzzles-ep4.ts — 아이템·퍼즐·EP4_CONFIG (TDD)

**Files:**
- Create: `lib/puzzles-ep4.ts`
- Test: `tests/puzzles-ep4.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/puzzles-ep4.test.ts` (기존 `tests/puzzles-ep2.test.ts`의 불변식 테스트 패턴 참고):

```ts
import { describe, it, expect } from 'vitest';
import { EP4_CONFIG, EP4_PUZZLES, EP4_ITEMS } from '../lib/puzzles-ep4';

describe('EP4_CONFIG 불변식', () => {
  it('퍼즐 17개, finalPuzzles 4방, epilogueAt 4', () => {
    expect(EP4_PUZZLES.length).toBe(17);
    expect(Object.keys(EP4_CONFIG.finalPuzzles)).toEqual(
      expect.arrayContaining(['ep4-anbang', 'ep4-golbang', 'ep4-booth', 'ep4-maru'])
    );
    expect(EP4_CONFIG.epilogueAt).toBe(4);
  });
  it('requires가 가리키는 퍼즐 id는 모두 실재한다', () => {
    const ids = new Set(EP4_PUZZLES.map((p) => p.id));
    for (const p of EP4_PUZZLES) for (const r of p.requires) expect(ids.has(r)).toBe(true);
  });
  it('reward/requires 아이템은 모두 EP4_ITEMS에 실재한다', () => {
    for (const p of EP4_PUZZLES) {
      const refs = [p.requiresItem, ...(p.requiresItems ?? []), p.rewardItem, ...(p.rewardItems ?? [])]
        .filter(Boolean) as string[];
      for (const r of refs) expect(EP4_ITEMS[r], `${p.id}의 ${r}`).toBeTruthy();
    }
  });
  it('모든 퍼즐에 힌트 2단계가 있다', () => {
    for (const p of EP4_PUZZLES) expect(p.hints.length).toBe(2);
  });
  it('골방 게이트: ep4-knock 필요, fallback은 마루', () => {
    expect(EP4_CONFIG.roomGates?.['ep4-golbang']).toEqual({ requires: ['ep4-knock'], fallback: 'ep4-maru' });
  });
  it('최종 ep4-final은 3막 회수 퍼즐(P13~P15)을 전부 선행 요구한다', () => {
    const fin = EP4_PUZZLES.find((p) => p.id === 'ep4-final')!;
    expect(fin.requires).toEqual(expect.arrayContaining(['ep4-relisten', 'ep4-numbers', 'ep4-lasttape']));
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run tests/puzzles-ep4.test.ts` → FAIL

- [ ] **Step 3: 구현** — `lib/puzzles-ep4.ts`. 파일 상단에 답 규약 주석(이 문서 상단 블록 복사). 전체 데이터:

```ts
import { Puzzle, Item } from './types';
import { EpisodeConfig } from './episode';

export const EP4_ITEMS: Record<string, Item> = {
  'postcard-pile': {
    id: 'postcard-pile', name: '사연 엽서 뭉치', icon: '📮',
    desc: '라디오 방송국으로 보내려던 엽서들. 부친 흔적은 없다.', doc: true,
    docPages: [
      '앞면 귀퉁이, 방송국 주파수가 인쇄되어 있다 — "FM 89.1, 밤의 사연".',
      '뒷면. 사연이 아니라 같은 문장의 초안이 여러 번 — "…목소리에 좋다는 병원을, 혹시 방송국에서는 알고 계신지요." 몇 번을 쓰다 그만둔 흔적.',
    ],
  },
  'note-counter': {
    id: 'note-counter', name: '메모 쪽지', icon: '📝',
    desc: '데크 옆에 붙어 있던 쪽지. "자장가는 042부터."',
  },
  'photo-audition': {
    id: 'photo-audition', name: '오디션 날 사진', icon: '📷',
    desc: '방송국 앞, 젊은 어머니. 뒷면에 날짜 — 10월의 어느 날.', doc: true,
    docPages: ['뒷면. "10월 4일. 결과 발표는 이틀 전에 들었다. 그래도 갔다." — 발표를 듣고도 간 곳, 그날은 누구의 생일이던가.'],
  },
  'pill-bag': {
    id: 'pill-bag', name: '약봉투', icon: '💊',
    desc: '이름 없는 약봉투 세 장. 날짜 도장이 찍혀 있다.', doc: true,
    docPages: ['날짜 도장: 9월 4일, 9월 18일, 9월 25일. 간격이 점점 좁아진다.'],
  },
  'rx-bundle': {
    id: 'rx-bundle', name: '처방전 묶음', icon: '📄',
    desc: '약 이름이 기호로만 적힌 처방전. 맨 위 장에 "10/2 첫 진단"이라 적을 뻔한 자리가 지우개로 지워져 있다.', doc: true,
    docPages: [
      '기호 ●는 사흘 간격, ▲는 이레 간격 복용. 첫 복용일에서 거꾸로 세면 처방일이 나온다.',
      '두 번째 장: ● 첫 복용 10월 5일. ▲ 첫 복용 10월 9일. 둘 다 같은 처방일에서 시작됐다.',
    ],
  },
  'knock-note': {
    id: 'knock-note', name: '노크 쪽지', icon: '🚪',
    desc: '자개장 속 쪽지. "골방 신호, 잊지 말 것." 리듬은 테이프 어딘가에서 들었다.',
  },
  'reel-box': {
    id: 'reel-box', name: '릴 원본 상자', icon: '🎞️',
    desc: '계란판 벽감 속 릴 테이프들. 끊어진 조각도 함께 들어 있다.',
  },
  'tape-scraps': {
    id: 'tape-scraps', name: '끊어진 테이프 조각', icon: '✂️',
    desc: '다섯 토막. 이어 붙이면 무언가 들릴 것이다.',
  },
  'audition-tape': {
    id: 'audition-tape', name: '복원된 오디션 테이프', icon: '📼',
    desc: '이어 붙인 테이프. 데크에 걸면 그날로 돌아갈 수 있을 것 같다.',
  },
  'tape-035': {
    id: 'tape-035', name: '숫자 없는 테이프', icon: '📼',
    desc: '상자 맨 아래, 라벨이 비어 있는 테이프 하나. 몇 번이어야 했을까.',
  },
};

export const EP4_PUZZLES: Puzzle[] = [
  // ── 1막: 마루 (소리 계열 S) ──
  {
    id: 'ep4-belt', room: 'ep4-maru', requires: [], answer: 'routed',
    rewardItem: 'note-counter',
    hints: ['데크 뒷판의 벨트가 끊어져 늘어져 있다. 모터와 풀리 두 개를 한 바퀴로 이어야 한다.',
      '모터 → 왼쪽 풀리 → 오른쪽 풀리 순서로, 테이프가 시계 방향으로 돌게 걸어라.'],
  },
  {
    id: 'ep4-radio', room: 'ep4-maru', requires: [], requiresItem: 'postcard-pile', answer: '891',
    hints: ['엽서 뭉치 앞면 귀퉁이에 방송국 주파수가 인쇄되어 있다.',
      '다이얼을 89.1에 정확히 맞춰라. 지직음이 걷히면 드라마 재방송이 나온다.'],
  },
  {
    id: 'ep4-postcards', room: 'ep4-maru', requires: [], rewardItem: 'postcard-pile',
    hints: ['라디오 아래 서랍이 살짝 열려 있다.', '서랍 속 엽서 뭉치를 집어라.'],
  },
  {
    id: 'ep4-speed', room: 'ep4-maru', requires: ['ep4-belt'], answer: '33',
    hints: ['전축 위 판은 45rpm인데 스위치가 이상한 자리에 가 있다.',
      '45짜리 판을 33으로 틀면 목소리가 낮게 늘어진다 — 그 속에 숨은 말이 있다. 스위치를 33에 두고 재생하라.'],
  },
  {
    id: 'ep4-counter', room: 'ep4-maru', requires: ['ep4-belt'], requiresItem: 'note-counter', answer: '042',
    hints: ['쪽지에 적힌 숫자가 데크 카운터 자리다.', '되감기 버튼으로 카운터를 042에 맞추고 재생하라.'],
  },
  // ── 1막: 안방 (문서 계열 D) ──
  {
    id: 'ep4-ring', room: 'ep4-anbang', requires: [], answer: 'aligned',
    rewardItem: 'photo-audition',
    hints: ['화장대 서랍의 자개 꽃문양이 세 링으로 어긋나 있다.',
      '꽃잎 다섯 장이 이어지도록 각 링을 돌려라. 바깥 링의 금 간 꽃잎이 기준이다.'],
  },
  {
    id: 'ep4-pillbag', room: 'ep4-anbang', requires: [], rewardItem: 'pill-bag',
    hints: ['화장대 아래, 휴지통 뒤에 무언가 구겨져 있다.', '약봉투다. 날짜 도장을 봐라.'],
  },
  {
    id: 'ep4-calendar', room: 'ep4-anbang', requires: [], requiresItem: 'pill-bag', answer: 'matched',
    hints: ['달력의 동그라미 간격이 점점 좁아진다. 오디션 일정이 이렇게 잦을까?',
      '약봉투의 날짜 도장 세 개를 달력의 동그라미에 하나씩 겹쳐 보라. 정확히 포개진다.'],
  },
  {
    id: 'ep4-jagae', room: 'ep4-anbang', requires: ['ep4-radio'], answer: '은-방-울',
    rewardItems: ['rx-bundle', 'knock-note'],
    hints: ['자개장 자물쇠는 한글 세 음절. 라디오에서 어머니를 부르던 이름이 있었다.',
      '드라마 재방송에서 들린 예명 — 은, 방, 울.'],
  },
  // ── 골방 게이트 (마루의 골방 문에서) ──
  {
    id: 'ep4-knock', room: 'ep4-maru', requires: ['ep4-speed', 'ep4-calendar', 'ep4-jagae'],
    requiresItem: 'knock-note', answer: '장-장-단-단-장',
    hints: ['쪽지는 "리듬은 테이프 어딘가에서"라 했다. 라디오를 맞춘 뒤 해금된 구간을 들어봤나?',
      '카운터 118 구간의 신호 — 길게 둘, 짧게 둘, 길게 하나. 문을 그 리듬으로 두드려라.'],
  },
  // ── 2막: 골방 ──
  {
    id: 'ep4-eggwall', room: 'ep4-golbang', requires: [], rewardItems: ['reel-box', 'tape-scraps', 'tape-035'],
    hints: ['벽을 덮은 계란판 중 한 장만 색이 바래지 않았다.', '그 한 장을 떼어내라. 뒤에 벽감이 있다.'],
  },
  {
    id: 'ep4-eq', room: 'ep4-golbang', requires: ['ep4-eggwall'], answer: 'clean',
    hints: ['녹음기 옆 종이에 파형 그림이 있다 — 저·중·고 세 칸의 높이.',
      '이퀄라이저 세 슬라이더를 종이의 파형 높이와 똑같이 맞춰라. 노이즈가 걷힌다.'],
  },
  {
    id: 'ep4-rx', room: 'ep4-golbang', requires: ['ep4-calendar'], requiresItem: 'rx-bundle', answer: '1002',
    hints: ['처방전의 기호는 복용 간격이다. 첫 복용일에서 간격만큼 거꾸로 세면 처방일이 나온다.',
      '●는 10월 5일에서 사흘 전, ▲는 10월 9일에서 이레 전 — 둘 다 10월 2일. 그날이 진단일이다. 1002.'],
  },
  {
    id: 'ep4-splice', room: 'ep4-golbang', requires: ['ep4-eggwall'], requiresItem: 'tape-scraps',
    answer: '3-1-4-2-5', rewardItem: 'audition-tape',
    hints: ['조각마다 첫 마디와 끝 마디 자막이 보인다. 문장이 이어지게 붙여라.',
      '"수험번호…"로 시작하는 조각이 첫 번째가 아니다 — 테이프 리더(무음 띠)가 붙은 조각이 맨 앞이다.'],
  },
  // ── 2막 말: 부스 회상 ──
  {
    id: 'ep4-booth', room: 'ep4-booth', requires: ['ep4-splice'], answer: '2-1-3',
    hints: ['대본의 표기: ∨는 들숨, ─는 길게 끌기. 큐 카드 세 장을 지문 순서대로.',
      '들숨(∨) 먼저, 그다음 첫 대사, 길게 끌기(─)는 마지막 — 2, 1, 3.'],
  },
  // ── 3막: 재청취와 회수 (마루/데크) ──
  {
    id: 'ep4-relisten', room: 'ep4-maru', requires: ['ep4-counter', 'ep4-eq', 'ep4-booth'],
    hints: ['노이즈가 걷힌 지금, 처음 들었던 자장가를 다시 들어보라.',
      '데크 카운터를 042로 되감아 재생하라. 전에는 안 들리던 것이 들린다.'],
  },
  {
    id: 'ep4-numbers', room: 'ep4-maru', requires: ['ep4-relisten', 'ep4-rx'], requiresItem: 'tape-035',
    answer: 'missing-35',
    hints: ['테이프 번호를 작은 수부터 늘어놓아 보라. 7, 10, 15, 20… 무엇의 수열인가?',
      '생일 나이다 — 일곱 살, 열 살, 열다섯… 서른과 마흔 사이가 비어 있다. 빈 라벨의 테이프가 서른다섯이다.'],
  },
  {
    id: 'ep4-lasttape', room: 'ep4-maru', requires: ['ep4-eq', 'ep4-splice'], answer: 'restored',
    hints: ['처음부터 데크에 반쯤 감긴 채 걸려 있던 그 테이프 — 이제 고칠 수 있다.',
      '스플라이스로 끊긴 끝을 잇고 클린 모드로 재생하라. 어머니의 마지막 녹음이다.'],
  },
  {
    id: 'ep4-final', room: 'ep4-maru', requires: ['ep4-relisten', 'ep4-numbers', 'ep4-lasttape'],
    requiresItem: 'tape-035', answer: '035', consumes: ['tape-035'],
    hints: ['빈 라벨의 테이프에 번호를 붙인다면 — 올해의 네 나이.',
      '테이프를 걸고 카운터를 035로 되감아라. 너에게 온 생일 메시지다.'],
  },
];

export const EP4_CONFIG: EpisodeConfig = {
  id: 'ep4',
  saveKey: 'memory-box-ep4',
  puzzles: EP4_PUZZLES,
  items: EP4_ITEMS,
  finalPuzzles: {
    'ep4-anbang': 'ep4-jagae',
    'ep4-golbang': 'ep4-splice',
    'ep4-booth': 'ep4-booth',
    'ep4-maru': 'ep4-final',
  },
  epilogueAt: 4,
  hubRoom: 'ep4-maru',
  roomGates: {
    'ep4-golbang': { requires: ['ep4-knock'], fallback: 'ep4-maru' },
    'ep4-booth': { requires: ['ep4-splice'], fallback: 'ep4-golbang' },
  },
};
```

- [ ] **Step 4: 통과 확인** — `npx vitest run tests/puzzles-ep4.test.ts` → PASS. `npx vitest run` 전체 회귀도 PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: ep4 퍼즐·아이템 데이터와 EP4_CONFIG"`

---

### Task 4: 플레이스루 테스트 (리듀서 통합 검증)

**Files:**
- Test: `tests/playthrough-ep4.test.ts` (기존 `tests/playthrough-ep3.test.ts` 패턴 복제)

- [ ] **Step 1: 테스트 작성** — 기존 ep3 플레이스루 테스트를 열어 같은 헬퍼 방식으로 작성. 핵심 시나리오:

```ts
// 의사 코드 아님 — playthrough-ep3.test.ts의 dispatch 헬퍼를 그대로 가져와 사용
// 1) 정순 완주: ep4-postcards → ep4-belt → ep4-radio → ep4-speed → ep4-counter
//    → ep4-ring → ep4-pillbag → ep4-calendar → ep4-jagae → ep4-knock
//    → (골방 이동 성공 확인) → ep4-eggwall → ep4-eq → ep4-rx → ep4-splice
//    → (부스 이동) → ep4-booth → (마루 복귀) → ep4-relisten → ep4-numbers
//    → ep4-lasttape → ep4-final → phase === 'epilogue'
// 2) 게이트: ep4-knock 미해결 상태로 ep4-golbang 이동 시도 → 거부(room 불변)
// 3) 저장 복귀 방어: room='ep4-golbang'인데 solved에 ep4-knock 없는 저장 → fallback 'ep4-maru'
// 4) canAttempt: ep4-final은 ep4-numbers 미해결 시 시도 불가
// 5) 오답: ep4-knock에 '장-단-장-단-장' 제출 → solved 미포함, wrongAttempts 증가
```

- [ ] **Step 2: 실행** — `npx vitest run tests/playthrough-ep4.test.ts` → PASS (Task 3 데이터가 맞으면 리듀서는 기존 코드로 통과해야 함. 실패 시 데이터 수정)
- [ ] **Step 3: Commit** — `git commit -m "test: ep4 플레이스루·게이트·저장 복귀 검증"`

---

### Task 5: TapeDeck 오버레이 (시그니처 UI)

**Files:**
- Create: `components/ep4/TapeDeck.tsx`
- Modify: 없음 (장면들이 Task 9에서 연결)

**계약:**

```ts
interface TapeDeckProps {
  open: boolean;
  onClose: () => void;
  /** 데크에서 퍼즐 제출: dispatch({type:'ATTEMPT', id, answer}) 래퍼 */
  onSubmit: (puzzleId: string, answer: string) => void;
  solved: string[];
}
```

**동작 사양:**
- 하단 고정 버튼(📼)으로 열리는 오버레이. `ep4-belt` 미해결이면 버튼 비활성(수리 전).
- UI: 릴 두 개(SVG, 재생/되감기 시 회전 애니메이션), 카운터 3자리(000~999), 버튼 ◀◀ 되감기 / ▶ 재생 / ■ 정지. 되감기 홀드 시 카운터 감소 가속.
- 재생 시: 카운터와 일치하는 `TAPE_SEGMENTS`의 해금 구간이면 `segmentLines(segId, solved)`를 자막으로 순차 표시(줄당 ~2.5초, 클릭으로 다음 줄). 해금 안 된 카운터면 "…지직… (아무것도 들리지 않는다)".
- 퍼즐 제출 연결: 카운터 042 재생 완료 → `onSubmit('ep4-counter','042')` (미해결 시). 042 재생 완료 & `ep4-relisten` 시도 가능 상태 → `onSubmit('ep4-relisten','')` 대신 **클릭형이므로 ATTEMPT에 answer 없이** — 기존 클릭형 규약 확인 후 동일하게. 035 재생 완료 → `onSubmit('ep4-final','035')`. `ep4-lasttape`: 데크 안 "걸려 있는 테이프" 슬롯 클릭 → 선행 충족 시 복원 연출 후 `onSubmit('ep4-lasttape','restored')`.
- 클린 모드(`isCleanMode(solved)`)면 카운터 창에 옅은 청록 글로우 + "CLEAN" 라벨.
- 호버 지침 준수: brightness+glow만, 이동 없음.

- [ ] **Step 1: 컴포넌트 구현** (위 사양대로, 스타일은 기존 `components/puzzles/*.tsx` 인라인 스타일 컨벤션)
- [ ] **Step 2: 타입체크** — `npx tsc --noEmit` → 0 에러
- [ ] **Step 3: Commit** — `git commit -m "feat: ep4 TapeDeck 오버레이 — 카운터·되감기·자막 재생"`

---

### Task 6: 마루 조작형 3종 — BeltRouting · FrequencyDial · SpeedSwitch

**Files:**
- Create: `components/ep4/BeltRouting.tsx`, `components/ep4/FrequencyDial.tsx`, `components/ep4/SpeedSwitch.tsx`

각 컴포넌트 공통 계약 (기존 `MeasureJug`/`KnitGrid` 자동 제출 패턴):

```ts
interface Props { onSolve: (answer: string) => void; onClose: () => void; }
```

- [ ] **Step 1: BeltRouting** — SVG 모터 1 + 풀리 2. 벨트는 클릭 순서로 경로 지정(모터→풀리L→풀리R = 정답 경로). 완성 시 릴이 시계 방향으로 도는 프리뷰 애니메이션 1.2초 후 `onSolve('routed')`. 역방향이면 테이프가 풀려나오는 연출 + 흔들림(오답 아님, 재시도).
- [ ] **Step 2: FrequencyDial** — 가로 다이얼 87.5~108.0, 드래그/버튼으로 0.1 단위 이동. 89.1 ±0.2 구간에서 지직음 감소(Web Audio 노이즈 게인), 정확히 89.1에서 1초 유지 시 `onSolve('891')`. 눈금 주변에 함정 방송 2곳(88.1 뉴스, 91.9 음악 — 자막만, 단서 없음).
- [ ] **Step 3: SpeedSwitch** — 전축 SVG. 33/45 스위치 + 재생. 45로 재생하면 빠른 웅얼거림 자막 "(높고 빨라 알아들을 수 없다)", 33이면 낮은 목소리 자막 3줄 재생 후 `onSolve('33')`. 자막 내용: "…골방 열쇠는 없다. 문은 손으로 여는 게 아니야." (노크 복선).
- [ ] **Step 4: 타입체크 + Commit** — `git commit -m "feat: ep4 마루 조작 퍼즐 — 벨트·주파수·회전수"`

---

### Task 7: 안방 조작형 2종 — PatternRing · CalendarMatch

**Files:**
- Create: `components/ep4/PatternRing.tsx`, `components/ep4/CalendarMatch.tsx`

- [ ] **Step 1: PatternRing** — 동심원 링 3개(SVG group rotate), 클릭/드래그로 45° 단위 회전. 꽃잎 5장이 이어지는 각도 조합은 링별 (0°, 135°, 270°). 정렬 완료 1초 유지 시 `onSolve('aligned')`.
- [ ] **Step 2: CalendarMatch** — 달력 SVG(동그라미 5개: 9/4, 9/11, 9/18, 9/25, 9/28) + 약봉투 도장 칩 3개(9/4, 9/18, 9/25) 드래그. 세 칩이 모두 맞는 동그라미에 놓이면 `onSolve('matched')`. 오답 배치 시 칩이 미끄러져 돌아오는 연출(이동 애니메이션은 칩에만 — 호버 지침과 무관).
  - 주의: 달력 동그라미 5개 중 2개(9/11, 9/28)는 도장이 없는 함정 — "전부 진료일은 아니었다"는 여지로 힌트 문구와 일치시킬 것.
- [ ] **Step 3: 타입체크 + Commit** — `git commit -m "feat: ep4 안방 조작 퍼즐 — 자개 링·달력 대조"`

---

### Task 8: 골방·부스·3막 조작형 4종 — KnockRhythm · EqualizerBars · SpliceEditor · NumberBoard

**Files:**
- Create: `components/ep4/KnockRhythm.tsx`, `components/ep4/EqualizerBars.tsx`, `components/ep4/SpliceEditor.tsx`, `components/ep4/NumberBoard.tsx`

- [ ] **Step 1: KnockRhythm** — 문 SVG. 클릭(터치) 간격으로 장/단 판정: 누르는 길이 아님, **탭 간격** — 직전 탭과의 간격 ≥600ms면 '장', <600ms면 '단'으로 기록(첫 탭은 '장' 시작으로 간주). 5탭 후 자동 판정, `onSolve(pattern.join('-'))` (예: '장-장-단-단-장'). 판정 실패 시 리듀서가 오답 처리(흔들림 기존 연출). 상단에 입력 중 리듬을 ●●○○● 시각화.
- [ ] **Step 2: EqualizerBars** — 세로 슬라이더 3개(저/중/고, 0~10). 옆에 종이 파형 가이드(정답: 저3·중7·고5 — 골방 벽 종이 소품과 일치시킬 것). 세 값 일치 1초 유지 → 노이즈 오디오 페이드아웃 연출 → `onSolve('clean')`.
- [ ] **Step 3: SpliceEditor** — 테이프 조각 5개(드래그로 순서 배열, 기존 OrderPicker 상호작용 참고하되 가로 테이프 릴 비주얼). 각 조각에 첫/끝 마디 자막 표시. 조각 3에만 무음 리더 띠(반투명 흰 띠) 표시 — 힌트 2단계와 일치. 배열 확정 버튼 → `onSolve(order.join('-'))` (정답 '3-1-4-2-5').
- [ ] **Step 4: NumberBoard** — 테이프 카드 7장(007·010·015·020·025·030·040) + 빈 라벨 카드 1장. 카드를 수직선 보드(0~40 눈금)에 드래그 배치. 7장이 눈금 위치에 맞게 놓이면 빈 카드가 깜빡이는 빈 눈금(35)으로만 드롭 가능해짐 → 드롭 시 `onSolve('missing-35')`.
- [ ] **Step 5: 타입체크 + Commit** — `git commit -m "feat: ep4 골방·3막 조작 퍼즐 — 노크·EQ·스플라이스·수열"`

---

### Task 9: 장면 6종 — 프롤로그/마루/안방/골방/부스/에필로그

**Files:**
- Create: `components/scenes/ep4/Ep4Prologue.tsx`, `Ep4Maru.tsx`, `Ep4Anbang.tsx`, `Ep4Golbang.tsx`, `Ep4Booth.tsx`, `Ep4Epilogue.tsx`

기존 `components/scenes/ep3/*` 구조(SVG 배경 + 핫스팟 + `useGame()` dispatch + 조작형 모달 open state)를 그대로 따른다. 팔레트: 마루/안방 = 밤 백열등 갈색·호박색, 골방 = 차가운 청록, 부스 = 형광등 청백. 호버는 brightness+glow만.

- [ ] **Step 1: Ep4Prologue** — 다락 연출: 카세트 더미·굳은 워크맨 발견 내레이션 4줄 → "세 자리 숫자뿐, 제목이 없다"(F1 살포) → 옛집 전환.
- [ ] **Step 2: Ep4Maru** — 핫스팟: 릴 데크(TapeDeck 오버레이 + ep4-belt 수리 진입), 라디오(FrequencyDial), 라디오 아래 서랍(ep4-postcards 클릭형), 전축(SpeedSwitch), 골방 문(KnockRhythm — 게이트 충족 전 클릭 시 "잠겨 있다. 열쇠 구멍이 없다." 내레이션, F4 문틈 담요 언급), 데크에 걸린 테이프(F7 — ep4-lasttape 선행 미충족 시 "끊어져 있다" 내레이션).
- [ ] **Step 3: Ep4Anbang** — 핫스팟: 화장대 서랍(PatternRing), 휴지통 뒤(ep4-pillbag), 달력(CalendarMatch), 자개장(NameLock 재사용 — `components/puzzles/NameLock.tsx`의 props에 음절 3개 구성이 가능한지 확인, 2음절 고정이면 syllable 수 prop 추가).
- [ ] **Step 4: Ep4Golbang** — 어두운 방, 계란판 벽(ep4-eggwall 클릭형 — 색 다른 한 장 하이라이트), 녹음기(EqualizerBars), 책상 위 처방전(DocViewer + Keypad 'ep4-rx'), 릴 상자(SpliceEditor).
- [ ] **Step 5: Ep4Booth** — 회상 톤 오버레이(채도 낮춤). 대본대(큐 카드 OrderPicker 재사용, 항목: ['1. "수험번호 열넷…"','2. (∨ 들숨)','3. (─ 길게)'] → 정답 '2-1-3'), 해결 시 합격 통지 → 진단 회상 내레이션 5줄(중간 반전) → 골방 복귀.
- [ ] **Step 6: Ep4Epilogue** — 035 재생 연출: 생일 메시지 자막 6줄("서른다섯 번째 생일 축하해. …이 목소리가 늙지 않아서, 엄마는 조금 기뻐.") → 다락 귀환 → 명패 「사라진 목소리 — 완료」.
- [ ] **Step 7: 타입체크 + Commit** — `git commit -m "feat: ep4 장면 6종 — 옛집·부스·프롤로그/에필로그"`

---

### Task 10: 앱 통합 — page.tsx·에피소드 선택·오디오

**Files:**
- Modify: `app/page.tsx` (ep3 블록 패턴 복제: import, Ep4InnerApp/Ep4App, screen 분기, 에피소드 선택 카드)
- Modify: `lib/audio.ts` (신규 효과음: 릴 회전 루프, 되감기 고속음, 스플라이스 '틱', 노이즈→클린 페이드, 노크 톤 장/단)

- [ ] **Step 1: page.tsx 통합** — `Ep3App` 블록(약 200~247행)과 동일 구조로 `Ep4App` 추가. `loadGame(EP4_CONFIG.saveKey)` resume, room별 장면 분기(ep4-maru/anbang/golbang/booth), phase 분기(prologue/epilogue/memory). 에피소드 선택 화면에 ep4 카드(제목 「사라진 목소리」, 잠금 없음 — 스펙상 ep1~3 연동 없음).
- [ ] **Step 2: audio.ts 확장** — 기존 합성 함수 패턴으로 `playReelLoop/stopReelLoop`, `playRewind`, `playSpliceTick`, `playNoiseFade`, `playKnock(long: boolean)` 추가. TapeDeck/KnockRhythm 등에서 호출 연결.
- [ ] **Step 3: 전체 테스트 + 타입체크** — `npx vitest run` PASS, `npx tsc --noEmit` 0 에러
- [ ] **Step 4: Commit** — `git commit -m "feat: ep4 앱 통합 — 에피소드 선택·장면 라우팅·효과음"`

---

### Task 11: 검증 — 자동 회귀 + 수동 플레이스루

- [ ] **Step 1: 전체 테스트** — `npx vitest run` → 전부 PASS (ep1~3 회귀 포함)
- [ ] **Step 2: 개발 서버 수동 검증** — preview로 기동, 시나리오:
  1. 노힌트 정순 완주 (스펙 §5 순서) → 에필로그 도달
  2. 골방 게이트: ep4-knock 전 골방 문 → 잠김 내레이션
  3. 저장 복귀: 골방에서 저장 후 localStorage에서 solved의 'ep4-knock' 제거 → 이어하기 시 마루로 복귀
  4. 재청취 회수: ep4-eq 전/후 042 구간 자막 차이 (F2)
  5. 모바일 뷰포트(375px): TapeDeck 오버레이·드래그 퍼즐 조작 가능
- [ ] **Step 3: 발견 이슈 수정 후 Commit** — `git commit -m "fix: ep4 수동 검증 후속"`

---

## Self-Review 결과 (작성 시 반영 완료)

- 스펙 퍼즐 16+1 ↔ 플랜 17개 id 일치 (P1~P16 + G=ep4-knock; P4=ep4-counter, P13=ep4-relisten). 스펙의 "P16이 마지막" 제약은 ep4-final.requires로 강제.
- 아이템 참조 무결성은 Task 3 테스트가 기계 검증.
- NameLock 3음절 여부는 Task 9 Step 3에서 확인 항목으로 명시(2음절 고정일 가능성).
