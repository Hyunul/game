'use client';
import { useState, useEffect, useMemo } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

const SIZE = 5;

/**
 * 도안 목표 패턴 (row-major, true=겉뜨기 ●).
 * 채워 넣으면 「돌」의 첫 자소를 닮은 무늬가 된다 — 완성 시 내레이션이 글자를 읽어준다.
 */
const TARGET: boolean[][] = [
  [true,  true,  true,  true,  false],
  [true,  false, false, false, false],
  [true,  true,  true,  true,  false],
  [false, false, false, true,  false],
  [true,  true,  true,  true,  false],
];

/** 뜨개 도안 격자 — 도안의 겉뜨기(●) 기호를 그대로 격자에 옮기면 풀린다 */
export default function KnitGrid({ open, onSubmit, onClose }: Props) {
  const [cells, setCells] = useState<boolean[][]>(() => emptyGrid());

  useEffect(() => { if (open) setCells(emptyGrid()); }, [open]);
  useEscape(open, onClose);

  const matched = useMemo(
    () => cells.every((row, r) => row.every((c, col) => c === TARGET[r][col])),
    [cells],
  );

  useEffect(() => {
    if (!open || !matched) return;
    const t = setTimeout(() => onSubmit('dol'), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched, open]);

  if (!open) return null;

  function toggle(r: number, c: number) {
    playSfx('click');
    setCells((prev) => prev.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? !v : v))));
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>뜨개 도안</h2>
        <p style={styles.instruction}>도안의 겉뜨기(●) 칸을 격자에 그대로 옮겨 떠보자.</p>

        <div style={styles.panes}>
          {/* 도안 (읽기 전용) */}
          <div>
            <p style={styles.paneLabel}>도안</p>
            <div style={styles.grid} aria-label="뜨개 도안 (겉뜨기 ●, 안뜨기 ○)">
              {TARGET.map((row, r) =>
                row.map((v, c) => (
                  <div key={`t-${r}-${c}`} style={styles.patternCell}>
                    {v ? '●' : '○'}
                  </div>
                )),
              )}
            </div>
          </div>
          {/* 내 뜨개 (입력) */}
          <div>
            <p style={styles.paneLabel}>내 뜨개</p>
            <div style={styles.grid}>
              {cells.map((row, r) =>
                row.map((v, c) => (
                  <button
                    key={`c-${r}-${c}`}
                    style={{
                      ...styles.cellBtn,
                      backgroundColor: v ? '#c88a5a' : '#1a1008',
                      border: v ? '1px solid #ffd24a' : '1px solid rgba(232,211,168,0.3)',
                    }}
                    onClick={() => toggle(r, c)}
                    aria-label={`${r + 1}단 ${c + 1}코 ${v ? '겉뜨기' : '안뜨기'}`}
                  />
                )),
              )}
            </div>
          </div>
        </div>

        <p style={styles.hintLine}>{matched ? '…무늬가 글자를 이룬다.' : '한 코 한 코, 도안을 따라서.'}</p>
      </div>
    </div>
  );
}

function emptyGrid(): boolean[][] {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => false));
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
  instruction: { fontSize: '0.85rem', opacity: 0.75, textAlign: 'center', marginBottom: '18px' },
  panes: { display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' },
  paneLabel: { fontSize: '0.8rem', opacity: 0.7, textAlign: 'center', marginBottom: '6px' },
  grid: {
    display: 'grid', gridTemplateColumns: `repeat(${SIZE}, 32px)`, gridAutoRows: '32px', gap: '4px',
  },
  patternCell: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.9rem', color: '#e8d3a8', backgroundColor: 'rgba(232,211,168,0.06)', borderRadius: '4px',
  },
  cellBtn: { borderRadius: '4px', cursor: 'pointer', padding: 0 },
  hintLine: { fontSize: '0.8rem', opacity: 0.65, textAlign: 'center', marginTop: '16px' },
};
