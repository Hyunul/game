'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { canAttemptWith } from '../../../lib/gameState';
import { playSfx, playBgm } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';
import TapLabel from '../../TapLabel';
import OrderPicker from '../../puzzles/OrderPicker';
import { useTwoTap } from '../../../lib/useTwoTap';
import { useShake } from '../../../lib/useShake';

// 큐 카드 — 대본 지문 순서: 들숨(∨) → 첫 대사 → 길게 끌기(─)
const CUE_ITEMS = [
  { id: '1', label: '큐 ① 첫 대사', desc: '"수험번호 열넷, 은방울입니다."' },
  { id: '2', label: '큐 ② ∨ (들숨)', desc: '대본 맨 앞의 표기' },
  { id: '3', label: '큐 ③ ─ (길게)', desc: '"…목소리가 되고 싶습니다──"' },
];

// 반전 회상 — ep4-booth 해결 직후 내레이션 시퀀스
const REVEAL_LINES = [
  '"축하합니다. 다음 달부터 나와주세요." — 합격이었다.',
  '통지를 받고 이틀 뒤, 어머니는 병원에 있었다.',
  '"성대가… 천천히 굳는 병입니다. 목소리를 아끼셔야 해요."',
  '어머니는 방송국에 가지 않았다. 대신 골방에 계란판을 붙이기 시작했다.',
  '남은 목소리의 쓸 곳을, 그날 정한 것이다.',
];

