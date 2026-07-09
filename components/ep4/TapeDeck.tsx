'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../lib/GameContext';
import { canAttemptWith } from '../../lib/gameState';
import { TAPE_SEGMENTS, segmentLines, isCleanMode } from '../../lib/ep4Tape';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** ep4 시그니처 — 릴 데크 오버레이. 카운터 되감기/재생, 구간 자막, 클린 모드. */
export default function TapeDeck({ open, onClose }: Props) {
  const { state, dispatch, episode } = useGame();
  const [counter, setCounter] = useState(0);
  const [lines, setLines] = useState<string[] | null>(null);
  const [lineIdx, setLineIdx] = useState(0);
  const [spinning, setSpinning] = useState<'play' | 'rewind' | 'ff' | null>(null);
  const [restoring, setRestoring] = useState(false);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdSpeed = useRef(1);

  const can = useCallback(
    (id: string) => canAttemptWith(episode, state, id),
    [episode, state],
  );
  const solved = state.solved;
  const clean = isCleanMode(solved);

  useEscape(open, onClose);
  useEffect(() => {
    if (open) { setLines(null); setLineIdx(0); setSpinning(null); setRestoring(false); }
  }, [open]);
  useEffect(() => () => { if (holdRef.current) clearInterval(holdRef.current); }, []);

  if (!open) return null;

  const counterStr = String(counter).padStart(3, '0');
  const playingSubtitles = lines !== null;

  // ── 되감기/빨리감기: 홀드 시 가속 ──
  function startHold(dir: -1 | 1) {
    if (playingSubtitles) return;
    stopHold();
    holdSpeed.current = 1;
    playSfx('rewind');
    setSpinning(dir === -1 ? 'rewind' : 'ff');
    holdRef.current = setInterval(() => {
      holdSpeed.current = Math.min(holdSpeed.current + 0.35, 12);
      setCounter((c) => Math.max(0, Math.min(999, c + dir * Math.round(holdSpeed.current))));
    }, 60);
  }
  function stopHold() {
    if (holdRef.current) { clearInterval(holdRef.current); holdRef.current = null; }
    setSpinning((sp) => (sp === 'play' ? sp : null));
  }
  function step(dir: -1 | 1) {
    if (playingSubtitles) return;
    playSfx('click');
    setCounter((c) => Math.max(0, Math.min(999, c + dir)));
  }

  // ── 재생 ──
  function handlePlay() {
    if (playingSubtitles) return;
    playSfx('click');

    // 최종: 올해의 테이프 (035) — 재생 즉시 에필로그로
    if (counterStr === '035' && can('ep4-final')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-final', answer: '035' });
      onClose();
      return;
    }

    const seg = TAPE_SEGMENTS.find((sg) => sg.counter === counterStr);
    // seg-042는 첫 청취가 곧 ep4-counter의 해결 — 시도 가능하면 아직 미해결이어도 들린다
    const effectiveSolved =
      seg?.id === 'seg-042' && !solved.includes('ep4-counter') && can('ep4-counter')
        ? [...solved, 'ep4-counter']
        : solved;
    const heard = seg ? segmentLines(seg.id, effectiveSolved) : [];
    if (heard.length === 0) {
      setLines(['…지직… (아무것도 들리지 않는다)']);
    } else {
      setLines(heard);
    }
    setLineIdx(0);
    setSpinning('play');
  }

  // 자막 진행 — 마지막 줄에서 한 번 더 클릭하면 정지 + 퍼즐 판정
  function advanceLine() {
    if (!lines) return;
    if (lineIdx < lines.length - 1) {
      playSfx('click');
      setLineIdx((i) => i + 1);
      return;
    }
    finishPlayback();
  }

  function finishPlayback() {
    const seg = TAPE_SEGMENTS.find((sg) => sg.counter === counterStr);
    setLines(null);
    setLineIdx(0);
    setSpinning(null);

    if (!seg) return;
    // 042 첫 청취 → ep4-counter / 클린 모드 재청취 → ep4-relisten
    if (seg.id === 'seg-042') {
      if (!solved.includes('ep4-counter') && can('ep4-counter')) {
        dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-counter', answer: '042' });
      } else if (clean && !solved.includes('ep4-relisten') && can('ep4-relisten')) {
        dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-relisten', answer: '' });
      }
    }
    // 복원된 오디션 테이프를 끝까지 들으면 부스 회상으로
    if (seg.id === 'seg-audition' && !solved.includes('ep4-booth')) {
      onClose();
      dispatch({ type: 'ENTER_ROOM', room: 'ep4-booth' });
    }
  }

  // ── 걸려 있는 테이프 (F7) 복원 ──
  const lastTapeSolved = solved.includes('ep4-lasttape');
  const lastTapeReady = !lastTapeSolved && can('ep4-lasttape');
  function handleRestore() {
    if (!lastTapeReady || restoring) return;
    setRestoring(true);
    playSfx('splice');
    setTimeout(() => {
      playSfx('noise-clear');
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-lasttape', answer: 'restored' });
      setRestoring(false);
      setCounter(387);
    }, 1200);
  }

  const reelSpin = spinning
    ? { animation: `ep4reel ${spinning === 'play' ? 1.6 : 0.4}s linear infinite` }
    : {};

  return (
    <div style={styles.overlay} onClick={onClose}>
      <style>{`@keyframes ep4reel { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>릴 데크</h2>

        {/* 릴 + 카운터 */}
        <svg viewBox="0 0 300 120" width="100%" style={{ maxWidth: 340, display: 'block', margin: '0 auto' }} aria-label={`카운터 ${counterStr}`}>
          <rect x="8" y="8" width="284" height="104" rx="10" fill="#241a10" stroke="#8a5a33" strokeWidth="2" />
          {[80, 220].map((cx) => (
            <g key={cx} style={{ transformOrigin: `${cx}px 52px`, ...reelSpin } as React.CSSProperties}>
              <circle cx={cx} cy="52" r="30" fill="#141210" stroke="#c8a86a" strokeWidth="2" />
              <circle cx={cx} cy="52" r="8" fill="#c8a86a" />
              {[0, 120, 240].map((deg) => (
                <line
                  key={deg} x1={cx} y1="52"
                  x2={cx + 26 * Math.cos((deg * Math.PI) / 180)}
                  y2={52 + 26 * Math.sin((deg * Math.PI) / 180)}
                  stroke="#c8a86a" strokeWidth="3"
                />
              ))}
            </g>
          ))}
          <line x1="108" y1="70" x2="192" y2="70" stroke="#6a4a2a" strokeWidth="3" />
          {/* 카운터 창 */}
          <rect x="118" y="20" width="64" height="26" rx="4" fill="#0c0a06" stroke={clean ? '#5ad8c8' : '#8a5a33'} strokeWidth="1.5" />
          <text x="150" y="39" textAnchor="middle" fontSize="18" fontFamily="monospace" fill={clean ? '#7ae8d8' : '#e8d3a8'}>
            {counterStr}
          </text>
          {clean && <text x="150" y="102" textAnchor="middle" fontSize="9" fill="#7ae8d8" letterSpacing="2">CLEAN</text>}
        </svg>

        {/* 자막 영역 */}
        {playingSubtitles ? (
          <div style={styles.subtitleBox} onClick={advanceLine} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') advanceLine(); }}>
            <p style={styles.subtitleLine}>{lines![lineIdx]}</p>
            <p style={styles.subtitleHint}>
              {lineIdx < lines!.length - 1 ? '▸ 눌러서 계속 듣기' : '■ 눌러서 멈추기'}
            </p>
          </div>
        ) : (
          <>
            <div style={styles.controls}>
              <button style={styles.ctrlBtn} onClick={() => step(-1)}
                onPointerDown={() => startHold(-1)} onPointerUp={stopHold} onPointerLeave={stopHold}
                aria-label="되감기">⏪</button>
              <button style={{ ...styles.ctrlBtn, ...styles.playBtn }} onClick={handlePlay} aria-label="재생">▶</button>
              <button style={styles.ctrlBtn} onClick={() => step(1)}
                onPointerDown={() => startHold(1)} onPointerUp={stopHold} onPointerLeave={stopHold}
                aria-label="빨리 감기">⏩</button>
            </div>
            <p style={styles.hintLine}>버튼을 꾹 누르면 빠르게 감긴다</p>

            {/* 걸려 있는 테이프 (F7) */}
            <div style={styles.lastTapeRow}>
              <span style={styles.lastTapeLabel}>
                {lastTapeSolved
                  ? '복원된 테이프가 걸려 있다 — 카운터 387'
                  : '반쯤 감기다 만 테이프가 걸려 있다. 끝이 끊어져 있다.'}
              </span>
              {lastTapeReady && (
                <button style={styles.restoreBtn} onClick={handleRestore} disabled={restoring}>
                  {restoring ? '잇는 중…' : '끊어진 끝 잇기'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(8,5,2,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: '16px',
  },
  card: {
    backgroundColor: '#2a1d10', border: '1px solid rgba(232,211,168,0.3)', borderRadius: '12px',
    padding: '24px 26px', maxWidth: '440px', width: '95%', position: 'relative', color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#e8d3a8', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '10px', fontWeight: 600, textAlign: 'center' },
  controls: { display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '14px' },
  ctrlBtn: {
    minWidth: '64px', minHeight: '48px', fontSize: '1.2rem',
    backgroundColor: '#3a2810', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.25)', borderRadius: '8px', cursor: 'pointer',
    touchAction: 'none',
  },
  playBtn: { backgroundColor: '#4a3218', minWidth: '84px' },
  hintLine: { fontSize: '0.75rem', opacity: 0.55, textAlign: 'center', marginTop: '10px' },
  subtitleBox: {
    marginTop: '16px', padding: '18px 16px', minHeight: '96px',
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: '8px', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px',
  },
  subtitleLine: { fontSize: '0.95rem', lineHeight: 1.7, textAlign: 'center' },
  subtitleHint: { fontSize: '0.72rem', opacity: 0.5, textAlign: 'center' },
  lastTapeRow: {
    marginTop: '18px', paddingTop: '14px', borderTop: '1px dashed rgba(232,211,168,0.2)',
    display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center',
  },
  lastTapeLabel: { fontSize: '0.8rem', opacity: 0.75, textAlign: 'center' },
  restoreBtn: {
    minHeight: '40px', padding: '0 18px', fontSize: '0.85rem', fontWeight: 600,
    backgroundColor: '#3a2810', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.35)', borderRadius: '8px', cursor: 'pointer',
  },
};
