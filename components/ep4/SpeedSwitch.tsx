'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

// 45rpm 판을 33rpm으로 틀면 낮게 늘어진 목소리 속에 숨은 말이 들린다.
const SLOW_LINES = [
  '(낮게 늘어진 목소리 — 판 속에 숨어 있던 말이 또박또박 들린다)',
  '"…골방 열쇠는 없어. 그 문은 손으로 여는 게 아니야."',
  '"두드리는 법을 아는 사람한테만 열리는 문이지."',
];

/** 전축 회전수 퍼즐 — 45rpm 판을 33rpm으로 재생한다 */
export default function SpeedSwitch({ open, onSubmit, onClose }: Props) {
  const [speed, setSpeed] = useState<33 | 45>(45);
  const [playing, setPlaying] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);

  useEscape(open, onClose);
  useEffect(() => { if (open) { setSpeed(45); setPlaying(false); setLineIdx(0); } }, [open]);

  if (!open) return null;

  const slowMode = playing && speed === 33;

  function toggleSpeed() {
    if (playing) return;
    playSfx('tick');
    setSpeed((s) => (s === 45 ? 33 : 45));
  }

  function play() {
    if (playing) return;
    playSfx('click');
    setPlaying(true);
    setLineIdx(0);
  }

  function advance() {
    if (!playing) return;
    if (speed === 45) { setPlaying(false); return; } // 빠른 재생은 한 줄로 끝
    if (lineIdx < SLOW_LINES.length - 1) { playSfx('click'); setLineIdx((i) => i + 1); return; }
    onSubmit('33');
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <style>{`@keyframes ep4disc { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>전축</h2>
        <p style={styles.instruction}>턴테이블에 판이 걸려 있다. 라벨: &ldquo;45rpm — 동요 모음&rdquo;. 그런데 홈이 이상하게 깊다.</p>

        <svg viewBox="0 0 300 150" width="100%" style={{ maxWidth: 320, display: 'block', margin: '0 auto' }}>
          <rect x="6" y="6" width="288" height="138" rx="10" fill="#241a10" stroke="#8a5a33" strokeWidth="2" />
          <g style={playing ? ({ transformOrigin: '110px 75px', animation: `ep4disc ${speed === 45 ? 0.9 : 1.8}s linear infinite` } as React.CSSProperties) : undefined}>
            <circle cx="110" cy="75" r="52" fill="#141210" stroke="#3a2810" strokeWidth="2" />
            <circle cx="110" cy="75" r="44" fill="none" stroke="#2a2018" strokeWidth="1" />
            <circle cx="110" cy="75" r="36" fill="none" stroke="#2a2018" strokeWidth="1" />
            <circle cx="110" cy="75" r="16" fill="#a8352a" />
            <circle cx="110" cy="75" r="3" fill="#e8d3a8" />
          </g>
          {/* 톤암 */}
          <line x1="235" y1="30" x2={playing ? 160 : 200} y2={playing ? 70 : 40}
            stroke="#c8a86a" strokeWidth="4" strokeLinecap="round" />
          <circle cx="235" cy="30" r="8" fill="#3a2810" stroke="#c8a86a" strokeWidth="2" />
          {/* 속도 스위치 */}
          <g onClick={toggleSpeed} style={{ cursor: playing ? 'default' : 'pointer' }} role="button" aria-label={`회전수 ${speed}`}>
            <rect x="216" y="90" width="60" height="26" rx="13" fill="#141210" stroke="#8a5a33" strokeWidth="1.5" />
            <circle cx={speed === 45 ? 262 : 230} cy="103" r="10" fill="#c8a86a" />
            <text x="222" y="132" fontSize="11" fill={speed === 33 ? '#e8b84a' : '#8a7a5a'}>33</text>
            <text x="258" y="132" fontSize="11" fill={speed === 45 ? '#e8b84a' : '#8a7a5a'}>45</text>
          </g>
        </svg>

        <div style={{ ...styles.subtitleBox, cursor: playing ? 'pointer' : 'default' }} onClick={advance}>
          {playing ? (
            speed === 45 ? (
              <>
                <p style={styles.subtitleLine}>(높고 빨라서 웅얼거림밖에 들리지 않는다)</p>
                <p style={styles.subtitleHint}>■ 눌러서 멈추기</p>
              </>
            ) : (
              <>
                <p style={styles.subtitleLine}>{SLOW_LINES[lineIdx]}</p>
                <p style={styles.subtitleHint}>{lineIdx < SLOW_LINES.length - 1 ? '▸ 계속 듣기' : '■ 눌러서 멈추기'}</p>
              </>
            )
          ) : (
            <button style={styles.playBtn} onClick={play}>▶ 재생</button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(10,6,2,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: '16px',
  },
  card: {
    backgroundColor: '#2e1f10', border: '1px solid rgba(232,211,168,0.3)', borderRadius: '12px',
    padding: '28px 32px', maxWidth: '420px', width: '95%', position: 'relative', color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#e8d3a8', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.85rem', opacity: 0.75, textAlign: 'center', marginBottom: '14px' },
  subtitleBox: {
    marginTop: '14px', padding: '14px', minHeight: '84px',
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: '8px',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px',
  },
  subtitleLine: { fontSize: '0.9rem', lineHeight: 1.6, textAlign: 'center' },
  subtitleHint: { fontSize: '0.72rem', opacity: 0.5, textAlign: 'center' },
  playBtn: {
    minHeight: '44px', padding: '0 28px', fontSize: '0.95rem', fontWeight: 600,
    backgroundColor: '#3a2810', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.3)', borderRadius: '8px', cursor: 'pointer',
  },
};
