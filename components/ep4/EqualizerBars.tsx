'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

// 종이 파형 가이드: 저3 · 중7 · 고5 (골방 벽의 종이 소품과 동일)
const TARGET = [3, 7, 5];
const BANDS = ['저음', '중음', '고음'];
const MAX = 10;

/** 녹음기 이퀄라이저 — 세 밴드를 파형 가이드에 맞춰 노이즈를 걷는다 */
export default function EqualizerBars({ open, onSubmit, onClose }: Props) {
  const [vals, setVals] = useState([5, 5, 5]);
  const [done, setDone] = useState(false);

  useEscape(open, onClose);
  useEffect(() => { if (open) { setVals([5, 5, 5]); setDone(false); } }, [open]);

  const matched = vals.every((v, i) => v === TARGET[i]);

  useEffect(() => {
    if (!open || !matched || done) return;
    const t = setTimeout(() => {
      setDone(true);
      playSfx('noise-clear');
      setTimeout(() => onSubmit('clean'), 1300);
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched, open, done]);

  if (!open) return null;

  function adjust(i: number, d: number) {
    if (done) return;
    playSfx('tick');
    setVals((vs) => vs.map((v, j) => (j === i ? Math.max(0, Math.min(MAX, v + d)) : v)));
  }

  // 노이즈 정도 표시 (가이드와의 거리)
  const dist = vals.reduce((acc, v, i) => acc + Math.abs(v - TARGET[i]), 0);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>녹음기 이퀄라이저</h2>
        <p style={styles.instruction}>
          옆에 붙은 종이: 세 칸 파형 그림 — <b>▂ 낮게 · ▇ 높게 · ▅ 중간</b>.
          어머니가 맞춰두던 자리일 것이다.
        </p>

        <div style={styles.eqRow}>
          {BANDS.map((label, i) => (
            <div key={label} style={styles.band}>
              <button style={styles.adjBtn} onClick={() => adjust(i, 1)} aria-label={`${label} 올리기`}>▲</button>
              <svg viewBox="0 0 40 130" width="40" aria-label={`${label}: ${vals[i]}`}>
                <rect x="8" y="5" width="24" height="120" rx="4" fill="#141210" stroke="#5a4328" strokeWidth="1.5" />
                <rect x="11" y={125 - vals[i] * 11.7 - 3} width="18" height={vals[i] * 11.7}
                  fill={vals[i] === TARGET[i] ? '#7ac8b8' : '#c8a86a'} rx="2" opacity="0.9" />
              </svg>
              <button style={styles.adjBtn} onClick={() => adjust(i, -1)} aria-label={`${label} 내리기`}>▼</button>
              <span style={styles.bandLabel}>{label}</span>
              <span style={styles.bandVal}>{vals[i]}</span>
            </div>
          ))}
        </div>

        <div style={styles.noiseBox}>
          {done ? (
            <p style={{ ...styles.noiseLine, color: '#7ae8d8' }}>…스으윽 — 노이즈가 걷혔다. 이제 테이프가 맑게 들릴 것이다.</p>
          ) : (
            <p style={{ ...styles.noiseLine, opacity: 0.35 + Math.min(0.6, dist * 0.06) }}>
              {dist === 0 ? '……' : dist <= 3 ? '치직… 지지익… (거의 다 왔다)' : '치지지지지직…'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(6,8,8,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: '16px',
  },
  card: {
    backgroundColor: '#16211f', border: '1px solid rgba(140,220,205,0.25)', borderRadius: '12px',
    padding: '26px 30px', maxWidth: '400px', width: '95%', position: 'relative', color: '#cfe8e2',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#cfe8e2', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.83rem', opacity: 0.75, textAlign: 'center', marginBottom: '14px', lineHeight: 1.6 },
  eqRow: { display: 'flex', justifyContent: 'center', gap: '26px' },
  band: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  adjBtn: {
    minWidth: '44px', minHeight: '38px', fontSize: '0.85rem',
    backgroundColor: '#1e302c', color: '#cfe8e2',
    border: '1px solid rgba(140,220,205,0.25)', borderRadius: '8px', cursor: 'pointer',
  },
  bandLabel: { fontSize: '0.75rem', opacity: 0.7 },
  bandVal: { fontSize: '0.85rem', fontFamily: 'monospace', color: '#7ac8b8' },
  noiseBox: {
    marginTop: '16px', padding: '12px', minHeight: '56px',
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  noiseLine: { fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.6 },
};
