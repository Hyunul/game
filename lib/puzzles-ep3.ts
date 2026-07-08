import { Puzzle, Item } from './types';
import { EpisodeConfig } from './episode';

// ── ep3 「지워진 이름」 답 규약 메모 ──
// ep3-sundial: 그림자가 가리키는 자리 id — 'daetdol'
// ep3-knit: 도안대로 격자를 채우면 KnitGrid가 'dol'을 자동 제출
// ep3-jangdok: 장 담근 절기 순서 — '동지-입춘-곡우-백로'
// ep3-doetbak: 3되·5되 됫박으로 넉 되를 만들면 MeasureJug가 '4'를 자동 제출
// ep3-heat: HeatReveal에서 알맞은 높이로 쬐면 'revealed', 너무 가까우면 'scorched'(오답)
// ep3-well: 추 무게 조합(근수 오름차순, '-' 연결) — '3-5' (합 8근)
// ep3-clothesline: 옷 id를 너는 순서대로 — 'jeogori-jeoksam-chima-ibul' (흰 것부터, 무거운 순)
// ep3-postmark: 편지봉투 6장을 소인 날짜순으로 — 'e4-e1-e5-e2-e6-e3'
//   (봉투 id는 문갑에 흩어진 전시 위치 기준: e4=편지①겨울, e1=②봄, e5=③여름, e2=④가을, e6=⑤겨울, e3=⑥1975가을)
// ep3-truth-N: 대조 뷰어에서 고른 두 구절 id를 오름차순 정렬해 '|'로 연결 — 'G?|L?'
// ep3-name: NameLock 음절 두 개 — '한-별'

