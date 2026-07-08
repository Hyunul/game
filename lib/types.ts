export type RoomId = 'attic' | 'home' | 'class' | 'store';
export type Ep2RoomId = 'ep2-attic' | 'sarangbang' | 'anbang' | 'heotgan' | 'reservoir';
export type Ep3RoomId = 'ep3-attic' | 'madang' | 'geonneonbang' | 'bueok' | 'ep3-anbang';
export type AnyRoomId = RoomId | Ep2RoomId | Ep3RoomId;
export type Era = 'past' | 'present';

export type ItemId =
  | 'photo' | 'backscratcher' | 'sewingbox-key' | 'memo-anniversary'
  | 'pencilcase' | 'sheet-music' | 'chalk' | 'diary'
  | 'capsule' | 'coin-100' | 'coin-gacha';

export interface Item {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** 문서 아이템: 문서 뷰어로 전문을 열람할 수 있다 */
  doc?: boolean;
  /** 문서 전문 페이지 (doc: true일 때). 페이지 넘김 가능. */
  docPages?: string[];
}

export interface Puzzle {
  id: string;
  room: AnyRoomId;
  /** 이 퍼즐을 시도하려면 먼저 풀려 있어야 하는 퍼즐 id들 */
  requires: string[];
  /** 사용해야 하는 인벤토리 아이템 (없으면 undefined) */
  requiresItem?: string;
  /** 사용해야 하는 인벤토리 아이템들 (모두 보유해야 함) */
  requiresItems?: string[];
  /** 입력형 퍼즐의 정답 (클릭형이면 undefined) */
  answer?: string;
  /** 풀면 얻는 아이템 */
  rewardItem?: string;
  /** 풀면 얻는 아이템들 (rewardItem과 함께 사용 가능) */
  rewardItems?: string[];
  hints: [string, string];
  /** 지정 시 해당 시점에서만 canAttempt 통과 */
  era?: Era;
  /** 이 퍼즐 해결 시 용도를 다해 인벤토리에서 제거할 아이템.
      같은 아이템을 아직 필요로 하는 미해결 퍼즐이 있으면 그때까지 유지된다. */
  consumes?: string[];
}
