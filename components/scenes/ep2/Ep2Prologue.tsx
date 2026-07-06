'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { playSfx, playBgm } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';

interface Line {
  text: string;
  pickup?: string;
}

const LINES: Line[] = [
  { text: '궤짝 깊은 곳에서, 것들이 나왔다.' },
  { text: '빛바랜 신문… \'15일 밤 저수지에서 청년 익사\'. 사진 속 큰아버지의 이름이 있었다.', pickup: 'doc-news' },
  { text: '그리고 11시 40분에 멈춘 회중시계. 뒷면에 물때가 낀.', pickup: 'pocket-watch' },
  { text: '…태엽을 감아본다. (인벤토리에서 문서를 선택하면 전문을 읽을 수 있다)' },
];

export default function Ep2Prologue() {
  const { dispatch } = useGame();
  const [lineIdx, setLineIdx] = useState(0);
  const transitioningRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    playBgm('ep2-present');
  }, []);

  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
  }, []);

  function handleNarrationDone() {
    if (transitioningRef.current) return;
    const current = LINES[lineIdx];
    if (current.pickup) {
      dispatch({ type: 'PICKUP', itemId: current.pickup });
      playSfx('pickup');
    }
    if (lineIdx < LINES.length - 1) {
      setLineIdx((i) => i + 1);
      return;
    }
    // last line ("…태엽을 감아본다.") → transition to sarangbang
    transitioningRef.current = true;
    fx.roomTransition();
    playSfx('tick');
    timerRef.current = setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room: 'sarangbang' });
      playBgm('ep2-present');
      transitioningRef.current = false;
    }, 600);
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        viewBox="0 0 800 400"
        width="100%"
        style={{ display: 'block' }}
        aria-label="다락방 궤짝 클로즈업"
      >
        {/* Background */}
        <rect width="800" height="400" fill="#1a1410" />

        {/* Light beam from above */}
        <polygon points="330,0 470,0 560,400 240,400" fill="url(#lightBeam)" opacity="0.16" />
        <defs>
          <linearGradient id="lightBeam" x1="400" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffd24a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffd24a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Dust motes */}
        {[{cx:350,cy:110},{cx:420,cy:130},{cx:370,cy:155},{cx:440,cy:100},{cx:395,cy:140}].map((m, i) => (
          <circle key={i} cx={m.cx} cy={m.cy} r="2" fill="#f3e3c8" opacity="0.3" />
        ))}

        {/* Floor */}
        <rect x="0" y="320" width="800" height="80" fill="#1e1510" />
        <line x1="0" y1="320" x2="800" y2="320" stroke="#3a2618" strokeWidth="2" />

        {/* Open chest, centered, close-up */}
        <g transform="translate(280, 190)">
          {/* Box body */}
          <rect x="0" y="30" width="240" height="130" rx="8" fill="#5a3620" stroke="#8a5a33" strokeWidth="3" />
          {/* Open lid */}
          <rect x="0" y="18" width="240" height="26" rx="5" fill="#7a4f2a" stroke="#8a5a33" strokeWidth="3"
            transform="rotate(-35 120 44)" />
          {/* Latch */}
          <rect x="106" y="38" width="28" height="16" rx="3" fill="#ffd24a" opacity="0.8" />
          {/* Wear lines */}
          <line x1="20" y1="90" x2="220" y2="90" stroke="#3d2214" strokeWidth="1" opacity="0.4" />
          <line x1="20" y1="120" x2="220" y2="120" stroke="#3d2214" strokeWidth="1" opacity="0.4" />

          {/* Artifacts inside, revealed as narration advances */}
          {lineIdx >= 0 && (
            <text x="60" y="90" fontSize="30" textAnchor="middle" style={{ userSelect: 'none' }}>🖼️</text>
          )}
          {lineIdx >= 1 && (
            <text x="120" y="100" fontSize="30" textAnchor="middle" style={{ userSelect: 'none' }}>📰</text>
          )}
          {lineIdx >= 2 && (
            <text x="180" y="90" fontSize="30" textAnchor="middle" style={{ userSelect: 'none' }}>⌚</text>
          )}
        </g>
      </svg>

      <Narration text={LINES[lineIdx].text} onDone={handleNarrationDone} />
    </div>
  );
}
