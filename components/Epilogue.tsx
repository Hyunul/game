'use client';
import { useEffect, useState, useCallback } from 'react';
import { stopBgm, playBgm, playSfx } from '../lib/audio';
import { fx } from '../lib/effects';
import { clearSave } from '../lib/save';

const LINES: { text: string; dim?: boolean }[] = [
  { text: '방을 탈출한 게 아니었다.' },
  { text: '잊고 있던 나를, 다시 만난 것이었다.' },
  { text: '상자를 닫으며, 나는 조금 울었다. 그리고 웃었다.' },
  { text: '— 기억의 상자 —', dim: true },
];

export default function Epilogue() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const allVisible = visibleCount >= LINES.length;

  const revealAll = useCallback(() => {
    setVisibleCount(LINES.length);
  }, []);

  // On mount: stop bgm, play sfx, trigger particles; after ~3s start soft attic bgm
  useEffect(() => {
    stopBgm();
    playSfx('shard');
    fx.shardParticles();
    const t = setTimeout(() => playBgm('attic'), 3000);
    return () => clearTimeout(t);
  }, []);

  // Sequential line reveal starting after 3s convergence (~1.4s apart)
  useEffect(() => {
    if (visibleCount >= LINES.length) {
      const t = setTimeout(() => setShowButton(true), 700);
      return () => clearTimeout(t);
    }
    const delay = visibleCount === 0 ? 3200 : 1400;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [visibleCount]);

  function handleRestart() {
    clearSave();
    stopBgm();
    window.location.reload();
  }

  return (
    <div
      style={styles.overlay}
      onClick={allVisible ? undefined : revealAll}
      role="presentation"
    >
      {/* Vignette */}
      <div style={styles.vignette} />

      {/* Keyframe styles injected once */}
      <style>{keyframes}</style>

      <div style={styles.inner}>
        {/* Box + shards SVG */}
        <div style={styles.svgWrap}>
          <svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" style={styles.svg}>
            {/* Box body */}
            <rect x="190" y="190" width="220" height="90" rx="6" fill="#3a2810" />
            {/* Box lid (open, tilted back) */}
            <path d="M190 190 Q300 140 410 190" stroke="#5a3a18" strokeWidth="3" fill="#4a3015" />
            {/* Box interior shadow */}
            <rect x="196" y="195" width="208" height="80" rx="4" fill="#2a1a08" />

            {/* Shard 1 — left */}
            <polygon
              points="260,170 270,130 280,170"
              fill="#d4a820"
              opacity="0.9"
              style={{ animation: 'shardDrift1 3s ease-in forwards' }}
            />
            {/* Shard 2 — center */}
            <polygon
              points="294,165 300,120 306,165"
              fill="#e8c040"
              opacity="0.95"
              style={{ animation: 'shardDrift2 3s ease-in forwards' }}
            />
            {/* Shard 3 — right */}
            <polygon
              points="320,170 330,130 340,170"
              fill="#c89e18"
              opacity="0.9"
              style={{ animation: 'shardDrift3 3s ease-in forwards' }}
            />

            {/* Light orb (appears after convergence) */}
            <circle
              cx="300"
              cy="100"
              r="18"
              fill="#fff8d0"
              style={{ animation: 'orbAppear 1s 3s ease-out both' }}
            />
            <circle
              cx="300"
              cy="100"
              r="30"
              fill="none"
              stroke="#ffe060"
              strokeWidth="2"
              opacity="0.5"
              style={{ animation: 'orbGlow 2s 3s ease-in-out infinite alternate' }}
            />
          </svg>
        </div>

        {/* Narration lines */}
        <div style={styles.linesWrap}>
          {LINES.map((line, i) => (
            <p
              key={i}
              style={{
                ...styles.line,
                ...(line.dim ? styles.lineDim : {}),
                opacity: i < visibleCount ? 1 : 0,
                transform: i < visibleCount ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity 0.9s ease, transform 0.9s ease',
              }}
            >
              {line.text}
            </p>
          ))}
        </div>

        {/* Restart button */}
        <div
          style={{
            ...styles.btnWrap,
            opacity: showButton ? 1 : 0,
            pointerEvents: showButton ? 'auto' : 'none',
            transition: 'opacity 0.8s ease',
          }}
        >
          <button style={styles.btn} onClick={handleRestart}>
            처음으로
          </button>
        </div>

        {/* Skip hint */}
        {!allVisible && (
          <p style={styles.skipHint}>화면을 클릭하면 건너뜁니다</p>
        )}
      </div>
    </div>
  );
}

const keyframes = `
@keyframes shardDrift1 {
  0%   { transform: translate(0, 0) rotate(0deg); opacity: 0.9; }
  60%  { transform: translate(32px, -60px) rotate(-8deg); opacity: 0.95; }
  100% { transform: translate(40px, -80px) rotate(-12deg); opacity: 0; }
}
@keyframes shardDrift2 {
  0%   { transform: translate(0, 0) rotate(0deg); opacity: 0.95; }
  60%  { transform: translate(0, -70px) rotate(0deg); opacity: 1; }
  100% { transform: translate(0, -90px) rotate(0deg); opacity: 0; }
}
@keyframes shardDrift3 {
  0%   { transform: translate(0, 0) rotate(0deg); opacity: 0.9; }
  60%  { transform: translate(-32px, -60px) rotate(8deg); opacity: 0.95; }
  100% { transform: translate(-40px, -80px) rotate(12deg); opacity: 0; }
}
@keyframes orbAppear {
  0%   { opacity: 0; r: 6; }
  100% { opacity: 1; r: 18; }
}
@keyframes orbGlow {
  0%   { opacity: 0.3; }
  100% { opacity: 0.8; }
}
`;

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#1a1410',
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
    maxWidth: '600px',
  },
  svg: {
    width: '100%',
    height: 'auto',
    display: 'block',
    borderRadius: '8px',
    filter: 'sepia(0.2) brightness(0.9)',
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
  lineDim: {
    fontSize: 'clamp(0.8rem, 1.8vw, 1rem)',
    opacity: 0.5,
    letterSpacing: '0.12em',
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
