'use client';
import { useEffect, useRef, useState } from 'react';
import { GameProvider, useGame } from '../lib/GameContext';
import { loadGame, clearSave } from '../lib/save';
import { GameState } from '../lib/gameState';
import { EP2_CONFIG } from '../lib/puzzles-ep2';
import GameShell from '../components/GameShell';
import Attic from '../components/scenes/Attic';
import Room1Home from '../components/scenes/Room1Home';
import Room2Class from '../components/scenes/Room2Class';
import MemoryScene from '../components/MemoryScene';
import Room3Store from '../components/scenes/Room3Store';
import Epilogue from '../components/Epilogue';

function TitleScreen() {
  const { dispatch } = useGame();
  const [savedGame, setSavedGame] = useState<GameState | null>(null);

  useEffect(() => {
    setSavedGame(loadGame());
  }, []);

  function handleNewGame() {
    clearSave();
    dispatch({ type: 'START' });
  }

  function handleResume() {
    if (!savedGame) return;
    dispatch({ type: 'START', resume: savedGame });
  }

  return (
    <div style={titleStyles.page}>
      <div style={titleStyles.card}>
        <h1 style={titleStyles.title}>기억의 상자</h1>
        <p style={titleStyles.subtitle}>어른이 된 당신에게, 그 시절의 기억을</p>
        <div style={titleStyles.buttons}>
          <button style={titleStyles.btn} onClick={handleNewGame}>
            처음부터
          </button>
          {savedGame && (
            <button style={{ ...titleStyles.btn, ...titleStyles.btnSecondary }} onClick={handleResume}>
              이어하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Ep1InnerApp({ onStartEp2 }: { onStartEp2: (resume: boolean) => void }) {
  const { state } = useGame();

  if (state.phase === 'title') {
    return <TitleScreen />;
  }

  if (state.phase === 'memory') {
    return <MemoryScene />;
  }

  if (state.phase === 'epilogue') {
    return <Epilogue />;
  }

  if (state.room === 'attic' && (state.phase === 'prologue' || state.phase === 'playing')) {
    return <GameShell><Attic onStartEp2={onStartEp2} /></GameShell>;
  }

  if (state.room === 'home' && state.phase === 'playing') {
    return <GameShell><Room1Home /></GameShell>;
  }

  if (state.room === 'class' && state.phase === 'playing') {
    return <GameShell><Room2Class /></GameShell>;
  }

  if (state.room === 'store' && state.phase === 'playing') {
    return <GameShell><Room3Store /></GameShell>;
  }

  return (
    <GameShell>
      <div style={placeholderStyles.box}>
        <p style={placeholderStyles.text}>
          (장면 준비 중 — Room: {state.room}, Phase: {state.phase})
        </p>
      </div>
    </GameShell>
  );
}

function Ep1App({ onStartEp2 }: { onStartEp2: (resume: boolean) => void }) {
  return (
    <GameProvider>
      <Ep1InnerApp onStartEp2={onStartEp2} />
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

  if (state.phase === 'epilogue') {
    return (
      <GameShell onExitToHub={onExitToHub}>
        <div style={placeholderStyles.box}>
          <p style={placeholderStyles.text}>(에필로그 준비 중)</p>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell onExitToHub={onExitToHub}>
      <div style={placeholderStyles.box}>
        <p style={placeholderStyles.text}>
          (EP2 장면 준비 중 — {state.room} / {state.era})
        </p>
      </div>
    </GameShell>
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
  const [activeEpisode, setActiveEpisode] = useState<'ep1' | 'ep2'>('ep1');
  const [ep2Resume, setEp2Resume] = useState(false);

  function handleStartEp2(resume: boolean) {
    setEp2Resume(resume);
    setActiveEpisode('ep2');
  }

  function handleExitToHub() {
    setActiveEpisode('ep1');
  }

  if (activeEpisode === 'ep2') {
    return <Ep2App onExitToHub={handleExitToHub} resume={ep2Resume} />;
  }

  return <Ep1App onStartEp2={handleStartEp2} />;
}

const titleStyles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#1a1410',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    textAlign: 'center',
    color: '#e8d3a8',
    padding: '40px 32px',
  },
  title: {
    fontSize: 'clamp(2.4rem, 6vw, 4rem)',
    fontFamily: '"Georgia", "Batang", serif',
    fontWeight: 700,
    letterSpacing: '0.1em',
    marginBottom: '16px',
  },
  subtitle: {
    fontSize: '1rem',
    opacity: 0.7,
    marginBottom: '48px',
    fontStyle: 'italic',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    alignItems: 'center',
  },
  btn: {
    padding: '14px 48px',
    fontSize: '1rem',
    fontWeight: 600,
    backgroundColor: '#7a4f1e',
    color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.4)',
    borderRadius: '8px',
    cursor: 'pointer',
    minWidth: '200px',
    letterSpacing: '0.05em',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(232,211,168,0.4)',
  },
};

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
