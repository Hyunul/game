'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  /** 오답 신호 — 값이 바뀌면 흔들림 */
  wrongSignal?: number;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

/** 회전 고리 두 개에 새겨진 음절들 — 정답 '한-별' 외에는 모두 미끼 */
const REEL_1 = ['하', '한', '해', '희', '호'];
const REEL_2 = ['별', '빛', '봄', '비', '벼'];

/** 반닫이 이름 자물쇠 — 음절 고리 두 개를 돌려 지워진 이름을 되살린다 */
export default function NameLock({ open, wrongSignal, onSubmit, onClose }: Props) {
  const [i1, setI1] = useState(0);
  const [i2, setI2] = useState(0);
  const [shake, setShake] = useState(false);

  useEffect(() => { if (open) { setI1(0); setI2(0); setShake(false); } }, [open]);

  useEffect(() => {
    if (!open || wrongSignal === undefined) return;
    setShake(true);
    const t = setTimeout(() => setShake(false), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongSignal]);

  useEscape(open, onClose);
  if (!open) return null;

  function spin(which: 1 | 2, dir: -1 | 1) {
    playSfx('tick');
    if (which === 1) setI1((i) => (i + dir + REEL_1.length) % REEL_1.length);
    else setI2((i) => (i + dir + REEL_2.length) % REEL_2.length);
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>반닫이 — 지워진 이름</h2>
        <p style={styles.instruction}>놋쇠 고리 두 개에 음절이 새겨져 있다. 그 아이의 이름을 되살리자.</p>

        <div className={shake ? 'shake' : undefined} style={styles.reelsRow}>
          <Reel value={REEL_1[i1]} onUp={() => spin(1, -1)} onDown={() => spin(1, 1)} label="첫 글자" />
          <Reel value={REEL_2[i2]} onUp={() => spin(2, -1)} onDown={() => spin(2, 1)} label="둘째 글자" />
        </div>

        <button
          style={styles.confirmBtn}
          onClick={() => onSubmit(`${REEL_1[i1]}-${REEL_2[i2]}`)}
        >
          이 이름을 부른다
        </button>
      </div>
    </div>
  );
}

function Reel({ value, onUp, onDown, label }: { value: string; onUp: () => void; onDown: () => void; label: string }) {
  return (
    <div style={styles.reel}>
      <button style={styles.spinBtn} onClick={onUp} aria-label={`${label} 위로`}>▲</button>
      <div style={styles.reelWindow}>{value}</div>
      <button style={styles.spinBtn} onClick={onDown} aria-label={`${label} 아래로`}>▼</button>
      <span style={styles.reelLabel}>{label}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(10,6,2,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: '16px',
  },
  card: {
    backgroundColor: '#2e1f10', border: '1px solid rgba(232,211,168,0.3)', borderRadius: '12px',
    padding: '28px 32px', maxWidth: '340px', width: '90%', position: 'relative', color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#e8d3a8', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.85rem', opacity: 0.75, textAlign: 'center', marginBottom: '18px' },
  reelsRow: { display: 'flex', justifyContent: 'center', gap: '28px', marginBottom: '20px' },
  reel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  spinBtn: {
    width: '52px', height: '36px', fontSize: '0.9rem',
    backgroundColor: '#3a2810', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.25)', borderRadius: '8px', cursor: 'pointer',
  },
  reelWindow: {
    width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '2rem', fontWeight: 700, color: '#ffd24a',
    backgroundColor: '#1a1008', border: '2px solid rgba(255,210,74,0.5)', borderRadius: '10px',
    fontFamily: '"Georgia", "Batang", serif',
  },
  reelLabel: { fontSize: '0.72rem', opacity: 0.65 },
  confirmBtn: {
    width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 600,
    backgroundColor: '#7a4f1e', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.4)', borderRadius: '8px', cursor: 'pointer',
  },
};
