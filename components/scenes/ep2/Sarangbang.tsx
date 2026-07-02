'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { canAttemptWith } from '../../../lib/gameState';
import { playSfx, playBgm } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';
import Keypad from '../../Keypad';
import TapLabel from '../../TapLabel';
import { useTwoTap } from '../../../lib/useTwoTap';
import { eraTint, handleWatchUse } from './era';
import RoomNav from '../../RoomNav';

export default function Sarangbang() {
  const { state, dispatch, episode } = useGame();
  const { solved, lastResult, era } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [keypadConfig, setKeypadConfig] = useState<{
    title: string; length: number; puzzleId: string;
  } | null>(null);
  const [shake, setShake] = useState(false);
  const navGuard = useRef(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (navTimer.current !== null) clearTimeout(navTimer.current);
  }, []);

  const prevLastResult = useRef<typeof lastResult>(null);

  function canAttempt(puzzleId: string) {
    return canAttemptWith(episode, state, puzzleId);
  }

  useEffect(() => {
    playBgm(era === 'past' ? 'ep2-past' : 'ep2-present');
  }, [era]);

  useEffect(() => {
    if (lastResult === 'wrong' && lastResult !== prevLastResult.current) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    prevLastResult.current = lastResult;
  }, [lastResult]);

  function say(text: string) {
    setNarration(text);
  }

  function handleBackgroundClick() {
    handleWatchUse(state, dispatch);
  }

  // ── 달력 ──
  function handleCalendar() {
    if (handleWatchUse(state, dispatch)) return;
    if (era === 'past') {
      setCalendarOpen(true);
      if (!solved.includes('ep2-calendar')) {
        dispatch({ type: 'SOLVE', puzzleId: 'ep2-calendar' });
        playSfx('pickup');
      }
    } else {
      say('바랜 달력. 아무것도 읽을 수 없다.');
    }
  }

  // ── 서랍장 ──
  function handleDrawer() {
    if (handleWatchUse(state, dispatch)) return;
    if (era === 'past') {
      say('서랍은 잠겨 있지 않다. 편지지와 만년필이 가지런하다.');
      return;
    }
    if (solved.includes('ep2-drawer')) {
      say("서랍 속, '아버지께'라 적힌 빈 봉투… 본문은 어디에?");
      return;
    }
    if (canAttempt('ep2-drawer')) {
      setKeypadConfig({ title: '네 자리 다이얼', length: 4, puzzleId: 'ep2-drawer' });
    } else {
      say('다이얼 자물쇠. 네 자리… 무슨 날짜일까?');
    }
  }

  // ── 가훈 액자 ──
  function handleFrame() {
    if (handleWatchUse(state, dispatch)) return;
    if (era === 'past') {
      say('반듯하게 걸린 가훈. 兄友弟恭 — 형은 우애하고 아우는 공경한다.');
      return;
    }
    if (solved.includes('ep2-frame')) {
      say('반듯해진 가훈 액자. 이제 더 볼 것은 없다.');
      return;
    }
    if (canAttempt('ep2-frame')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-frame', answer: '' });
      fx.correctPulse();
      say('액자 뒤에서 접힌 편지가 떨어졌다 — "동생을 탓하지 마세요. 그 아이 잘못이 아닙니다."');
    } else {
      say('액자가 비뚤어져 있다.');
    }
  }

  // ── 라디오 ──
  function handleRadio() {
    if (handleWatchUse(state, dispatch)) return;
    if (era === 'present') {
      say('낡은 라디오. 전원이 들어오지 않는다.');
      return;
    }
    if (solved.includes('ep2-radio')) {
      say('라디오에서 잔잔한 소리가 흘러나온다.');
      return;
    }
    if (canAttempt('ep2-radio')) {
      setKeypadConfig({ title: '주파수를 맞추자', length: 3, puzzleId: 'ep2-radio' });
    } else {
      say('라디오 주파수 다이얼. 어디를 맞춰야 할까?');
    }
  }

  // ── Keypad submit ──
  function handleKeypadSubmit(answer: string) {
    if (!keypadConfig) return;
    const { puzzleId } = keypadConfig;
    dispatch({ type: 'ATTEMPT', puzzleId, answer });
    setKeypadConfig(null);
    setTimeout(() => {
      if (puzzleId === 'ep2-drawer' && answer === '0815') {
        say("서랍 속, '아버지께'라 적힌 빈 봉투… 본문은 어디에?");
      }
      if (puzzleId === 'ep2-radio' && answer === '711') {
        say('지지직… "내일은 보름. 저수지 수위가 높으니 야간 출입을 삼가시기 바랍니다." 라디오 옆에 성냥갑이 있다.');
      }
    }, 50);
  }

  // ── 문 (안방으로 / 마당으로) ──
  function goRoom(room: 'anbang' | 'heotgan') {
    if (navGuard.current) return;
    navGuard.current = true;
    fx.roomTransition();
    playSfx('door');
    navTimer.current = setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room });
      navGuard.current = false;
    }, 600);
  }

  const calendarSolved = solved.includes('ep2-calendar');
  const drawerSolved = solved.includes('ep2-drawer');
  const frameSolved = solved.includes('ep2-frame');
  const radioSolved = solved.includes('ep2-radio');
  const isPast = era === 'past';

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className={shake ? 'shake' : undefined}
    >
      <svg
        viewBox="0 0 800 400"
        width="100%"
        style={{ display: 'block' }}
        aria-label="사랑방 장면"
        onClick={handleBackgroundClick}
      >
        {/* Background */}
        <rect width="800" height="400" fill={isPast ? '#e8cfa0' : '#8f8378'} />

        {/* Floor */}
        <rect x="0" y="320" width="800" height="80" fill={isPast ? '#b89058' : '#6e675e'} />
        <line x1="0" y1="320" x2="800" y2="320" stroke={isPast ? '#8a6838' : '#4a453f'} strokeWidth="2" />
        {/* 장판 결 */}
        <line x1="0" y1="352" x2="800" y2="350" stroke={isPast ? '#a37c48' : '#5e574f'} strokeWidth="1" opacity="0.6" />
        <line x1="0" y1="382" x2="800" y2="378" stroke={isPast ? '#a37c48' : '#5e574f'} strokeWidth="1" opacity="0.5" />

        {/* 창문 (위쪽 벽, 장식) */}
        <g aria-hidden="true">
          <rect x="600" y="40" width="90" height="70" rx="2" fill={isPast ? '#f7ecd0' : '#7d7468'} stroke="#7a6040" strokeWidth="2" />
          <line x1="645" y1="40" x2="645" y2="110" stroke="#7a6040" strokeWidth="2" />
          <line x1="600" y1="75" x2="690" y2="75" stroke="#7a6040" strokeWidth="2" />
          {isPast && <rect x="602" y="42" width="86" height="66" fill="#ffe9a8" opacity="0.35" />}
        </g>

        {/* 벽 몰딩 */}
        <line x1="0" y1="30" x2="800" y2="30" stroke={isPast ? '#c8a878' : '#7d7468'} strokeWidth="3" opacity="0.6" />

        {/* 방석 (바닥 장식) */}
        <ellipse cx="450" cy="345" rx="42" ry="12" fill={isPast ? '#b06060' : '#6e5450'} opacity={isPast ? 0.9 : 0.5} />
        <ellipse cx="450" cy="342" rx="42" ry="12" fill={isPast ? '#c87878' : '#7d5f5a'} opacity={isPast ? 0.9 : 0.5} />

        {/* Present-only dust/cobweb decoration */}
        {!isPast && (
          <>
            <path d="M20,10 Q40,30 20,50 Q0,30 20,10" fill="none" stroke="#ccc" strokeWidth="0.7" opacity="0.4" />
            <path d="M760,20 Q780,40 760,60" fill="none" stroke="#ccc" strokeWidth="0.7" opacity="0.4" />
            <circle cx="400" cy="380" r="1.5" fill="#ddd" opacity="0.5" />
            <circle cx="450" cy="390" r="1" fill="#ddd" opacity="0.4" />
          </>
        )}

        {/* ── 달력 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('calendar', handleCalendar); }}
          role="button"
          aria-label="달력"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleCalendar()}
        >
          <rect x="80" y="50" width="90" height="110" rx="3" fill={isPast ? '#f5f0e0' : '#c8c0b0'} stroke="#7a6040" strokeWidth="1.5" />
          <rect x="80" y="50" width="90" height="24" rx="3" fill={isPast ? '#d04040' : '#9a8a78'} />
          {isPast && (
            <>
              <text x="125" y="67" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">1978.8</text>
              <circle cx="125" cy="120" r="8" fill="none" stroke="#d04040" strokeWidth="1.5" />
              <text x="125" y="124" textAnchor="middle" fontSize="9" fill="#333">15</text>
              {calendarSolved && (
                <text x="125" y="145" textAnchor="middle" fontSize="7" fill="#664400">보름. 물가 출입 금지 — 父</text>
              )}
            </>
          )}
        </g>

        {/* ── 서랍장 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('drawer', handleDrawer); }}
          role="button"
          aria-label="서랍장"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleDrawer()}
        >
          {!isPast && (
            <text x="260" y="185" textAnchor="middle" fontSize="8" fill="#4a3820" opacity="0.8">잊지 말자</text>
          )}
          <rect x="220" y="190" width="120" height="90" rx="3" fill={isPast ? '#8b5e3c' : '#5e4a38'} stroke="#3a2810" strokeWidth="1.5" />
          <rect x="230" y="200" width="100" height="24" rx="2" fill={isPast ? '#a07850' : '#4a3a2c'}
            transform={drawerSolved ? 'translate(0, 6)' : undefined} />
          <rect x="230" y="230" width="100" height="24" rx="2" fill={isPast ? '#a07850' : '#4a3a2c'} />
          <rect x="230" y="260" width="100" height="14" rx="2" fill={isPast ? '#a07850' : '#4a3a2c'} />
          {!isPast && (
            <circle cx="280" cy="212" r="5" fill="#c8a050" stroke="#a07030" strokeWidth="1" />
          )}
        </g>

        {/* ── 가훈 액자 ── */}
        {/* 기울기는 바깥 그룹(SVG transform), 호버 리프트는 안쪽 그룹(CSS) —
            CSS transform이 SVG transform 속성을 덮어써 기울기가 풀리는 것 방지 */}
        <g transform={!isPast && !frameSolved ? 'rotate(-8 470 90)' : undefined}>
          <g
            className="hotspot-lift"
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); guard('frame', handleFrame); }}
            role="button"
            aria-label="가훈 액자"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleFrame()}
          >
            <rect x="430" y="60" width="80" height="60" rx="2" fill="#5a3810" stroke="#3a2408" strokeWidth="2" />
            <rect x="438" y="68" width="64" height="44" rx="1" fill="#f0e4c8" />
            <text x="470" y="96" textAnchor="middle" fontSize="14" fill="#3a2810" fontWeight="700">兄友弟恭</text>
          </g>
        </g>

        {/* ── 라디오 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('radio', handleRadio); }}
          role="button"
          aria-label="라디오"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleRadio()}
        >
          <rect x="580" y="200" width="90" height="60" rx="4" fill="#4a3a28" stroke="#2a1c10" strokeWidth="1.5" />
          <circle cx="605" cy="230" r="12" fill="#222" stroke="#555" strokeWidth="1" />
          <rect x="626" y="220" width="34" height="6" rx="2" fill={radioSolved && isPast ? '#ffd24a' : '#333'} />
          {radioSolved && isPast && <circle cx="605" cy="230" r="4" fill="#ffd24a" opacity="0.8" />}
        </g>

        {/* 문 (장식 — 이동은 하단 RoomNav 버튼) */}
        <g aria-hidden="true">
          <rect x="730" y="120" width="60" height="180" rx="2" fill={isPast ? '#7a5030' : '#5a4632'} stroke="#3a2810" strokeWidth="2" />
          <line x1="740" y1="135" x2="780" y2="135" stroke="#3a2810" strokeWidth="1" opacity="0.5" />
          <line x1="740" y1="205" x2="780" y2="205" stroke="#3a2810" strokeWidth="1" opacity="0.5" />
          <line x1="740" y1="275" x2="780" y2="275" stroke="#3a2810" strokeWidth="1" opacity="0.5" />
          <circle cx="738" cy="212" r="3" fill="#c8a050" />
        </g>
      </svg>

      <RoomNav
        targets={[
          { room: 'heotgan', label: '마당', side: 'left' },
          { room: 'anbang', label: '안방', side: 'right' },
        ]}
        onGo={(room) => goRoom(room as 'anbang' | 'heotgan')}
      />

      {/* Era 색조 오버레이 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundColor: eraTint(era) }} />

      {/* ── 달력 확대 오버레이 ── */}
      {calendarOpen && isPast && (
        <div style={overlayStyles.overlay} onClick={() => setCalendarOpen(false)}>
          <div style={overlayStyles.card} onClick={(e) => e.stopPropagation()}>
            <button style={overlayStyles.closeBtn} onClick={() => setCalendarOpen(false)} aria-label="닫기">✕</button>
            <h2 style={overlayStyles.title}>1978년 8월</h2>
            <div style={overlayStyles.calGrid}>
              {['일','월','화','수','목','금','토'].map((d) => (
                <div key={d} style={overlayStyles.calHeader}>{d}</div>
              ))}
              {Array.from({ length: 2 }).map((_, i) => <div key={`pad-${i}`} />)}
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const isCircled = day === 15;
                return (
                  <div key={day} style={{ ...overlayStyles.calDay, ...(isCircled ? overlayStyles.calDayCircled : {}) }}>
                    {day}
                  </div>
                );
              })}
            </div>
            <div style={overlayStyles.memo}>📝 보름. 물가 출입 금지 — 父</div>
          </div>
        </div>
      )}

      <Keypad
        open={!!keypadConfig}
        title={keypadConfig?.title ?? ''}
        length={keypadConfig?.length ?? 4}
        onSubmit={handleKeypadSubmit}
        onClose={() => setKeypadConfig(null)}
      />

      <TapLabel name={ARMED_NAMES[armedId ?? ''] ?? null} />

      <Narration text={narration} onDone={() => setNarration(null)} />
    </div>
  );
}

