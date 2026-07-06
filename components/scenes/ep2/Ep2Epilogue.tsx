'use client';
import { useEffect, useState, useCallback } from 'react';
import { stopBgm, playSfx } from '../../../lib/audio';
import { fx } from '../../../lib/effects';

const PART_A_LINES = [
  '그날 밤, 물에 빠진 것은 영호였다.',
  '형 영수는 맨몸으로 뛰어들어, 동생을 물 밖으로 밀어 올렸다.',
  '그리고 형은, 그 여름 속에 남았다.',
];

const PART_B_LINES = [
  '낚싯대 하나, 양동이 하나 — 그리고 맨손의 한 사람.',
  '형은 동생을 살리고, 소문 속에 잠들었다.',
  '…아버지께 전화를 걸었다.',
  '"아버지… 큰아버지 이야기, 이제 알 것 같아요."',
  '"…그 밤 이야기를, 이제야 하는구나."',
];

interface Props {
  onExitToHub: () => void;
}

export default function Ep2Epilogue({ onExitToHub }: Props) {
  const [part, setPart] = useState<'A' | 'B'>('A');
  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);

  const lines = part === 'A' ? PART_A_LINES : PART_B_LINES;
  const allVisible = visibleCount >= lines.length;

  const revealAll = useCallback(() => {
    setVisibleCount(lines.length);
  }, [lines.length]);

  // Part A mount: shard sfx + particles, stop bgm
  useEffect(() => {
    if (part === 'A') {
      stopBgm();
      playSfx('shard');
      fx.shardParticles();
    }
  }, [part]);

  useEffect(() => {
    if (visibleCount >= lines.length) {
      const t = setTimeout(() => setShowButton(true), 700);
      return () => clearTimeout(t);
    }
    const delay = visibleCount === 0 ? 1000 : 1400;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [visibleCount, lines.length]);

  function handleContinue() {
    setPart('B');
    setVisibleCount(0);
    setShowButton(false);
  }

  function handleExit() {
    stopBgm();
    onExitToHub();
  }

  return (
    <div style={styles.overlay} onClick={allVisible ? undefined : revealAll} role="presentation">
      <div style={styles.vignette} />
      <style>{keyframes}</style>

      <div style={styles.inner}>
        {part === 'A' ? (
          <div style={styles.svgWrap}>
            <svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" style={styles.svg}>
              {/* Night sky */}
              <rect x="0" y="0" width="600" height="180" fill="#0e1a3a" />
              <circle cx="480" cy="60" r="26" fill="#f0edd8" opacity="0.9" />
              {/* Water */}
              <rect x="0" y="180" width="600" height="120" fill="#16254a" />
              <path d="M0 195 Q150 185 300 195 T600 195" stroke="#2a3f6e" strokeWidth="2" fill="none" opacity="0.6" />
              <path d="M0 220 Q150 210 300 220 T600 220" stroke="#2a3f6e" strokeWidth="2" fill="none" opacity="0.5" />

              {/* Silhouette: 아래 손이 위 손을 밀어 올린다 (얼굴/구체적 묘사 없음) */}
              <g style={{ animation: 'liftHands 3.5s ease-in-out infinite' }}>
                <ellipse cx="300" cy="245" rx="14" ry="30" fill="#050810" opacity="0.85" />
                <ellipse cx="300" cy="195" rx="12" ry="24" fill="#050810" opacity="0.9" />
              </g>
              <path
                d="M292 232 Q300 210 300 190"
                stroke="#050810"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                opacity="0.9"
                style={{ animation: 'liftArm 3.5s ease-in-out infinite' }}
              />

              {/* Glow at surface */}
              <ellipse cx="300" cy="196" rx="30" ry="8" fill="#ffd24a" opacity="0.25" />
            </svg>
          </div>
        ) : (
          <div style={styles.svgWrap}>
            <svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" style={styles.svg}>
              {/* Dim attic */}
              <rect x="0" y="0" width="600" height="300" fill="#1a1410" />
              <circle cx="300" cy="70" r="22" fill="#2a1e14" stroke="#5a3e26" strokeWidth="3" />
              <circle cx="300" cy="70" r="16" fill="#c8a96e" opacity="0.2" />
              {/* Phone motif */}
              <rect x="270" y="150" width="60" height="90" rx="8" fill="#3a2810" stroke="#5a3e26" strokeWidth="2" />
              <circle cx="300" cy="230" r="4" fill="#8a5a33" />
              <path
                d="M280 160 Q300 145 320 160"
                stroke="#ffd24a"
                strokeWidth="2"
                fill="none"
                opacity="0.6"
                style={{ animation: 'ringPulse 2s ease-in-out infinite' }}
              />
            </svg>
          </div>
        )}

        <div style={styles.linesWrap}>
          {lines.map((line, i) => (
            <p
              key={i}
              style={{
                ...styles.line,
                opacity: i < visibleCount ? 1 : 0,
                transform: i < visibleCount ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity 0.9s ease, transform 0.9s ease',
              }}
            >
              {line}
            </p>
          ))}
        </div>

        <div
          style={{
            ...styles.btnWrap,
            opacity: showButton ? 1 : 0,
            pointerEvents: showButton ? 'auto' : 'none',
            transition: 'opacity 0.8s ease',
          }}
        >
          {part === 'A' ? (
            <button style={styles.btn} onClick={handleContinue}>
              계속
            </button>
          ) : (
            <button style={styles.btn} onClick={handleExit}>
              다락방으로
            </button>
          )}
        </div>

        {!allVisible && <p style={styles.skipHint}>화면을 클릭하면 건너뜁니다</p>}
      </div>
    </div>
  );
}

const keyframes = `
@keyframes liftHands {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-14px); }
}
@keyframes liftArm {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
@keyframes ringPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.9; }
}
`;

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#0e0b08',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    cursor: 'default',
  },
  vignette: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.80) 100%)',
    pointerEvents: 'none',
  },
  inner: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    padding: '32px 24px',
    width: 'min(680px, 94vw)',
  },
  svgWrap: {
    width: '100%',
    maxWidth: '520px',
  },
  svg: {
    width: '100%',
    height: 'auto',
    display: 'block',
    borderRadius: '8px',
  },
  linesWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    minHeight: '110px',
  },
  line: {
    color: '#d8c4a0',
    fontFamily: '"Georgia", "Batang", serif',
    fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
    lineHeight: 1.8,
    textAlign: 'center',
    margin: 0,
    willChange: 'opacity, transform',
  },
  btnWrap: {
    marginTop: '8px',
  },
  btn: {
    padding: '12px 48px',
    fontSize: '1rem',
    fontWeight: 600,
    backgroundColor: 'transparent',
    color: '#d8c4a0',
    border: '1px solid rgba(216,196,160,0.5)',
    borderRadius: '8px',
    cursor: 'pointer',
    letterSpacing: '0.1em',
    fontFamily: '"Georgia", "Batang", serif',
  },
  skipHint: {
    position: 'absolute' as const,
    bottom: '8px',
    right: '16px',
    color: 'rgba(216,196,160,0.3)',
    fontSize: '0.72rem',
    margin: 0,
    pointerEvents: 'none',
  },
};
