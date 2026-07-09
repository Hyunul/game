'use client';
import { useEffect, useState, useCallback } from 'react';
import { useGame } from '../../lib/GameContext';
import { playSfx, stopBgm, playBgm } from '../../lib/audio';

interface MemoryData {
  title: string;
  lines: string[];
}

// ep4 기억 조각 — 방별 최종 퍼즐 해결 시의 짧은 연출 (MemoryScene의 ep4판)
const MEMORY_MAP: Record<string, MemoryData> = {
  'ep4-anbang': {
    title: '조각 — 은방울',
    lines: [
      '어머니에게는 다른 이름이 있었다.',
      '비 오는 밤의 라디오, 은방울.',
      '그 이름을 아는 사람이 이제 나뿐이라는 게, 이상하게 아팠다.',
    ],
  },
  'ep4-golbang': {
    title: '조각 — 골방의 진실',
    lines: [
      '혼자 있고 싶어서가 아니었다.',
      '계란판을 붙인 벽, 담요를 두른 문틈.',
      '이 방은 — 녹음실이었다.',
      '이어 붙인 테이프의 릴 가장자리, 연필로 쓴 숫자가 보인다. "203".',
    ],
  },
  'ep4-booth': {
    title: '조각 — 그날의 부스',
    lines: [
      '합격 통지를 받고 이틀 뒤, 진단을 받았다.',
      '어머니는 방송국이 아니라 골방으로 갔다.',
      '남은 목소리를 전부, 나에게 쓰기로 한 것이다.',
    ],
  },
  'ep4-maru': {
    title: '',
    lines: [],
  },
};

export default function Ep4Memory() {
  const { state, dispatch } = useGame();
  const roomId = state.memoryShards[state.memoryShards.length - 1] as string;
  const memory = MEMORY_MAP[roomId] ?? MEMORY_MAP['ep4-anbang'];

  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const allVisible = visibleCount >= memory.lines.length;

  const revealAll = useCallback(() => {
    setVisibleCount(memory.lines.length);
  }, [memory.lines.length]);

  useEffect(() => {
    stopBgm();
    playSfx('shard');
  }, []);

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
    playBgm('ep4');
    dispatch({ type: 'MEMORY_DONE' });
  }

  return (
    <div style={styles.overlay} onClick={allVisible ? undefined : revealAll} role="presentation">
      <div style={styles.vignette} />
      <div style={styles.inner}>
        <h2 style={styles.title}>{memory.title}</h2>

        {/* 릴 테이프 일러스트 — 조각마다 공통, 릴이 천천히 돈다 */}
        <svg viewBox="0 0 600 200" style={styles.svg} aria-hidden="true">
          <style>{`@keyframes ep4memreel { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
          <rect width="600" height="200" fill="#141008" rx="8" />
          {[210, 390].map((cx) => (
            <g key={cx} style={{ transformOrigin: `${cx}px 100px`, animation: 'ep4memreel 6s linear infinite' } as React.CSSProperties}>
              <circle cx={cx} cy="100" r="52" fill="#0c0a06" stroke="#8a7040" strokeWidth="2" />
              <circle cx={cx} cy="100" r="12" fill="#8a7040" />
              {[0, 120, 240].map((deg) => (
                <line key={deg} x1={cx} y1="100"
                  x2={cx + 44 * Math.cos((deg * Math.PI) / 180)}
                  y2={100 + 44 * Math.sin((deg * Math.PI) / 180)}
                  stroke="#8a7040" strokeWidth="4" />
              ))}
            </g>
          ))}
          <line x1="258" y1="132" x2="342" y2="132" stroke="#5a4828" strokeWidth="3" />
        </svg>

        <div style={styles.linesWrap}>
          {memory.lines.map((line, i) => (
            <p key={i} style={{
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
          <button style={styles.btn} onClick={handleContinue}>계속하기</button>
        </div>

        {!allVisible && <p style={styles.skipHint}>화면을 클릭하면 건너뜁니다</p>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: '#181410',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, cursor: 'default',
  },
  vignette: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%)',
    pointerEvents: 'none',
  },
  inner: {
    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '24px', padding: '32px 24px', width: 'min(680px, 94vw)',
  },
  title: {
    color: '#d8c4a0', fontFamily: '"Georgia", "Batang", serif',
    fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 600,
    letterSpacing: '0.08em', textAlign: 'center', opacity: 0.85, margin: 0,
  },
  svg: { width: '100%', maxWidth: '480px', height: 'auto', display: 'block', borderRadius: '8px' },
  linesWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minHeight: '100px',
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
