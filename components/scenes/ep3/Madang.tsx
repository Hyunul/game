'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { canAttemptWith } from '../../../lib/gameState';
import { playSfx, playBgm } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';
import TapLabel from '../../TapLabel';
import RoomNav from '../../RoomNav';
import ShadowDial from '../../puzzles/ShadowDial';
import OrderPicker from '../../puzzles/OrderPicker';
import WellWeights from '../../puzzles/WellWeights';
import { useTwoTap } from '../../../lib/useTwoTap';
import { useShake } from '../../../lib/useShake';

const JANGDOK_ITEMS = [
  { id: '입춘', label: '입춘 독', desc: '"입춘에 장 가르고"' },
  { id: '백로', label: '백로 독', desc: '"백로에 새 독을"' },
  { id: '동지', label: '동지 독', desc: '"동지에 메주 쑤고"' },
  { id: '곡우', label: '곡우 독', desc: '"곡우에 간장 뜨고"' },
];

const CLOTHES_ITEMS = [
  { id: 'chima', label: '물빛 치마', desc: '색이 있다. 가볍다.' },
  { id: 'jeogori', label: '흰 저고리', desc: '희고 가장 가볍다.' },
  { id: 'ibul', label: '솜이불잇', desc: '색이 바랬다. 가장 무겁다.' },
  { id: 'jeoksam', label: '흰 적삼', desc: '희다. 저고리보다 도톰하다.' },
];

