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

/** 회전 고리 세 개 — 정답 '은-방-울' 외에는 모두 미끼 */
const REEL_1 = ['은', '금', '옥', '연', '수'];
const REEL_2 = ['방', '반', '별', '봉', '비'];
const REEL_3 = ['울', '아', '이', '주', '녀'];

/** 자개장 이름 자물쇠 — 라디오에서 들은 예명을 되살린다 (NameLock 3릴 변형) */
export default function JagaeLock({ open, wrongSignal, onSubmit, onClose }: Props) {
  // 초기 위치는 정답과 다르게 어긋나 있어야 한다
  const INITIAL = [2, 4, 1];
  const [idx, setIdx] = useState(INITIAL);
  const [shake, setShake] = useState(false);
  const reels = [REEL_1, REEL_2, REEL_3];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) { setIdx(INITIAL); setShake(false); } }, [open]);

  useEffect(() => {
    if (!open || wrongSignal === undefined) return;
    setShake(true);
    const t = setTimeout(() => setShake(false), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongSignal]);

  useEscape(open, onClose);
  if (!open) return null;

  function spin(which: number, dir: -1 | 1) {
    playSfx('tick');
    setIdx((cur) => cur.map((v, i) => (i === which ? (v + dir + reels[i].length) % reels[i].length : v)));
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>자개장 — 음절 자물쇠</h2>
        <p style={styles.instruction}>놋쇠 고리 세 개. 라디오에서, 어머니를 부르던 이름이 있었다.</p>

        <div className={shake ? 'shake' : undefined} style={styles.reelsRow}>
          {reels.map((reel, i) => (
            <div key={i} style={styles.reel}>
              <button style={styles.spinBtn} onClick={() => spin(i, -1)} aria-label={`${i + 1}번째 글자 위로`}>▲</button>
              <div style={styles.reelWindow}>{reel[idx[i]]}</div>
              <button style={styles.spinBtn} onClick={() => spin(i, 1)} aria-label={`${i + 1}번째 글자 아래로`}>▼</button>
            </div>
          ))}
        </div>

        <button style={styles.confirmBtn}
          onClick={() => onSubmit(idx.map((v, i) => reels[i][v]).join('-'))}>
          이 이름을 맞춰본다
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
    padding: '28px 32px', maxWidth: '380px', width: '95%', position: 'relative', color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#e8d3a8', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.85rem', opacity: 0.75, textAlign: 'center', marginBottom: '16px' },
  reelsRow: { display: 'flex', justifyContent: 'center', gap: '18px', marginBottom: '18px' },
  reel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  reelWindow: {
    width: '64px', height: '64px', borderRadius: '8px',
    backgroundColor: '#1c1208', border: '2px solid #c8a86a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.7rem', fontWeight: 700, color: '#e8cfa8',
  },
  spinBtn: {
    minWidth: '52px', minHeight: '38px', fontSize: '0.85rem',
    backgroundColor: '#3a2810', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.25)', borderRadius: '8px', cursor: 'pointer',
  },
  confirmBtn: {
    display: 'block', margin: '0 auto', minHeight: '46px', padding: '0 26px',
    fontSize: '0.92rem', fontWeight: 600,
    backgroundColor: '#4a3218', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.35)', borderRadius: '8px', cursor: 'pointer',
  },
};
