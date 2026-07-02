import { Puzzle, Item } from './types';
import { EpisodeConfig } from './episode';

// ── 문서 아이템(doc) 답 규약 메모 ──
// ep2-contradiction의 answer는 'D2-2|D5-1' 형식: "문서번호-문장(페이지)번호|문서번호-문장(페이지)번호"
// (모순되는 두 문장의 id를 오름차순 정렬해 짝지어 표기. ContradictionPicker가 선택된 두 id를
// 알파벳순으로 정렬한 뒤 '|'로 이어 제출하므로, 선택 순서와 무관하게 이 정규화된 형태와 비교된다.)
// ep2-handwriting의 answer는 'youngho' | 'youngsu' 중 선택.
// ep2-photo의 answer는 'assembled' (조립 완료 시 자동 제출).
// ep2-timeline의 answer는 카드 7장의 시간 순서 번호를 '-'로 이은 문자열.

export const EP2_ITEMS: Record<string, Item> = {
  // ── 도구 ──
  'pocket-watch': {
    id: 'pocket-watch', name: '멈춘 회중시계', icon: '⌚',
    desc: '11시 40분에 멈춰 있다. 태엽을 감으면… (사용: 시점 전환)',
  },
  matches: {
    id: 'matches', name: '성냥갑', icon: '🔥',
    desc: '다방 성냥. 아직 쓸 수 있다.',
  },
  'oil-bottle': {
    id: 'oil-bottle', name: '호롱 기름병', icon: '🛢️',
    desc: '등잔용 기름. 굳은 경첩에도 쓸 수 있겠다.',
  },
  'brass-key': {
    id: 'brass-key', name: '놋쇠 열쇠', icon: '🗝️',
    desc: '반짇고리에 있던 열쇠. 헛간 자물쇠 크기다.',
  },
  'empty-envelope': {
    id: 'empty-envelope', name: '빈 편지봉투', icon: '✉️',
    desc: '"아버지께". 본문이 없다. 소인은 8월 14일 — 누군가 먼저 꺼내 갔다.',
  },
  embroidery: {
    id: 'embroidery', name: '수틀', icon: '🧵',
    desc: '작은 꽃부터 피운다 — 어미. 손바느질로 새긴 문장.',
  },

  // ── 문서 (D1~D7) ──
  'doc-news': {
    id: 'doc-news', name: '신문 기사', icon: '📰',
    desc: '1978년 8월 16일자. 앞면은 사건 기사, 뒷면은 라디오 편성표다.',
    doc: true,
    docPages: [
      '1978년 8월 16일. "15일 밤, 마을 저수지에서 청년 윤영수(21)가 익사한 채 발견되었다. 마을 주민들은 사건 전날 저녁 그가 동생과 크게 다투는 소리를 들었다고 증언했다. 경찰은 실족사와 더불어 타살 가능성도 배제하지 않고 수사 중이라고 밝혔다. 유족은 큰 충격에 빠져 있다."',
      '(뒷면) 저녁 라디오 편성표 — 표준방송 711 · 중앙음악 855 · 교육방송 603. 매일 저녁 8시, 표준방송에서 종합뉴스가 전해진다고 작게 적혀 있다.',
    ],
  },
  'doc-rumor': {
    id: 'doc-rumor', name: '마을 벽보', icon: '📜',
    desc: '부고 옆에 누군가 급히 휘갈긴 낙서가 남아 있다.',
    doc: true,
    docPages: [
      '"고 윤영수 님의 명복을 빕니다." 정식으로 인쇄된 부고 아래, 다른 손으로 휘갈겨 쓴 글씨가 덧붙어 있다. "동생이 그랬다더라." 서명은 없다. 마을 사람들 사이에서 떠돌던 말이 그대로 벽에 옮겨진 것이다.',
      '"그날 밤 두 형제가 함께 낚시 짐을 지고 저수지로 가는 걸 봤다"는 말도 떠돈다. 본 사람이 누구인지는 아무도 모른다.',
    ],
  },
  'doc-letter': {
    id: 'doc-letter', name: '형의 편지 (부치지 못한)', icon: '💌',
    desc: '병풍 다이얼을 풀고 얻은 편지. 봉투 없이 편지지만 남아 있다.',
    doc: true,
    docPages: [
      '아버지께. 오늘 영호와 크게 다투었습니다. 낚싯대를 빼앗아 헛간에 넣어 잠근 것은 저입니다. 부디 그 아이를 탓하지 마세요. 열일곱입니다. 아직 저수지의 밤이 얼마나 깊은지 모릅니다. 제가 그 아이를 막겠습니다. 걱정 마시고 며칠만 더 기다려 주세요. 1978년 8월 14일, 영수 올림.',
    ],
  },
  'doc-diary': {
    id: 'doc-diary', name: '어머니의 일기', icon: '📖',
    desc: '마루 밑 양철상자에서 나왔다. 사흘치가 적혀 있다.',
    doc: true,
    docPages: [
      '8월 14일. 형제가 다투었다. 영수가 영호의 낚싯대를 빼앗아 헛간에 넣고 잠갔다. 영호는 분을 못 이겨 뒤란으로 나가버렸다. 저녁상도 뜨는 둥 마는 둥. 아이들 아버지는 아직 모른다.',
      '8월 15일. 초저녁부터 영호가 보이지 않는다. 큰애도 뒤따라 나간 듯 조용하다. 달이 밝은 밤이다. 마음이 편치 않아 문간에 앉아 오래 기다렸다.',
      '8월 16일 새벽. 영호가 젖은 채 혼자 돌아왔다. 아무 말도 하지 않고 마당 수돗가에서 옷을 빨았다. 나도 묻지 않았다. 무언가 크게 잘못되었다는 것만 알겠다. 이 일은 아무에게도 말하지 않을 것이다.',
    ],
  },
  'doc-report': {
    id: 'doc-report', name: '경찰 조서 사본 (이장 진술)', icon: '📋',
    desc: '헛간 도구 걸이 뒤 벽 틈에서 나온 사본. 이장이 몰래 남겨둔 것 같다.',
    doc: true,
    docPages: [
      '진술인 김만복(이장). 15일 밤 11시경, 저수지 쪽에서 고함 소리를 들었습니다. 나가보니 한 사람이 물가로 달려가는 것이 보였습니다. 달이 밝았지만 거리가 있어 얼굴은 알아보지 못했습니다. 다만 그 사람이 맨손이었다는 것은 분명히 기억합니다. 장비 같은 것은 아무것도 들고 있지 않았습니다.',
    ],
  },
  'doc-note': {
    id: 'doc-note', name: '서명 없는 쪽지', icon: '🗒️',
    desc: '도구함 안쪽, 도형 자물쇠를 풀고 나온 쪽지. 흘려 쓴 글씨체다.',
    doc: true,
    docPages: [
      '보름달 뜨면 큰 놈이 문다더라. 도구함 열쇠는 늘 두던 곳에 있다. 아버지껜 비밀로 해줘.',
    ],
  },
  'doc-scribble': {
    id: 'doc-scribble', name: '기둥의 낙서', icon: '✏️',
    desc: '기둥 아래쪽에 흘려 쓴 낙서를 옮겨 적었다.',
    doc: true,
    docPages: [
      '기둥 눈금 아래, 흘려 쓴 낙서: "빨리 커서 형만큼 큰 놈 잡을 거다 — 浩". 급하고 비스듬하게 기울어진 글씨체다.',
    ],
  },
  'doc-jokbo': {
    id: 'doc-jokbo', name: '족보 기록', icon: '📚',
    desc: '문갑 안에서 나온 낡은 족보. 항렬자와 이름의 규칙이 적혀 있다.',
    doc: true,
    docPages: [
      '이 대(代)의 항렬자는 榮(영)이다. 榮秀(영수)는 이 집안의 장남이며, 榮浩(영호)는 차남이다. 順伊(순이)는 이 대의 딸이 아니라 이웃한 작은아버지 댁의 사촌누이로, 항렬자를 따르지 않는다. 제삿날: 음력 7월 보름(백중) 무렵으로 기록되어 있다.',
    ],
  },

  // ── 시계 내부 (H5) ──
  'watch-open': {
    id: 'watch-open', name: '열린 회중시계', icon: '🕰️',
    desc: '경첩에 기름을 치고서야 겨우 열렸다. 안쪽에 무언가 새겨져 있다.',
    doc: true,
    docPages: [
      '뚜껑 안쪽에 옅게 낀 물때. 바늘은 11시 40분에 멈춰 있다. 뚜껑 안쪽에 작은 글씨로 새겨진 문장: "아우와 함께 — 아버지가". 아버지가 두 형제 모두에게 준 시계였던 모양이다.',
    ],
  },

  // ── 사진 조각 ──
  'photo-1': {
    id: 'photo-1', name: '찢긴 사진 조각 ①', icon: '🧩',
    desc: '문갑 서랍 밑칸에서 나왔다. 사진의 한 귀퉁이다.',
  },
  'photo-2': {
    id: 'photo-2', name: '찢긴 사진 조각 ②', icon: '🧩',
    desc: '기둥 눈금 옆, 갈라진 틈에 끼워져 있었다.',
  },
  'photo-3': {
    id: 'photo-3', name: '찢긴 사진 조각 ③', icon: '🧩',
    desc: '문서함 서랍 안쪽, 모순을 알아챈 뒤에야 눈에 띄었다.',
  },
  'photo-4': {
    id: 'photo-4', name: '찢긴 사진 조각 ④', icon: '🧩',
    desc: '도구 걸이 뒤 벽 틈에서 나왔다.',
  },
  'photo-full': {
    id: 'photo-full', name: '완성된 가족사진', icon: '🖼️',
    desc: '네 조각을 맞춘 흑백 가족사진. 뒷면에 짧은 글이 적혀 있다.',
    doc: true,
    docPages: [
      '무진년 백중, 넷이서. 사진 속 네 사람 — 아버지, 어머니, 그리고 나란히 선 두 형제. 항렬로 보면 왼쪽이 영수, 오른쪽이 영호다.',
    ],
  },
};

