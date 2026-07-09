'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

// 데크 뒷판 — 모터(M)와 풀리 두 개(L, R)에 벨트를 거는 순서 퍼즐.
// 정답 경로: M → L → R (릴이 시계 방향으로 돈다)
const NODES = [
  { id: 'M', label: '모터', cx: 150, cy: 150 },
  { id: 'L', label: '왼 풀리', cx: 70, cy: 60 },
  { id: 'R', label: '오른 풀리', cx: 230, cy: 60 },
] as const;
const CORRECT = 'M-L-R';

/** 릴 데크 벨트 걸기 — 클릭 순서로 벨트 경로를 정한다 */
export default function BeltRouting({ open, onSubmit, onClose }: Props) {
  const [path, setPath] = useState<string[]>([]);
  const [reversed, setReversed] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { if (open) { setPath([]); setReversed(false); setDone(false); } }, [open]);
  useEscape(open, onClose);

  useEffect(() => {
    if (!open || path.length < 3) return;
    const joined = path.join('-');
    if (joined === CORRECT) {
      setDone(true);
      playSfx('correct');
      const t = setTimeout(() => onSubmit('routed'), 1200);
      return () => clearTimeout(t);
    }
    // 역방향/오배선 — 테이프가 풀려나오는 연출 후 초기화 (오답 아님, 재시도)
    setReversed(true);
    playSfx('rewind');
    const t = setTimeout(() => { setPath([]); setReversed(false); }, 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, open]);

  if (!open) return null;

  function tap(id: string) {
    if (done || reversed || path.includes(id)) return;
    playSfx('click');
    setPath((p) => [...p, id]);
  }

  const pts = path.map((id) => NODES.find((n) => n.id === id)!);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>데크 뒷판 — 벨트 걸기</h2>
        <p style={styles.instruction}>끊어진 벨트를 새로 걸어야 한다. 거는 순서대로 축을 눌러라.</p>

        <svg viewBox="0 0 300 210" width="100%" style={{ maxWidth: 340, display: 'block', margin: '0 auto' }}>
          <rect x="6" y="6" width="288" height="198" rx="10" fill="#241a10" stroke="#8a5a33" strokeWidth="2" />
          {/* 걸린 벨트 선 */}
          {pts.length >= 2 && pts.slice(1).map((p, i) => (
            <line key={i} x1={pts[i].cx} y1={pts[i].cy} x2={p.cx} y2={p.cy}
              stroke={reversed ? '#c0392b' : '#c8a86a'} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={reversed ? '6 6' : undefined} />
          ))}
          {/* 완성 시 닫히는 마지막 변 */}
          {done && (
            <line x1={pts[2].cx} y1={pts[2].cy} x2={pts[0].cx} y2={pts[0].cy}
              stroke="#c8a86a" strokeWidth="4" strokeLinecap="round" />
          )}
          {NODES.map((n) => {
            const idx = path.indexOf(n.id);
            return (
              <g key={n.id} onClick={() => tap(n.id)} style={{ cursor: 'pointer' }}
                role="button" aria-label={n.label}>
                <circle cx={n.cx} cy={n.cy} r={n.id === 'M' ? 26 : 20}
                  fill={idx >= 0 ? '#4a3218' : '#141210'} stroke="#c8a86a" strokeWidth="2"
                  style={{ filter: idx >= 0 ? 'brightness(1.25) drop-shadow(0 0 6px rgba(200,168,106,0.6))' : undefined }} />
                <circle cx={n.cx} cy={n.cy} r="5" fill="#c8a86a" />
                <text x={n.cx} y={n.cy + (n.id === 'M' ? 44 : 38)} textAnchor="middle" fontSize="12" fill="#e8d3a8">
                  {n.label}{idx >= 0 ? ` (${idx + 1})` : ''}
                </text>
              </g>
            );
          })}
        </svg>

        <p style={styles.hintLine}>
          {done ? '릴이 부드럽게 돌기 시작한다.' :
            reversed ? '…테이프가 주르륵 풀려나온다! 방향이 틀렸다.' :
            `걸린 축: ${path.length} / 3`}
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
