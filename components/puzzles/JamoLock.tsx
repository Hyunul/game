'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';

interface Props {
  open: boolean;
  title: string;
  length: number;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

const JAMO = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

export default function JamoLock({ open, title, length, onSubmit, onClose }: Props) {
  const [entries, setEntries] = useState<string[]>([]);

  useEffect(() => {
    if (open) setEntries([]);
  }, [open]);

  if (!open) return null;

  function handleJamo(j: string) {
    playSfx('click');
    setEntries((prev) => (prev.length < length ? [...prev, j] : prev));
  }

  function handleBackspace() {
    playSfx('click');
    setEntries((prev) => prev.slice(0, -1));
  }

  function handleSubmit() {
    if (entries.length < length) return;
    onSubmit(entries.join('-'));
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>{title}</h2>

        <div style={styles.entryRow}>
          {Array.from({ length }).map((_, i) => (
            <div key={i} style={styles.entryBox}>
              {entries[i] ?? ''}
            </div>
          ))}
        </div>

        <div style={styles.jamoGrid}>
          {JAMO.map((j) => (
            <button
              key={j}
              style={styles.jamoBtn}
              onClick={() => handleJamo(j)}
              aria-label={j}
            >
              {j}
            </button>
          ))}
        </div>

        <div style={styles.actionRow}>
          <button style={styles.backBtn} onClick={handleBackspace} aria-label="지우기">⌫</button>
          <button
            style={{
              ...styles.confirmBtn,
              opacity: entries.length === length ? 1 : 0.4,
              cursor: entries.length === length ? 'pointer' : 'default',
            }}
            onClick={handleSubmit}
            disabled={entries.length < length}
          >
            확인
          </button>
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
  },
  card: {
    backgroundColor: '#2e1f10',
    border: '1px solid rgba(232,211,168,0.3)',
    borderRadius: '12px',
    padding: '28px 32px',
    maxWidth: '340px',
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
    marginBottom: '20px',
    fontWeight: 600,
    textAlign: 'center',
  },
  entryRow: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  entryBox: {
    width: '44px',
    height: '52px',
    backgroundColor: '#1a1008',
    border: '1px solid rgba(232,211,168,0.4)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ffd24a',
  },
  jamoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '6px',
    marginBottom: '16px',
  },
  jamoBtn: {
    padding: '0',
    height: '44px',
    minWidth: '44px',
    fontSize: '1.05rem',
    fontWeight: 600,
    backgroundColor: '#3a2810',
    color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.25)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
  },
  backBtn: {
    padding: '12px',
    minWidth: '52px',
    height: '48px',
    fontSize: '1rem',
    fontWeight: 600,
    backgroundColor: '#3a2810',
    color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.25)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  confirmBtn: {
    flex: 1,
    padding: '12px',
    height: '48px',
    fontSize: '1rem',
    fontWeight: 600,
    backgroundColor: '#7a4f1e',
    color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.4)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
