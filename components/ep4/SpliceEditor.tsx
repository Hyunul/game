'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

// 조각 5개 — 표시 라벨은 뒤섞인 전시 순서, 정답 배열은 '3-1-4-2-5'.
// 조각 3에만 무음 리더 띠(반투명 흰 띠)가 붙어 있다 → 맨 앞 단서.
const SCRAPS = [
  { id: '1', head: '"수험번호 열넷…"', tail: '"…은방울입니다" 까지', leader: false },
  { id: '2', head: '"…목소리가 되고…"', tail: '"…싶습니다" 까지', leader: false },
  { id: '3', head: '(무음 리더 띠)', tail: '녹음 시작음 까지', leader: true },
  { id: '4', head: '"…비 오는 날의…"', tail: '"…라디오처럼" 까지', leader: false },
  { id: '5', head: '(박수 소리)', tail: '테이프 끝', leader: false },
];

/** 테이프 스플라이스 — 끊어진 조각 5개를 문장이 이어지게 배열한다 */
export default function SpliceEditor({ open, onSubmit, onClose }: Props) {
  const [order, setOrder] = useState<string[]>([]);

  useEscape(open, onClose);
  useEffect(() => { if (open) setOrder([]); }, [open]);

  if (!open) return null;

  function add(id: string) {
    if (order.includes(id)) return;
    playSfx('splice');
    setOrder((o) => [...o, id]);
  }
  function undo() {
    playSfx('click');
    setOrder((o) => o.slice(0, -1));
  }
  function submit() {
    onSubmit(order.join('-'));
    setOrder([]);
  }

  const remaining = SCRAPS.filter((s) => !order.includes(s.id));

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>테이프 잇기</h2>
        <p style={styles.instruction}>
          끊어진 다섯 토막. 조각마다 시작과 끝에 들리는 소리가 적혀 있다.
          문장이 이어지도록, 붙일 순서대로 조각을 골라라.
        </p>

        {/* 이어붙인 릴 */}
        <div style={styles.reelStrip} aria-label={`이어붙인 순서: ${order.join(', ') || '없음'}`}>
          {order.length === 0 ? (
            <span style={styles.stripEmpty}>· 아직 아무것도 붙이지 않았다 ·</span>
          ) : (
            order.map((id, i) => {
              const s = SCRAPS.find((x) => x.id === id)!;
              return (
                <span key={id} style={styles.stripPiece}>
                  {s.leader && <span style={styles.leaderBand} />}
                  {i + 1}
                </span>
              );
            })
          )}
        </div>

        {/* 남은 조각 */}
        <div style={styles.scrapList}>
          {remaining.map((s) => (
            <button key={s.id} style={styles.scrap} onClick={() => add(s.id)}>
              {s.leader && <span style={styles.leaderBand} />}
              <span style={styles.scrapHead}>{s.head}</span>
              <span style={styles.scrapTail}>{s.tail}</span>
            </button>
          ))}
        </div>

        <div style={styles.btnRow}>
          <button style={styles.actBtn} onClick={undo} disabled={order.length === 0}>한 조각 떼기</button>
          <button style={{ ...styles.actBtn, ...styles.submitBtn }} onClick={submit}
            disabled={order.length !== SCRAPS.length}>
            접합하기
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(6,8,8,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: '16px',
  },
  card: {
    backgroundColor: '#16211f', border: '1px solid rgba(140,220,205,0.25)', borderRadius: '12px',
    padding: '26px 28px', maxWidth: '440px', width: '95%', position: 'relative', color: '#cfe8e2',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#cfe8e2', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.83rem', opacity: 0.75, textAlign: 'center', marginBottom: '14px', lineHeight: 1.6 },
  reelStrip: {
    display: 'flex', alignItems: 'center', gap: '4px', minHeight: '44px',
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '8px 12px',
    marginBottom: '14px', overflowX: 'auto',
  },
  stripEmpty: { fontSize: '0.75rem', opacity: 0.4, margin: '0 auto' },
  stripPiece: {
    position: 'relative', minWidth: '44px', height: '26px', backgroundColor: '#4a3a20',
    border: '1px solid #8a7040', borderRadius: '3px', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700,
  },
  scrapList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  scrap: {
    position: 'relative', display: 'flex', justifyContent: 'space-between', gap: '8px',
    minHeight: '48px', alignItems: 'center', padding: '8px 14px',
    backgroundColor: '#1e302c', color: '#cfe8e2', textAlign: 'left',
    border: '1px solid rgba(140,220,205,0.25)', borderRadius: '8px', cursor: 'pointer',
  },
  scrapHead: { fontSize: '0.82rem', fontWeight: 600 },
  scrapTail: { fontSize: '0.72rem', opacity: 0.6, whiteSpace: 'nowrap' },
  leaderBand: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px',
    backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: '3px 0 0 3px',
  },
  btnRow: { display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' },
  actBtn: {
    minHeight: '44px', padding: '0 18px', fontSize: '0.85rem', fontWeight: 600,
    backgroundColor: '#1e302c', color: '#cfe8e2',
    border: '1px solid rgba(140,220,205,0.3)', borderRadius: '8px', cursor: 'pointer',
  },
  submitBtn: { backgroundColor: '#24443c' },
};
