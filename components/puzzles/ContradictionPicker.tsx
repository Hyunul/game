'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface SentenceDoc {
  docId: string;
  docName: string;
  sentences: { id: string; text: string }[];
}

interface Props {
  open: boolean;
  sentences: SentenceDoc[];
  /** 오답 신호. 값이 바뀔 때마다(예: 카운터 증가) 흔들림+선택 해제를 트리거한다. */
  wrongSignal?: number;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

export default function ContradictionPicker({ open, sentences, wrongSignal, onSubmit, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected([]);
      setShake(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || wrongSignal === undefined) return;
    // 오답음은 ATTEMPT 디스패치를 받은 GameContext가 재생 — 여기서 또 울리면 중복
    setShake(true);
    setSelected([]);
    const t = setTimeout(() => setShake(false), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongSignal]);

  useEscape(open, onClose);

  if (!open) return null;

  function toggleSentence(id: string) {
    playSfx('click');
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  function handleSubmit() {
    if (selected.length !== 2) return;
    const [a, b] = [...selected].sort();
    const answer = `${a}|${b}`;
    onSubmit(answer);
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>모순 찾기</h2>
        <p style={styles.instruction}>서로 모순되는 문장 두 개를 골라보자.</p>

        <div className={shake ? 'shake' : undefined} style={styles.docColumns}>
          {sentences.map((doc) => (
            <div key={doc.docId} style={styles.docColumn}>
              <div style={styles.docName}>{doc.docName}</div>
              {doc.sentences.map((s) => {
                const isSelected = selected.includes(s.id);
                return (
                  <button
                    key={s.id}
                    style={{
                      ...styles.sentenceBtn,
                      backgroundColor: isSelected ? '#7a4f1e' : '#3a2810',
                      border: isSelected
                        ? '1px solid #ffd24a'
                        : '1px solid rgba(232,211,168,0.25)',
                    }}
                    onClick={() => toggleSentence(s.id)}
                  >
                    {s.text}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <button
          style={{
            ...styles.confirmBtn,
            opacity: selected.length === 2 ? 1 : 0.4,
            cursor: selected.length === 2 ? 'pointer' : 'default',
          }}
          onClick={handleSubmit}
          disabled={selected.length !== 2}
        >
          이 두 진술은 모순이다
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
    padding: '16px',
  },
  card: {
    backgroundColor: '#2e1f10',
    border: '1px solid rgba(232,211,168,0.3)',
    borderRadius: '12px',
    padding: '28px 32px',
    maxWidth: '560px',
    width: '95%',
    maxHeight: '85vh',
    overflowY: 'auto',
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
    marginBottom: '8px',
    fontWeight: 600,
    textAlign: 'center',
  },
  instruction: {
    fontSize: '0.85rem',
    opacity: 0.75,
    textAlign: 'center',
    marginBottom: '18px',
  },
  docColumns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '20px',
  },
  docColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  docName: {
    fontSize: '0.85rem',
    fontWeight: 700,
    opacity: 0.85,
    marginBottom: '2px',
    borderBottom: '1px solid rgba(232,211,168,0.25)',
    paddingBottom: '6px',
  },
  sentenceBtn: {
    padding: '10px 12px',
    fontSize: '0.85rem',
    lineHeight: 1.5,
    color: '#e8d3a8',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    minHeight: '44px',
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
