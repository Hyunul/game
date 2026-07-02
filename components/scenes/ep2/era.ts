import { GameState, Action } from '../../../lib/gameState';
import { playSfx, playBgm } from '../../../lib/audio';
import { fx } from '../../../lib/effects';

/** 현재 시점 색조 오버레이 — 차갑고 바랜 회갈색 */
export const PRESENT_TINT = 'rgba(90,95,105,0.18)';
/** 과거 시점 색조 오버레이 — 따뜻한 여름 톤 */
export const PAST_TINT = 'rgba(255,190,80,0.10)';

export function eraTint(era: GameState['era']): string {
  return era === 'past' ? PAST_TINT : PRESENT_TINT;
}

/**
 * 인벤토리에서 회중시계가 선택된 상태에서 장면을 클릭하면 시점을 전환한다.
 * 처리했으면 true를 반환 — 각 장면은 배경/어디든 클릭 핸들러 맨 앞에서 호출한다.
 */
export function handleWatchUse(state: GameState, dispatch: (a: Action) => void): boolean {
  if (state.selectedItem !== 'pocket-watch') return false;
  playSfx('tick');
  fx.roomTransition();
  dispatch({ type: 'TOGGLE_ERA' });
  dispatch({ type: 'SELECT_ITEM', itemId: null });
  const newEra = state.era === 'past' ? 'present' : 'past';
  playBgm(newEra === 'past' ? 'ep2-past' : 'ep2-present');
  return true;
}
