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
  { text: '다락방 선반, 끈으로 단단히 묶인 두 권의 책.' },
  { text: '할머니의 가계부. 살림 기록 사이사이, 이유를 알 수 없는 항목들이 있다.', pickup: 'doc-ledger' },
  { text: '갈피에 끼워진 낡은 편지 한 장 — 보낸 이의 이름은 지워졌고, 주소만 남았다. "샘골 별채".', pickup: 'doc-address' },
  { text: '가족사진 한켠, 얼굴이 접혀 가려진 젊은 여자. 집안에서 그 이름은 금기였다.' },
  { text: '…주소를 따라, 외가 마을의 별채로 향한다. (인벤토리에서 문서를 선택하면 전문을 읽을 수 있다)' },
];

export default function Ep3Prologue() {
  const { dispatch } = useGame();
  const [lineIdx, setLineIdx] = useState(0);
  const transitioningRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    playBgm('ep3');
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
    transitioningRef.current = true;
    fx.roomTransition();
    playSfx('door');
    timerRef.current = setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room: 'madang' });
      transitioningRef.current = false;
    }, 600);
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        viewBox="0 0 800 400"
        width="100%"
        style={{ display: 'block' }}
        aria-label="다락방 — 묶인 두 권의 책"
      >
        <rect width="800" height="400" fill="#1a1410" />

        {/* 창빛 */}
        <polygon points="330,0 470,0 560,400 240,400" fill="url(#ep3beam)" opacity="0.14" />
        <defs>
          <linearGradient id="ep3beam" x1="400" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffd24a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffd24a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 먼지 */}
        {[{ cx: 350, cy: 110 }, { cx: 420, cy: 130 }, { cx: 370, cy: 155 }, { cx: 440, cy: 100 }].map((m, i) => (
          <circle key={i} cx={m.cx} cy={m.cy} r="2" fill="#f3e3c8" opacity="0.3" />
        ))}

        {/* 선반 */}
        <rect x="220" y="270" width="360" height="12" fill="#4a3420" />
        <rect x="240" y="282" width="10" height="60" fill="#3a2818" />
        <rect x="550" y="282" width="10" height="60" fill="#3a2818" />

        {/* 두 권의 책 (끈으로 묶임) */}
        <g transform="translate(330, 200)">
          <rect x="0" y="30" width="140" height="26" rx="3" fill="#6a4023" stroke="#96622f" strokeWidth="2" />
          <rect x="6" y="4" width="128" height="28" rx="3" fill="#7a5a30" stroke="#96622f" strokeWidth="2" />
          {/* 끈 */}
          <line x1="70" y1="0" x2="70" y2="60" stroke="#c8b088" strokeWidth="3" />
          <line x1="0" y1="30" x2="140" y2="30" stroke="#c8b088" strokeWidth="3" />
          <circle cx="70" cy="30" r="5" fill="#c8b088" />
          {/* 갈피의 편지 */}
          {lineIdx >= 2 && (
            <rect x="100" y="-6" width="46" height="14" rx="2" fill="#efe3c0" stroke="#b8a070" strokeWidth="1"
              transform="rotate(-8 123 1)" />
          )}
        </g>

        {/* 접힌 가족사진 (3번째 줄부터) */}
        {lineIdx >= 3 && (
          <g transform="translate(500, 218)">
            <rect x="0" y="0" width="60" height="42" rx="2" fill="#d8c8a8" stroke="#8a7a58" strokeWidth="1.5" />
            <polygon points="60,0 60,42 44,42" fill="#b0a080" />
            <circle cx="18" cy="18" r="6" fill="#6a5a40" />
            <circle cx="34" cy="20" r="6" fill="#6a5a40" />
          </g>
        )}
      </svg>

      <Narration text={LINES[lineIdx].text} onDone={handleNarrationDone} />
    </div>
  );
}
