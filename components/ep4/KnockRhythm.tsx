'use client';
import { useState, useEffect, useRef } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

// 탭 '간격'으로 장/단 판정: 직전 탭과의 간격 ≥600ms면 '장', 미만이면 '단'.
// 첫 탭은 '장' 시작으로 간주. 5탭이 모이면 자동 제출.
const TAP_COUNT = 5;
const LONG_MS = 600;

/** 골방 문 노크 — 들은 리듬을 직접 두드린다 */
export default function KnockRhythm({ open, onSubmit, onClose }: Props) {
  const [pattern, setPattern] = useState<('장' | '단')[]>([]);
  const lastTap = useRef<number | null>(null);

  useEscape(open, onClose);
  useEffect(() => { if (open) { setPattern([]); lastTap.current = null; } }, [open]);

  useEffect(() => {
    if (!open || pattern.length < TAP_COUNT) return;
    const t = setTimeout(() => {
      onSubmit(pattern.join('-'));
      setPattern([]);
      lastTap.current = null;
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern, open]);

  if (!open) return null;

  function knock() {
    if (pattern.length >= TAP_COUNT) return;
    const now = Date.now();
    const kind: '장' | '단' =
      lastTap.current == null || now - lastTap.current >= LONG_MS ? '장' : '단';
    lastTap.current = now;
    playSfx(kind === '장' ? 'knock-long' : 'knock-short');
    setPattern((p) => [...p, kind]);
  }

  function reset() {
    playSfx('click');
    setPattern([]);
    lastTap.current = null;
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>골방 문</h2>
        <p style={styles.instruction}>
          열쇠 구멍이 없는 문. 두드리는 법을 아는 사람에게만 열린다고 했다.
          <br />천천히 두드리면 <b>장</b>, 빠르게 이어 두드리면 <b>단</b>.
        </p>

        {/* 문 */}
        <svg viewBox="0 0 200 240" width="100%" style={{ maxWidth: 200, display: 'block', margin: '0 auto', cursor: 'pointer' }}
          onClick={knock} role="button" aria-label="문 두드리기">
          <rect x="20" y="10" width="160" height="220" rx="6" fill="#3a2a18" stroke="#8a5a33" strokeWidth="3" />
          <rect x="38" y="30" width="124" height="80" rx="4" fill="none" stroke="#5a4328" strokeWidth="2" />
          <rect x="38" y="128" width="124" height="80" rx="4" fill="none" stroke="#5a4328" strokeWidth="2" />
          <circle cx="160" cy="120" r="6" fill="#c8a86a" />
          <text x="100" y="125" textAnchor="middle" fontSize="13" fill="#c8a86a" opacity="0.7">두드리기</text>
        </svg>

        {/* 입력 시각화: 장=● 단=○ */}
        <div style={styles.dots} aria-label={`입력한 리듬 ${pattern.join(' ')}`}>
          {Array.from({ length: TAP_COUNT }).map((_, i) => (
            <span key={i} style={{
              ...styles.dot,
              ...(pattern[i] === '장' ? styles.dotLong : pattern[i] === '단' ? styles.dotShort : null),
            }}>
              {pattern[i] === '장' ? '●' : pattern[i] === '단' ? '•' : '·'}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button style={styles.resetBtn} onClick={reset} disabled={pattern.length === 0}>다시 두드리기</button>
        </div>
        <p style={styles.hintLine}>
          {pattern.length === 0 ? '문을 눌러 두드리자. 첫 박은 길게 시작한다.' :
            pattern.length < TAP_COUNT ? `${pattern.join(' · ')}` : '…문 너머에서 기척이…'}
        </p>
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
    padding: '26px 30px', maxWidth: '400px', width: '95%', position: 'relative', color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#e8d3a8', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.83rem', opacity: 0.75, textAlign: 'center', marginBottom: '12px', lineHeight: 1.6 },
  dots: { display: 'flex', justifyContent: 'center', gap: '14px', margin: '14px 0' },
  dot: { fontSize: '1.4rem', opacity: 0.3, width: '24px', textAlign: 'center' },
  dotLong: { opacity: 1, color: '#e8b84a' },
  dotShort: { opacity: 1, color: '#7ac8b8' },
  resetBtn: {
    minHeight: '40px', padding: '0 16px', fontSize: '0.82rem',
    backgroundColor: '#3a2810', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.25)', borderRadius: '8px', cursor: 'pointer',
  },
  hintLine: { fontSize: '0.8rem', opacity: 0.65, textAlign: 'center', marginTop: '12px', minHeight: '1.2em' },
};