export const EP2_PUZZLES: Puzzle[] = [
  // ── 사랑방 ──
  { id: 'ep2-calendar', room: 'sarangbang', era: 'past', requires: [],
    hints: [
      '벽에 걸린 것을 살펴보자. 표식마다 뜻이 다를 것이다.',
      '8월 14일 ○, 15일 ●, 18일 ×. 지금은 뜻을 알 수 없다 — 다른 문서와 대조해 보자.',
    ] },

  { id: 'ep2-drawer', room: 'sarangbang', era: 'present', requires: [], answer: '5372',
    rewardItem: 'doc-letter',
    hints: [
      '병풍 네 폭에 계절이 있고, 각 폭에는 수놓인 사물이 있다.',
      '매화-봄, 물결-여름, 국화-가을, 학-겨울 순서로, 각 폭의 사물 개수(5·3·7·2)를 이어보자 — 5372.',
    ] },

  { id: 'ep2-radio', room: 'sarangbang', era: 'past', requires: [], answer: '711',
    rewardItem: 'matches',
    hints: [
      '신문 기사 본문에 채널 이름이 적혀 있다.',
      '기사 속 "표준방송"을 뒷면 편성표에서 찾아 주파수를 맞추자 — 711.',
    ] },

  { id: 'ep2-frame', room: 'sarangbang', era: 'present', requires: [],
    rewardItem: 'empty-envelope',
    hints: [
      '과거와 현재, 액자의 기울기가 다르다.',
      '기울어진 가훈 액자를 들춰보면 무언가 숨겨져 있을 것이다.',
    ] },

  { id: 'ep2-bookchest', room: 'sarangbang', era: 'past', requires: [], answer: 'ㅅ-ㅂ-ㄷ',
    rewardItems: ['doc-rumor', 'doc-jokbo', 'photo-1'],
    hints: [
      '책상 위 책 세 권에 Ⅰ·Ⅱ·Ⅲ 순서가 매겨져 있다.',
      '『샘터』『바다와 노인』『들꽃 도감』 — 각 제목 첫 글자의 자음을 순서대로: ㅅ-ㅂ-ㄷ.',
    ] },

  { id: 'ep2-photo', room: 'sarangbang', era: 'present',
    requires: ['ep2-bookchest', 'ep2-column', 'ep2-contradiction', 'ep2-toolwall'],
    requiresItems: ['photo-1', 'photo-2', 'photo-3', 'photo-4'],
    answer: 'assembled',
    rewardItem: 'photo-full',
    consumes: ['photo-1', 'photo-2', 'photo-3', 'photo-4'],
    hints: [
      '조각 네 개를 모으면 하나의 사진이 될 것 같다.',
      '4분면에 조각을 맞춰 넣어보자. 회전은 필요 없다.',
    ] },

  // ── 안방과 마루 ──
  { id: 'ep2-column', room: 'anbang', era: 'past', requires: [],
    rewardItems: ['photo-2', 'doc-scribble'],
    hints: [
      '기둥에 한자로 새겨진 눈금이 있다. 지금은 누가 누군지 알 수 없다.',
      '榮秀 175 / 榮浩 168 / 順伊 152 — 족보에서 이름의 뜻을 확인하면 실마리가 보일 것이다.',
    ] },

  { id: 'ep2-closet', room: 'anbang', era: 'present', requires: ['ep2-column', 'ep2-bookchest'], answer: '175',
    rewardItems: ['oil-bottle', 'embroidery'],
    hints: [
      '태그에는 "우리 큰아이가 마지막으로 잰 키"라 적혀 있다.',
      '족보(D7)로 榮秀가 장남임을 확인했다면, 기둥 눈금의 榮秀 175를 입력하자. 順伊는 사촌누이이니 함정이다.',
    ] },

  { id: 'ep2-sewingbox', room: 'anbang', era: 'past', requires: ['ep2-closet'], answer: '2-3-4-5',
    rewardItem: 'brass-key',
    hints: [
      '단추 네 개에 꽃이 각인되어 있고, 벽장 수틀에는 순서를 알려주는 문장이 있다.',
      '"작은 꽃부터 피운다" — 잎이 적은 순서(2·3·4·5장)로 단추를 누르자.',
    ] },

  { id: 'ep2-floor-creak', room: 'anbang', era: 'past', requires: [],
    hints: [
      '마루를 걸으며 소리를 들어보자.',
      '동쪽 세 번째 널만 삐걱이고 반짝인다 — 그 자리를 기억해두자.',
    ] },

  { id: 'ep2-floorboard', room: 'anbang', era: 'present', requires: ['ep2-floor-creak'],
    rewardItem: 'doc-diary',
    hints: [
      '과거에 삐걱이던 그 자리를 현재에서 다시 찾자.',
      '동쪽 세 번째 널빤지를 들추면 양철상자가 있다.',
    ] },

  // 모순 찾기: 확보한 문서들의 문장을 대조해 서로 어긋나는 한 쌍을 고른다.
  // 문장 번호는 해당 문서 docPages의 페이지(문장) 순번.
  // 정답 쌍: D5-1 (조서: "한 사람이, 맨손으로 물가로 달려갔다")
  //        ↔ D2-2 (벽보 소문: "두 형제가 함께 낚시 짐을 지고 저수지로 갔다")
  // — 인원수(한 명 vs 둘)와 짐(맨손 vs 낚시 짐)이 정면으로 어긋난다.
  // answer는 두 id를 오름차순 정렬한 형태('D2-2' < 'D5-1') — ContradictionPicker가 동일하게 정규화해 제출한다.
  { id: 'ep2-contradiction', room: 'anbang', era: 'present',
    requires: ['ep2-floorboard'], requiresItems: ['doc-diary', 'doc-report', 'doc-rumor'],
    answer: 'D2-2|D5-1',
    rewardItem: 'photo-3',
    hints: [
      '문서들이 말하는 그날 밤의 광경이 서로 다르다. 사람 수와 손에 든 것을 눈여겨보자.',
      '조서는 "한 사람이 맨손으로 달려갔다"고 하고, 벽보의 소문은 "둘이서 낚시 짐을 지고 갔다"고 한다 — 이 두 문장은 동시에 참일 수 없다.',
    ] },

  // ── 헛간과 마당 ──
  { id: 'ep2-shed-door', room: 'heotgan', era: 'past', requires: [],
    requiresItem: 'brass-key', consumes: ['brass-key'],
    hints: [
      '헛간이 굵은 자물쇠로 잠겨 있다.',
      '반짇고리에서 나온 놋쇠 열쇠를 써보자.',
    ] },

  { id: 'ep2-toolwall', room: 'heotgan', era: 'past', requires: ['ep2-shed-door'],
    rewardItems: ['photo-4', 'doc-report'],
    hints: [
      '벽에 그려진 도구 윤곽선과 실제로 걸린 도구를 비교해보자.',
      '윤곽은 다섯인데 실물은 셋 — 낚싯대 하나와 양동이만 자리가 비어 있다. 간 사람은 한 명이다.',
    ] },

  { id: 'ep2-toolbox', room: 'heotgan', era: 'present', requires: [], answer: '345',
    rewardItem: 'doc-note',
    hints: [
      '도구함 뚜껑에 세 가지 도형이 그려져 있다.',
      '삼각형·사각형·오각형 — 각 도형의 변의 개수를 이으면 345.',
    ] },

  { id: 'ep2-handwriting', room: 'heotgan',
    requires: ['ep2-toolbox'], requiresItems: ['doc-note', 'doc-letter', 'doc-scribble'],
    answer: 'youngho',
    hints: [
      '쪽지의 글씨체를 형과 아우, 둘 중 누구의 것과 비교해볼 수 있을까.',
      '세 글씨를 나란히 놓고 보자 — 편지는 반듯한 정자체(영수), 기둥 낙서(浩=영호)는 흘림체. 쪽지는 어느 쪽과 같은가?',
    ] },

  { id: 'ep2-watch-lid', room: 'heotgan',
    requires: ['ep2-closet'], requiresItem: 'oil-bottle',
    rewardItem: 'watch-open',
    hints: [
      '회중시계 뚜껑이 굳어 열리지 않는다.',
      '경첩에 기름을 쳐보자.',
    ] },

  { id: 'ep2-lantern', room: 'heotgan', era: 'past',
    requires: ['ep2-radio', 'ep2-shed-door'], requiresItem: 'oil-bottle',
    consumes: ['oil-bottle', 'matches'],
    hints: [
      '밤길에는 불이 필요하다.',
      '랜턴에 기름을 채우고 성냥으로 불을 붙이자.',
    ] },

  // ── 저수지 ──
  { id: 'ep2-timeline', room: 'reservoir', era: 'past',
    requires: ['ep2-photo', 'ep2-handwriting', 'ep2-contradiction', 'ep2-lantern', 'ep2-watch-lid', 'ep2-toolwall'],
    answer: '1-2-3-6-4-5-7',
    hints: [
      '일곱 조각을 시간 순서대로 놓아보자. 서두르지 말고 문서들이 말하는 순서를 따라가자.',
      '다툼(1) → 편지(2) → 영호 잠적(3) → 장비는 1인분(6) → 고함·맨손의 한 사람(4) → 시계가 멈춘 11:40(5) → 새벽 귀가(7).',
    ] },
];

export const EP2_CONFIG: EpisodeConfig = {
  id: 'ep2',
  saveKey: 'memory-box-save-ep2',
  puzzles: EP2_PUZZLES,
  items: EP2_ITEMS,
  finalPuzzles: { reservoir: 'ep2-timeline' },
  epilogueAt: 1,
  hubRoom: 'ep2-attic',
};
