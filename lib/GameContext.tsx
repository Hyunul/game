'use client';
import { createContext, useContext, useEffect, useReducer, useCallback, ReactNode } from 'react';
import { reducer, initialState, GameState, Action } from './gameState';
import { saveGame } from './save';
import { playSfx, initAudio } from './audio';
import { fx } from './effects';

const Ctx = createContext<{ state: GameState; dispatch: (a: Action) => void } | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, initialState);
  const dispatch = useCallback((a: Action) => {
    initAudio();
    rawDispatch(a);
  }, []);
  useEffect(() => { if (state.phase !== 'title') saveGame(state); }, [state]);
  useEffect(() => {
    if (state.lastResult === 'correct') { playSfx('correct'); fx.correctPulse(); }
    if (state.lastResult === 'wrong') playSfx('wrong');
  }, [state.lastResult, state.solved.length]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}
export function useGame() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGame outside provider');
  return v;
}
