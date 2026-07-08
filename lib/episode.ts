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
  /** 입장 조건이 있는 방 — resume 시 requires 미충족이면 fallback 방으로 되돌린다.
   *  (예: ep2 저수지는 밤 게이트 6퍼즐을 모두 풀어야 진입 가능. 게이트 수정 전
   *   저장이나 손상된 저장으로 조건 미달인 채 갇힌 방에서 시작하는 것 방지) */
  roomGates?: Record<string, { requires: string[]; fallback: AnyRoomId }>;
}
