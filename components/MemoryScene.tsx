'use client';
import { useEffect, useState, useCallback } from 'react';
import { useGame } from '../lib/GameContext';
import { playSfx, stopBgm, playBgm } from '../lib/audio';
import type { RoomId } from '../lib/types';

// ── Memory data per room ──────────────────────────────────────────────────────

interface MemoryData {
  title: string;
  lines: string[];
  illustration: React.ReactNode;
}

function HomeIllustration() {
  return (
    <svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" style={styles.svg}>
      {/* Window with crescent moon */}
      <rect x="420" y="40" width="120" height="140" rx="4" fill="#1a1208" />
      <rect x="428" y="48" width="104" height="124" rx="2" fill="#2a1e10" />
      {/* Crescent moon */}
      <circle cx="480" cy="100" r="28" fill="#c8aa70" />
      <circle cx="493" cy="92" r="22" fill="#2a1e10" />
      {/* Stars */}
      <circle cx="440" cy="65" r="2" fill="#d8c4a0" opacity="0.7" />
      <circle cx="520" cy="72" r="1.5" fill="#d8c4a0" opacity="0.6" />
      <circle cx="505" cy="148" r="1.5" fill="#d8c4a0" opacity="0.5" />
      {/* Bed frame */}
      <rect x="60" y="200" width="340" height="20" rx="6" fill="#5a3a18" />
      <rect x="60" y="160" width="30" height="60" rx="4" fill="#5a3a18" />
      <rect x="370" y="160" width="30" height="60" rx="4" fill="#5a3a18" />
      {/* Pillow */}
      <rect x="80" y="170" width="100" height="32" rx="10" fill="#b8a080" opacity="0.8" />
      {/* Blanket */}
      <rect x="80" y="195" width="300" height="25" rx="4" fill="#8a6040" />
      {/* Child under blanket - silhouette */}
      <ellipse cx="150" cy="185" rx="30" ry="18" fill="#3a2810" />
      {/* Mother silhouette - seated/leaning */}
      <ellipse cx="310" cy="165" rx="16" ry="20" fill="#3a2810" />
      <rect x="296" y="175" width="32" height="50" rx="8" fill="#3a2810" />
      {/* Mother's arm reaching toward child */}
      <path d="M296 185 Q240 178 185 192" stroke="#3a2810" strokeWidth="14" fill="none" strokeLinecap="round" />
      {/* Floor */}
      <rect x="0" y="225" width="600" height="75" fill="#1a1208" />
    </svg>
  );
}

function ClassIllustration() {
  return (
    <svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" style={styles.svg}>
      {/* Sky / background */}
      <rect x="0" y="0" width="600" height="220" fill="#1a1208" />
      {/* Ground */}
      <rect x="0" y="220" width="600" height="80" fill="#1a1208" />
      <rect x="0" y="218" width="600" height="6" fill="#3a2a10" />
      {/* Tree trunk */}
      <rect x="270" y="80" width="28" height="145" rx="6" fill="#3a2810" />
      {/* Tree canopy */}
      <ellipse cx="284" cy="70" rx="80" ry="65" fill="#2a2010" />
      <ellipse cx="240" cy="90" rx="55" ry="50" fill="#2a2010" />
      <ellipse cx="328" cy="90" rx="55" ry="50" fill="#2a2010" />
      {/* Child 1 silhouette - left */}
      <ellipse cx="185" cy="178" rx="16" ry="18" fill="#3a2810" />
      <rect x="171" y="190" width="28" height="42" rx="6" fill="#3a2810" />
      {/* Child 2 silhouette - right */}
      <ellipse cx="385" cy="178" rx="16" ry="18" fill="#3a2810" />
      <rect x="371" y="190" width="28" height="42" rx="6" fill="#3a2810" />
      {/* Pinky fingers extended toward each other */}
      <path d="M199 210 Q284 195 371 210" stroke="#3a2810" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* Pinky detail */}
      <circle cx="199" cy="210" r="5" fill="#4a3820" />
      <circle cx="371" cy="210" r="5" fill="#4a3820" />
      <circle cx="284" cy="197" r="4" fill="#4a3820" />
    </svg>
  );
}

