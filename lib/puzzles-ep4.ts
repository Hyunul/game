import { Puzzle, Item } from './types';
import { EpisodeConfig } from './episode';

// ── ep4 「사라진 목소리」 답 규약 메모 ──
// ep4-belt     : BeltRouting 완성 시 'routed' 자동 제출
// ep4-radio    : FrequencyDial 89.1MHz 정조준 시 '891' 자동 제출
// ep4-speed    : SpeedSwitch 33rpm 재생 완료 시 '33' 자동 제출
// ep4-counter  : TapeDeck 카운터 042 되감기 재생 완료 시 '042' 자동 제출
// ep4-ring     : PatternRing 3링 정렬 시 'aligned' 자동 제출
// ep4-calendar : CalendarMatch 도장 3쌍 매칭 시 'matched' 자동 제출
// ep4-jagae    : NameLock 음절 세 개 — '은-방-울'
// ep4-knock    : KnockRhythm 탭 간격 판정 — '장-장-단-단-장'
// ep4-eggwall  : 클릭형 (answer 없음)
// ep4-eq       : EqualizerBars 3밴드 정합 시 'clean' 자동 제출
// ep4-rx       : 처방전 규칙 → 진단일 10월 2일 — Keypad '1002'
// ep4-splice   : SpliceEditor 접합 순서 — '3-1-4-2-5'
// ep4-booth    : 녹음 큐 순서(OrderPicker) — '2-1-3'
// ep4-relisten : 클릭형 — 클린 모드로 042 재청취 (TapeDeck에서 자동)
// ep4-numbers  : NumberBoard 빠진 나이 — 'missing-35'
// ep4-lasttape : 데크에 걸린 테이프 복원 — 'restored'
// ep4-final    : TapeDeck 카운터 035 되감기 — '035'
// 서사 고정값: 생일 10/4, 진단일 10/2, 예명 은방울, 주파수 89.1,
//   테이프 번호 = 생일 나이 007·010·015·020·025·030·040 + 빈 라벨(=035)

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
    desc: '방송국 앞, 젊은 어머니. 뒷면에 날짜가 적혀 있다.', doc: true,
    docPages: ['뒷면. "10월 4일. 결과 발표는 이틀 전에 들었다. 그래도 갔다." — 발표를 듣고도 간 곳. 그날은 누구의 생일이던가.'],
  },
  'pill-bag': {
    id: 'pill-bag', name: '약봉투', icon: '💊',
    desc: '이름 없는 약봉투 세 장. 날짜 도장이 찍혀 있다.', doc: true,
    docPages: ['날짜 도장: 9월 4일, 9월 18일, 9월 25일. 간격이 점점 좁아진다.'],
  },
  'rx-bundle': {
    id: 'rx-bundle', name: '처방전 묶음', icon: '📄',
    desc: '약 이름이 기호로만 적힌 처방전. 맨 위 장, 무언가 적으려다 지운 자리가 있다.', doc: true,
    docPages: [
      '기호 ●는 사흘 간격, ▲는 이레 간격 복용. 첫 복용일에서 간격만큼 거꾸로 세면 처방일이 나온다.',
      '두 번째 장: ● 첫 복용 10월 5일. ▲ 첫 복용 10월 9일. 둘 다 같은 처방일에서 시작됐다.',
    ],
  },
  'knock-note': {
    id: 'knock-note', name: '노크 쪽지', icon: '🚪',
    desc: '자개장 속 쪽지. "골방 신호, 잊지 말 것." 리듬은 테이프 어딘가에서 들었다.',
  },
  'reel-box': {
    id: 'reel-box', name: '릴 원본 상자', icon: '🎞️',
    desc: '계란판 벽감 속 릴 테이프들. 겉에 아무 표시가 없다.',
  },
  'tape-scraps': {
    id: 'tape-scraps', name: '끊어진 테이프 조각', icon: '✂️',
    desc: '다섯 토막. 이어 붙이면 무언가 들릴 것이다.',
  },
  'audition-tape': {
    id: 'audition-tape', name: '복원된 오디션 테이프', icon: '📼',
    desc: '이어 붙인 테이프. 릴 가장자리에 연필로 쓴 숫자 — "203". 데크 카운터 자리일 것이다.',
  },
  'tape-035': {
    id: 'tape-035', name: '숫자 없는 테이프', icon: '📼',
    desc: '상자 맨 아래, 라벨이 비어 있는 테이프 하나. 몇 번이어야 했을까.',
  },
};

export const EP4_PUZZLES: Puzzle[] = [
  // ── 1막: 마루 (소리 계열) ──
  {
    id: 'ep4-belt', room: 'ep4-maru', requires: [], answer: 'routed',
    rewardItem: 'note-counter',
    hints: ['데크 뒷판의 벨트가 끊어져 늘어져 있다. 모터와 풀리 두 개를 한 바퀴로 이어야 한다.',
      '모터 → 왼쪽 풀리 → 오른쪽 풀리 순서로, 릴이 시계 방향으로 돌게 걸어라.'],
  },
  {
    id: 'ep4-postcards', room: 'ep4-maru', requires: [], rewardItem: 'postcard-pile',
    hints: ['라디오 아래 서랍이 살짝 열려 있다.', '서랍 속 엽서 뭉치를 집어라.'],
  },
  {
    id: 'ep4-radio', room: 'ep4-maru', requires: [], requiresItem: 'postcard-pile', answer: '891',
    hints: ['엽서 뭉치 앞면 귀퉁이에 방송국 주파수가 인쇄되어 있다.',
      '다이얼을 89.1에 정확히 맞춰라. 지직음이 걷히면 드라마 재방송이 나온다.'],
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
  // ── 1막: 안방 (문서 계열) ──
  {
    id: 'ep4-ring', room: 'ep4-anbang', requires: [], answer: 'aligned',
    rewardItem: 'photo-audition',
    hints: ['화장대 서랍의 자개 꽃문양이 세 링으로 어긋나 있다.',
      '꽃잎이 이어지도록 각 링을 돌려라. 바깥 링의 금 간 꽃잎이 기준이다.'],
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
  // ── 골방 게이트 (마루의 골방 문) ──
  {
    id: 'ep4-knock', room: 'ep4-maru', requires: ['ep4-speed', 'ep4-calendar', 'ep4-jagae'],
    requiresItem: 'knock-note', answer: '장-장-단-단-장',
    hints: ['쪽지는 "리듬은 테이프 어딘가에서"라 했다. 라디오를 맞춘 뒤 해금된 구간을 들어봤나?',
      '카운터 118 구간의 신호 — 길게 둘, 짧게 둘, 길게 하나. 문을 그 리듬으로 두드려라.'],
  },
  // ── 2막: 골방 ──
  {
    id: 'ep4-eggwall', room: 'ep4-golbang', requires: [],
    rewardItems: ['reel-box', 'tape-scraps', 'tape-035'],
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
    answer: '3-1-4-2-5', rewardItem: 'audition-tape', consumes: ['tape-scraps'],
    hints: ['조각마다 첫 마디와 끝 마디 자막이 보인다. 문장이 이어지게 붙여라.',
      '"수험번호…"로 시작하는 조각이 첫 번째가 아니다 — 무음 리더 띠가 붙은 조각이 맨 앞이다.'],
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
  saveKey: 'memory-box-save-ep4',
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
