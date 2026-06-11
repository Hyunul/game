'use client';
import { useEffect, useState } from 'react';
import { GameProvider, useGame } from '../lib/GameContext';
import { loadGame, clearSave } from '../lib/save';
import { GameState } from '../lib/gameState';
import GameShell from '../components/GameShell';
import Attic from '../components/scenes/Attic';
import Room1Home from '../components/scenes/Room1Home';

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

function InnerApp() {
  const { state } = useGame();

  if (state.phase === 'title') {
    return <TitleScreen />;
  }

  if (state.room === 'attic' && (state.phase === 'prologue' || state.phase === 'playing')) {
    return <GameShell><Attic /></GameShell>;
  }

  if (state.room === 'home' && state.phase === 'playing') {
    return <GameShell><Room1Home /></GameShell>;
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

export default function Home() {
  return (
    <GameProvider>
      <InnerApp />
    </GameProvider>
  );
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