export const EP3_ITEMS: Record<string, Item> = {
  // ── 두 권의 기록 ──
  'doc-ledger': {
    id: 'doc-ledger', name: '할머니의 가계부', icon: '📒',
    desc: '1968~1975년. 꼬박꼬박 적힌 살림 기록 사이, 이유를 알 수 없는 항목들이 있다.',
    doc: true,
    docPages: [
      '1968년 겨울. "호적 수속비 — 면사무소." 그 아래, 딸의 이름이 이 가계부에 마지막으로 등장한다. 같은 장 귀퉁이에 작게: "쌀뜨물로 쓴 글은 불에 쬐면 나온다더라. 잊지 말 것."',
      '1969년 봄. "재봉틀 값 — 삯바느질 도구." 살림에 없던 큰 지출이다. 같은 해 12월: "약값 3천 원." 누구의 약인지는 적혀 있지 않다.',
      '1969년부터 매달 보름 자리에 같은 항목이 반복된다. "쌀 한 말." 우리 집 식구 수로는 설명되지 않는 양이다.',
      '장 담근 기록: "동지에 메주 쑤고, 입춘에 장 가르고, 곡우에 간장 뜨고, 백로에 새 독을 앉혔다."',
      '1975년 가을을 끝으로, 보름의 쌀도, 약값도, 모든 항목이 조용히 사라진다. 이유는 어디에도 적혀 있지 않다.',
      '마지막 장 여백. 연필로 같은 글씨를 연습하듯 몇 번이고 쓴 흔적 — 획이 닳아 반쯤만 남았다. ㅎ… ㄴ… 그리고 별 모양처럼 뻗은 획.',
    ],
  },
  'doc-address': {
    id: 'doc-address', name: '낡은 편지 한 장', icon: '✉️',
    desc: '가계부 갈피에 끼워져 있던 편지. 보낸 주소만 남아 있다.',
    doc: true,
    docPages: [
      '봉투 겉면. "○○군 ○○면 샘골 별채" — 외가 마을의 주소다. 보낸 사람 이름 자리는 오래 문질러 지워져 있다. 뒷면에 할머니의 글씨: "답장은 부치지 못했다."',
    ],
  },

  // ── 고모의 편지 (L1~L7) ──
  'letter-1': {
    id: 'letter-1', name: '고모의 편지 ①', icon: '💌',
    desc: '뜨개 바구니 밑에서 나온 편지.',
    doc: true,
    docPages: [
      '어머니. 아이 홍역이 나았어요. 보내주신 약 덕분이에요. 사흘 밤을 끓다가 오늘 아침에야 미음을 넘겼어요. 고맙습니다, 고맙습니다. — 겨울, 샘골에서.',
    ],
  },
  'letter-2': {
    id: 'letter-2', name: '고모의 편지 ②', icon: '💌',
    desc: '장독 속 기름종이 꾸러미에 들어 있던 편지.',
    doc: true,
    docPages: [
      '어머니. 보내주신 재봉틀로 삯일을 시작했어요. 읍내 포목점에서 일감을 받아요. 이제 저희 두 식구 먹을 것은 제 손으로 벌어요. 어머니 짐을 덜어드리고 싶어요. — 봄.',
    ],
  },
  'letter-3': {
    id: 'letter-3', name: '고모의 편지 ③', icon: '💌',
    desc: '뒤주 바닥 이중판에서 나왔다. 뒷면이 이상하게 빳빳하다.',
    doc: true,
    docPages: [
      '어머니. 아이가 걸음마를 뗐어요. 마루 끝에서 세 걸음. 넘어지고도 웃어요. 어머니께 보여드리고 싶은데, 보여드릴 수가 없네요. — 여름.',
      '(뒷면 — 무언가 쓰여 있던 자국이 있지만 맨눈으로는 읽을 수 없다. 종이가 유난히 빳빳하다.)',
    ],
  },
  'letter-4': {
    id: 'letter-4', name: '고모의 편지 ④', icon: '💌',
    desc: '우물에서 건진 방수 단지 속 편지.',
    doc: true,
    docPages: [
      '어머니. 보름이면 뒷문 쪽에서 소리가 나요. 쌀자루가 놓여 있고요. 얼굴은 못 봬도, 어머니 다녀가신 거 다 알아요. 달 밝은 밤이면 아이를 안고 뒷문 앞에 한참 서 있어요. — 가을.',
    ],
  },
  'letter-5': {
    id: 'letter-5', name: '고모의 편지 ⑤', icon: '💌',
    desc: '안방 벽장, 이불 갈피에서 나온 편지.',
    doc: true,
    docPages: [
      '어머니. 면사무소 일, 어머니 뜻대로 하셨다는 말 들었어요. 원망하지 않아요. 아이 이름은 어머니가 지어주신 대로 부르고 있어요. 이 아이는 낙인 없이 살 거예요. 그거면 돼요. — 겨울.',
      '추신. 빨래 너는 순서만 봐도 어머니가 다녀가신 걸 알아요. 어머니는 늘 흰 것부터, 무거운 것 순서로 너셨지요.',
    ],
  },
  'letter-6': {
    id: 'letter-6', name: '고모의 편지 ⑥', icon: '💌',
    desc: '빨랫줄 적삼 주머니에서 나온, 부치지 못한 마지막 편지.',
    doc: true,
    docPages: [
      '어머니. 이제 저희 걱정 마세요. 먼 곳에 자리를 잡았어요. 아이 학교도 정해졌어요. 더는 쌀도 약도 보내지 마세요. 어머니가 주신 것으로 여기까지 왔어요. 남은 길은 저희가 걸어갈게요. — 1975년 가을.',
    ],
  },
  'letter-7': {
    id: 'letter-7', name: '부치지 못한 답장', icon: '📜',
    desc: '문갑 비밀칸에 있던, 할머니가 끝내 부치지 못한 답장.',
    doc: true,
    docPages: [
      '딸에게. 미안하다는 말은 쓰지 않으마. 네가 싫어할 테니. 마을의 눈은 어미가 다 가리마. 너는 그 아이 손만 꼭 잡고 있거라. 자장가는 어미가 부르던 그대로 불러주거라 — 그 노래 첫 글자에 그 아이 이름을 숨겨두었다.',
    ],
  },

  // ── 도구·단서 ──
  'geon-key': {
    id: 'geon-key', name: '무쇠 열쇠', icon: '🗝️',
    desc: '댓돌 밑에 묻혀 있던 열쇠. 건넌방 문 크기다.',
  },
  'backdoor-key': {
    id: 'backdoor-key', name: '뒷문 열쇠', icon: '🔑',
    desc: '우물 속 단지에서 나온 열쇠. 안방으로 통하는 뒷문 것이다.',
  },
  matches: {
    id: 'matches', name: '성냥갑', icon: '🔥',
    desc: '뒤주 이중판에 함께 들어 있던 성냥. 아궁이에 불을 붙일 수 있겠다.',
  },
  'cloth-map': {
    id: 'cloth-map', name: '박음질 천 조각', icon: '🧵',
    desc: '재봉틀에 걸려 있던 천. 박음질 선이 어딘가의 평면도 같다.',
    doc: true,
    docPages: [
      '박음질 선을 따라가면 — 마당, 부엌, 건넌방… 이 별채의 평면도다. 안방 자리, 벽장 위치에 매듭이 단단히 지어져 있다.',
    ],
  },
  'heat-note': {
    id: 'heat-note', name: '떠오른 글씨', icon: '🔎',
    desc: '편지 ③ 뒷면, 아궁이 불에 쬐자 떠오른 글.',
    doc: true,
    docPages: [
      '"어머니만 보세요. 뒷문 열쇠는 우물 안에 넣어두었어요. 여덟 근이면 바닥의 단지에 닿아요."',
    ],
  },
  lullaby: {
    id: 'lullaby', name: '자장가 악보', icon: '🎵',
    desc: '문갑 비밀칸의 손글씨 악보. 할머니의 필체다.',
    doc: true,
    docPages: [
      '자장자장. 「한숨도 걱정도 어미가 안고 / 별빛이 이불 되어 덮어준단다 / 자거라 자거라 샘골의 아가」 — 소절 첫 글자에 동그라미가 쳐져 있다: 한, 별.',
    ],
  },
};

