import { Puzzle, Item, ItemId, RoomId } from './types';

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
  { id: 'class-board', room: 'class', requires: ['class-organ'], requiresItem: 'chalk',
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