/** ep4 부스 — 오디션 날의 회상. 형광등 청백 톤. */
export default function Ep4Booth() {
  const { state, dispatch, episode } = useGame();
  const { solved, wrongAttempts } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const shake = useShake(wrongAttempts);
  const [cueOpen, setCueOpen] = useState(false);
  const [revealIdx, setRevealIdx] = useState<number | null>(null);
  const navGuard = useRef(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { playBgm('ep4'); }, []);
  useEffect(() => () => {
    if (navTimer.current !== null) clearTimeout(navTimer.current);
  }, []);

  function canAttempt(puzzleId: string) {
    return canAttemptWith(episode, state, puzzleId);
  }
  function say(text: string) { setNarration(text); }

  const boothSolved = solved.includes('ep4-booth');

  // ── 대본대 ──
  function handleScript() {
    if (boothSolved) { say('녹음은 끝났다. 그날의 마이크가 아직 따뜻한 것 같다.'); return; }
    if (canAttempt('ep4-booth')) { setCueOpen(true); return; }
    say('대본대 위 큐 카드 세 장. 표기의 순서대로 눌러야 한다.');
  }
  function handleCueSubmit(answer: string) {
    if (answer === '2-1-3') {
      // 정답 — 반전 회상을 먼저 보여주고, 끝난 뒤 ATTEMPT (해결 시 memory 연출로 넘어가므로)
      setCueOpen(false);
      setRevealIdx(0);
      return;
    }
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-booth', answer });
  }

  // 회상 진행 — 끝나면 ATTEMPT 디스패치 (기억 조각 연출 → 마루 복귀)
  function handleRevealDone() {
    if (revealIdx === null) return;
    if (revealIdx < REVEAL_LINES.length - 1) {
      setRevealIdx(revealIdx + 1);
      return;
    }
    setRevealIdx(null);
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-booth', answer: '2-1-3' });
  }

  // 회상이 모두 끝난 뒤(또는 재방문) 나가기
  function leave() {
    if (navGuard.current) return;
    navGuard.current = true;
    fx.roomTransition();
    playSfx('door');
    navTimer.current = setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room: 'ep4-maru' });
      navGuard.current = false;
    }, 600);
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} className={shake}>
      <svg viewBox="0 0 800 400" width="100%" style={{ display: 'block' }} aria-label="방송국 녹음 부스 — 회상">
        {/* 형광등 청백 톤, 채도 낮음 */}
        <rect width="800" height="400" fill="#1c2228" />
        <rect x="0" y="320" width="800" height="80" fill="#242c34" />
        {/* 형광등 */}
        <rect x="300" y="18" width="200" height="10" rx="5" fill="#dce8f0" opacity="0.85" />
        <rect x="280" y="30" width="240" height="60" fill="#dce8f0" opacity="0.06" />

        {/* 유리창 — 조정실 실루엣 */}
        <g aria-hidden="true">
          <rect x="540" y="70" width="220" height="140" rx="4" fill="#0e141a" stroke="#3a444e" strokeWidth="3" />
          <ellipse cx="620" cy="150" rx="18" ry="22" fill="#232c34" />
          <ellipse cx="690" cy="146" rx="18" ry="22" fill="#232c34" />
          <text x="650" y="64" textAnchor="middle" fontSize="11" fill="#7a8a96">조정실</text>
        </g>

        {/* ── 마이크 ── */}
        <g aria-hidden="true">
          <line x1="400" y1="330" x2="400" y2="200" stroke="#3a444e" strokeWidth="6" />
          <rect x="384" y="160" width="32" height="48" rx="16" fill="#2a343e" stroke="#5a6a76" strokeWidth="2" />
          {[170, 180, 190, 200].map((y) => (
            <line key={y} x1="386" y1={y} x2="414" y2={y} stroke="#5a6a76" strokeWidth="1" opacity="0.7" />
          ))}
        </g>

        {/* ── 대본대 (핫스팟) ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('script', handleScript); }}
          role="button" aria-label="대본대" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleScript()}>
          <line x1="230" y1="336" x2="230" y2="250" stroke="#3a444e" strokeWidth="5" />
          <rect x="176" y="206" width="108" height="60" rx="3" fill="#2a343e" stroke="#5a6a76" strokeWidth="2" transform="rotate(-10 230 236)" />
          <rect x="186" y="214" width="88" height="44" rx="2" fill="#e8e4d8" transform="rotate(-10 230 236)" />
          <text x="230" y="234" textAnchor="middle" fontSize="9" fill="#3a444e" transform="rotate(-10 230 236)">∨ …입니다</text>
          <text x="230" y="246" textAnchor="middle" fontSize="9" fill="#3a444e" transform="rotate(-10 230 236)">…싶습니다──</text>
          <text x="230" y="196" textAnchor="middle" fontSize="12" fill="#9ab4c4">대본대</text>
        </g>

        {/* 녹음 램프 */}
        <g aria-hidden="true">
          <rect x="60" y="60" width="90" height="34" rx="6" fill="#0e141a" stroke="#3a444e" strokeWidth="2" />
          <text x="105" y="82" textAnchor="middle" fontSize="13" fontWeight="700"
            fill={boothSolved ? '#3a444e' : '#c04a3a'}>ON AIR</text>
        </g>
      </svg>

      {/* 나가기 — 회상 종료 후 */}
      {boothSolved && revealIdx === null && (
        <button className="room-nav-btn room-nav-left" onClick={leave} aria-label="회상에서 나가기">
          ◀ 마루로
        </button>
      )}

      <OrderPicker
        open={cueOpen}
        title="녹음 큐 — 대본 표기 순서"
        instruction="∨는 들숨, ─는 길게 끌기. 대본이 시키는 순서대로 큐를 눌러라."
        items={CUE_ITEMS}
        submitLabel="이 순서로 녹음한다"
        wrongSignal={wrongAttempts || undefined}
        onSubmit={handleCueSubmit}
        onClose={() => setCueOpen(false)}
      />

      <TapLabel name={ARMED_NAMES[armedId ?? ''] ?? null} />
      <Narration
        text={revealIdx !== null ? REVEAL_LINES[revealIdx] : narration}
        onDone={revealIdx !== null ? handleRevealDone : () => setNarration(null)}
      />
    </div>
  );
}

const ARMED_NAMES: Record<string, string> = {
  script: '대본대',
};
