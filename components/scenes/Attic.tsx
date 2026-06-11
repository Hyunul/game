'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../lib/GameContext';
import { playSfx, playBgm } from '../../lib/audio';
import { fx } from '../../lib/effects';
import Narration from '../Narration';
import { RoomId } from '../../lib/types';

const PROLOGUE_LINES = [
  '이삿짐을 정리하다, 다락에서 낡은 상자를 발견했다.',
  '상자 안에는… 어릴 적 물건들이 잠들어 있었다.',
];

const OBJECTS: { emoji: string; label: string; room: RoomId; cx: number; cy: number }[] = [
  { emoji: '📷', label: '빛바랜 가족사진', room: 'home',  cx: 310, cy: 255 },
  { emoji: '✏️', label: '몽당연필 필통',   room: 'class', cx: 400, cy: 270 },
  { emoji: '🔮', label: '뽑기 캡슐',       room: 'store', cx: 490, cy: 255 },
];

// order gate: photo always, pencilcase needs 'home', capsule needs 'class'
const REQUIRES: Record<RoomId, RoomId | null> = {
  home: null, class: 'home', store: 'class', attic: null,
};

export default function Attic() {
  const { state, dispatch } = useGame();
  const { phase, room, memoryShards } = state;

  const [prologueLine, setPrologueLine] = useState(0); // 0 or 1
  const [boxOpen, setBoxOpen] = useState(false);
  const [returnShown, setReturnShown] = useState(false);
  const [disabledMsg, setDisabledMsg] = useState(false);

  const transitioningRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inPrologue = phase === 'prologue' && !boxOpen;

  // Mount: play attic BGM
  useEffect(() => {
    if (room === 'attic') playBgm('attic');
  }, [room]);

  // Cleanup pending transition timer on unmount
  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
  }, []);

  // RESET → phase back to 'prologue': restore local narration/box state
  useEffect(() => {
    if (phase === 'prologue') {
      setPrologueLine(0);
      setBoxOpen(false);
      setReturnShown(false);
      setDisabledMsg(false);
      transitioningRef.current = false;
    }
  }, [phase]);

  // When returning (phase=playing, room=attic, box already open)
  useEffect(() => {
    if (phase === 'playing' && room === 'attic') {
      setBoxOpen(true);
    }
  }, [phase, room]);

  function handleNarration() {
    if (prologueLine < PROLOGUE_LINES.length - 1) {
      setPrologueLine((p) => p + 1);
    } else {
      // last line clicked → open box
      setBoxOpen(true);
      playSfx('door');
    }
  }

  function isEnabled(objRoom: RoomId): boolean {
    const req = REQUIRES[objRoom];
    if (req === null) return true;
    return memoryShards.includes(req);
  }

  function handleObjectClick(objRoom: RoomId) {
    if (transitioningRef.current) return;
    if (!isEnabled(objRoom)) {
      setDisabledMsg(true);
      return;
    }
    transitioningRef.current = true;
    playSfx('click');
    fx.roomTransition();
    playSfx('door');
    timerRef.current = setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room: objRoom });
      playBgm(objRoom);
      transitioningRef.current = false;
    }, 600);
  }

  const narrationText = inPrologue
    ? PROLOGUE_LINES[prologueLine]
    : disabledMsg
    ? '아직은 손이 가지 않는다…'
    : phase === 'playing' && room === 'attic' && !returnShown && memoryShards.length > 0
    ? '또 하나의 기억이 상자 안에서 빛나고 있었다.'
    : null;

  function handleNarrationDone() {
    if (inPrologue) {
      handleNarration();
    } else if (disabledMsg) {
      setDisabledMsg(false);
    } else {
      setReturnShown(true);
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        viewBox="0 0 800 400"
        width="100%"
        style={{ display: 'block' }}
        aria-label="다락방 장면"
      >
        {/* Background */}
        <rect width="800" height="400" fill="#1a1410" />

        {/* Sloped roof beams */}
        <polygon points="0,0 800,0 800,120 400,60 0,120" fill="#2a1e14" />
        <line x1="0" y1="0" x2="400" y2="60" stroke="#3d2b1a" strokeWidth="8" />
        <line x1="800" y1="0" x2="400" y2="60" stroke="#3d2b1a" strokeWidth="8" />
        {/* Ceiling beam left */}
        <rect x="0" y="110" width="240" height="14" rx="3" fill="#3d2b1a" transform="rotate(-8 0 110)" />
        {/* Ceiling beam right */}
        <rect x="560" y="110" width="240" height="14" rx="3" fill="#3d2b1a" transform="rotate(8 800 110)" />

        {/* Small round window */}
        <circle cx="400" cy="48" r="28" fill="#2a1e14" stroke="#5a3e26" strokeWidth="3" />
        <circle cx="400" cy="48" r="22" fill="#c8a96e" opacity="0.25" />
        <circle cx="400" cy="48" r="18" fill="#ffd24a" opacity="0.12" />
        {/* Window cross */}
        <line x1="400" y1="26" x2="400" y2="70" stroke="#5a3e26" strokeWidth="2" />
        <line x1="378" y1="48" x2="422" y2="48" stroke="#5a3e26" strokeWidth="2" />

        {/* Light beam from window */}
        <polygon points="385,68 415,68 500,200 300,200" fill="url(#lightBeam)" opacity="0.18" />
        <defs>
          <linearGradient id="lightBeam" x1="400" y1="68" x2="400" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffd24a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffd24a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Dust motes */}
        {[{cx:350,cy:110},{cx:420,cy:130},{cx:370,cy:155},{cx:440,cy:100},{cx:395,cy:140}].map((m,i) => (
          <circle key={i} cx={m.cx} cy={m.cy} r="2" fill="#f3e3c8" opacity="0.3" />
        ))}

        {/* Floor */}
        <rect x="0" y="320" width="800" height="80" fill="#1e1510" />
        <line x1="0" y1="320" x2="800" y2="320" stroke="#3a2618" strokeWidth="2" />

        {/* Old furniture silhouettes */}
        {/* Left: wardrobe */}
        <rect x="30" y="200" width="90" height="120" rx="4" fill="#2a1c0f" stroke="#3d2b1a" strokeWidth="2" />
        <rect x="35" y="205" width="38" height="110" rx="2" fill="#231508" />
        <rect x="77" y="205" width="38" height="110" rx="2" fill="#231508" />
        <circle cx="69" cy="262" r="4" fill="#5a3e26" />
        <circle cx="81" cy="262" r="4" fill="#5a3e26" />

        {/* Right: old chest */}
        <rect x="660" y="240" width="110" height="80" rx="5" fill="#2a1c0f" stroke="#3d2b1a" strokeWidth="2" />
        <rect x="660" y="240" width="110" height="20" rx="5" fill="#3d2b1a" />
        <rect x="708" y="273" width="14" height="10" rx="2" fill="#5a3e26" />

        {/* Center old box (상자) */}
        <g transform="translate(340, 230)">
          {/* Box body */}
          <rect x="0" y="20" width="120" height="70" rx="4" fill="#5a3620" stroke="#8a5a33" strokeWidth="2" />
          {/* Lid — open or closed */}
          {boxOpen ? (
            <rect x="0" y="14" width="120" height="14" rx="3" fill="#7a4f2a" stroke="#8a5a33" strokeWidth="2"
              transform="rotate(-35 60 28)" />
          ) : (
            <rect x="0" y="10" width="120" height="18" rx="3" fill="#7a4f2a" stroke="#8a5a33" strokeWidth="2" />
          )}
          {/* Latch */}
          <rect x="53" y="22" width="14" height="8" rx="2" fill="#ffd24a" opacity="0.8" />
          {/* Box label wear lines */}
          <line x1="10" y1="45" x2="110" y2="45" stroke="#3d2214" strokeWidth="1" opacity="0.4" />
          <line x1="10" y1="60" x2="110" y2="60" stroke="#3d2214" strokeWidth="1" opacity="0.4" />
        </g>

        {/* Objects inside/around box when open */}
        {boxOpen && OBJECTS.map((obj) => {
          const enabled = isEnabled(obj.room);
          const done = memoryShards.includes(obj.room);
          return (
            <g
              key={obj.room}
              className={enabled ? 'hotspot' : undefined}
              style={{ cursor: enabled ? 'pointer' : 'default', opacity: enabled ? 1 : 0.35 }}
              onClick={() => handleObjectClick(obj.room)}
              role="button"
              aria-label={obj.label}
              tabIndex={enabled ? 0 : -1}
              onKeyDown={(e) => e.key === 'Enter' && handleObjectClick(obj.room)}
            >
              {/* Glow halo for enabled items */}
              {enabled && (
                <circle cx={obj.cx} cy={obj.cy} r="26"
                  fill={done ? '#ffd24a' : 'transparent'}
                  stroke={done ? '#ffd24a' : '#ffd24a'}
                  strokeWidth={done ? 2 : 1.5}
                  opacity={done ? 0.35 : 0.5}
                />
              )}
              {/* Item background circle */}
              <circle cx={obj.cx} cy={obj.cy} r="20"
                fill={done ? '#3a2800' : '#2a1c0f'}
                stroke={done ? '#ffd24a' : '#8a5a33'}
                strokeWidth="1.5"
              />
              {/* Emoji label */}
              <text x={obj.cx} y={obj.cy + 7} textAnchor="middle"
                fontSize="18" style={{ userSelect: 'none' }}>
                {done ? '✨' : obj.emoji}
              </text>
            </g>
          );
        })}
      </svg>

      <Narration text={narrationText} onDone={handleNarrationDone} />
    </div>
  );
}
