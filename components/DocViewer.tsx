'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../lib/audio';
import { Item } from '../lib/types';

interface Props {
  item: Item | null;
  onClose: () => void;
}

export default function DocViewer({ item, onClose }: Props) {
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [item]);

  if (!item || !item.doc) return null;

  const pages = item.docPages ?? [];
  const hasMultiplePages = pages.length > 1;

  function goPrev() {
    playSfx('click');
    setPage((p) => Math.max(0, p - 1));
  }

  function goNext() {
    playSfx('click');
    setPage((p) => Math.min(pages.length - 1, p + 1));
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>{item.name}</h2>
        <div style={styles.pageText}>{pages[page]}</div>
        {hasMultiplePages && (
          <div style={styles.pageNav}>
            <button
              style={{ ...styles.navBtn, opacity: page === 0 ? 0.35 : 1 }}
              onClick={goPrev}
              disabled={page === 0}
            >
              이전
            </button>
            <span style={styles.pageIndicator}>{page + 1} / {pages.length}</span>
            <button
              style={{ ...styles.navBtn, opacity: page === pages.length - 1 ? 0.35 : 1 }}
              onClick={goNext}
              disabled={page === pages.length - 1}
            >
              다음
            </button>
          </div>
        )}
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
    backgroundColor: '#f0e4c8',
    border: '1px solid rgba(58,42,24,0.3)',
    borderRadius: '4px 14px 4px 14px',
    boxShadow: 'inset 0 0 40px rgba(58,42,24,0.18), 0 8px 24px rgba(0,0,0,0.4)',
    padding: '28px 32px',
    maxWidth: '480px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    position: 'relative',
    color: '#3a2a18',
    fontFamily: 'Georgia, "Nanum Myeongjo", serif',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '14px',
    background: 'none',
    border: 'none',
    color: '#3a2a18',
    fontSize: '1.1rem',
    cursor: 'pointer',
    opacity: 0.6,
    padding: '4px',
  },
  title: {
    fontSize: '1.15rem',
    marginBottom: '18px',
    fontWeight: 700,
    textAlign: 'center',
    borderBottom: '1px solid rgba(58,42,24,0.25)',
    paddingBottom: '12px',
  },
  pageText: {
    fontSize: '0.95rem',
    lineHeight: 1.9,
    whiteSpace: 'pre-wrap',
    minHeight: '80px',
  },
  pageNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '20px',
    paddingTop: '14px',
    borderTop: '1px solid rgba(58,42,24,0.2)',
  },
  navBtn: {
    padding: '8px 16px',
    fontSize: '0.9rem',
    fontWeight: 600,
    backgroundColor: 'rgba(58,42,24,0.1)',
    color: '#3a2a18',
    border: '1px solid rgba(58,42,24,0.3)',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  pageIndicator: {
    fontSize: '0.85rem',
    opacity: 0.75,
    minWidth: '48px',
    textAlign: 'center',
  },
};
