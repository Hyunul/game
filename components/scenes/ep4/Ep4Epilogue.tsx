'use client';
import { useEffect, useState, useCallback } from 'react';
import { stopBgm, playSfx } from '../../../lib/audio';
import { fx } from '../../../lib/effects';

// A: 035 테이프 재생 — 생일 메시지
const PART_A_LINES = [
  '카운터가 035에 멈춘다. 릴이 천천히 돌기 시작한다.',
  '"…서른다섯 번째 생일, 축하해."',
  '"엄마 목소리, 하나도 안 늙었지? 이 목소리가 늙지 않아서 — 엄마는 조금 기뻐."',
  '"거기 있는 노래들, 네 것만이 아니야. 언젠가 네 아이한테도 틀어주렴."',
  '"자, 이제 촛불 불어야지. 하나, 둘 — "',
];

// B: 다락 귀환 — 정리
const PART_B_LINES = [
  '어머니는 꿈을 접은 게 아니었다.',
  '남은 목소리 전부의 쓸 곳을 정했을 뿐이다 — 마흔 번의 생일, 마흔 개의 밤.',
  '노래가 멈춘 날은, 나에게 평생의 노래를 주기 시작한 날이었다.',
  '"나머지 노래는 네가 불러주렴." — 이제 그 말의 뜻을 안다.',
  '…다락의 상자를 닫는다. 명패에 쓴다 — 「사라진 목소리 — 완료」.',
];

interface Props {
  onExitToHub: () => void;
}

export default function Ep4Epilogue({ onExitToHub }: Props) {
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
              {/* 어두운 마루, 돌아가는 릴 데크 */}
              <rect width="600" height="300" fill="#141008" />
              <rect x="0" y="250" width="600" height="50" fill="#1c1208" />
              <line x1="0" y1="250" x2="600" y2="250" stroke="#2e2010" strokeWidth="2" />

              {/* 데크에서 새는 온기 */}
              <ellipse cx="300" cy="160" rx="140" ry="70" fill="#ffd24a" opacity="0.07"
                style={{ animation: 'glowPulse 3s ease-in-out infinite' }} />

              {/* 릴 데크 */}
              <rect x="180" y="150" width="240" height="86" rx="8" fill="#8a8478" stroke="#5a544a" strokeWidth="3" />
              {[240, 360].map((cx) => (
                <g key={cx} style={{ transformOrigin: `${cx}px 186px`, animation: 'ep4epiReel 5s linear infinite' } as React.CSSProperties}>
                  <circle cx={cx} cy="186" r="26" fill="#141210" stroke="#c8a86a" strokeWidth="2" />
                  <circle cx={cx} cy="186" r="7" fill="#c8a86a" />
                  {[0, 120, 240].map((deg) => (
                    <line key={deg} x1={cx} y1="186"
                      x2={cx + 22 * Math.cos((deg * Math.PI) / 180)}
                      y2={186 + 22 * Math.sin((deg * Math.PI) / 180)}
                      stroke="#c8a86a" strokeWidth="3" />
                  ))}
                </g>
              ))}
              <rect x="278" y="164" width="44" height="18" rx="3" fill="#0c0a06" />
              <text x="300" y="178" textAnchor="middle" fontSize="13" fontFamily="monospace" fill="#e8d3a8">035</text>

              {/* 앉아 듣는 실루엣 */}
              <ellipse cx="470" cy="196" rx="16" ry="20" fill="#3a2810" />
              <path d="M 456 208 Q 470 250 494 250 L 456 250 Z" fill="#3a2810" />
            </svg>
          </div>
        ) : (
          <div style={styles.svgWrap}>
            <svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" style={styles.svg}>
              {/* 다락 — 닫힌 상자와 명패 */}
              <rect width="600" height="300" fill="#141008" />
              <polygon points="240,0 360,0 430,300 170,300" fill="#ffd24a" opacity="0.06" />
              <rect x="0" y="250" width="600" height="50" fill="#1c1208" />

              {/* 상자 */}
              <polygon points="210,170 390,170 375,250 225,250" fill="#8a6a42" stroke="#5a4326" strokeWidth="2.5" />
              <polygon points="210,170 236,148 416,148 390,170" fill="#a08050" stroke="#5a4326" strokeWidth="2.5" />

              {/* 명패 */}
              <rect x="250" y="196" width="100" height="30" rx="3" fill="#e8dcc0" stroke="#8a7a58" strokeWidth="1.5" />
              <text x="300" y="211" textAnchor="middle" fontSize="9" fill="#3a2a18">사라진 목소리</text>
              <text x="300" y="221" textAnchor="middle" fontSize="8" fill="#8a6a3a">— 완료 —</text>

              {/* 테이프 하나, 상자 위에 */}
              <g transform="translate(330, 130) rotate(6)">
                <rect width="46" height="28" rx="3" fill="#2a2018" stroke="#4a3a28" strokeWidth="1.5" />
                <rect x="5" y="4" width="36" height="10" rx="1" fill="#e8dcc0" />
                <text x="23" y="12" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#3a2a18">035</text>
              </g>
            </svg>
          </div>
        )}

        <div style={styles.linesWrap}>
          {lines.map((line, i) => (
            <p key={`${part}-${i}`} style={{
              ...styles.line,
              opacity: i < visibleCount ? 1 : 0,
              transform: i < visibleCount ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.9s ease, transform 0.9s ease',
            }}>
              {line}
            </p>
          ))}
        </div>

        <div style={{
          ...styles.btnWrap,
          opacity: showButton ? 1 : 0,
          pointerEvents: showButton ? 'auto' : 'none',
          transition: 'opacity 0.8s ease',
        }}>
          {part === 'A' ? (
            <button style={styles.btn} onClick={handleContinue}>…촛불을 분다</button>
          ) : (
            <button style={styles.btn} onClick={handleExit}>에피소드 선택으로</button>
          )}
        </div>

        {!allVisible && <p style={styles.skipHint}>화면을 클릭하면 건너뜁니다</p>}
      </div>
    </div>
  );
}

const keyframes = `
@keyframes glowPulse { 0%,100% { opacity: 0.05; } 50% { opacity: 0.11; } }
@keyframes ep4epiReel { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: '#100c06',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, cursor: 'default',
  },
  vignette: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)',
    pointerEvents: 'none',
  },
  inner: {
    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '22px', padding: '32px 24px', width: 'min(680px, 94vw)',
  },
  svgWrap: { width: '100%', maxWidth: '540px' },
  svg: { width: '100%', height: 'auto', display: 'block', borderRadius: '8px' },
  linesWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minHeight: '150px',
  },
  line: {
    color: '#d8c4a0', fontFamily: '"Georgia", "Batang", serif',
    fontSize: 'clamp(0.95rem, 2.2vw, 1.15rem)', lineHeight: 1.8, textAlign: 'center', margin: 0,
    willChange: 'opacity, transform',
  },
  btnWrap: { marginTop: '4px' },
  btn: {
    padding: '12px 44px', fontSize: '1rem', fontWeight: 600,
    backgroundColor: 'transparent', color: '#d8c4a0',
    border: '1px solid rgba(216,196,160,0.5)', borderRadius: '8px', cursor: 'pointer',
    letterSpacing: '0.1em', fontFamily: '"Georgia", "Batang", serif',
  },
  skipHint: {
    position: 'absolute' as const, bottom: '8px', right: '16px',
    color: 'rgba(216,196,160,0.3)', fontSize: '0.72rem', margin: 0, pointerEvents: 'none',
  },
};