const ARMED_NAMES: Record<string, string> = {
  calendar: '달력',
  drawer: '서랍장',
  frame: '가훈 액자',
  radio: '라디오',
  'door-anbang': '안방 문',
  'door-heotgan': '마당 문',
};

const overlayStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(10,6,2,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 80,
  },
  card: {
    backgroundColor: '#2e1f10',
    border: '1px solid rgba(232,211,168,0.3)',
    borderRadius: '12px',
    padding: '28px 32px',
    maxWidth: '380px',
    width: '90%',
    position: 'relative',
    color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '14px',
    background: 'none',
    border: 'none',
    color: '#e8d3a8',
    fontSize: '1.1rem',
    cursor: 'pointer',
    opacity: 0.7,
    padding: '4px',
  },
  title: {
    fontSize: '1.2rem',
    marginBottom: '16px',
    fontWeight: 600,
    textAlign: 'center',
  },
  calGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    fontSize: '0.85rem',
  },
  calHeader: {
    textAlign: 'center',
    fontWeight: 700,
    padding: '4px',
    color: 'rgba(232,211,168,0.6)',
    fontSize: '0.75rem',
  },
  calDay: {
    textAlign: 'center',
    padding: '4px',
    borderRadius: '50%',
    cursor: 'default',
  },
  calDayCircled: {
    border: '2px solid #d04040',
    color: '#d04040',
    fontWeight: 700,
  },
  memo: {
    marginTop: '16px',
    padding: '10px 14px',
    backgroundColor: '#fffacd',
    color: '#664400',
    borderRadius: '6px',
    fontSize: '0.9rem',
  },
};
