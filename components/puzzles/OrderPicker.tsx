'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

export interface OrderItem {
  id: string;
  label: string;
  desc?: string;
}

interface Props {
  open: boolean;
  title: string;
  instruction: string;
  items: OrderItem[];
  /** 제출 버튼 문구 */
  submitLabel?: string;
  /** 오답 신호 — 값이 바뀌면 흔들림 + 선택 초기화 */
  wrongSignal?: number;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

/** 항목을 순서대로 탭해 배열을 만드는 범용 퍼즐 UI (장독 절기·빨랫줄·소인 연대기) */
export default function OrderPicker({ open, title, instruction, items, submitLabel, wrongSignal, onSubmit, onClose }: Props) {
  const [order, setOrder] = useState<string[]>([]);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (open) { setOrder([]); setShake(false); }
  }, [open]);

  useEffect(() => {
    if (!open || wrongSignal === undefined) return;
    setShake(true);
    setOrder([]);
    const t = setTimeout(() => setShake(false), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongSignal]);

  useEscape(open, onClose);

  if (!open) return null;

  function toggle(id: string) {
    playSfx('click');
    setOrder((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const complete = order.length === items.length;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.instruction}>{instruction}</p>

        <div className={shake ? 'shake' : undefined} style={styles.grid}>
          {items.map((it) => {
            const idx = order.indexOf(it.id);
            const picked = idx >= 0;
            return (
              <button
                key={it.id}
                style={{
                  ...styles.itemBtn,
                  backgroundColor: picked ? '#7a4f1e' : '#3a2810',
                  border: picked ? '1px solid #ffd24a' : '1px solid rgba(232,211,168,0.25)',
                }}
                onClick={() => toggle(it.id)}
              >
                <span style={styles.badge}>{picked ? idx + 1 : ' '}</span>
                <span style={styles.itemLabel}>{it.label}</span>
                {it.desc && <span style={styles.itemDesc}>{it.desc}</span>}
              </button>
            );
          })}
        </div>

        <button
          style={{ ...styles.confirmBtn, opacity: complete ? 1 : 0.4, cursor: complete ? 'pointer' : 'default' }}
          onClick={() => complete && onSubmit(order.join('-'))}
          disabled={!complete}
        >
          {submitLabel ?? '이 순서로 정한다'}
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
    padding: '28px 32px', maxWidth: '480px', width: '95%', maxHeight: '85vh', overflowY: 'auto',
    position: 'relative', color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#e8d3a8', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.85rem', opacity: 0.75, textAlign: 'center', marginBottom: '18px' },
  grid: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  itemBtn: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
    fontSize: '0.9rem', color: '#e8d3a8', borderRadius: '8px', cursor: 'pointer',
    textAlign: 'left', minHeight: '48px',
  },
  badge: {
    width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(255,210,74,0.18)',
    border: '1px solid rgba(255,210,74,0.4)', color: '#ffd24a', fontWeight: 700, fontSize: '0.85rem',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  itemLabel: { fontWeight: 600 },
  itemDesc: { fontSize: '0.78rem', opacity: 0.7, marginLeft: 'auto', textAlign: 'right' },
  confirmBtn: {
    width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 600,
    backgroundColor: '#7a4f1e', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.4)', borderRadius: '8px',
  },
};
