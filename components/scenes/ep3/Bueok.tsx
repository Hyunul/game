'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { canAttemptWith } from '../../../lib/gameState';
import { playSfx, playBgm } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';
import TapLabel from '../../TapLabel';
import RoomNav from '../../RoomNav';
import MeasureJug from '../../puzzles/MeasureJug';
import HeatReveal from '../../puzzles/HeatReveal';
import { useTwoTap } from '../../../lib/useTwoTap';
import { useShake } from '../../../lib/useShake';

export default function Bueok() {
  const { state, dispatch, episode } = useGame();
  const { solved, wrongAttempts, selectedItem } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const shake = useShake(wrongAttempts);
  const [jugOpen, setJugOpen] = useState(false);
  const [heatOpen, setHeatOpen] = useState(false);
  const navGuard = useRef(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { playBgm('ep3'); }, []);
  useEffect(() => () => {
    if (navTimer.current !== null) clearTimeout(navTimer.current);
  }, []);

  function canAttempt(puzzleId: string) {
    return canAttemptWith(episode, state, puzzleId);
  }

  function say(text: string) { setNarration(text); }

  // ── 쌀뒤주 ──
  function handleDoetbak() {
    if (solved.includes('ep3-doetbak')) {
      say('열린 뒤주. 이중판 아래는 비어 있다.');
      return;
    }
    if (canAttempt('ep3-doetbak')) {
      setJugOpen(true);
    } else {
      say('묵직한 쌀뒤주.');
    }
  }

  function handleJugSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep3-doetbak', answer });
    if (answer === '4') {
      setJugOpen(false);
      fx.correctPulse();
      say('덜컹 — 뒤주 바닥의 이중판이 열렸다. 편지 한 장과 성냥갑.');
    }
  }

  // ── 아궁이 ──
  function handleAgungi() {
    if (solved.includes('ep3-heat')) {
      say('사그라든 불씨. 편지 뒷면의 글씨는 인벤토리에서 다시 읽을 수 있다.');
      return;
    }
    if (canAttempt('ep3-heat')) {
      if (selectedItem === 'letter-3') {
        setHeatOpen(true);
      } else {
        say('불을 지필 수 있다. 쬐어 볼 것이 있다면 선택해서 가져오자. (편지 ③의 뒷면이 이상하게 빳빳했다)');
      }
    } else if (!solved.includes('ep3-doetbak')) {
      say('차갑게 식은 아궁이. 불씨를 만들 성냥이 없다.');
    } else {
      say('차갑게 식은 아궁이.');
    }
  }

  function handleHeatSubmit(answer: 'revealed' | 'scorched') {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep3-heat', answer });
    if (answer === 'revealed') {
      setHeatOpen(false);
      fx.correctPulse();
      say('종이 위로 옅은 갈색 글씨가 떠오른다 — "뒷문 열쇠는 우물 안에. 여덟 근이면 바닥의 단지에 닿아요."');
    }
  }

  // ── 이동 ──
  function goMadang() {
    if (navGuard.current) return;
    navGuard.current = true;
    fx.roomTransition();
    playSfx('door');
    navTimer.current = setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room: 'madang' });
      navGuard.current = false;
    }, 600);
  }

  const doetbakSolved = solved.includes('ep3-doetbak');
  const heatSolved = solved.includes('ep3-heat');

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} className={shake}>
      <svg
        viewBox="0 0 800 400"
        width="100%"
        style={{ display: 'block' }}
        aria-label="부엌 장면"
      >
        {/* 어둑한 부엌 */}
        <rect width="800" height="400" fill="#4a3a28" />
        <rect x="0" y="320" width="800" height="80" fill="#2e2418" />
        {/* 그을린 벽 */}
        <ellipse cx="250" cy="140" rx="120" ry="90" fill="#3a2c1c" opacity="0.8" />

        {/* 살창으로 드는 빛 */}
        <g aria-hidden="true">
          <rect x="600" y="60" width="110" height="70" fill="#8a7a58" stroke="#2e2418" strokeWidth="3" />
          {[622, 644, 666, 688].map((x) => (
            <line key={x} x1={x} y1="62" x2={x} y2="128" stroke="#2e2418" strokeWidth="3" />
          ))}
          <polygon points="600,130 710,130 760,320 560,320" fill="#e8d8a8" opacity="0.07" />
        </g>

        {/* ── 아궁이 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('agungi', handleAgungi); }}
          role="button" aria-label="아궁이" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleAgungi()}
        >
          {/* 부뚜막 */}
          <path d="M 120 320 L 140 220 L 360 220 L 380 320 Z" fill="#5a4632" stroke="#3a2810" strokeWidth="2" />
          {/* 가마솥 */}
          <ellipse cx="250" cy="218" rx="70" ry="18" fill="#1a1e26" stroke="#0a0e14" strokeWidth="2" />
          <path d="M 182 218 Q 190 260 250 262 Q 310 260 318 218" fill="#20242c" stroke="#0a0e14" strokeWidth="2" />
          {/* 아궁이 입 */}
          <path d="M 210 320 Q 210 280 250 280 Q 290 280 290 320 Z" fill="#100a06" stroke="#3a2810" strokeWidth="2" />
          {heatSolved && (
            <>
              <path d="M 236 316 Q 242 296 250 308 Q 256 292 262 316 Z" fill="#ff8a3a" />
              <path d="M 244 316 Q 249 302 254 316 Z" fill="#ffd24a" />
            </>
          )}
        </g>

        {/* ── 쌀뒤주 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('doetbak', handleDoetbak); }}
          role="button" aria-label="쌀뒤주" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleDoetbak()}
        >
          <rect x="470" y="210" width="130" height="110" fill="#6a4c2c" stroke="#3a2810" strokeWidth="2.5" />
          <rect x="464" y="196" width="142" height="20" rx="3" fill="#7a5a34" stroke="#3a2810" strokeWidth="2.5"
            transform={doetbakSolved ? 'rotate(-18 535 206)' : undefined} />
          {/* 각인 */}
          <text x="535" y="262" textAnchor="middle" fontSize="13" fill="#e8d3a8" opacity="0.8"
            fontFamily='"Georgia","Batang",serif'>넉 되를 채우면</text>
          <text x="535" y="280" textAnchor="middle" fontSize="13" fill="#e8d3a8" opacity="0.8"
            fontFamily='"Georgia","Batang",serif'>열린다</text>
          {/* 됫박 두 개 */}
          <path d="M 618 296 l 4 22 h 30 l 4 -22 z" fill="#8a6838" stroke="#4a3018" strokeWidth="1.5" />
          <path d="M 664 290 l 5 28 h 36 l 5 -28 z" fill="#8a6838" stroke="#4a3018" strokeWidth="1.5" />
        </g>

        {/* 선반 (장식) */}
        <g aria-hidden="true">
          <rect x="80" y="120" width="200" height="8" fill="#3a2c1c" />
          <ellipse cx="120" cy="112" rx="16" ry="9" fill="#5a3e26" />
          <ellipse cx="170" cy="110" rx="14" ry="10" fill="#5a3e26" />
          <ellipse cx="224" cy="112" rx="18" ry="8" fill="#4a3520" />
        </g>
      </svg>

      <RoomNav
        targets={[{ room: 'madang', label: '마당', side: 'right' }]}
        onGo={goMadang}
      />

      <MeasureJug
        open={jugOpen}
        onSubmit={handleJugSubmit}
        onClose={() => setJugOpen(false)}
      />

      <HeatReveal
        open={heatOpen}
        wrongSignal={wrongAttempts || undefined}
        onSubmit={handleHeatSubmit}
        onClose={() => setHeatOpen(false)}
      />

      <TapLabel name={ARMED_NAMES[armedId ?? ''] ?? null} />
      <Narration text={narration} onDone={() => setNarration(null)} />
    </div>
  );
}

const ARMED_NAMES: Record<string, string> = {
  agungi: '아궁이',
  doetbak: '쌀뒤주',
};
