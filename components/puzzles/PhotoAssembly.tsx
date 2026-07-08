'use client';
import { useState, useEffect, useRef } from 'react';
import { playSfx } from '../../lib/audio';
import { fx } from '../../lib/effects';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

type Quadrant = 'TL' | 'TR' | 'BL' | 'BR';
const QUADRANTS: Quadrant[] = ['TL', 'TR', 'BL', 'BR'];
const QUADRANT_LABEL: Record<Quadrant, string> = {
  TL: '좌상', TR: '우상', BL: '좌하', BR: '우하',
};

interface Piece {
  id: string;
  label: string;
  correct: Quadrant;
}

const PIECES: Piece[] = [
  { id: 'p1', label: '조각①', correct: 'TL' },
  { id: 'p2', label: '조각②', correct: 'TR' },
  { id: 'p3', label: '조각③', correct: 'BL' },
  { id: 'p4', label: '조각④', correct: 'BR' },
];

// 조각별 미니 삽화: 각 조각의 내용으로 정답 위치를 추론할 수 있게 그린다.
function PieceArt({ id }: { id: string }) {
  switch (id) {
    case 'p1': // 좌상: 아버지 어깨/처마 — 위쪽에 처마선, 인물 어깨는 아래쪽에 걸침
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <rect width="100" height="100" fill="#cbb98a" />
          <path d="M0,18 L100,18 L85,30 L15,30 Z" fill="#5a4632" />
          <path d="M10,100 Q50,60 90,100 Z" fill="#3a2a18" />
        </svg>
      );
    case 'p2': // 우상: 어머니와 하늘 — 하늘색 위쪽, 머리 실루엣 아래쪽
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <rect width="100" height="100" fill="#bcd6e8" />
          <circle cx="30" cy="90" r="6" fill="#fff" opacity="0.7" />
          <circle cx="55" cy="95" r="5" fill="#fff" opacity="0.6" />
          <path d="M20,100 Q50,55 80,100 Z" fill="#4a3a2c" />
        </svg>
      );
    case 'p3': // 좌하: 형(왼쪽 인물) 몸통 — 땅색 아래, 옷깃이 위쪽에 걸침
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <rect width="100" height="100" fill="#8a7a5c" />
          <path d="M20,0 Q50,25 80,0 L80,60 Q50,75 20,60 Z" fill="#3a4a5c" />
          <rect x="42" y="0" width="16" height="14" fill="#e8d3a8" />
        </svg>
      );
    case 'p4': // 우하: 동생(오른쪽 인물) 몸통 — 땅색 아래, 옷깃이 위쪽에 걸침
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <rect width="100" height="100" fill="#94815f" />
          <path d="M20,0 Q50,25 80,0 L80,60 Q50,75 20,60 Z" fill="#5c3a2c" />
          <rect x="42" y="0" width="16" height="14" fill="#e8d3a8" />
        </svg>
      );
    default:
      return null;
  }
}

export default function PhotoAssembly({ open, onSubmit, onClose }: Props) {
  const [placed, setPlaced] = useState<Partial<Record<Quadrant, string>>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setPlaced({});
      setSelected(null);
      setShake(false);
    }
  }, [open]);

  useEffect(() => () => {
    if (shakeTimer.current !== null) clearTimeout(shakeTimer.current);
  }, []);

  useEscape(open, onClose);

  if (!open) return null;

  const placedIds = Object.values(placed);
  const pool = PIECES.filter((p) => !placedIds.includes(p.id));

  function handlePoolClick(pieceId: string) {
    playSfx('click');
    setSelected((prev) => (prev === pieceId ? null : pieceId));
  }

  function handleSlotClick(q: Quadrant) {
    playSfx('click');
    const existing = placed[q];
    if (existing) {
      // 이미 놓인 조각을 다시 클릭하면 pool로 되돌린다.
      setPlaced((prev) => {
        const next = { ...prev };
        delete next[q];
        return next;
      });
      return;
    }
    if (!selected) return;
    const next = { ...placed, [q]: selected };
    setPlaced(next);
    setSelected(null);

    if (Object.keys(next).length === QUADRANTS.length) {
      const isCorrect = QUADRANTS.every((quad) => {
        const pieceId = next[quad];
        const piece = PIECES.find((p) => p.id === pieceId);
        return piece?.correct === quad;
      });
      if (isCorrect) {
        fx.correctPulse();
        onSubmit('assembled');
      } else {
        playSfx('wrong');
        setShake(true);
        shakeTimer.current = setTimeout(() => setShake(false), 600);
      }
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>찢긴 사진 조립</h2>

        <div className={shake ? 'shake' : undefined} style={styles.board}>
          {QUADRANTS.map((q) => {
            const pieceId = placed[q];
            const piece = pieceId ? PIECES.find((p) => p.id === pieceId) : null;
            return (
              <button
                key={q}
                style={{
                  ...styles.slot,
                  border: piece ? '2px solid #ffd24a' : '2px dashed rgba(232,211,168,0.4)',
                }}
                onClick={() => handleSlotClick(q)}
                aria-label={`${QUADRANT_LABEL[q]} 자리${piece ? `, ${piece.label} 놓임` : ''}`}
              >
                {piece ? <PieceArt id={piece.id} /> : (
                  <span style={styles.slotLabel}>{QUADRANT_LABEL[q]}</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={styles.poolLabel}>조각 보관함</div>
        <div style={styles.pool}>
          {pool.map((p) => (
            <button
              key={p.id}
              style={{
                ...styles.poolPiece,
                outline: selected === p.id ? '3px solid #ffd24a' : 'none',
              }}
              onClick={() => handlePoolClick(p.id)}
              aria-label={`${p.label} 선택`}
            >
              <PieceArt id={p.id} />
              <span style={styles.poolPieceLabel}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(10,6,2,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 80,
    padding: '16px',
  },
  card: {
    backgroundColor: '#2e1f10',
    border: '1px solid rgba(232,211,168,0.3)',
    borderRadius: '12px',
    padding: '28px 32px',
    maxWidth: '380px',
    width: '90%',
    position: 'relative',
    color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '14px',
    background: 'none',
    border: 'none',
    color: '#e8d3a8',
    fontSize: '1.1rem',
    cursor: 'pointer',
    opacity: 0.7,
    padding: '4px',
  },
  title: {
    fontSize: '1.1rem',
    marginBottom: '18px',
    fontWeight: 600,
    textAlign: 'center',
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 120px)',
    gridTemplateRows: 'repeat(2, 120px)',
    gap: '4px',
    justifyContent: 'center',
    marginBottom: '22px',
  },
  slot: {
    width: '120px',
    height: '120px',
    borderRadius: '4px',
    backgroundColor: '#1a1008',
    padding: 0,
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: {
    fontSize: '0.85rem',
    color: 'rgba(232,211,168,0.5)',
  },
  poolLabel: {
    fontSize: '0.85rem',
    opacity: 0.7,
    marginBottom: '8px',
    textAlign: 'center',
  },
  pool: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  poolPiece: {
    width: '64px',
    height: '78px',
    padding: '4px',
    backgroundColor: '#3a2810',
    border: '1px solid rgba(232,211,168,0.25)',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  poolPieceLabel: {
    fontSize: '0.7rem',
    color: '#e8d3a8',
  },
};
