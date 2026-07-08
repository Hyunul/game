'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

/** 해 위치 0(아침)~6(해질녘) */
const SUN_STEPS = 7;

/** 그림자 끝이 가리키는 마당의 자리들 — 해질녘(6)에만 댓돌을 가리킨다 */
const SPOTS: { id: string; label: string; x: number }[] = [
  { id: 'well', label: '우물가', x: 120 },
  { id: 'jangdok', label: '장독대', x: 260 },
  { id: 'daetdol', label: '댓돌', x: 400 },
  { id: 'yard', label: '마당 가운데', x: 540 },
];

/**
 * 문살 그림자 퍼즐 — 해를 움직여 그림자를 돌리고, 그림자 끝이 닿은 자리를 판다.
 * 해질녘(마지막 단계)에서 그림자 끝이 댓돌에 닿는다.
 */
export default function ShadowDial({ open, onSubmit, onClose }: Props) {
  const [sun, setSun] = useState(0);

  useEffect(() => { if (open) setSun(0); }, [open]);
  useEscape(open, onClose);
  if (!open) return null;

  // 해가 서쪽으로 갈수록 그림자는 동쪽으로 길어진다
  const t = sun / (SUN_STEPS - 1); // 0..1
  const sunX = 80 + t * 480; // 동→서
  const sunY = 90 - Math.sin(t * Math.PI) * 50;
  const tipX = 160 + t * 300; // 그림자 끝: t=1 → 460 ≈ 댓돌 앞
  const shadowLen = 40 + t * 260;

  function handleSpot(id: string) {
    playSfx('click');
    // 해질녘이 아니면 그림자가 짧아 아무 자리도 특정하지 못한다 — 제출 자체는 허용(페어플레이: 오답 처리)
    onSubmit(id);
  }

  const atDusk = sun === SUN_STEPS - 1;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>문살 그림자</h2>
        <p style={styles.instruction}>해를 움직여 문살 그림자가 닿는 곳을 찾자 — &ldquo;해질녘 그림자가 닿는 곳&rdquo;</p>

        <svg viewBox="0 0 640 240" width="100%" style={{ display: 'block', borderRadius: '8px', backgroundColor: '#141a26' }}>
          {/* 하늘 그라데이션 느낌 */}
          <rect width="640" height="150" fill={atDusk ? '#3a2438' : '#20304a'} />
          <rect y="150" width="640" height="90" fill="#2a2418" />
          {/* 해 */}
          <circle cx={sunX} cy={sunY} r="16" fill={atDusk ? '#ff9a4a' : '#ffd24a'} />
          {/* 대문 + 문살 */}
          <g>
            <rect x="60" y="90" width="70" height="70" fill="#4a3520" stroke="#2a1c10" strokeWidth="2" />
            {[75, 90, 105, 115].map((x) => (
              <line key={x} x1={x} y1="94" x2={x} y2="156" stroke="#2a1c10" strokeWidth="2" />
            ))}
            <line x1="64" y1="115" x2="126" y2="115" stroke="#2a1c10" strokeWidth="2" />
            <line x1="64" y1="138" x2="126" y2="138" stroke="#2a1c10" strokeWidth="2" />
          </g>
          {/* 문살 그림자 — 해 반대 방향으로 뻗는다 */}
          <g opacity="0.5">
            <polygon
              points={`130,158 ${130 + shadowLen},${168 + t * 8} ${130 + shadowLen},${188 + t * 8} 130,178`}
              fill="#0a0806"
            />
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1={130 + shadowLen * f} y1={160 + f * 4}
                x2={130 + shadowLen * f} y2={186 + t * 6}
                stroke="#0a0806" strokeWidth="3"
              />
            ))}
          </g>
          {/* 그림자 끝 표식 (해질녘일 때 반짝임) */}
          {atDusk && <circle cx={tipX} cy="182" r="6" fill="#ffd24a" opacity="0.8" />}
          {/* 자리들 */}
          {SPOTS.map((sp) => (
            <g
              key={sp.id}
              style={{ cursor: 'pointer' }}
              onClick={() => handleSpot(sp.id)}
              role="button"
              aria-label={sp.label}
            >
              <ellipse cx={sp.x} cy="205" rx="42" ry="14"
                fill={atDusk && sp.id === 'daetdol' ? 'rgba(255,210,74,0.25)' : 'rgba(232,211,168,0.08)'}
                stroke="rgba(232,211,168,0.35)" strokeWidth="1" />
              <text x={sp.x} y="210" textAnchor="middle" fontSize="12" fill="#e8d3a8">{sp.label}</text>
            </g>
          ))}
        </svg>

        <div style={styles.sliderRow}>
          <span style={styles.sliderLabel}>아침</span>
          <input
            type="range"
            min={0}
            max={SUN_STEPS - 1}
            step={1}
            value={sun}
            onChange={(e) => { playSfx('tick'); setSun(Number(e.target.value)); }}
            style={{ flex: 1 }}
            aria-label="해의 위치"
          />
          <span style={styles.sliderLabel}>해질녘</span>
        </div>
        <p style={styles.hintLine}>
          {atDusk ? '그림자 끝이 한 곳에 닿았다. 그 자리를 골라 파보자.' : '그림자가 아직 짧다.'}
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
    padding: '28px 32px', maxWidth: '560px', width: '95%', position: 'relative', color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#e8d3a8', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.85rem', opacity: 0.75, textAlign: 'center', marginBottom: '14px' },
  sliderRow: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' },
  sliderLabel: { fontSize: '0.78rem', opacity: 0.7, flexShrink: 0 },
  hintLine: { fontSize: '0.8rem', opacity: 0.65, textAlign: 'center', marginTop: '10px' },
};
