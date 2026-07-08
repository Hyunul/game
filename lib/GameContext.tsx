'use client';
import { createContext, useContext, useEffect, useMemo, useReducer, useCallback, useRef, ReactNode } from 'react';
import { createGameReducer, initialState, GameState, Action, EP1_CONFIG } from './gameState';
import { EpisodeConfig } from './episode';
import { saveGame } from './save';
import { playSfx, initAudio } from './audio';
import { fx } from './effects';

const Ctx = createContext<{ state: GameState; dispatch: (a: Action) => void; episode: EpisodeConfig } | null>(null);

export function GameProvider({ children, episode = EP1_CONFIG }: { children: ReactNode; episode?: EpisodeConfig }) {
  const reducer = useMemo(() => createGameReducer(episode), [episode]);
  const [state, rawDispatch] = useReducer(reducer, initialState);
  const dispatch = useCallback((a: Action) => {
    initAudio();
    rawDispatch(a);
  }, []);
  useEffect(() => { if (state.phase !== 'title') saveGame(state, episode.saveKey); }, [state, episode.saveKey]);
  useEffect(() => {
    if (state.lastResult === 'correct') { playSfx('correct'); fx.correctPulse(); }
  }, [state.lastResult, state.solved.length]);
  // 오답음은 wrongAttempts '증가'에 반응 — lastResult('wrong'→'wrong')로는
  // 연속 오답을 감지할 수 없다. ref 비교로 resume 시 점프(0→N)에는 안 울린다.
  const prevWrongAttempts = useRef(state.wrongAttempts);
  useEffect(() => {
    if (state.wrongAttempts > prevWrongAttempts.current && state.lastResult === 'wrong') {
      playSfx('wrong');
    }
    prevWrongAttempts.current = state.wrongAttempts;
  }, [state.wrongAttempts, state.lastResult]);
  return <Ctx.Provider value={{ state, dispatch, episode }}>{children}</Ctx.Provider>;
}
export function useGame() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGame outside provider');
  return v;
}
