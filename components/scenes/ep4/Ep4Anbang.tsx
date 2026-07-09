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
import PatternRing from '../../ep4/PatternRing';
import CalendarMatch from '../../ep4/CalendarMatch';
import JagaeLock from '../../ep4/JagaeLock';

/** ep4 안방 — 화장대·달력·자개장. 어머니의 '겉모습' 단서들. */
export default function Ep4Anbang() {
  const { state, dispatch, episode } = useGame();
  const { solved, wrongAttempts } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const shake = useShake(wrongAttempts);
  const [ringOpen, setRingOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [jagaeOpen, setJagaeOpen] = useState(false);
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

  const ringSolved = solved.includes('ep4-ring');
  const pillTaken = solved.includes('ep4-pillbag');
  const calendarSolved = solved.includes('ep4-calendar');
  const jagaeSolved = solved.includes('ep4-jagae');

  // ── 화장대 서랍 (자개 링) ──
  function handleVanity() {
    if (ringSolved) { say('열린 서랍. 오디션 날 사진은 챙겨두었다.'); return; }
    setRingOpen(true);
  }
  function handleRingSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-ring', answer });
    setRingOpen(false);
    playSfx('pickup');
    say('서랍 안 — 방송국 앞에서 찍은 사진 한 장. 뒷면에 날짜가 적혀 있다.');
  }

  // ── 휴지통 뒤 (약봉투) ──
  function handleBin() {
    if (pillTaken) { say('휴지통 뒤는 이제 비어 있다.'); return; }
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-pillbag', answer: '' });
    playSfx('pickup');
    say('구겨진 약봉투 세 장. 이름은 없고, 날짜 도장만 찍혀 있다.');
  }

  // ── 달력 ──
  function handleCalendar() {
    if (calendarSolved) { say('세 도장이 동그라미와 정확히 포개졌다. 오디션 일정이 아니라 — 진료일이었다.'); return; }
    if (canAttempt('ep4-calendar')) { setCalendarOpen(true); return; }
    say('9월 달력. 동그라미가 다섯 개 — 간격이 점점 좁아진다. 오디션이 이렇게 잦았을까?');
  }
  function handleCalendarSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-calendar', answer });
    setCalendarOpen(false);
  }

  // ── 자개장 ──
  function handleJagae() {
    if (jagaeSolved) { say('자개장은 열려 있다. 처방전 묶음과 쪽지는 챙겼다.'); return; }
    if (canAttempt('ep4-jagae')) { setJagaeOpen(true); return; }
    say('음절 고리 세 개가 달린 자개장 자물쇠. 어머니를 부르던 다른 이름이 있었던 것 같은데.');
  }
  function handleJagaeSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-jagae', answer });
    if (answer === '은-방-울') {
      setJagaeOpen(false);
      playSfx('pickup');
    }
  }

  // ── 이동 ──
  function goRoom(room: 'ep4-maru') {
    if (navGuard.current) return;
    navGuard.current = true;
    fx.roomTransition();
    playSfx('door');
    navTimer.current = setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room });
      navGuard.current = false;
    }, 600);
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} className={shake}>
      <svg viewBox="0 0 800 400" width="100%" style={{ display: 'block' }} aria-label="옛집 안방 — 밤">
        <rect width="800" height="400" fill="#28190f" />
        <rect x="0" y="310" width="800" height="90" fill="#3e2c1a" />
        {/* 창 — 밤하늘 */}
        <g aria-hidden="true">
          <rect x="330" y="60" width="140" height="110" rx="4" fill="#101828" stroke="#4a3a26" strokeWidth="3" />
          <line x1="400" y1="62" x2="400" y2="168" stroke="#4a3a26" strokeWidth="2.5" />
          <line x1="332" y1="115" x2="468" y2="115" stroke="#4a3a26" strokeWidth="2.5" />
          <circle cx="368" cy="88" r="12" fill="#e8dcc0" opacity="0.9" />
          <circle cx="374" cy="84" r="10" fill="#101828" />
        </g>

        {/* ── 화장대 (왼쪽) ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('vanity', handleVanity); }}
          role="button" aria-label="화장대" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleVanity()}>
          <rect x="60" y="180" width="140" height="16" rx="3" fill="#5a3e26" stroke="#3a2810" strokeWidth="2" />
          <rect x="70" y="196" width="120" height="90" rx="3" fill="#4a3420" stroke="#2a1c10" strokeWidth="2" />
          {/* 거울 */}
          <ellipse cx="130" cy="130" rx="46" ry="52" fill="#182028" stroke="#c8a86a" strokeWidth="3" opacity="0.9" />
          {/* 자개 문양 서랍 */}
          <rect x="82" y={ringSolved ? 214 : 208} width="96" height="26" rx="2" fill="#5a4326" stroke="#2a1c10" strokeWidth="1.5" />
          <circle cx="130" cy={ringSolved ? 227 : 221} r="8" fill="none" stroke="#e8cfa8" strokeWidth="2" />
          <circle cx="130" cy={ringSolved ? 227 : 221} r="4" fill="#e8cfa8" opacity="0.7" />
          <text x="130" y="76" textAnchor="middle" fontSize="12" fill="#c8b088">화장대</text>
        </g>

        {/* ── 휴지통 (화장대 옆) ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('bin', handleBin); }}
          role="button" aria-label="휴지통 뒤" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleBin()}>
          <path d="M 226 300 L 232 342 L 262 342 L 268 300 Z" fill="#4a4238" stroke="#2a2620" strokeWidth="2" />
          {!pillTaken && <rect x="266" y="318" width="22" height="14" rx="3" fill="#e8e0d0" transform="rotate(12 277 325)" />}
        </g>

        {/* ── 달력 (창 오른쪽 벽) ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('calendar', handleCalendar); }}
          role="button" aria-label="달력" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleCalendar()}>
          <rect x="520" y="80" width="96" height="120" rx="3" fill="#f2e8d0" stroke="#8a7a58" strokeWidth="2" />
          <rect x="520" y="80" width="96" height="26" fill="#a8352a" />
          <text x="568" y="98" textAnchor="middle" fontSize="13" fill="#f2e8d0">9월</text>
          {/* 동그라미들 — 간격이 좁아진다 */}
          {[{ x: 538, y: 122 }, { x: 566, y: 138 }, { x: 594, y: 154 }, { x: 552, y: 170 }, { x: 580, y: 182 }].map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r="7" fill="none"
              stroke={calendarSolved && (i === 0 || i === 2 || i === 3) ? '#2a7a6a' : '#c0392b'} strokeWidth="1.8" />
          ))}
          <text x="568" y="216" textAnchor="middle" fontSize="12" fill="#c8b088">달력</text>
        </g>

        {/* ── 자개장 (오른쪽) ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('jagae', handleJagae); }}
          role="button" aria-label="자개장" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleJagae()}>
          <rect x="650" y="130" width="120" height="180" rx="4" fill="#241610" stroke="#3a2810" strokeWidth="2.5" />
          <line x1="710" y1="132" x2="710" y2="308" stroke="#3a2810" strokeWidth="2" />
          {/* 자개 무늬 */}
          {[{ x: 680, y: 170 }, { x: 740, y: 190 }, { x: 676, y: 240 }, { x: 744, y: 260 }].map((p, i) => (
            <g key={i} opacity="0.85">
              <circle cx={p.x} cy={p.y} r="8" fill="none" stroke="#9ac8c0" strokeWidth="1.5" />
              <circle cx={p.x} cy={p.y} r="3" fill="#c8e0d8" />
            </g>
          ))}
          {!jagaeSolved && (
            <g>
              <rect x="694" y="212" width="32" height="18" rx="3" fill="#c8a86a" stroke="#8a6a3a" strokeWidth="1.5" />
              <circle cx="710" cy="221" r="3" fill="#3a2810" />
            </g>
          )}
          <text x="710" y="120" textAnchor="middle" fontSize="12" fill="#c8b088">자개장</text>
        </g>
      </svg>

      <RoomNav targets={[{ room: 'ep4-maru', label: '마루', side: 'left' as const }]}
        onGo={() => goRoom('ep4-maru')} />

      <PatternRing open={ringOpen} onSubmit={handleRingSubmit} onClose={() => setRingOpen(false)} />
      <CalendarMatch open={calendarOpen} onSubmit={handleCalendarSubmit} onClose={() => setCalendarOpen(false)} />
      <JagaeLock open={jagaeOpen} wrongSignal={wrongAttempts || undefined}
        onSubmit={handleJagaeSubmit} onClose={() => setJagaeOpen(false)} />

      <TapLabel name={ARMED_NAMES[armedId ?? ''] ?? null} />
      <Narration text={narration} onDone={() => setNarration(null)} />
    </div>
  );
}

const ARMED_NAMES: Record<string, string> = {
  vanity: '화장대',
  bin: '휴지통',
  calendar: '달력',
  jagae: '자개장',
};
