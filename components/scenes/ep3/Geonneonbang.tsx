'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { canAttemptWith } from '../../../lib/gameState';
import { playSfx, playBgm } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';
import TapLabel from '../../TapLabel';
import RoomNav from '../../RoomNav';
import KnitGrid from '../../puzzles/KnitGrid';
import { useTwoTap } from '../../../lib/useTwoTap';
import { useShake } from '../../../lib/useShake';

export default function Geonneonbang() {
  const { state, dispatch, episode } = useGame();
  const { solved, wrongAttempts } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const shake = useShake(wrongAttempts);
  const [knitOpen, setKnitOpen] = useState(false);
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

  // ── 뜨개 바구니 ──
  function handleKnit() {
    if (solved.includes('ep3-knit')) {
      say('완성된 무늬 — 「돌」. 장독대를 가리키던 글자다.');
      return;
    }
    if (canAttempt('ep3-knit')) {
      setKnitOpen(true);
    } else {
      say('뜨다 만 아기 양말과 도안이 담긴 바구니.');
    }
  }

  function handleKnitSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep3-knit', answer });
    if (answer === 'dol') {
      setKnitOpen(false);
      fx.correctPulse();
      say('무늬가 글자를 이룬다 — 「돌」. …장독대다. 바구니 밑에는 편지 한 장이 깔려 있었다.');
    }
  }

  // ── 재봉틀 ──
  function handleSewing() {
    if (solved.includes('ep3-cloth')) {
      say('재봉틀 — 할머니가 보낸, 고모의 살림 밑천.');
      return;
    }
    if (canAttempt('ep3-cloth')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep3-cloth', answer: '' });
      playSfx('pickup');
      say('천에 박힌 실선이… 이 집의 평면도다. 안방 벽장 자리에 매듭이 지어져 있다.');
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

  const knitSolved = solved.includes('ep3-knit');
  const clothTaken = solved.includes('ep3-cloth');

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} className={shake}>
      <svg
        viewBox="0 0 800 400"
        width="100%"
        style={{ display: 'block' }}
        aria-label="건넌방 — 고모의 방"
      >
        {/* 방 배경 */}
        <rect width="800" height="400" fill="#c8b088" />
        <rect x="0" y="300" width="800" height="100" fill="#9a7648" />
        {[140, 300, 460, 620].map((x) => (
          <line key={x} x1={x} y1="302" x2={x} y2="400" stroke="#7a5a34" strokeWidth="1.5" opacity="0.4" />
        ))}
        {/* 오래 비어 있던 방 — 가구가 있던 자리의 벽지 자국 */}
        <rect x="580" y="90" width="110" height="140" fill="#d2bc94" opacity="0.5" />
        <rect x="580" y="90" width="110" height="140" fill="none" stroke="#a8946c" strokeWidth="1.5" opacity="0.5" strokeDasharray="4 3" />

        {/* 작은 창 */}
        <g aria-hidden="true">
          <rect x="330" y="70" width="140" height="100" fill="#e8e0c8" stroke="#6a5030" strokeWidth="3" />
          <line x1="400" y1="72" x2="400" y2="168" stroke="#6a5030" strokeWidth="2.5" />
          <line x1="332" y1="120" x2="468" y2="120" stroke="#6a5030" strokeWidth="2.5" />
        </g>

        {/* ── 재봉틀 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('sewing', handleSewing); }}
          role="button" aria-label="재봉틀" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleSewing()}
        >
          {/* 다리 테이블 */}
          <rect x="90" y="250" width="150" height="10" fill="#4a3018" />
          <line x1="100" y1="260" x2="94" y2="330" stroke="#3a2810" strokeWidth="5" />
          <line x1="230" y1="260" x2="236" y2="330" stroke="#3a2810" strokeWidth="5" />
          <line x1="97" y1="300" x2="233" y2="300" stroke="#3a2810" strokeWidth="3" />
          {/* 몸체 — 받침판 위에 선 아암형 머리 */}
          <rect x="112" y="242" width="106" height="8" rx="2" fill="#141820" stroke="#0a0e14" strokeWidth="1.5" />
          <rect x="196" y="204" width="16" height="40" rx="4" fill="#20242c" stroke="#0a0e14" strokeWidth="2" />
          <rect x="138" y="200" width="70" height="14" rx="6" fill="#20242c" stroke="#0a0e14" strokeWidth="2" />
          {/* 바늘대 */}
          <rect x="136" y="212" width="10" height="18" rx="2" fill="#20242c" stroke="#0a0e14" strokeWidth="1.5" />
          <line x1="141" y1="230" x2="141" y2="240" stroke="#c8c8b0" strokeWidth="1.5" />
          {/* 손잡이 바퀴 */}
          <circle cx="212" cy="222" r="11" fill="#3a3e46" stroke="#0a0e14" strokeWidth="2" />
          <circle cx="212" cy="222" r="4" fill="#20242c" />
          {/* 걸린 천 — 바늘 밑에 물려 있다 */}
          {!clothTaken && (
            <g>
              <rect x="118" y="234" width="58" height="18" fill="#e8dcc0" stroke="#b8a070" strokeWidth="1" transform="rotate(-3 147 243)" />
              <path d="M 126 242 h 40 M 128 246 v 4 M 160 240 v 8" stroke="#a04030" strokeWidth="1.2" fill="none" />
            </g>
          )}
        </g>

        {/* ── 뜨개 바구니 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('knit', handleKnit); }}
          role="button" aria-label="뜨개 바구니" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleKnit()}
        >
          <path d="M 560 320 Q 556 296 576 292 L 664 292 Q 684 296 680 320 Q 676 344 620 344 Q 564 344 560 320"
            fill="#a07840" stroke="#6a5030" strokeWidth="2" />
          <path d="M 566 300 h 108 M 562 314 h 116 M 566 328 h 108" stroke="#6a5030" strokeWidth="1" opacity="0.5" fill="none" />
          {/* 털실 + 바늘 */}
          <circle cx="600" cy="292" r="12" fill={knitSolved ? '#8a6a4a' : '#c85a3a'} />
          <circle cx="628" cy="288" r="10" fill="#e8dcc0" />
          <line x1="590" y1="270" x2="622" y2="296" stroke="#c8c8b0" strokeWidth="2" />
          <line x1="646" y1="268" x2="618" y2="296" stroke="#c8c8b0" strokeWidth="2" />
          {/* 뜨다 만 양말 */}
          <path d="M 648 296 q 14 -2 16 10 q 2 10 -10 12" fill="#e8dcc0" stroke="#b8a070" strokeWidth="1" />
        </g>

        {/* 앉은뱅이 책상 (장식) */}
        <g aria-hidden="true">
          <rect x="320" y="286" width="160" height="12" fill="#6a4c2c" stroke="#4a3018" strokeWidth="1.5" />
          <line x1="330" y1="298" x2="330" y2="330" stroke="#4a3018" strokeWidth="4" />
          <line x1="470" y1="298" x2="470" y2="330" stroke="#4a3018" strokeWidth="4" />
          <rect x="352" y="272" width="40" height="12" fill="#e8dcc0" stroke="#b8a070" strokeWidth="1" transform="rotate(-3 372 278)" />
        </g>
      </svg>

      <RoomNav
        targets={[{ room: 'madang', label: '마당', side: 'left' }]}
        onGo={goMadang}
      />

      <KnitGrid
        open={knitOpen}
        onSubmit={handleKnitSubmit}
        onClose={() => setKnitOpen(false)}
      />

      <TapLabel name={ARMED_NAMES[armedId ?? ''] ?? null} />
      <Narration text={narration} onDone={() => setNarration(null)} />
    </div>
  );
}

const ARMED_NAMES: Record<string, string> = {
  sewing: '재봉틀',
  knit: '뜨개 바구니',
};
