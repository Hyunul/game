'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

const CAP_A = 3; // 3되 됫박
const CAP_B = 5; // 5되 됫박
const GOAL = 4;

/** 됫박 계량 퍼즐 — 3되·5되 됫박으로 정확히 넉 되를 만든다 */
export default function MeasureJug({ open, onSubmit, onClose }: Props) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [moves, setMoves] = useState(0);

  useEffect(() => { if (open) { setA(0); setB(0); setMoves(0); } }, [open]);
  useEscape(open, onClose);

  const solved = a === GOAL || b === GOAL;

  useEffect(() => {
    if (!open || !solved) return;
    const t = setTimeout(() => onSubmit('4'), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved, open]);

  if (!open) return null;

  function act(fn: () => void) {
    playSfx('click');
    fn();
    setMoves((m) => m + 1);
  }

  const fillA = () => act(() => setA(CAP_A));
  const fillB = () => act(() => setB(CAP_B));
  const emptyA = () => act(() => setA(0));
  const emptyB = () => act(() => setB(0));
  const pourAB = () => act(() => {
    const amt = Math.min(a, CAP_B - b);
    setA(a - amt); setB(b + amt);
  });
  const pourBA = () => act(() => {
    const amt = Math.min(b, CAP_A - a);
    setB(b - amt); setA(a + amt);
  });

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>쌀뒤주 — 됫박 계량</h2>
        <p style={styles.instruction}>뒤주의 각인: &ldquo;넉 되를 채우면 열린다.&rdquo; 됫박은 3되와 5되뿐.</p>

        <div style={styles.jugsRow}>
          <Jug label="3되 됫박" cap={CAP_A} value={a} />
          <Jug label="5되 됫박" cap={CAP_B} value={b} />
        </div>

        <div style={styles.btnGrid}>
          <button style={styles.actBtn} onClick={fillA} disabled={a === CAP_A}>3되 채우기</button>
          <button style={styles.actBtn} onClick={fillB} disabled={b === CAP_B}>5되 채우기</button>
          <button style={styles.actBtn} onClick={emptyA} disabled={a === 0}>3되 비우기</button>
          <button style={styles.actBtn} onClick={emptyB} disabled={b === 0}>5되 비우기</button>
          <button style={styles.actBtn} onClick={pourAB} disabled={a === 0 || b === CAP_B}>3되 → 5되</button>
          <button style={styles.actBtn} onClick={pourBA} disabled={b === 0 || a === CAP_A}>5되 → 3되</button>
        </div>

        <p style={styles.hintLine}>
          {solved ? '…정확히 넉 되. 뒤주 바닥에서 소리가 났다.' : `부은 횟수: ${moves}`}
        </p>
      </div>
    </div>
  );
}

function Jug({ label, cap, value }: { label: string; cap: number; value: number }) {
  const H = 110;
  const fillH = (value / cap) * (H - 14);
  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 90 130" width="90" aria-label={`${label}: ${value}되`}>
        <path d={`M 15 10 L 20 ${10 + H} L 70 ${10 + H} L 75 10`} fill="#3a2810" stroke="#8a5a33" strokeWidth="2" />
        {value > 0 && (
          <rect x="21" y={10 + H - fillH - 2} width="48" height={fillH} fill="#e8d8a8" opacity="0.9" />
        )}
        <text x="45" y="128" textAnchor="middle" fontSize="12" fill="#e8d3a8">{value}되</text>
      </svg>
      <p style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: '2px' }}>{label}</p>
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
    padding: '28px 32px', maxWidth: '420px', width: '95%', position: 'relative', color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#e8d3a8', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.85rem', opacity: 0.75, textAlign: 'center', marginBottom: '14px' },
  jugsRow: { display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '16px' },
  btnGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  actBtn: {
    minHeight: '44px', fontSize: '0.88rem', fontWeight: 600,
    backgroundColor: '#3a2810', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.25)', borderRadius: '8px', cursor: 'pointer',
  },
  hintLine: { fontSize: '0.8rem', opacity: 0.65, textAlign: 'center', marginTop: '14px' },
};
