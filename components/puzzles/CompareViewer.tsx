'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';
import { CompareLine } from '../../lib/puzzles-ep3';

interface Props {
  open: boolean;
  ledgerLines: CompareLine[];
  letterLines: CompareLine[];
  /** 이미 밝혀진 진실 조각 수 (0~5) */
  foundCount: number;
  totalCount: number;
  /** 오답 신호 — 값이 바뀌면 흔들림 + 선택 해제 */
  wrongSignal?: number;
  /** 정답 직후 보여줄 정황 문구 (null이면 없음) */
  reveal: string | null;
  onRevealDone: () => void;
  /** 좌·우에서 하나씩 고른 뒤 제출 — 'G?|L?' (오름차순 정렬) */
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

/** 대조 뷰어 — 가계부(좌)와 편지(우)를 나란히 펼쳐 서로를 설명하는 짝을 찾는다 */
export default function CompareViewer({
  open, ledgerLines, letterLines, foundCount, totalCount, wrongSignal, reveal, onRevealDone, onSubmit, onClose,
}: Props) {
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (open) { setLeft(null); setRight(null); setShake(false); }
  }, [open]);

  useEffect(() => {
    if (!open || wrongSignal === undefined) return;
    setShake(true);
    setLeft(null);
    setRight(null);
    const t = setTimeout(() => setShake(false), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongSignal]);

  useEffect(() => {
    // 정답 후에도 계속 대조할 수 있게 선택만 초기화
    if (reveal) { setLeft(null); setRight(null); }
  }, [reveal]);

  useEscape(open, onClose);
  if (!open) return null;

  function pick(side: 'left' | 'right', id: string) {
    playSfx('click');
    if (side === 'left') setLeft((prev) => (prev === id ? null : id));
    else setRight((prev) => (prev === id ? null : id));
  }

  function handleSubmit() {
    if (!left || !right) return;
    const [a, b] = [left, right].sort();
    onSubmit(`${a}|${b}`);
  }

  const ready = left !== null && right !== null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>기록 대조</h2>
        <p style={styles.instruction}>
          서로를 설명하는 두 구절을 하나씩 골라 짝짓자 — 진실 조각 {foundCount}/{totalCount}
        </p>

        {reveal ? (
          <div style={styles.revealBox}>
            <p style={styles.revealText}>{reveal}</p>
            <button style={styles.confirmBtn} onClick={onRevealDone}>계속 대조한다</button>
          </div>
        ) : (
          <>
            <div className={shake ? 'shake' : undefined} style={styles.columns}>
              <div style={styles.column}>
                <div style={styles.colName}>📒 할머니의 가계부</div>
                {ledgerLines.map((l) => (
                  <button
                    key={l.id}
                    style={{
                      ...styles.lineBtn,
                      backgroundColor: left === l.id ? '#7a4f1e' : '#3a2810',
                      border: left === l.id ? '1px solid #ffd24a' : '1px solid rgba(232,211,168,0.25)',
                    }}
                    onClick={() => pick('left', l.id)}
                  >
                    {l.text}
                  </button>
                ))}
              </div>
              <div style={styles.column}>
                <div style={styles.colName}>💌 고모의 편지</div>
                {letterLines.length === 0 && (
                  <p style={styles.emptyNote}>아직 펼칠 편지가 없다. 별채를 더 살펴보자.</p>
                )}
                {letterLines.map((l) => (
                  <button
                    key={l.id}
                    style={{
                      ...styles.lineBtn,
                      backgroundColor: right === l.id ? '#7a4f1e' : '#3a2810',
                      border: right === l.id ? '1px solid #ffd24a' : '1px solid rgba(232,211,168,0.25)',
                    }}
                    onClick={() => pick('right', l.id)}
                  >
                    {l.text}
                  </button>
                ))}
              </div>
            </div>

            <button
              style={{ ...styles.confirmBtn, opacity: ready ? 1 : 0.4, cursor: ready ? 'pointer' : 'default' }}
              onClick={handleSubmit}
              disabled={!ready}
            >
              두 기록은 같은 일을 말하고 있다
            </button>
          </>
        )}
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
    padding: '28px 32px', maxWidth: '680px', width: '95%', maxHeight: '85vh', overflowY: 'auto',
    position: 'relative', color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#e8d3a8', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.85rem', opacity: 0.75, textAlign: 'center', marginBottom: '18px' },
  columns: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' },
  column: { display: 'flex', flexDirection: 'column', gap: '8px' },
  colName: {
    fontSize: '0.85rem', fontWeight: 700, opacity: 0.85, marginBottom: '2px',
    borderBottom: '1px solid rgba(232,211,168,0.25)', paddingBottom: '6px',
  },
  emptyNote: { fontSize: '0.8rem', opacity: 0.6, fontStyle: 'italic' },
  lineBtn: {
    padding: '10px 12px', fontSize: '0.82rem', lineHeight: 1.5, color: '#e8d3a8',
    borderRadius: '8px', cursor: 'pointer', textAlign: 'left', minHeight: '44px',
  },
  revealBox: {
    display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'center',
    padding: '24px 8px',
  },
  revealText: {
    fontFamily: '"Georgia", "Batang", serif', fontSize: '1rem', lineHeight: 1.9,
    textAlign: 'center', color: '#ffd24a',
  },
  confirmBtn: {
    width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 600,
    backgroundColor: '#7a4f1e', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.4)', borderRadius: '8px',
  },
};
