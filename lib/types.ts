export type RoomId = 'attic' | 'home' | 'class' | 'store';
export type Ep2RoomId = 'ep2-attic' | 'sarangbang' | 'anbang' | 'heotgan' | 'reservoir';
export type AnyRoomId = RoomId | Ep2RoomId;
export type Era = 'past' | 'present';

export type ItemId =
  | 'photo' | 'backscratcher' | 'sewingbox-key' | 'memo-anniversary'
  | 'pencilcase' | 'sheet-music' | 'chalk' | 'diary'
  | 'capsule' | 'coin-100' | 'coin-gacha';

export interface Item { id: string; name: string; icon: string; desc: string; }

export interface Puzzle {
  id: string;
  room: AnyRoomId;
  /** 이 퍼즐을 시도하려면 먼저 풀려 있어야 하는 퍼즐 id들 */
  requires: string[];
  /** 사용해야 하는 인벤토리 아이템 (없으면 undefined) */
  requiresItem?: string;
  /** 입력형 퍼즐의 정답 (클릭형이면 undefined) */
  answer?: string;
  /** 풀면 얻는 아이템 */
  rewardItem?: string;
  hints: [string, string];
  /** 지정 시 해당 시점에서만 canAttempt 통과 */
  era?: Era;
}