// ── 대조 뷰어 데이터 ──
// 가계부 구절(G)과 편지 구절(L). L의 등장은 해당 편지 아이템 보유에 따른다.
export interface CompareLine {
  id: string;
  text: string;
  /** 이 구절이 뷰어에 보이려면 보유해야 하는 아이템 (없으면 항상 표시) */
  needsItem?: string;
}

export const EP3_LEDGER_LINES: CompareLine[] = [
  { id: 'G1', text: '1968년 겨울 — "호적 수속비, 면사무소." 딸의 이름이 마지막으로 등장한다.' },
  { id: 'G2', text: '1969년 봄 — "재봉틀 값. 삯바느질 도구."' },
  { id: 'G3', text: '1969년 12월 — "약값 3천 원." 누구의 약인지 적혀 있지 않다.' },
  { id: 'G4', text: '매달 보름 — "쌀 한 말." 식구 수로는 설명되지 않는 양.' },
  { id: 'G5', text: '장 담근 기록 — 동지, 입춘, 곡우, 백로.' },
  { id: 'G6', text: '1975년 가을 — 모든 항목이 조용히 사라진다.' },
];

export const EP3_LETTER_LINES: CompareLine[] = [
  { id: 'L1', text: '"아이 홍역이 나았어요. 보내주신 약 덕분이에요." (편지 ①)', needsItem: 'letter-1' },
  { id: 'L2', text: '"보내주신 재봉틀로 삯일을 시작했어요." (편지 ②)', needsItem: 'letter-2' },
  { id: 'L3', text: '"아이가 걸음마를 뗐어요. 마루 끝에서 세 걸음." (편지 ③)', needsItem: 'letter-3' },
  { id: 'L4', text: '"보름이면 뒷문 쪽에서 소리가 나요. 쌀자루가 놓여 있고요." (편지 ④)', needsItem: 'letter-4' },
  { id: 'L5', text: '"면사무소 일, 원망하지 않아요. 아이 이름은 어머니가 지어주신 대로." (편지 ⑤)', needsItem: 'letter-5' },
  { id: 'L6', text: '"이제 저희 걱정 마세요. 먼 곳에 자리를 잡았어요." (편지 ⑥)', needsItem: 'letter-6' },
];

/** 진실 조각 퍼즐 id ↔ 정답 짝 (오름차순 정렬, 'G?|L?') */
export const EP3_TRUTH_PAIRS: Record<string, string> = {
  'ep3-truth-1': 'G3|L1', // 약값 ↔ 홍역 — 몰래 부양했다
  'ep3-truth-2': 'G2|L2', // 재봉틀 ↔ 삯일 — 자립을 도왔다
  'ep3-truth-3': 'G1|L5', // 호적 ↔ 이름 — 지운 날 이름을 지어줬다
  'ep3-truth-4': 'G4|L4', // 보름 쌀 ↔ 뒷문 소리 — 직접 다녀갔다
  'ep3-truth-5': 'G6|L6', // 지출 중단 ↔ 자립 — 끝은 단절이 아니었다
};

/** 진실 조각을 풀었을 때 밝혀지는 정황 (연출 문구) */
export const EP3_TRUTH_REVEALS: Record<string, string> = {
  'ep3-truth-1': '가계부의 약값은 이 아이의 약이었다 — 할머니는 몰래 모녀를 부양하고 있었다.',
  'ep3-truth-2': '재봉틀은 할머니가 보낸 것이었다 — 딸이 제 손으로 설 수 있도록.',
  'ep3-truth-3': '호적에서 지운 그날, 할머니는 아이의 이름을 지어 보냈다. 버림이 아니라 보호였다.',
  'ep3-truth-4': '매달 보름의 쌀 한 말 — 할머니는 7년 동안 직접 밤길을 다녀갔다.',
  'ep3-truth-5': '기록이 끝난 것은 버림받아서가 아니다. 모녀가 마침내 자립한 것이다.',
};