function StoreIllustration() {
  return (
    <svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" style={styles.svg}>
      {/* Background */}
      <rect x="0" y="0" width="600" height="300" fill="#1a1208" />
      {/* Gacha machine body */}
      <rect x="220" y="60" width="160" height="180" rx="12" fill="#2a1e10" />
      <rect x="228" y="68" width="144" height="164" rx="8" fill="#1a1208" />
      {/* Glass dome */}
      <ellipse cx="300" cy="110" rx="60" ry="55" fill="#2a2010" />
      <ellipse cx="300" cy="110" rx="60" ry="55" fill="none" stroke="#5a4820" strokeWidth="3" />
      {/* Capsules inside dome */}
      <ellipse cx="285" cy="105" rx="14" ry="10" fill="#5a3a18" opacity="0.7" />
      <ellipse cx="315" cy="115" rx="12" ry="9" fill="#4a3018" opacity="0.7" />
      <ellipse cx="295" cy="128" rx="13" ry="9" fill="#5a4020" opacity="0.7" />
      {/* Coin slot */}
      <rect x="283" y="160" width="34" height="8" rx="3" fill="#3a2810" />
      {/* Retrieval hatch */}
      <rect x="255" y="205" width="90" height="24" rx="8" fill="#3a2810" />
      {/* Machine base */}
      <rect x="230" y="228" width="140" height="12" rx="4" fill="#3a2810" />
      {/* Child crouching - silhouette */}
      <ellipse cx="185" cy="210" rx="18" ry="16" fill="#3a2810" />
      {/* Torso leaning forward */}
      <path d="M178 220 Q185 240 210 248" stroke="#3a2810" strokeWidth="20" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Arm reaching to hatch */}
      <path d="M205 242 Q230 238 255 228" stroke="#3a2810" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* Legs */}
      <path d="M178 228 L165 265" stroke="#3a2810" strokeWidth="14" strokeLinecap="round" />
      <path d="M185 230 L178 268" stroke="#3a2810" strokeWidth="13" strokeLinecap="round" />
      {/* Coin in hand hint */}
      <circle cx="252" cy="229" r="5" fill="#b8940a" opacity="0.6" />
    </svg>
  );
}

const MEMORY_MAP: Record<RoomId, MemoryData> = {
  home: {
    title: '기억 조각 — 엄마의 자장가',
    lines: [
      '그날 밤, 엄마의 자장가는',
      '세상에서 제일 따뜻했다.',
      '나는 그 온기를 오래도록 잊고 있었다.',
    ],
    illustration: <HomeIllustration />,
  },
  class: {
    title: '기억 조각 — 친구의 약속',
    lines: [
      '꼭 다시 만나자던 약속.',
      '우리는 정말 어른이 되었을까.',
      '그 새끼손가락의 온도를 기억한다.',
    ],
    illustration: <ClassIllustration />,
  },
  store: {
    title: '기억 조각 — 백 원의 행복',
    lines: [
      '백 원이면 충분했던,',
      '그 시절의 행복.',
      '행복은 생각보다 가까이 있었다.',
    ],
    illustration: <StoreIllustration />,
  },
  attic: {
    title: '',
    lines: [],
    illustration: null,
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MemoryScene() {
  const { state, dispatch } = useGame();
  const roomId = state.memoryShards[state.memoryShards.length - 1] as RoomId;
  const memory = MEMORY_MAP[roomId] ?? MEMORY_MAP.home;

  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const allVisible = visibleCount >= memory.lines.length;

  // Reveal all lines immediately (skip)
  const revealAll = useCallback(() => {
    setVisibleCount(memory.lines.length);
  }, [memory.lines.length]);

  // On mount: stop bgm, play shard sfx
  useEffect(() => {
    stopBgm();
    playSfx('shard');
  }, []);

  // Sequential line reveal: each line fades in 1.2s after the previous
  useEffect(() => {
    if (visibleCount >= memory.lines.length) {
      const t = setTimeout(() => setShowButton(true), 600);
      return () => clearTimeout(t);
    }
    const delay = visibleCount === 0 ? 800 : 1200;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [visibleCount, memory.lines.length]);

  function handleContinue() {
    playBgm('attic');
    dispatch({ type: 'MEMORY_DONE' });
  }

  return (
    <div style={styles.overlay} onClick={allVisible ? undefined : revealAll} role="presentation">
      {/* Vignette */}
      <div style={styles.vignette} />

      <div style={styles.inner}>
        {/* Title */}
        <h2 style={styles.title}>{memory.title}</h2>

        {/* Illustration */}
        <div style={styles.illustrationWrap}>
          {memory.illustration}
        </div>

        {/* Narration lines */}
        <div style={styles.linesWrap}>
          {memory.lines.map((line, i) => (
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

        {/* Continue button */}
        <div
          style={{
            ...styles.btnWrap,
            opacity: showButton ? 1 : 0,
            pointerEvents: showButton ? 'auto' : 'none',
            transition: 'opacity 0.8s ease',
          }}
        >
          <button style={styles.btn} onClick={handleContinue}>
            계속하기
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#2a2118',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    cursor: 'default',
  },
  vignette: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%)',
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
  title: {
    color: '#d8c4a0',
    fontFamily: '"Georgia", "Batang", serif',
    fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textAlign: 'center',
    opacity: 0.85,
    margin: 0,
  },
  illustrationWrap: {
    width: '100%',
    maxWidth: '600px',
  },
  svg: {
    width: '100%',
    height: 'auto',
    display: 'block',
    borderRadius: '8px',
    filter: 'sepia(0.4) brightness(0.85)',
  },
  linesWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    minHeight: '100px',
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
