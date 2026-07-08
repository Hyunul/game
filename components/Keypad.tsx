'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../lib/audio';
import { useEscape } from '../lib/useEscape';

interface Props {
  open: boolean;
  title: string;
  length: number;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

export default function Keypad({ open, title, length, onSubmit, onClose }: Props) {
  const [entry, setEntry] = useState('');

  useEffect(() => {
    if (open) setEntry('');
  }, [open]);

  useEscape(open, onClose);

  if (!open) return null;

  function handleDigit(d: string) {
    playSfx('click');
    setEntry((prev) => (prev.length < length ? prev + d : prev));
  }

  function handleBackspace() {
    playSfx('click');
    setEntry((prev) => prev.slice(0, -1));
  }

  function handleSubmit() {
    if (entry.length < length) return;
    onSubmit(entry);
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>{title}</h2>

        {/* Entry boxes */}
        <div style={styles.entryRow}>
          {Array.from({ length }).map((_, i) => (
            <div key={i} style={styles.entryBox}>
              {entry[i] ?? ''}
            </div>
          ))}
        </div>

        {/* Digit grid */}
        <div style={styles.digitGrid}>
          {['1','2','3','4','5','6','7','8','9','⌫','0','✓'].map((key) => {
            const isBack = key === '⌫';
            const isConfirm = key === '✓';
            return (
              <button
                key={key}
                style={{
                  ...styles.digitBtn,
                  ...(isConfirm
                    ? { backgroundColor: entry.length === length ? '#7a4f1e' : '#3a2810' }
                    : {}),
                }}
                onClick={() => {
                  if (isBack) handleBackspace();
                  else if (isConfirm) handleSubmit();
                  else handleDigit(key);
                }}
                aria-label={isBack ? '지우기' : isConfirm ? '확인' : key}
              >
                {key}
              </button>
            );
          })}
        </div>

        <button
          style={{
            ...styles.confirmBtn,
            opacity: entry.length === length ? 1 : 0.4,
            cursor: entry.length === length ? 'pointer' : 'default',
          }}
          onClick={handleSubmit}
          disabled={entry.length < length}
        >
          확인
        </button>
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
    maxWidth: '320px',
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
  digitGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '16px',
  },
  digitBtn: {
    padding: '0',
    height: '52px',
    fontSize: '1.2rem',
    fontWeight: 600,
    backgroundColor: '#3a2810',
    color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.25)',
    borderRadius: '8px',
    cursor: 'pointer',
    minHeight: '48px',
  },
  confirmBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    backgroundColor: '#7a4f1e',
    color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.4)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