export const EP3_PUZZLES: Puzzle[] = [
  // ── 마당 ──
  { id: 'ep3-sundial', room: 'madang', requires: [], answer: 'daetdol',
    rewardItem: 'geon-key',
    hints: [
      '동봉된 편지 뒷면 — "해질녘 그림자가 닿는 곳". 대문 문살의 그림자를 움직여보자.',
      '해를 서쪽 끝(해질녘)까지 돌리면 문살 그림자 끝이 댓돌 하나를 가리킨다. 그 댓돌을 파보자.',
    ] },

  { id: 'ep3-geon-door', room: 'madang', requires: [],
    requiresItem: 'geon-key', consumes: ['geon-key'],
    hints: [
      '건넌방 문이 잠겨 있다.',
      '댓돌 밑에서 나온 무쇠 열쇠를 선택하고 건넌방 문을 열자.',
    ] },

  { id: 'ep3-jangdok', room: 'madang', requires: ['ep3-knit'],
    answer: '동지-입춘-곡우-백로',
    rewardItem: 'letter-2',
    hints: [
      '뜨개 도안의 글자는 「돌」 — 장독대를 가리킨다. 뚜껑 안쪽마다 담근 절기가 적혀 있다.',
      '가계부의 장 담근 기록 순서대로 — 동지, 입춘, 곡우, 백로 순으로 뚜껑을 열자.',
    ] },

  { id: 'ep3-well', room: 'madang', requires: ['ep3-heat'],
    answer: '3-5',
    rewardItems: ['backdoor-key', 'letter-4'],
    hints: [
      '떠오른 글씨 — "여덟 근이면 바닥의 단지에 닿아요". 두레박에 추를 달아 내려보자.',
      '추는 2근·3근·5근·7근. 정확히 여덟 근 — 3근과 5근을 달자.',
    ] },

  { id: 'ep3-backdoor', room: 'madang', requires: ['ep3-well'],
    requiresItem: 'backdoor-key', consumes: ['backdoor-key'],
    hints: [
      '뒷문이 잠겨 있다. 안방으로 통하는 문이다.',
      '우물에서 나온 뒷문 열쇠를 선택하고 뒷문을 열자.',
    ] },

  { id: 'ep3-clothesline', room: 'madang', requires: ['ep3-closet'],
    requiresItem: 'letter-5',
    answer: 'jeogori-jeoksam-chima-ibul',
    rewardItem: 'letter-6',
    hints: [
      '편지 ⑤의 추신 — 어머니의 빨래 너는 규칙이 적혀 있다.',
      '흰 것부터, 무거운 것 순서로: 흰 저고리 → 흰 적삼 → 물빛 치마 → 솜이불잇. 다 널면 적삼 주머니가 무겁다.',
    ] },

  // ── 건넌방 ──
  { id: 'ep3-knit', room: 'geonneonbang', requires: ['ep3-geon-door'],
    answer: 'dol',
    rewardItem: 'letter-1',
    hints: [
      '뜨다 만 아기 양말 옆에 도안이 있다. 겉뜨기(●)와 안뜨기(○)가 격자로 그려져 있다.',
      '도안의 겉뜨기(●) 칸만 그대로 격자에 채워보자 — 글자가 떠오른다.',
    ] },

  { id: 'ep3-cloth', room: 'geonneonbang', requires: ['ep3-geon-door'],
    rewardItem: 'cloth-map',
    hints: [
      '재봉틀에 천이 걸린 채다. 박음질 선이 예사롭지 않다.',
      '천을 살펴보자 — 박음질 선은 이 집의 평면도다.',
    ] },

  // ── 부엌 ──
  { id: 'ep3-doetbak', room: 'bueok', requires: [],
    answer: '4',
    rewardItems: ['letter-3', 'matches'],
    hints: [
      '뒤주에 "넉 되를 채우면 열린다"고 새겨져 있다. 됫박은 3되와 5되뿐.',
      '5되를 채워 3되에 붓고(남는 2되), 3되를 비우고 2되를 옮긴 뒤, 다시 5되를 채워 3되를 마저 채우면 — 5되 됫박에 넉 되가 남는다.',
    ] },

  { id: 'ep3-heat', room: 'bueok', requires: ['ep3-doetbak'],
    requiresItems: ['letter-3', 'matches'],
    answer: 'revealed',
    rewardItem: 'heat-note',
    hints: [
      '편지 ③의 뒷면이 이상하게 빳빳하다. 가계부 여백의 메모를 떠올리자.',
      '"쌀뜨물로 쓴 글은 불에 쬐면 나온다" — 아궁이에 불을 붙이고, 종이를 타지 않을 만큼만 가까이 대보자.',
    ] },

  // ── 안방 ──
  { id: 'ep3-closet', room: 'ep3-anbang', requires: ['ep3-backdoor'],
    requiresItem: 'cloth-map', consumes: ['cloth-map'],
    rewardItem: 'letter-5',
    hints: [
      '박음질 평면도의 매듭 자리 — 안방 벽장이다.',
      '천 조각을 선택하고 벽장을 살피자. 이불 갈피에 편지가 있다.',
    ] },

  { id: 'ep3-postmark', room: 'ep3-anbang', requires: ['ep3-clothesline'],
    answer: 'e4-e1-e5-e2-e6-e3',
    rewardItems: ['lullaby', 'letter-7'],
    hints: [
      '문갑에 편지봉투 꽂이가 있다. 소인 날짜가 일부 번져 있다.',
      '번진 소인은 가계부의 지출 날짜로 복원된다. 겨울(호적·약값의 해)부터 1975년 가을까지, 시간순으로 꽂자.',
    ] },

  // ── 진실 조각 (대조 뷰어 — 안방 서안) ──
  { id: 'ep3-truth-1', room: 'ep3-anbang', requires: ['ep3-backdoor'],
    requiresItems: ['doc-ledger', 'letter-1'],
    answer: EP3_TRUTH_PAIRS['ep3-truth-1'],
    hints: [
      '가계부의 "약값"은 누구의 약이었을까.',
      '가계부 "약값 3천 원" ↔ 편지 ① "보내주신 약 덕분이에요"를 짝짓자.',
    ] },
  { id: 'ep3-truth-2', room: 'ep3-anbang', requires: ['ep3-backdoor'],
    requiresItems: ['doc-ledger', 'letter-2'],
    answer: EP3_TRUTH_PAIRS['ep3-truth-2'],
    hints: [
      '살림에 없던 큰 지출 — 재봉틀은 누구를 위한 것이었을까.',
      '가계부 "재봉틀 값" ↔ 편지 ② "보내주신 재봉틀로 삯일을"을 짝짓자.',
    ] },
  { id: 'ep3-truth-3', room: 'ep3-anbang', requires: ['ep3-backdoor'],
    requiresItems: ['doc-ledger', 'letter-5'],
    answer: EP3_TRUTH_PAIRS['ep3-truth-3'],
    hints: [
      '호적에서 지운 날, 무슨 일이 함께 있었을까.',
      '가계부 "호적 수속비" ↔ 편지 ⑤ "아이 이름은 어머니가 지어주신 대로"를 짝짓자.',
    ] },
  { id: 'ep3-truth-4', room: 'ep3-anbang', requires: ['ep3-backdoor'],
    requiresItems: ['doc-ledger', 'letter-4'],
    answer: EP3_TRUTH_PAIRS['ep3-truth-4'],
    hints: [
      '매달 보름의 쌀 한 말은 어디로 갔을까.',
      '가계부 "쌀 한 말" ↔ 편지 ④ "보름이면 뒷문 쪽에서 소리가"를 짝짓자.',
    ] },
  { id: 'ep3-truth-5', room: 'ep3-anbang', requires: ['ep3-backdoor'],
    requiresItems: ['doc-ledger', 'letter-6'],
    answer: EP3_TRUTH_PAIRS['ep3-truth-5'],
    hints: [
      '1975년, 기록은 왜 끝났을까.',
      '가계부 "모든 항목이 사라진다" ↔ 편지 ⑥ "이제 걱정 마세요"를 짝짓자.',
    ] },

  // ── 최종: 반닫이 — 지워진 이름 ──
  { id: 'ep3-name', room: 'ep3-anbang',
    requires: ['ep3-truth-1', 'ep3-truth-2', 'ep3-truth-3', 'ep3-truth-4', 'ep3-truth-5'],
    requiresItems: ['lullaby'],
    answer: '한-별',
    hints: [
      '반닫이는 이름을 묻는다. 자장가 악보, 편지 ⑤, 가계부 마지막 장 — 세 단서가 한 이름을 가리킨다.',
      '자장가 소절의 첫 글자들 — 한, 별. 가계부 여백의 닳은 획도 같은 글자다.',
    ] },
];

export const EP3_CONFIG: EpisodeConfig = {
  id: 'ep3',
  saveKey: 'memory-box-save-ep3',
  puzzles: EP3_PUZZLES,
  items: EP3_ITEMS,
  finalPuzzles: { 'ep3-anbang': 'ep3-name' },
  epilogueAt: 1,
  hubRoom: 'ep3-attic',
};
