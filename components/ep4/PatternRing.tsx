'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

// 자개 꽃문양 링 3개 — 각 링을 45° 단위로 돌려 꽃잎이 이어지게 한다.
// 초기 오프셋에서 각 링이 (0°, 135°, 270°)가 되면 정렬 완료.
const RING_COUNT = 3;
const STEP = 45;
const TARGET = [0, 135, 270]; // 정렬 각도
const INITIAL = [90, 45, 180]; // 시작 각도 (전부 어긋남)
const RADII = [86, 62, 38];

/** 화장대 자개 문양 링 — 회전 정렬 퍼즐 */
export default function PatternRing({ open, onSubmit, onClose }: Props) {
  const [angles, setAngles] = useState<number[]>(INITIAL);
  const [done, setDone] = useState(false);

  useEscape(open, onClose);
  useEffect(() => { if (open) { setAngles(INITIAL); setDone(false); } }, [open]);

  const aligned = angles.every((a, i) => a % 360 === TARGET[i]);

  useEffect(() => {
    if (!open || !aligned || done) return;
    const t = setTimeout(() => {
      setDone(true);
      playSfx('correct');
      setTimeout(() => onSubmit('aligned'), 900);
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aligned, open, done]);

  if (!open) return null;

  function rotate(i: number) {
    if (done) return;
    playSfx('tick');
    setAngles((as) => as.map((a, j) => (j === i ? (a + STEP) % 360 : a)));
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>화장대 서랍 — 자개 문양</h2>
        <p style={styles.instruction}>
          서랍 앞판의 자개 꽃이 세 겹의 링으로 어긋나 있다. 링을 눌러 돌려보자.
          바깥 링, 금 간 꽃잎이 위로 오는 게 원래 모습이었던 것 같다.
        </p>

        <svg viewBox="0 0 220 220" width="100%" style={{ maxWidth: 260, display: 'block', margin: '0 auto' }}>
          <circle cx="110" cy="110" r="102" fill="#241a10" stroke="#8a5a33" strokeWidth="2" />
          {RADII.map((r, i) => (
            <g key={i} onClick={() => rotate(i)} style={{ cursor: done ? 'default' : 'pointer' }}
              role="button" aria-label={`${i + 1}번째 링 돌리기`}
              transform={`rotate(${angles[i]} 110 110)`}>
              <circle cx="110" cy="110" r={r} fill="none"
                stroke={angles[i] % 360 === TARGET[i] ? '#7ac8b8' : '#5a4328'}
                strokeWidth="17" opacity="0.9" />
              {/* 꽃잎 조각: 링마다 목표각 기준으로 위쪽에 그려, 정렬되면 세로로 이어진다 */}
              {[0, 72, 144, 216, 288].map((leaf) => (
                <ellipse key={leaf}
                  cx={110 + r * Math.sin(((leaf - TARGET[i]) * Math.PI) / 180)}
                  cy={110 - r * Math.cos(((leaf - TARGET[i]) * Math.PI) / 180)}
                  rx="7" ry="11"
                  fill={leaf === 0 ? '#e8cfa8' : '#b89a68'}
                  stroke={leaf === 0 && i === 0 ? '#c0392b' : 'none'}
                  strokeWidth={leaf === 0 && i === 0 ? 1.5 : 0}
                  transform={`rotate(${leaf - TARGET[i]} ${110 + r * Math.sin(((leaf - TARGET[i]) * Math.PI) / 180)} ${110 - r * Math.cos(((leaf - TARGET[i]) * Math.PI) / 180)})`}
                  opacity="0.95"
                />
              ))}
            </g>
          ))}
          <circle cx="110" cy="110" r="14" fill="#e8cfa8" />
          <circle cx="110" cy="110" r="6" fill="#c8a86a" />
        </svg>

        <p style={styles.hintLine}>
          {done ? '딸깍 — 꽃이 한 송이로 피었다. 서랍이 열린다.' :
            aligned ? '…무늬가 이어진다…' : '링을 누르면 시계 방향으로 돌아간다.'}
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
    padding: '28px 32px', maxWidth: '420px', width: '95%', position: 'relative', color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#e8d3a8', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.85rem', opacity: 0.75, textAlign: 'center', marginBottom: '14px' },
  hintLine: { fontSize: '0.8rem', opacity: 0.65, textAlign: 'center', marginTop: '14px', minHeight: '1.2em' },
};
