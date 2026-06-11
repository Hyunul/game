'use client';
import { useState, ReactNode } from 'react';
import { useGame } from '../lib/GameContext';
import { setMuted, isMuted } from '../lib/audio';
import { clearSave } from '../lib/save';
import Inventory from './Inventory';
import HintModal from './HintModal';

const ROOM_NAMES: Record<string, string> = {
  attic: '다락방',
  home: '옛날 우리 집',
  class: '초등학교 교실',
  store: '학교 앞 문방구',
};

interface Props {
  children: ReactNode;
}

export default function GameShell({ children }: Props) {
  const { state, dispatch } = useGame();
  const [hintOpen, setHintOpen] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());

  function handleMuteToggle() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  function handleReset() {
    if (confirm('처음부터 시작할까요?')) {
      clearSave();
      dispatch({ type: 'RESET' });
    }
  }

  return (
    <div style={styles.page}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <span style={styles.roomName}>{ROOM_NAMES[state.room] ?? state.room}</span>
        <div style={styles.topControls}>
          <button style={styles.iconBtn} onClick={() => setHintOpen(true)} title="힌트" aria-label="힌트">
            💡
          </button>
          <button style={styles.iconBtn} onClick={handleMuteToggle} title={muted ? '음소거 해제' : '음소거'} aria-label={muted ? '음소거 해제' : '음소거'}>
            {muted ? '🔇' : '🔊'}
          </button>
          <button style={styles.iconBtn} onClick={handleReset} title="처음부터" aria-label="메뉴">
            ⚙️
          </button>
        </div>
      </div>

      {/* Scene area */}
      <div style={styles.sceneWrapper}>
        <div style={styles.scene}>
          {children}
        </div>
      </div>

      {/* Inventory (fixed bottom) */}
      <Inventory />

      {/* Hint modal */}
      <HintModal open={hintOpen} onClose={() => setHintOpen(false)} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#1a1410',
    color: '#e8d3a8',
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    backgroundColor: 'rgba(10,6,2,0.85)',
    borderBottom: '1px solid rgba(232,211,168,0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 30,
  },
  roomName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#e8d3a8',
    letterSpacing: '0.04em',
  },
  topControls: {
    display: 'flex',
    gap: '4px',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.3rem',
    cursor: 'pointer',
    padding: '6px 8px',
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    color: 'inherit',
  },
  sceneWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflowX: 'auto',
    padding: '16px 0 80px',
  },
  scene: {
    width: '100%',
    maxWidth: '960px',
    aspectRatio: '2 / 1',
    position: 'relative',
    backgroundColor: '#100c08',
    flexShrink: 0,
  },
};
