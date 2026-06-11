'use client';

interface Props {
  text: string | null;
  onDone?: () => void;
}

export default function Narration({ text, onDone }: Props) {
  if (!text) return null;

  return (
    <div style={styles.box} onClick={onDone} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onDone?.()}>
      <p style={styles.text}>{text}</p>
      <span style={styles.cue}>▼ 클릭하여 계속</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  box: {
    position: 'fixed',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'min(680px, 90vw)',
    backgroundColor: 'rgba(15,9,3,0.88)',
    border: '1px solid rgba(232,211,168,0.25)',
    borderRadius: '10px',
    padding: '18px 24px 14px',
    cursor: 'pointer',
    zIndex: 45,
    userSelect: 'none',
  },
  text: {
    color: '#e8d3a8',
    fontSize: '1rem',
    lineHeight: 1.7,
    fontFamily: '"Georgia", "Batang", serif',
    marginBottom: '8px',
  },
  cue: {
    display: 'block',
    textAlign: 'right',
    fontSize: '0.72rem',
    color: 'rgba(232,211,168,0.45)',
    letterSpacing: '0.05em',
  },
};
