'use client';
import { useEffect, useState, useCallback } from 'react';
import { stopBgm, playSfx } from '../../../lib/audio';
import { fx } from '../../../lib/effects';

const PART_A_LINES = [
  '반닫이가 열렸다. 배냇저고리, 빛바랜 돌사진.',
  '그리고 — 최근 소인이 찍힌 엽서 한 장.',
  '"장례에 찾아뵙지 못해 죄송합니다. 할머니 은혜, 어머니께 다 들었습니다. — 한별 올림"',
];

const PART_B_LINES = [
  '할머니는 딸을 지운 것이 아니었다.',
  '마을의 눈이 닿지 않는 곳에 살림을 차려주고, 위장된 가계부로 7년을 부양했다.',
  '호적에서 지운 것마저 — 아이가 낙인 없이 살게 하려는 일이었다.',
  '지워진 것은 사람이 아니라, 지키기 위한 사랑의 흔적이었다.',
  '…가족사진의 접힌 귀퉁이를 편다. 젊은 고모가, 웃고 있다.',
];

interface Props {
  onExitToHub: () => void;
}

export default function Ep3Epilogue({ onExitToHub }: Props) {
  const [part, setPart] = useState<'A' | 'B'>('A');
  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);

  const lines = part === 'A' ? PART_A_LINES : PART_B_LINES;
  const allVisible = visibleCount >= lines.length;

  const revealAll = useCallback(() => {
    setVisibleCount(lines.length);
  }, [lines.length]);

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
              {/* 어둑한 안방, 열린 반닫이 */}
              <rect width="600" height="300" fill="#141008" />
              <rect x="200" y="120" width="200" height="100" fill="#4a3018" stroke="#6a4c2c" strokeWidth="3" />
              <rect x="196" y="98" width="208" height="26" rx="3" fill="#5a3e26" stroke="#6a4c2c" strokeWidth="3"
                transform="rotate(-24 300 111)" />
              <circle cx="300" cy="170" r="10" fill="#c8a94e" />
              {/* 안에서 새는 온기 */}
              <ellipse cx="300" cy="128" rx="90" ry="24" fill="#ffd24a" opacity="0.12"
                style={{ animation: 'glowPulse 3s ease-in-out infinite' }} />
              {/* 엽서 */}
              <rect x="268" y="70" width="64" height="42" rx="2" fill="#efe3c0" stroke="#b8a070" strokeWidth="1.5"
                transform="rotate(-6 300 91)" style={{ animation: 'floatUp 4s ease-in-out infinite' }} />
              <line x1="280" y1="84" x2="316" y2="80" stroke="#8a6a3a" strokeWidth="1.5" transform="rotate(-6 300 91)" />
              <line x1="280" y1="92" x2="310" y2="88" stroke="#8a6a3a" strokeWidth="1.5" transform="rotate(-6 300 91)" />
            </svg>
          </div>
        ) : (
          <div style={styles.svgWrap}>
            <svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" style={styles.svg}>
              {/* 펴지는 가족사진 */}
              <rect width="600" height="300" fill="#1a1410" />
              <rect x="180" y="70" width="240" height="160" rx="4" fill="#d8c8a8" stroke="#8a7a58" strokeWidth="3" />
              {/* 네 사람 실루엣 */}
              <circle cx="240" cy="140" r="16" fill="#6a5a40" />
              <rect x="226" y="158" width="28" height="46" rx="8" fill="#6a5a40" />
              <circle cx="300" cy="136" r="17" fill="#6a5a40" />
              <rect x="285" y="156" width="30" height="48" rx="8" fill="#6a5a40" />
              <circle cx="358" cy="142" r="15" fill="#6a5a40" />
              <rect x="345" y="160" width="26" height="44" rx="8" fill="#6a5a40" />
              {/* 펴진 귀퉁이의 고모 */}
              <g style={{ animation: 'unfoldFade 3s ease forwards' }}>
                <circle cx="398" cy="120" r="14" fill="#8a6a4a" />
                <rect x="386" y="136" width="24" height="42" rx="8" fill="#8a6a4a" />
                {/* 웃음 */}
                <path d="M 392 122 q 6 5 12 0" stroke="#d8c8a8" strokeWidth="1.5" fill="none" />
              </g>
              <ellipse cx="398" cy="140" rx="40" ry="52" fill="#ffd24a" opacity="0.08"
                style={{ animation: 'glowPulse 3s ease-in-out infinite' }} />
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
@keyframes glowPulse {
  0%, 100% { opacity: 0.08; }
  50% { opacity: 0.2; }
}
@keyframes floatUp {
  0%, 100% { transform: translateY(0) rotate(-6deg); }
  50% { transform: translateY(-8px) rotate(-6deg); }
}
@keyframes unfoldFade {
  0% { opacity: 0; }
  60% { opacity: 0; }
  100% { opacity: 1; }
}
`;

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: '#0e0b08',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, cursor: 'default',
  },
  vignette: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.80) 100%)',
    pointerEvents: 'none',
  },
  inner: {
    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '24px', padding: '32px 24px', width: 'min(680px, 94vw)',
  },
  svgWrap: { width: '100%', maxWidth: '520px' },
  svg: { width: '100%', height: 'auto', display: 'block', borderRadius: '8px' },
  linesWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', minHeight: '110px',
  },
  line: {
    color: '#d8c4a0', fontFamily: '"Georgia", "Batang", serif',
    fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', lineHeight: 1.8, textAlign: 'center', margin: 0,
    willChange: 'opacity, transform',
  },
  btnWrap: { marginTop: '8px' },
  btn: {
    padding: '12px 48px', fontSize: '1rem', fontWeight: 600,
    backgroundColor: 'transparent', color: '#d8c4a0',
    border: '1px solid rgba(216,196,160,0.5)', borderRadius: '8px', cursor: 'pointer',
    letterSpacing: '0.1em', fontFamily: '"Georgia", "Batang", serif',
  },
  skipHint: {
    position: 'absolute' as const, bottom: '8px', right: '16px',
    color: 'rgba(216,196,160,0.3)', fontSize: '0.72rem', margin: 0, pointerEvents: 'none',
  },
};
