'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  /** 오답 신호 — 값이 바뀌면 그을음 연출 후 초기화 */
  wrongSignal?: number;
  onSubmit: (answer: 'revealed' | 'scorched') => void;
  onClose: () => void;
}

/** 종이 높이 0(불 속)~4(멀리). 2가 적당한 높이 */
const STEPS = 5;
const SWEET = 2;

/** 아궁이 열 현상 — 편지를 알맞은 높이에서 불에 쬐면 숨은 글씨가 떠오른다 */
export default function HeatReveal({ open, wrongSignal, onSubmit, onClose }: Props) {
  const [height, setHeight] = useState(STEPS - 1);
  const [scorchFx, setScorchFx] = useState(false);

  useEffect(() => { if (open) { setHeight(STEPS - 1); setScorchFx(false); } }, [open]);

  useEffect(() => {
    if (!open || wrongSignal === undefined) return;
    setScorchFx(true);
    setHeight(STEPS - 1);
    const t = setTimeout(() => setScorchFx(false), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongSignal]);

  useEscape(open, onClose);
  if (!open) return null;

  function handleHold() {
    playSfx('click');
    if (height < SWEET) {
      onSubmit('scorched'); // 너무 가깝다 — 종이 귀퉁이가 그을린다 (오답)
    } else if (height === SWEET) {
      onSubmit('revealed');
    }
    // 너무 멀면 아무 일도 없다
  }

  const tooFar = height > SWEET;
  const tooClose = height < SWEET;
  const paperY = 30 + height * 22;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>아궁이 — 불에 쬐기</h2>
        <p style={styles.instruction}>&ldquo;쌀뜨물로 쓴 글은 불에 쬐면 나온다.&rdquo; 타지 않을 만큼만 가까이.</p>

        <svg viewBox="0 0 320 200" width="100%" style={{ display: 'block', borderRadius: '8px', backgroundColor: '#160f0a' }}>
          {/* 아궁이 */}
          <path d="M 60 200 L 80 150 Q 160 120 240 150 L 260 200 Z" fill="#2a1c10" stroke="#4a3018" strokeWidth="3" />
          {/* 불 */}
          <g className={scorchFx ? undefined : undefined}>
            <path d="M 140 175 Q 150 140 160 160 Q 168 135 176 165 Q 186 150 184 175 Z" fill="#ff8a3a" />
            <path d="M 150 175 Q 158 155 164 168 Q 170 152 172 175 Z" fill="#ffd24a" />
          </g>
          {/* 편지 */}
          <g style={{ transition: 'transform 0.25s ease' }} transform={`translate(0 ${paperY - 74})`}>
            <rect x="120" y="44" width="80" height="52" rx="3"
              fill={scorchFx ? '#5a4530' : '#efe3c0'} stroke="#b8a070" strokeWidth="1.5" />
            {scorchFx && <path d="M 120 44 L 138 44 L 124 60 Z" fill="#1a120a" />}
            {/* 떠오르는 글씨 예열 표현 */}
            {height === SWEET && (
              <g opacity="0.55">
                <line x1="128" y1="56" x2="190" y2="56" stroke="#8a6a3a" strokeWidth="2" />
                <line x1="128" y1="66" x2="182" y2="66" stroke="#8a6a3a" strokeWidth="2" />
                <line x1="128" y1="76" x2="188" y2="76" stroke="#8a6a3a" strokeWidth="2" />
              </g>
            )}
          </g>
        </svg>

        <div style={styles.sliderRow}>
          <span style={styles.sliderLabel}>불 속</span>
          <input
            type="range"
            min={0}
            max={STEPS - 1}
            step={1}
            value={height}
            onChange={(e) => { playSfx('tick'); setHeight(Number(e.target.value)); }}
            style={{ flex: 1 }}
            aria-label="종이 높이"
          />
          <span style={styles.sliderLabel}>멀리</span>
        </div>

        <p style={styles.hintLine}>
          {scorchFx ? '앗 — 귀퉁이가 그을렸다! 조심하자.'
            : tooClose ? '너무 가깝다. 이대로 쬐면 타버린다.'
            : tooFar ? '열기가 닿지 않는다.'
            : '온기가 알맞다. 무언가 떠오르려 한다…'}
        </p>

        <button style={styles.confirmBtn} onClick={handleHold}>이 높이로 쬔다</button>
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
    padding: '28px 32px', maxWidth: '420px', width: '95%', position: 'relative', color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#e8d3a8', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.85rem', opacity: 0.75, textAlign: 'center', marginBottom: '14px' },
  sliderRow: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' },
  sliderLabel: { fontSize: '0.78rem', opacity: 0.7, flexShrink: 0 },
  hintLine: { fontSize: '0.8rem', opacity: 0.7, textAlign: 'center', marginTop: '10px', minHeight: '1.2em' },
  confirmBtn: {
    width: '100%', marginTop: '12px', padding: '12px', fontSize: '1rem', fontWeight: 600,
    backgroundColor: '#7a4f1e', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.4)', borderRadius: '8px', cursor: 'pointer',
  },
};
