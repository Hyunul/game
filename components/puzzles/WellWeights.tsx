'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  /** 오답 신호 — 값이 바뀌면 흔들림 + 초기화 */
  wrongSignal?: number;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

const WEIGHTS = [2, 3, 5, 7];

/** 우물 두레박 — 돌 추를 골라 달아 정확한 깊이(여덟 근)까지 내린다 */
export default function WellWeights({ open, wrongSignal, onSubmit, onClose }: Props) {
  const [picked, setPicked] = useState<number[]>([]);
  const [shake, setShake] = useState(false);

  useEffect(() => { if (open) { setPicked([]); setShake(false); } }, [open]);

  useEffect(() => {
    if (!open || wrongSignal === undefined) return;
    setShake(true);
    setPicked([]);
    const t = setTimeout(() => setShake(false), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongSignal]);

  useEscape(open, onClose);
  if (!open) return null;

  function toggle(w: number) {
    playSfx('click');
    setPicked((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]));
  }

  const total = picked.reduce((s, w) => s + w, 0);
  // 무게에 비례해 두레박이 내려간다 (8근에서 바닥의 단지 높이)
  const depth = Math.min(150, total * 15);

  function handleLower() {
    if (picked.length === 0) return;
    onSubmit([...picked].sort((x, y) => x - y).join('-'));
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>우물 — 두레박 내리기</h2>
        <p style={styles.instruction}>
          우물틀의 각인: &ldquo;물에 뜨는 것은 건질 수 없다.&rdquo; 추를 달아 두레박을 가라앉히자.
        </p>

        <div style={styles.body} className={shake ? 'shake' : undefined}>
          <svg viewBox="0 0 200 220" width="160" style={{ display: 'block', margin: '0 auto' }}>
            {/* 우물 단면 */}
            <rect x="40" y="10" width="120" height="200" fill="#101820" stroke="#4a3826" strokeWidth="4" />
            {/* 수면 */}
            <rect x="44" y="60" width="112" height="146" fill="#1c3048" opacity="0.9" />
            <path d="M 44 60 q 14 -4 28 0 t 28 0 t 28 0 t 28 0" stroke="#3a5878" strokeWidth="2" fill="none" />
            {/* 바닥 단지 */}
            <ellipse cx="100" cy="196" rx="18" ry="8" fill="#5a4530" stroke="#8a6a3a" strokeWidth="1.5" />
            {/* 줄 + 두레박 */}
            <line x1="100" y1="10" x2="100" y2={54 + depth} stroke="#c8b088" strokeWidth="2" />
            <path d={`M 88 ${54 + depth} h 24 l -4 16 h -16 z`} fill="#6a4c2c" stroke="#3a2810" strokeWidth="1.5" />
            {/* 달린 추 */}
            {picked.map((w, i) => (
              <circle key={w} cx={88 + i * 9} cy={54 + depth + 22} r="5" fill="#707880" stroke="#404850" strokeWidth="1" />
            ))}
            {/* 단지에 닿았는지 표시 */}
            {total === 8 && <circle cx="100" cy="192" r="10" fill="#ffd24a" opacity="0.35" />}
          </svg>

          <div style={styles.weightsCol}>
            {WEIGHTS.map((w) => {
              const on = picked.includes(w);
              return (
                <button
                  key={w}
                  style={{
                    ...styles.weightBtn,
                    backgroundColor: on ? '#7a4f1e' : '#3a2810',
                    border: on ? '1px solid #ffd24a' : '1px solid rgba(232,211,168,0.25)',
                  }}
                  onClick={() => toggle(w)}
                >
                  {w}근 추
                </button>
              );
            })}
            <p style={styles.totalLine}>단 무게: {total}근</p>
          </div>
        </div>

        <button
          style={{ ...styles.confirmBtn, opacity: picked.length ? 1 : 0.4 }}
          onClick={handleLower}
          disabled={!picked.length}
        >
          두레박을 내린다
        </button>
      </div>
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
    padding: '28px 32px', maxWidth: '440px', width: '95%', position: 'relative', color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#e8d3a8', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.85rem', opacity: 0.75, textAlign: 'center', marginBottom: '14px' },
  body: { display: 'flex', gap: '18px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  weightsCol: { display: 'flex', flexDirection: 'column', gap: '8px' },
  weightBtn: {
    minWidth: '96px', minHeight: '44px', fontSize: '0.9rem', fontWeight: 600,
    color: '#e8d3a8', borderRadius: '8px', cursor: 'pointer',
  },
  totalLine: { fontSize: '0.82rem', opacity: 0.75, textAlign: 'center', marginTop: '4px' },
  confirmBtn: {
    width: '100%', marginTop: '16px', padding: '12px', fontSize: '1rem', fontWeight: 600,
    backgroundColor: '#7a4f1e', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.4)', borderRadius: '8px', cursor: 'pointer',
  },
};
