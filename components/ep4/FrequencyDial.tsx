'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

const MIN = 875; // 87.5 MHz ×10
const MAX = 1080;
const TARGET = 891; // 89.1
// 함정 방송 — 자막만, 단서 없음
const DECOYS: Record<number, string> = {
  881: '"…다음은 날씨입니다. 내일은 전국이 대체로 맑겠…" (뉴스다. 찾는 방송이 아니다)',
  919: '♪ …흘러간 옛 노래가 흐른다. (찾는 방송이 아니다)',
};

/** 라디오 주파수 다이얼 — 89.1에 정확히 맞추면 드라마 재방송이 나온다 */
export default function FrequencyDial({ open, onSubmit, onClose }: Props) {
  const [freq, setFreq] = useState(950);
  const [locked, setLocked] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);

  useEscape(open, onClose);
  useEffect(() => { if (open) { setFreq(950); setLocked(false); setLineIdx(0); } }, [open]);

  // 89.1에서 1초 유지 시 수신 고정
  useEffect(() => {
    if (!open || locked || freq !== TARGET) return;
    const t = setTimeout(() => { setLocked(true); playSfx('correct'); }, 1000);
    return () => clearTimeout(t);
  }, [freq, open, locked]);

  if (!open) return null;

  const drama = [
    '"…지지난 계절의 밤 사연, 오늘은 옛 성우의 목소리로 다시 보내드립니다."',
    '"— 은방울 님. 그 시절, 비 오는 밤마다 사연을 읽어주던 바로 그 목소리."',
    '(은방울. 어디선가 들어본 이름 같기도 하다.)',
  ];

  function tune(d: number) {
    if (locked) return;
    playSfx('tick');
    setFreq((f) => Math.max(MIN, Math.min(MAX, f + d)));
  }

  // 가까울수록 지직음이 잦아드는 표시
  const dist = Math.abs(freq - TARGET);
  const staticLevel = locked ? 0 : Math.min(1, dist / 40);
  const decoy = DECOYS[freq];

  function advance() {
    if (!locked) return;
    if (lineIdx < drama.length - 1) { playSfx('click'); setLineIdx((i) => i + 1); return; }
    onSubmit('891');
  }

  const pct = ((freq - MIN) / (MAX - MIN)) * 100;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>오래된 라디오</h2>
        <p style={styles.instruction}>다이얼이 뻑뻑하다. 어느 주파수를 찾아야 할까.</p>

        <svg viewBox="0 0 320 90" width="100%" style={{ maxWidth: 360, display: 'block', margin: '0 auto' }}>
          <rect x="4" y="4" width="312" height="82" rx="8" fill="#241a10" stroke="#8a5a33" strokeWidth="2" />
          <line x1="20" y1="45" x2="300" y2="45" stroke="#6a4a2a" strokeWidth="2" />
          {[88, 92, 96, 100, 104, 108].map((mhz) => {
            const x = 20 + ((mhz * 10 - MIN) / (MAX - MIN)) * 280;
            return (
              <g key={mhz}>
                <line x1={x} y1="38" x2={x} y2="52" stroke="#8a5a33" strokeWidth="1.5" />
                <text x={x} y="70" textAnchor="middle" fontSize="10" fill="#c8a86a">{mhz}</text>
              </g>
            );
          })}
          {/* 바늘 */}
          <line x1={20 + pct * 2.8} y1="18" x2={20 + pct * 2.8} y2="60"
            stroke={locked ? '#e8b84a' : '#c0392b'} strokeWidth="3"
            style={{ filter: locked ? 'drop-shadow(0 0 5px rgba(232,184,74,0.8))' : undefined }} />
          <text x="160" y="26" textAnchor="middle" fontSize="13" fontFamily="monospace" fill="#e8d3a8">
            {(freq / 10).toFixed(1)} MHz
          </text>
        </svg>

        {!locked && (
          <div style={styles.controls}>
            <button style={styles.ctrlBtn} onClick={() => tune(-10)}>◀◀</button>
            <button style={styles.ctrlBtn} onClick={() => tune(-1)}>◀</button>
            <button style={styles.ctrlBtn} onClick={() => tune(1)}>▶</button>
            <button style={styles.ctrlBtn} onClick={() => tune(10)}>▶▶</button>
          </div>
        )}

        <div style={{ ...styles.radioBox, cursor: locked ? 'pointer' : 'default' }} onClick={advance}>
          {locked ? (
            <>
              <p style={styles.radioLine}>{drama[lineIdx]}</p>
              <p style={styles.radioHint}>{lineIdx < drama.length - 1 ? '▸ 계속 듣기' : '■ 라디오 끄기'}</p>
            </>
          ) : decoy ? (
            <p style={styles.radioLine}>{decoy}</p>
          ) : (
            <p style={{ ...styles.radioLine, opacity: 0.4 + 0.4 * (1 - staticLevel) }}>
              {staticLevel > 0.6 ? '치지지지직…' : staticLevel > 0.2 ? '치직… 지직… (무언가 들릴 듯하다)' : '지직… (거의 잡혔다)'}
            </p>
          )}
        </div>
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
  controls: { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '14px' },
  ctrlBtn: {
    minWidth: '56px', minHeight: '44px', fontSize: '0.95rem',
    backgroundColor: '#3a2810', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.25)', borderRadius: '8px', cursor: 'pointer',
  },
  radioBox: {
    marginTop: '16px', padding: '14px', minHeight: '76px',
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: '8px',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px',
  },
  radioLine: { fontSize: '0.88rem', lineHeight: 1.6, textAlign: 'center' },
  radioHint: { fontSize: '0.72rem', opacity: 0.5, textAlign: 'center' },
};
