'use client';
import { useEffect, useRef, useState } from 'react';
import { GameProvider, useGame } from '../lib/GameContext';
import { loadGame } from '../lib/save';
import { EP2_CONFIG } from '../lib/puzzles-ep2';
import Hub, { EpisodeKey } from '../components/Hub';
import GameShell from '../components/GameShell';
import Attic from '../components/scenes/Attic';
import Room1Home from '../components/scenes/Room1Home';
import Room2Class from '../components/scenes/Room2Class';
import MemoryScene from '../components/MemoryScene';
import Room3Store from '../components/scenes/Room3Store';
import Epilogue from '../components/Epilogue';
import Ep2Prologue from '../components/scenes/ep2/Ep2Prologue';
import Sarangbang from '../components/scenes/ep2/Sarangbang';
import Anbang from '../components/scenes/ep2/Anbang';
import Heotgan from '../components/scenes/ep2/Heotgan';
import Reservoir from '../components/scenes/ep2/Reservoir';
import Ep2Epilogue from '../components/scenes/ep2/Ep2Epilogue';
import { eraTint, handleWatchUse } from '../components/scenes/ep2/era';
import { playBgm } from '../lib/audio';

function Ep1InnerApp({ onExitToHub, resume }: { onExitToHub: () => void; resume: boolean }) {
  const { state, dispatch } = useGame();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (resume) {
      const saved = loadGame();
      dispatch({ type: 'START', resume: saved ?? undefined });
    } else {
      dispatch({ type: 'START' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.phase === 'title') {
    return null; // START 디스패치 직전 한 프레임
  }

  if (state.phase === 'memory') {
    return <MemoryScene />;
  }

  if (state.phase === 'epilogue') {
    return <Epilogue onExitToHub={onExitToHub} />;
  }

  if (state.room === 'attic' && (state.phase === 'prologue' || state.phase === 'playing')) {
    return <GameShell onExitToHub={onExitToHub}><Attic /></GameShell>;
  }

  if (state.room === 'home' && state.phase === 'playing') {
    return <GameShell onExitToHub={onExitToHub}><Room1Home /></GameShell>;
  }

  if (state.room === 'class' && state.phase === 'playing') {
    return <GameShell onExitToHub={onExitToHub}><Room2Class /></GameShell>;
  }

  if (state.room === 'store' && state.phase === 'playing') {
    return <GameShell onExitToHub={onExitToHub}><Room3Store /></GameShell>;
  }

  return (
    <GameShell onExitToHub={onExitToHub}>
      <div style={placeholderStyles.box}>
        <p style={placeholderStyles.text}>
          (장면 준비 중 — Room: {state.room}, Phase: {state.phase})
        </p>
      </div>
    </GameShell>
  );
}

function Ep1App({ onExitToHub, resume }: { onExitToHub: () => void; resume: boolean }) {
  return (
    <GameProvider>
      <Ep1InnerApp onExitToHub={onExitToHub} resume={resume} />
    </GameProvider>
  );
}

function Ep2InnerApp({ onExitToHub, resume }: { onExitToHub: () => void; resume: boolean }) {
  const { state, dispatch } = useGame();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (resume) {
      const saved = loadGame(EP2_CONFIG.saveKey);
      dispatch({ type: 'START', resume: saved ?? undefined });
    } else {
      dispatch({ type: 'START' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.phase === 'prologue') {
    return <Ep2Prologue />;
  }

  if (state.phase === 'epilogue') {
    return <Ep2Epilogue onExitToHub={onExitToHub} />;
  }

  if (state.room === 'sarangbang' && state.phase === 'playing') {
    return (
      <GameShell onExitToHub={onExitToHub}>
        <Sarangbang />
      </GameShell>
    );
  }

  if (state.room === 'anbang' && state.phase === 'playing') {
    return (
      <GameShell onExitToHub={onExitToHub}>
        <Anbang />
      </GameShell>
    );
  }

  if (state.room === 'heotgan' && state.phase === 'playing') {
    return (
      <GameShell onExitToHub={onExitToHub}>
        <Heotgan />
      </GameShell>
    );
  }

  if (state.room === 'reservoir' && state.phase === 'playing') {
    return (
      <GameShell onExitToHub={onExitToHub}>
        <Reservoir />
      </GameShell>
    );
  }

  return (
    <GameShell onExitToHub={onExitToHub}>
      <Ep2PlayingPlaceholder />
    </GameShell>
  );
}

function Ep2PlayingPlaceholder() {
  const { state, dispatch } = useGame();

  useEffect(() => {
    playBgm(state.era === 'past' ? 'ep2-past' : 'ep2-present');
  }, [state.era]);

  function handleClick() {
    handleWatchUse(state, dispatch);
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} onClick={handleClick}>
      <div style={placeholderStyles.box}>
        <p style={placeholderStyles.text}>
          (EP2 장면 준비 중 — {state.room} / {state.era})
        </p>
      </div>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: eraTint(state.era),
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function Ep2App({ onExitToHub, resume }: { onExitToHub: () => void; resume: boolean }) {
  return (
    <GameProvider episode={EP2_CONFIG}>
      <Ep2InnerApp onExitToHub={onExitToHub} resume={resume} />
    </GameProvider>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<'hub' | EpisodeKey>('hub');
  const [resume, setResume] = useState(false);

  function handleSelect(ep: EpisodeKey, res: boolean) {
    setResume(res);
    setScreen(ep);
  }

  function handleExitToHub() {
    setScreen('hub');
  }

  if (screen === 'ep1') {
    return <Ep1App onExitToHub={handleExitToHub} resume={resume} />;
  }

  if (screen === 'ep2') {
    return <Ep2App onExitToHub={handleExitToHub} resume={resume} />;
  }

  return <Hub onSelect={handleSelect} />;
}

const placeholderStyles: Record<string, React.CSSProperties> = {
  box: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'rgba(232,211,168,0.5)',
    fontSize: '0.9rem',
    fontFamily: 'monospace',
  },
};
