import { Puzzle, Item, AnyRoomId } from './types';

export interface EpisodeConfig {
  id: 'ep1' | 'ep2' | 'ep3';
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
