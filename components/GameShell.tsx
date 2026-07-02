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
  sarangbang: '사랑방',
  anbang: '안방과 마루',
  heotgan: '헛간과 마당',
  reservoir: '저수지 가는 길',
  'ep2-attic': '다락방',
};

interface Props {
  children: ReactNode;
  onExitToHub?: () => void;
}

export default function GameShell({ children, onExitToHub }: Props) {
  const { state, dispatch, episode } = useGame();
  const [hintOpen, setHintOpen] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const isEp2 = episode.id === 'ep2';

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

  function handleEp2Menu() {
    if (confirm('다락방 허브로 나갈까요? (진행은 저장됩니다)')) {
      onExitToHub?.();
    }
  }

  return (
    <div style={styles.page}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.roomInfo}>
          <span style={styles.roomName}>{ROOM_NAMES[state.room] ?? state.room}</span>
          {isEp2 && (
            <span style={styles.eraBadge}>
              {state.era === 'past' ? '1978년 여름' : '현재'}
            </span>
          )}
        </div>
        <div style={styles.topControls}>
          <button style={styles.iconBtn} onClick={() => setHintOpen(true)} title="힌트" aria-label="힌트">
            💡
          </button>
          <button style={styles.iconBtn} onClick={handleMuteToggle} title={muted ? '음소거 해제' : '음소거'} aria-label={muted ? '음소거 해제' : '음소거'}>
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            style={styles.iconBtn}
            onClick={isEp2 ? handleEp2Menu : handleReset}
            title={isEp2 ? '허브로 나가기' : '처음부터'}
            aria-label={isEp2 ? '허브로 나가기' : '처음부터'}
          >
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
  roomInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  roomName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#e8d3a8',
    letterSpacing: '0.04em',
  },
  eraBadge: {
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,210,74,0.15)',
    border: '1px solid rgba(255,210,74,0.4)',
    color: '#ffd24a',
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