export default function Madang() {
  const { state, dispatch, episode } = useGame();
  const { solved, wrongAttempts, selectedItem } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const shake = useShake(wrongAttempts);
  const [sundialOpen, setSundialOpen] = useState(false);
  const [jangdokOpen, setJangdokOpen] = useState(false);
  const [wellOpen, setWellOpen] = useState(false);
  const [clotheslineOpen, setClotheslineOpen] = useState(false);
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

  // ── 대문/해시계 (문살 그림자) ──
  function handleGate() {
    if (solved.includes('ep3-sundial')) {
      say('댓돌 밑은 이미 파보았다. 무쇠 열쇠가 나온 자리다.');
      return;
    }
    setSundialOpen(true);
  }

  function handleSundialSubmit(spot: string) {
    if (spot === 'daetdol' && canAttempt('ep3-sundial')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep3-sundial', answer: spot });
      setSundialOpen(false);
      playSfx('pickup');
      say('그림자 끝의 댓돌을 들추자 — 기름종이에 싼 무쇠 열쇠가 나왔다.');
    } else {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep3-sundial', answer: spot });
    }
  }

  // ── 건넌방 문 ──
  function handleGeonDoor() {
    if (solved.includes('ep3-geon-door')) {
      goRoom('geonneonbang');
      return;
    }
    if (selectedItem === 'geon-key' && canAttempt('ep3-geon-door')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep3-geon-door', answer: '' });
      playSfx('door');
      say('무쇠 열쇠가 맞았다. 건넌방 — 고모의 방이 열렸다.');
    } else {
      say('건넌방 문이 잠겨 있다. 오래된 무쇠 자물쇠다.');
    }
  }

  // ── 장독대 ──
  function handleJangdok() {
    if (solved.includes('ep3-jangdok')) {
      say('열어본 장독들. 마지막 독은 비어 있다.');
      return;
    }
    if (canAttempt('ep3-jangdok')) {
      setJangdokOpen(true);
    } else {
      say('장독 네 개. 뚜껑 안쪽에 무언가 적혀 있는 것 같지만, 어느 것부터 열지 실마리가 없다.');
    }
  }

  function handleJangdokSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep3-jangdok', answer });
    if (answer === '동지-입춘-곡우-백로') {
      setJangdokOpen(false);
      playSfx('pickup');
      say('백로 독 바닥 — 기름종이 꾸러미 속에 편지가 있었다.');
    }
  }

  // ── 우물 ──
  function handleWell() {
    if (solved.includes('ep3-well')) {
      say('두레박이 얌전히 걸려 있다. 단지는 건져 올렸다.');
      return;
    }
    if (canAttempt('ep3-well')) {
      setWellOpen(true);
    } else {
      say('오래된 우물. 두레박 줄 옆에 돌 추가 몇 개 놓여 있다. 우물틀에 "물에 뜨는 것은 건질 수 없다"고 새겨져 있다.');
    }
  }

  function handleWellSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep3-well', answer });
    if (answer === '3-5') {
      setWellOpen(false);
      playSfx('pickup');
      say('정확히 여덟 근 — 두레박이 바닥 단지에 닿았다. 방수 단지 속에 뒷문 열쇠와 편지가.');
    }
  }

  // ── 뒷문 ──
  function handleBackdoor() {
    if (solved.includes('ep3-backdoor')) {
      goRoom('ep3-anbang');
      return;
    }
    if (selectedItem === 'backdoor-key' && canAttempt('ep3-backdoor')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep3-backdoor', answer: '' });
      playSfx('door');
      say('뒷문이 열렸다. 안방으로 이어진다 — 보름밤, 할머니가 쌀자루를 놓고 가던 그 문이다.');
    } else {
      say('굳게 잠긴 뒷문. 안방으로 통하는 문이다.');
    }
  }

  // ── 빨랫줄 ──
  function handleClothesline() {
    if (solved.includes('ep3-clothesline')) {
      say('규칙대로 널린 빨래가 바람에 흔들린다.');
      return;
    }
    if (canAttempt('ep3-clothesline')) {
      setClotheslineOpen(true);
    } else {
      say('빨랫줄에 옷가지가 아무렇게나 걸쳐져 있다. 너는 순서에 규칙이 있었던 것 같은데…');
    }
  }

  function handleClotheslineSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep3-clothesline', answer });
    if (answer === 'jeogori-jeoksam-chima-ibul') {
      setClotheslineOpen(false);
      playSfx('pickup');
      say('어머니의 순서대로 널자 — 적삼 주머니가 묵직하다. 부치지 못한 마지막 편지다.');
    }
  }

  // ── 이동 ──
  function goRoom(room: 'geonneonbang' | 'bueok' | 'ep3-anbang') {
    if (navGuard.current) return;
    navGuard.current = true;
    fx.roomTransition();
    playSfx('door');
    navTimer.current = setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room });
      navGuard.current = false;
    }, 600);
  }

  const sundialSolved = solved.includes('ep3-sundial');
  const geonOpen = solved.includes('ep3-geon-door');
  const backdoorOpen = solved.includes('ep3-backdoor');
  const clotheslineSolved = solved.includes('ep3-clothesline');

  const navTargets = [
    { room: 'bueok', label: '부엌', side: 'left' as const },
    ...(geonOpen ? [{ room: 'geonneonbang', label: '건넌방', side: 'right' as const }] : []),
  ];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} className={shake}>
      <svg
        viewBox="0 0 800 400"
        width="100%"
        style={{ display: 'block' }}
        aria-label="별채 마당 장면"
      >
        {/* 하늘/땅 */}
        <rect width="800" height="400" fill="#a8b8c0" />
        <rect x="0" y="280" width="800" height="120" fill="#8a7a5c" />
        <ellipse cx="400" cy="350" rx="260" ry="30" fill="#a08a60" opacity="0.5" />

        {/* 별채 본채 (배경) */}
        <g aria-hidden="true">
          <rect x="180" y="120" width="440" height="160" fill="#c8b088" stroke="#6a5030" strokeWidth="2" />
          <polygon points="150,124 650,124 610,60 190,60" fill="#4a3826" stroke="#3a2810" strokeWidth="2" />
          {[260, 340, 480, 560].map((x) => (
            <line key={x} x1={x} y1="122" x2={x} y2="278" stroke="#6a5030" strokeWidth="1.5" opacity="0.4" />
          ))}
          {/* 마루 */}
          <rect x="200" y="240" width="400" height="40" fill="#9a7648" stroke="#6a5030" strokeWidth="1.5" />
        </g>

        {/* ── 건넌방 문 (오른쪽) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('geon-door', handleGeonDoor); }}
          role="button" aria-label="건넌방 문" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleGeonDoor()}
        >
          <rect x="500" y="150" width="80" height="110" fill={geonOpen ? '#3a2c1c' : '#7a5a34'} stroke="#4a3018" strokeWidth="2" />
          <line x1="540" y1="152" x2="540" y2="258" stroke="#4a3018" strokeWidth="1.5" />
          {!geonOpen && (
            <>
              <circle cx="540" cy="208" r="8" fill="#333" stroke="#111" strokeWidth="1.5" />
              <rect x="533" y="201" width="14" height="9" rx="2" fill="#222" />
            </>
          )}
          <text x="540" y="142" textAnchor="middle" fontSize="12" fill="#3a2c18">건넌방</text>
        </g>

        {/* ── 뒷문 (본채 왼쪽 뒤) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('backdoor', handleBackdoor); }}
          role="button" aria-label="뒷문" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleBackdoor()}
        >
          <rect x="220" y="156" width="64" height="104" fill={backdoorOpen ? '#2c2418' : '#5a4326'} stroke="#3a2810" strokeWidth="2" />
          {!backdoorOpen && <circle cx="272" cy="210" r="5" fill="#2a2018" />}
          <text x="252" y="148" textAnchor="middle" fontSize="12" fill="#3a2c18">뒷문(안방)</text>
        </g>

        {/* ── 대문 + 문살 그림자 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('gate', handleGate); }}
          role="button" aria-label="대문과 그림자" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleGate()}
        >
          <rect x="30" y="180" width="90" height="120" fill="#4a3520" stroke="#2a1c10" strokeWidth="2.5" />
          {[52, 72, 92].map((x) => (
            <line key={x} x1={x} y1="186" x2={x} y2="294" stroke="#2a1c10" strokeWidth="2.5" />
          ))}
          <line x1="34" y1="230" x2="116" y2="230" stroke="#2a1c10" strokeWidth="2.5" />
          {/* 마당의 그림자 자국 */}
          <polygon points="120,300 240,320 240,336 120,314" fill="#5a4a34" opacity="0.5" />
        </g>

        {/* ── 댓돌 ── */}
        <g aria-hidden="true">
          <ellipse cx="256" cy="330" rx="34" ry="12" fill={sundialSolved ? '#6a5a40' : '#8a7a60'} stroke="#5a4a34" strokeWidth="1.5" />
          {sundialSolved && <ellipse cx="256" cy="330" rx="16" ry="6" fill="#3a2f20" />}
        </g>

        {/* ── 장독대 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('jangdok', handleJangdok); }}
          role="button" aria-label="장독대" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleJangdok()}
        >
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${628 + (i % 2) * 62}, ${296 + Math.floor(i / 2) * 42})`}>
              <path d="M 6 30 Q 0 12 12 4 Q 24 -2 36 4 Q 48 12 42 30 Q 38 40 24 40 Q 10 40 6 30" fill="#5a3e26" stroke="#3a2810" strokeWidth="1.5" />
              <ellipse cx="24" cy="5" rx="14" ry="4" fill="#6a4c30" stroke="#3a2810" strokeWidth="1" />
            </g>
          ))}
        </g>

        {/* ── 우물 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('well', handleWell); }}
          role="button" aria-label="우물" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleWell()}
        >
          <ellipse cx="120" cy="356" rx="46" ry="16" fill="#6a6258" stroke="#4a4238" strokeWidth="2" />
          <ellipse cx="120" cy="350" rx="36" ry="12" fill="#20303e" />
          <line x1="86" y1="322" x2="86" y2="352" stroke="#5a4632" strokeWidth="4" />
          <line x1="154" y1="322" x2="154" y2="352" stroke="#5a4632" strokeWidth="4" />
          <line x1="82" y1="322" x2="158" y2="322" stroke="#5a4632" strokeWidth="4" />
          <line x1="120" y1="324" x2="120" y2="344" stroke="#c8b088" strokeWidth="1.5" />
        </g>

        {/* ── 빨랫줄 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('clothesline', handleClothesline); }}
          role="button" aria-label="빨랫줄" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleClothesline()}
        >
          <line x1="640" y1="120" x2="784" y2="140" stroke="#c8b088" strokeWidth="2" />
          <line x1="640" y1="120" x2="640" y2="280" stroke="#5a4632" strokeWidth="4" />
          <line x1="784" y1="140" x2="784" y2="280" stroke="#5a4632" strokeWidth="4" />
          {/* 옷가지 */}
          {(clotheslineSolved
            ? [{ x: 652, c: '#efe8d8' }, { x: 684, c: '#e8e0cc' }, { x: 716, c: '#9ab8c8' }, { x: 748, c: '#d8ccb0' }]
            : [{ x: 652, c: '#9ab8c8' }, { x: 684, c: '#d8ccb0' }, { x: 716, c: '#efe8d8' }, { x: 748, c: '#e8e0cc' }]
          ).map((o, i) => (
            <rect key={i} x={o.x} y={124 + i * 4} width="26" height={30 + (i % 2) * 8} fill={o.c} stroke="#8a7a60" strokeWidth="1" />
          ))}
        </g>
      </svg>

      <RoomNav targets={navTargets} onGo={(room) => goRoom(room as 'geonneonbang' | 'bueok')} />

      <ShadowDial
        open={sundialOpen}
        onSubmit={handleSundialSubmit}
        onClose={() => setSundialOpen(false)}
      />

      <OrderPicker
        open={jangdokOpen}
        title="장독대 — 뚜껑 열기"
        instruction="가계부의 장 담근 기록 순서대로 뚜껑을 열자."
        items={JANGDOK_ITEMS}
        submitLabel="이 순서로 연다"
        wrongSignal={wrongAttempts || undefined}
        onSubmit={handleJangdokSubmit}
        onClose={() => setJangdokOpen(false)}
      />

      <WellWeights
        open={wellOpen}
        wrongSignal={wrongAttempts || undefined}
        onSubmit={handleWellSubmit}
        onClose={() => setWellOpen(false)}
      />

      <OrderPicker
        open={clotheslineOpen}
        title="빨랫줄 — 다시 널기"
        instruction="어머니의 규칙대로 옷을 널자. (편지 ⑤ 추신)"
        items={CLOTHES_ITEMS}
        submitLabel="이 순서로 넌다"
        wrongSignal={wrongAttempts || undefined}
        onSubmit={handleClotheslineSubmit}
        onClose={() => setClotheslineOpen(false)}
      />

      <TapLabel name={ARMED_NAMES[armedId ?? ''] ?? null} />
      <Narration text={narration} onDone={() => setNarration(null)} />
    </div>
  );
}

const ARMED_NAMES: Record<string, string> = {
  gate: '대문',
  'geon-door': '건넌방 문',
  backdoor: '뒷문',
  jangdok: '장독대',
  well: '우물',
  clothesline: '빨랫줄',
};
