'use client';
import { createContext, useContext, useEffect, useMemo, useReducer, useCallback, ReactNode } from 'react';
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
    if (state.lastResult === 'wrong') playSfx('wrong');
  }, [state.lastResult, state.solved.length]);
  return <Ctx.Provider value={{ state, dispatch, episode }}>{children}</Ctx.Provider>;
}
export function useGame() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGame outside provider');
  return v;
}
