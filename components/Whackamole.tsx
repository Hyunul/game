'use client';
import { useEffect, useRef, useState } from 'react';
import { playSfx } from '../lib/audio';

interface Props {
  open: boolean;
  onClear: () => void;
  onClose: () => void;
}

const TOTAL = 5;
const COLS = 3;
const ROWS = 3;

export default function Whackamole({ open, onClear, onClose }: Props) {
  const [moleIndex, setMoleIndex] = useState<number | null>(null);
  const [caught, setCaught] = useState(0);
  const [bouncing, setBouncing] = useState<number | null>(null);
  const [cleared, setCleared] = useState(false);

  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (popTimer.current) clearTimeout(popTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    popTimer.current = null;
    hideTimer.current = null;
  }

  function scheduleMole() {
    clearTimers();
    popTimer.current = setTimeout(() => {
      const idx = Math.floor(Math.random() * 9);
      setMoleIndex(idx);
      hideTimer.current = setTimeout(() => {
        setMoleIndex(null);
        scheduleMole();
      }, 700);
    }, 800);
  }

  // Start/stop game loop
  useEffect(() => {
    if (!open) {
      clearTimers();
      setCaught(0);
      setMoleIndex(null);
      setBouncing(null);
      setCleared(false);
      return;
    }
    scheduleMole();
    return clearTimers;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleHit(idx: number) {
    if (moleIndex !== idx || cleared) return;
    playSfx('click');
    setMoleIndex(null);
    setBouncing(idx);
    clearTimers();

    const next = caught + 1;
    setCaught(next);
    setTimeout(() => setBouncing(null), 300);

    if (next >= TOTAL) {
      playSfx('correct');
      setCleared(true);
      onClear();
    } else {
      scheduleMole();
    }
  }

  if (!open) return null;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.card} onClick={(e) => e.stopPropagation()}>
        <button style={S.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={S.title}>두더지 잡기!</h2>
        <p style={S.score}>잡은 두더지: {caught}/{TOTAL}</p>

        {/* Grid */}
        <div style={S.grid}>
          {Array.from({ length: ROWS * COLS }).map((_, i) => {
            const isMole = moleIndex === i;
            const isBounce = bouncing === i;
            return (
              <div
                key={i}
                style={S.hole}
                onClick={() => handleHit(i)}
                role="button"
                aria-label={`구멍 ${i + 1}`}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleHit(i)}
              >
                {isMole && (
                  <div style={{ ...S.mole, ...(isBounce ? S.bounce : {}) }}>
                    🐹
                  </div>
                )}
                {isBounce && !isMole && (
                  <div style={{ ...S.mole, ...S.bounce }}>⭐</div>
                )}
              </div>
            );
          })}
        </div>

        {cleared && (
          <div style={S.codeBox}>
            <div style={S.codeLabel}>CODE:</div>
            <div style={S.codeValue}>24</div>
            <button style={S.doneBtn} onClick={onClose}>닫기</button>
          </div>
        )}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(10,6,2,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
  },
  card: {
    backgroundColor: '#1a1a2e',
    border: '2px solid #f9c74f',
    borderRadius: '16px',
    padding: '28px 32px',
    maxWidth: '340px',
    width: '90%',
    position: 'relative',
    color: '#f9c74f',
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '14px',
    background: 'none',
    border: 'none',
    color: '#f9c74f',
    fontSize: '1.1rem',
    cursor: 'pointer',
    opacity: 0.7,
    padding: '4px',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 700,
    marginBottom: '8px',
  },
  score: {
    fontSize: '0.95rem',
    marginBottom: '16px',
    opacity: 0.85,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  hole: {
    width: '70px',
    height: '70px',
    backgroundColor: '#2d1b00',
    borderRadius: '50%',
    border: '3px solid #5a3810',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '2rem',
    margin: '0 auto',
    userSelect: 'none',
  },
  mole: {
    display: 'inline-block',
    fontSize: '2rem',
    lineHeight: 1,
    transition: 'transform 0.1s',
  },
  bounce: {
    transform: 'scale(1.4)',
  },
  codeBox: {
    marginTop: '8px',
    backgroundColor: '#0d0d1a',
    border: '2px solid #f9c74f',
    borderRadius: '12px',
    padding: '20px',
  },
  codeLabel: {
    fontSize: '1rem',
    opacity: 0.7,
    marginBottom: '4px',
    letterSpacing: '0.2em',
  },
  codeValue: {
    fontSize: '3rem',
    fontWeight: 900,
    color: '#ffd24a',
    letterSpacing: '0.3em',
    marginBottom: '16px',
  },
  doneBtn: {
    padding: '10px 32px',
    fontSize: '1rem',
    fontWeight: 600,
    backgroundColor: '#f9c74f',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
