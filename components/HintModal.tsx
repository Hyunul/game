'use client';
import { useGame } from '../lib/GameContext';
import { canAttemptWith } from '../lib/gameState';
import { useEscape } from '../lib/useEscape';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HintModal({ open, onClose }: Props) {
  const { state, dispatch, episode } = useGame();
  useEscape(open, onClose);

  if (!open) return null;

  const roomPuzzles = episode.puzzles.filter((p) => p.room === state.room && !state.solved.includes(p.id));
  let puzzle = roomPuzzles.find((p) => canAttemptWith(episode, state, p.id)) ?? null;

  // ep2: era 조건 때문에 canAttempt가 전부 false여도, requires/requiresItem(s)는
  // 충족했지만 era만 어긋난 미해결 퍼즐이 있으면 그것을 힌트 대상으로 fallback.
  if (!puzzle && episode.id === 'ep2') {
    puzzle = roomPuzzles.find((p) => {
      if (!p.requires.every((r) => state.solved.includes(r))) return false;
      if (p.requiresItem && !state.inventory.includes(p.requiresItem)) return false;
      if (p.requiresItems && !p.requiresItems.every((it) => state.inventory.includes(it))) return false;
      return true;
    }) ?? null;
  }

  const hintsUsed = puzzle ? (state.hintsUsed[puzzle.id] ?? 0) : 0;
  const currentHint = puzzle && hintsUsed > 0 ? puzzle.hints[hintsUsed - 1] : null;
  // 힌트 배열 길이를 넘어선 사용 방지 — 배열이 2개 미만이어도 빈 힌트가 뜨지 않게
  const canUseMore = puzzle && hintsUsed < Math.min(2, puzzle.hints.length);

  function handleUseHint() {
    if (!puzzle) return;
    dispatch({ type: 'USE_HINT', puzzleId: puzzle.id });
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>💡 힌트</h2>
        {!puzzle ? (
          <p style={styles.text}>지금은 힌트가 필요 없어 보인다.</p>
        ) : (
          <>
            {currentHint && (
              <p style={styles.hintText}>{currentHint}</p>
            )}
            {!currentHint && (
              <p style={styles.text}>힌트를 사용하면 퍼즐 단서를 얻을 수 있다.</p>
            )}
            {canUseMore && (
              <button style={styles.btn} onClick={handleUseHint}>
                힌트 보기 {hintsUsed < 1 ? '(1/2)' : '(2/2)'}
              </button>
            )}
            {!canUseMore && hintsUsed >= 2 && (
              <p style={{ ...styles.text, marginTop: '8px', fontSize: '0.8rem', opacity: 0.7 }}>
                힌트를 모두 사용했다.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(10,6,2,0.75)',
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
    fontSize: '1.2rem',
    marginBottom: '16px',
    fontWeight: 600,
  },
  text: {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    opacity: 0.85,
  },
  hintText: {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    marginBottom: '16px',
    fontStyle: 'italic',
  },
  btn: {
    marginTop: '12px',
    padding: '10px 20px',
    backgroundColor: '#7a4f1e',
    color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.4)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
};
