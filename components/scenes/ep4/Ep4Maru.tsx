'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { canAttemptWith } from '../../../lib/gameState';
import { playSfx, playBgm } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';
import TapLabel from '../../TapLabel';
import RoomNav from '../../RoomNav';
import { useTwoTap } from '../../../lib/useTwoTap';
import { useShake } from '../../../lib/useShake';
import TapeDeck from '../../ep4/TapeDeck';
import BeltRouting from '../../ep4/BeltRouting';
import FrequencyDial from '../../ep4/FrequencyDial';
import SpeedSwitch from '../../ep4/SpeedSwitch';
import KnockRhythm from '../../ep4/KnockRhythm';
import NumberBoard from '../../ep4/NumberBoard';

/** ep4 마루 — 릴 데크·라디오·전축·골방 문. 늦은 밤 백열등 톤. */
export default function Ep4Maru() {
  const { state, dispatch, episode } = useGame();
  const { solved, wrongAttempts } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const shake = useShake(wrongAttempts);
  const [deckOpen, setDeckOpen] = useState(false);
  const [beltOpen, setBeltOpen] = useState(false);
  const [radioOpen, setRadioOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [knockOpen, setKnockOpen] = useState(false);
  const [numbersOpen, setNumbersOpen] = useState(false);
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

  const beltSolved = solved.includes('ep4-belt');
  const knockSolved = solved.includes('ep4-knock');
  const radioSolved = solved.includes('ep4-radio');
  const postcardsTaken = solved.includes('ep4-postcards');

  // ── 릴 데크 ──
  function handleDeck() {
    if (!beltSolved) { setBeltOpen(true); return; }
    setDeckOpen(true);
  }
  function handleBeltSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-belt', answer });
    setBeltOpen(false);
    playSfx('pickup');
    say('릴이 돌아간다. 데크 옆에 쪽지가 붙어 있었다 — "자장가는 042부터."');
  }

  // ── 라디오 + 서랍 ──
  function handleRadio() {
    if (radioSolved) { say('라디오는 89.1에 맞춰져 있다. 심야 방송은 끝났다.'); return; }
    if (canAttempt('ep4-radio')) { setRadioOpen(true); return; }
    say('오래된 라디오. 다이얼이 돌아가긴 하는데, 어느 주파수를 찾아야 할지 모르겠다.');
  }
  function handleRadioSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-radio', answer });
    setRadioOpen(false);
    say('은방울 — 라디오가 어머니를 그렇게 불렀다.');
  }
  function handleDrawer() {
    if (postcardsTaken) { say('서랍은 비었다.'); return; }
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-postcards', answer: '' });
    playSfx('pickup');
    say('서랍 속에서 사연 엽서 뭉치가 나왔다. 방송국으로 부치려던 것 같은데, 부친 흔적이 없다.');
  }

  // ── 전축 ──
  function handlePhono() {
    if (solved.includes('ep4-speed')) { say('전축의 낮은 목소리가 귓가에 남아 있다. "그 문은 손으로 여는 게 아니야."'); return; }
    if (canAttempt('ep4-speed')) { setSpeedOpen(true); return; }
    say('전축에 판이 걸려 있다. 데크부터 고치고 나서 차분히 들어보자.');
  }
  function handleSpeedSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-speed', answer });
    setSpeedOpen(false);
  }

  // ── 골방 문 ──
  function handleGolbangDoor() {
    if (knockSolved) { goRoom('ep4-golbang'); return; }
    if (canAttempt('ep4-knock')) { setKnockOpen(true); return; }
    say('열쇠 구멍이 없는 문. 문틈에는 담요가 둘러져 있다 — 바람막이치고는 꼼꼼하다.');
  }
  function handleKnockSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-knock', answer });
    if (answer === '장-장-단-단-장') {
      setKnockOpen(false);
      playSfx('door');
      say('딸깍 — 안쪽에서 걸쇠가 저절로 풀린 것처럼, 문이 열렸다.');
    }
  }

  // ── 테이프 상자 (수열 보드) ──
  function handleTapeBox() {
    if (solved.includes('ep4-numbers')) { say('테이프는 나이 순으로 정리해두었다. 035 — 올해의 테이프만 데크에 걸면 된다.'); return; }
    if (canAttempt('ep4-numbers')) { setNumbersOpen(true); return; }
    say('가져온 테이프 상자. 007, 010, 015… 이 숫자들의 규칙을 아직 모르겠다.');
  }
  function handleNumbersSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-numbers', answer });
    setNumbersOpen(false);
  }

  // ── 이동 ──
  function goRoom(room: 'ep4-anbang' | 'ep4-golbang') {
    if (navGuard.current) return;
    navGuard.current = true;
    fx.roomTransition();
    playSfx('door');
    navTimer.current = setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room });
      navGuard.current = false;
    }, 600);
  }

  const navTargets = [{ room: 'ep4-anbang', label: '안방', side: 'right' as const }];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} className={shake}>
      <svg viewBox="0 0 800 400" width="100%" style={{ display: 'block' }} aria-label="옛집 마루 — 밤">
        {/* 밤 실내: 백열등 갈색 */}
        <rect width="800" height="400" fill="#241a12" />
        <rect x="0" y="300" width="800" height="100" fill="#3a2c1c" />
        {[100, 300, 500, 700].map((x) => (
          <line key={x} x1={x} y1="300" x2={x} y2="400" stroke="#2a2014" strokeWidth="2" opacity="0.6" />
        ))}
        {/* 백열등 */}
        <g aria-hidden="true">
          <line x1="400" y1="0" x2="400" y2="46" stroke="#1a140c" strokeWidth="3" />
          <circle cx="400" cy="56" r="12" fill="#ffcf7a" opacity="0.95" />
          <circle cx="400" cy="56" r="30" fill="#ffcf7a" opacity="0.15" />
        </g>

        {/* ── 릴 데크 (중앙 낮은 장 위) ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('deck', handleDeck); }}
          role="button" aria-label="릴 데크" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleDeck()}>
          <rect x="330" y="250" width="150" height="52" rx="4" fill="#4a3a26" stroke="#2a1c10" strokeWidth="2" />
          <rect x="344" y="212" width="122" height="40" rx="5" fill="#8a8478" stroke="#5a544a" strokeWidth="2" />
          <circle cx="374" cy="230" r="12" fill="#141210" stroke="#c8a86a" strokeWidth="1.5" />
          <circle cx="436" cy="230" r="12" fill="#141210" stroke="#c8a86a" strokeWidth="1.5" />
          <rect x="392" y="224" width="26" height="11" rx="2" fill="#0c0a06" />
          <text x="405" y="233" textAnchor="middle" fontSize="8" fontFamily="monospace" fill={beltSolved ? '#e8d3a8' : '#5a544a'}>
            {beltSolved ? '000' : '---'}
          </text>
          {/* 걸린 테이프 (F7) */}
          <rect x="352" y="205" width="30" height="8" rx="1" fill="#2a2018" stroke="#4a3a28" strokeWidth="1" />
          <text x="405" y="200" textAnchor="middle" fontSize="12" fill="#c8b088">릴 데크</text>
        </g>

        {/* ── 라디오 (왼쪽 선반) ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('radio', handleRadio); }}
          role="button" aria-label="라디오" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleRadio()}>
          <rect x="80" y="190" width="110" height="64" rx="6" fill="#5a3e26" stroke="#3a2810" strokeWidth="2" />
          <rect x="92" y="202" width="50" height="40" rx="3" fill="#d8c8a0" opacity="0.85" />
          <line x1="97" y1="222" x2="137" y2="222" stroke="#6a5030" strokeWidth="1" />
          <line x1={radioSolved ? 104 : 122} y1="206" x2={radioSolved ? 104 : 122} y2="238" stroke="#c0392b" strokeWidth="2" />
          <circle cx="164" cy="222" r="12" fill="#3a2810" stroke="#c8a86a" strokeWidth="1.5" />
          <text x="135" y="182" textAnchor="middle" fontSize="12" fill="#c8b088">라디오</text>
        </g>

        {/* ── 라디오 아래 서랍 ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('drawer', handleDrawer); }}
          role="button" aria-label="라디오 아래 서랍" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleDrawer()}>
          <rect x="84" y="258" width="102" height="34" rx="3" fill="#4a3420" stroke="#2a1c10" strokeWidth="2" />
          <rect x="94" y={postcardsTaken ? 266 : 262} width="82" height="20" rx="2" fill="#5a4326" stroke="#2a1c10" strokeWidth="1.5" />
          <circle cx="135" cy={postcardsTaken ? 276 : 272} r="3" fill="#c8a86a" />
          {!postcardsTaken && <rect x="100" y="256" width="34" height="7" rx="1" fill="#e8dcc0" transform="rotate(-4 117 259)" />}
        </g>

        {/* ── 전축 (오른쪽) ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('phono', handlePhono); }}
          role="button" aria-label="전축" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handlePhono()}>
          <rect x="620" y="216" width="130" height="80" rx="5" fill="#4a3420" stroke="#2a1c10" strokeWidth="2" />
          <circle cx="672" cy="246" r="26" fill="#141210" stroke="#3a2810" strokeWidth="2" />
          <circle cx="672" cy="246" r="9" fill="#a8352a" />
          <line x1="716" y1="226" x2="694" y2="242" stroke="#c8a86a" strokeWidth="3" strokeLinecap="round" />
          <circle cx="716" cy="226" r="5" fill="#3a2810" stroke="#c8a86a" strokeWidth="1.5" />
          <text x="685" y="206" textAnchor="middle" fontSize="12" fill="#c8b088">전축</text>
        </g>

        {/* ── 테이프 상자 (데크 옆 바닥) ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('tapebox', handleTapeBox); }}
          role="button" aria-label="테이프 상자" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleTapeBox()}>
          <polygon points="520,330 610,330 602,372 528,372" fill="#8a6a42" stroke="#5a4326" strokeWidth="2" />
          <polygon points="520,330 534,316 624,316 610,330" fill="#a08050" stroke="#5a4326" strokeWidth="2" />
          <rect x="542" y="320" width="30" height="9" rx="1" fill="#2a2018" />
          <rect x="576" y="322" width="30" height="9" rx="1" fill="#2a2018" />
          <text x="566" y="392" textAnchor="middle" fontSize="12" fill="#c8b088">테이프 상자</text>
        </g>

        {/* ── 골방 문 (왼쪽 끝) ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('golbang', handleGolbangDoor); }}
          role="button" aria-label="골방 문" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleGolbangDoor()}>
          <rect x="8" y="120" width="58" height="180" fill={knockSolved ? '#1e2a28' : '#4a3520'} stroke="#2a1c10" strokeWidth="2.5" />
          {/* 문틈 담요 */}
          {!knockSolved && (
            <>
              <rect x="8" y="294" width="58" height="8" rx="3" fill="#6a4a3a" />
              <rect x="8" y="118" width="58" height="6" rx="2" fill="#6a4a3a" />
            </>
          )}
          <text x="37" y="110" textAnchor="middle" fontSize="12" fill="#c8b088">골방</text>
        </g>
      </svg>

      <RoomNav targets={navTargets} onGo={(room) => goRoom(room as 'ep4-anbang')} />

      {/* 하단 데크 버튼 — 수리 후 상시 접근 */}
      {beltSolved && (
        <button className="room-nav-btn room-nav-left" style={{ bottom: 'auto' }}
          onClick={() => { playSfx('click'); setDeckOpen(true); }}
          aria-label="릴 데크 열기">
          📼 데크
        </button>
      )}

      <TapeDeck open={deckOpen} onClose={() => setDeckOpen(false)} />
      <BeltRouting open={beltOpen} onSubmit={handleBeltSubmit} onClose={() => setBeltOpen(false)} />
      <FrequencyDial open={radioOpen} onSubmit={handleRadioSubmit} onClose={() => setRadioOpen(false)} />
      <SpeedSwitch open={speedOpen} onSubmit={handleSpeedSubmit} onClose={() => setSpeedOpen(false)} />
      <KnockRhythm open={knockOpen} onSubmit={handleKnockSubmit} onClose={() => setKnockOpen(false)} />
      <NumberBoard open={numbersOpen} onSubmit={handleNumbersSubmit} onClose={() => setNumbersOpen(false)} />

      <TapLabel name={ARMED_NAMES[armedId ?? ''] ?? null} />
      <Narration text={narration} onDone={() => setNarration(null)} />
    </div>
  );
}

const ARMED_NAMES: Record<string, string> = {
  deck: '릴 데크',
  radio: '라디오',
  drawer: '서랍',
  phono: '전축',
  tapebox: '테이프 상자',
  golbang: '골방 문',
};
