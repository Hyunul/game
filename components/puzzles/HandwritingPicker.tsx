'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';

interface Sample {
  id: string;
  label: string;
  text: string;
  style: 'neat' | 'cursive' | 'small';
}

interface Props {
  open: boolean;
  question: string;
  /** 쪽지(비교 대상) 본문 — 흘려 쓴 글씨체로 렌더된다. */
  noteText: string;
  samples: Sample[];
  /** 오답 신호. 값이 바뀔 때마다 흔들림을 트리거한다. */
  wrongSignal?: number;
  onSubmit: (answer: 'youngsu' | 'youngho') => void;
  onClose: () => void;
}

const STYLE_MAP: Record<Sample['style'], React.CSSProperties> = {
  neat: {
    fontFamily: 'Georgia, "Nanum Myeongjo", serif',
    fontStyle: 'normal',
    letterSpacing: '0.5px',
    fontWeight: 500,
  },
  cursive: {
    fontFamily: 'Georgia, "Nanum Myeongjo", serif',
    fontStyle: 'italic',
    letterSpacing: '-0.5px',
    transform: 'skewX(-6deg)',
  },
  small: {
    fontFamily: 'Georgia, "Nanum Myeongjo", serif',
    fontStyle: 'normal',
    letterSpacing: '-1px',
    fontSize: '0.78rem',
  },
};

export default function HandwritingPicker({
  open, question, noteText, samples, wrongSignal, onSubmit, onClose,
}: Props) {
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (open) setShake(false);
  }, [open]);

  useEffect(() => {
    if (!open || wrongSignal === undefined) return;
    // 오답음은 ATTEMPT 디스패치를 받은 GameContext가 재생 — 여기서 또 울리면 중복
    setShake(true);
    const t = setTimeout(() => setShake(false), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongSignal]);

  if (!open) return null;

  function handleChoice(choice: 'youngsu' | 'youngho') {
    playSfx('click');
    onSubmit(choice);
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={styles.card}
        className={shake ? 'shake' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>필적 감정</h2>

        <div style={styles.noteBox}>
          <div style={styles.noteLabel}>쪽지</div>
          <div style={{ ...styles.noteText, ...STYLE_MAP.cursive }}>{noteText}</div>
        </div>

        <div style={styles.samples}>
          {samples.map((s) => (
            <div key={s.id} style={styles.sampleBox}>
              <div style={styles.sampleLabel}>{s.label}</div>
              <div style={{ ...styles.sampleText, ...STYLE_MAP[s.style] }}>{s.text}</div>
            </div>
          ))}
        </div>

        <p style={styles.question}>{question}</p>

        <div style={styles.choiceRow}>
          <button style={styles.choiceBtn} onClick={() => handleChoice('youngsu')}>영수</button>
          <button style={styles.choiceBtn} onClick={() => handleChoice('youngho')}>영호</button>
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
    maxWidth: '420px',
    width: '92%',
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
    marginBottom: '18px',
    fontWeight: 600,
    textAlign: 'center',
  },
  noteBox: {
    backgroundColor: '#f0e4c8',
    color: '#3a2a18',
    borderRadius: '6px',
    padding: '12px 14px',
    marginBottom: '16px',
  },
  noteLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    opacity: 0.6,
    marginBottom: '6px',
  },
  noteText: {
    fontSize: '0.95rem',
    lineHeight: 1.7,
  },
  samples: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '18px',
  },
  sampleBox: {
    backgroundColor: '#f0e4c8',
    color: '#3a2a18',
    borderRadius: '6px',
    padding: '10px 14px',
  },
  sampleLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    opacity: 0.6,
    marginBottom: '4px',
  },
  sampleText: {
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  question: {
    fontSize: '0.9rem',
    textAlign: 'center',
    marginBottom: '16px',
    opacity: 0.9,
  },
  choiceRow: {
    display: 'flex',
    gap: '10px',
  },
  choiceBtn: {
    flex: 1,
    padding: '14px',
    minHeight: '48px',
    fontSize: '1rem',
    fontWeight: 600,
    backgroundColor: '#7a4f1e',
    color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.4)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
