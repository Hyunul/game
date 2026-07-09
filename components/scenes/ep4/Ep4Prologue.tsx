'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { playSfx, playBgm } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';

const LINES: string[] = [
  '다락방 구석, 종이 상자 하나 가득 — 카세트테이프가 쏟아질 듯 쌓여 있다.',
  '라벨엔 제목이 없다. 007, 010, 015… 세 자리 숫자뿐.',
  '상자 밑에서 나온 낡은 워크맨은 건전지가 새어 굳은 지 오래다. 이걸로는 못 듣는다.',
  '…옛집 마루에 릴 데크가 있었다. 어머니가 아끼던, 그 커다란 은색 기계.',
  '기억 속의 옛집으로 — 마루의 불을 켠다.',
];

export default function Ep4Prologue() {
  const { dispatch } = useGame();
  const [lineIdx, setLineIdx] = useState(0);
  const transitioningRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { playBgm('ep4'); }, []);
  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
  }, []);

  function handleNarrationDone() {
    if (transitioningRef.current) return;
    if (lineIdx < LINES.length - 1) {
      setLineIdx((i) => i + 1);
      return;
    }
    transitioningRef.current = true;
    fx.roomTransition();
    playSfx('door');
    timerRef.current = setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room: 'ep4-maru' });
      transitioningRef.current = false;
    }, 600);
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg viewBox="0 0 800 400" width="100%" style={{ display: 'block' }}
        aria-label="다락방 — 숫자뿐인 카세트 상자">
        <rect width="800" height="400" fill="#1a1410" />

        {/* 창빛 */}
        <polygon points="330,0 470,0 560,400 240,400" fill="url(#ep4beam)" opacity="0.13" />
        <defs>
          <linearGradient id="ep4beam" x1="400" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffd24a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffd24a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 종이 상자 + 테이프 무더기 */}
        <g transform="translate(300, 210)">
          <polygon points="0,40 200,40 185,120 15,120" fill="#8a6a42" stroke="#5a4326" strokeWidth="2" />
          <polygon points="0,40 30,16 230,16 200,40" fill="#a08050" stroke="#5a4326" strokeWidth="2" />
          {/* 테이프들 */}
          {[
            { x: 30, y: 22, n: '007' }, { x: 86, y: 18, n: '015' }, { x: 142, y: 24, n: '030' },
            { x: 58, y: 44, n: '010' }, { x: 114, y: 40, n: '042' },
          ].map((t) => (
            <g key={t.n} transform={`translate(${t.x}, ${t.y}) rotate(${(t.x % 3) * 4 - 4})`}>
              <rect width="52" height="32" rx="3" fill="#2a2018" stroke="#4a3a28" strokeWidth="1.5" />
              <rect x="6" y="5" width="40" height="12" rx="1" fill="#e8dcc0" />
              <text x="26" y="14" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#3a2a18">{t.n}</text>
              <circle cx="16" cy="24" r="4" fill="none" stroke="#6a5a40" strokeWidth="1.5" />
              <circle cx="36" cy="24" r="4" fill="none" stroke="#6a5a40" strokeWidth="1.5" />
            </g>
          ))}
        </g>

        {/* 굳은 워크맨 (3번째 줄부터) */}
        {lineIdx >= 2 && (
          <g transform="translate(540, 270)">
            <rect width="70" height="46" rx="5" fill="#4a4640" stroke="#2a2620" strokeWidth="2" />
            <rect x="8" y="8" width="34" height="22" rx="2" fill="#2a2620" />
            <circle cx="56" cy="19" r="7" fill="#3a3630" stroke="#2a2620" strokeWidth="1.5" />
            {/* 새어 나온 건전지 얼룩 */}
            <ellipse cx="20" cy="44" rx="14" ry="4" fill="#7a8a6a" opacity="0.5" />
          </g>
        )}
      </svg>

      <Narration text={LINES[lineIdx]} onDone={handleNarrationDone} />
    </div>
  );
}
