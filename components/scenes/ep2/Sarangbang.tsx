'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { canAttemptWith } from '../../../lib/gameState';
import { playSfx, playBgm } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';
import Keypad from '../../Keypad';
import JamoLock from '../../puzzles/JamoLock';
import PhotoAssembly from '../../puzzles/PhotoAssembly';
import TapLabel from '../../TapLabel';
import { useTwoTap } from '../../../lib/useTwoTap';
import { eraTint, handleWatchUse } from './era';
import RoomNav from '../../RoomNav';

export default function Sarangbang() {
  const { state, dispatch, episode } = useGame();
  const { solved, wrongAttempts, era, inventory } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [screenOpen, setScreenOpen] = useState(false);
  const [bookchestOpen, setBookchestOpen] = useState(false);
  const [jamoOpen, setJamoOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [keypadConfig, setKeypadConfig] = useState<{
    title: string; length: number; puzzleId: string;
  } | null>(null);
  const [shake, setShake] = useState(false);
  const [flashback, setFlashback] = useState(false);
  const [flashbackLine, setFlashbackLine] = useState(0);
  const navGuard = useRef(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (navTimer.current !== null) clearTimeout(navTimer.current);
    if (flashbackTimer.current !== null) clearTimeout(flashbackTimer.current);
    if (shakeTimer.current !== null) clearTimeout(shakeTimer.current);
  }, []);

  const prevWrongAttempts = useRef(wrongAttempts);
  const prevDrawerSolved = useRef(solved.includes('ep2-drawer'));

  function canAttempt(puzzleId: string) {
    return canAttemptWith(episode, state, puzzleId);
  }

  useEffect(() => {
    playBgm(era === 'past' ? 'ep2-past' : 'ep2-present');
  }, [era]);

  useEffect(() => {
    if (wrongAttempts > prevWrongAttempts.current) {
      setShake(true);
      shakeTimer.current = setTimeout(() => setShake(false), 600);
    }
    prevWrongAttempts.current = wrongAttempts;
  }, [wrongAttempts]);

  // ── 회상 씬: ep2-drawer 최초 해결 시 ──
  useEffect(() => {
    const nowSolved = solved.includes('ep2-drawer');
    if (nowSolved && !prevDrawerSolved.current) {
      setFlashback(true);
      setFlashbackLine(0);
    }
    prevDrawerSolved.current = nowSolved;
  }, [solved]);

  useEffect(() => {
    if (!flashback) return;
    if (flashbackLine >= FLASHBACK_LINES.length - 1) return;
    flashbackTimer.current = setTimeout(() => {
      setFlashbackLine((n) => n + 1);
    }, 2200);
    return () => {
      if (flashbackTimer.current !== null) clearTimeout(flashbackTimer.current);
    };
  }, [flashback, flashbackLine]);

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

  // ── 병풍 ──
  function handleScreen() {
    if (handleWatchUse(state, dispatch)) return;
    setScreenOpen(true);
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
      setKeypadConfig({ title: '네 자리 다이얼 — 무엇의 순서일까', length: 4, puzzleId: 'ep2-drawer' });
    } else {
      say('다이얼 자물쇠. 네 자리… 무엇의 순서일까?');
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
      say('액자 뒤 — 빈 봉투뿐이다. 소인은 8월 14일. 누군가 먼저 꺼내 갔다.');
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

  // ── 문갑 + 책 3권 ──
  function handleBookchest() {
    if (handleWatchUse(state, dispatch)) return;
    if (era === 'present') {
      say('빈 문갑. 책은 이제 여기 없다.');
      return;
    }
    if (solved.includes('ep2-bookchest')) {
      say('열린 문갑. 안은 비어 있다.');
      return;
    }
    setBookchestOpen(true);
  }

  function handleJamoSubmit(answer: string) {
    setJamoOpen(false);
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-bookchest', answer });
    setTimeout(() => {
      if (answer === 'ㅅ-ㅂ-ㄷ') {
        setBookchestOpen(false);
        say('문갑이 열렸다 — 벽보 스크랩, 족보, 그리고 찢긴 사진 한 조각.');
      } else {
        say('철컥 — 자물쇠가 열리지 않는다.');
      }
    }, 50);
  }

  // ── 서탁(사진 조립) ──
  function handleDesk() {
    if (handleWatchUse(state, dispatch)) return;
    if (era === 'past') {
      say('서탁 위, 벼루와 붓이 놓여 있다.');
      return;
    }
    if (solved.includes('ep2-photo')) {
      say('서탁 위, 완성된 가족사진이 놓여 있다.');
      return;
    }
    if (canAttempt('ep2-photo')) {
      setPhotoOpen(true);
    } else {
      const owned = ['photo-1', 'photo-2', 'photo-3', 'photo-4'].filter((id) =>
        inventory.includes(id),
      ).length;
      say(`조각이 더 있을 것이다. (보유 ${owned}/4)`);
    }
  }

  function handlePhotoSubmit(answer: string) {
    setPhotoOpen(false);
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-photo', answer });
  }

  // ── Keypad submit ──
  function handleKeypadSubmit(answer: string) {
    if (!keypadConfig) return;
    const { puzzleId } = keypadConfig;
    dispatch({ type: 'ATTEMPT', puzzleId, answer });
    setKeypadConfig(null);
    setTimeout(() => {
      if (puzzleId === 'ep2-drawer' && answer === '5372') {
        say('서랍 깊숙이, 부치지 못한 편지가 잠들어 있었다.');
      }
      if (puzzleId === 'ep2-radio' && answer === '711') {
        say('지지직… "어젯밤 저수지에서 스물한 살 청년이… 유족으로는 부모와 남동생이…" 라디오 옆에 성냥갑이 놓여 있다.');
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

  function closeFlashback() {
    if (flashbackTimer.current !== null) clearTimeout(flashbackTimer.current);
    setFlashback(false);
  }

  const calendarSolved = solved.includes('ep2-calendar');
  const drawerSolved = solved.includes('ep2-drawer');
  const frameSolved = solved.includes('ep2-frame');
  const radioSolved = solved.includes('ep2-radio');
  const bookchestSolved = solved.includes('ep2-bookchest');
  const photoSolved = solved.includes('ep2-photo');
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
          <rect x="690" y="40" width="90" height="70" rx="2" fill={isPast ? '#f7ecd0' : '#7d7468'} stroke="#7a6040" strokeWidth="2" />
          <line x1="735" y1="40" x2="735" y2="110" stroke="#7a6040" strokeWidth="2" />
          <line x1="690" y1="75" x2="780" y2="75" stroke="#7a6040" strokeWidth="2" />
          {isPast && <rect x="692" y="42" width="86" height="66" fill="#ffe9a8" opacity="0.35" />}
        </g>

        {/* 벽 몰딩 */}
        <line x1="0" y1="30" x2="800" y2="30" stroke={isPast ? '#c8a878' : '#7d7468'} strokeWidth="3" opacity="0.6" />

        {/* 방석 (바닥 장식) */}
        <ellipse cx="500" cy="345" rx="42" ry="12" fill={isPast ? '#b06060' : '#6e5450'} opacity={isPast ? 0.9 : 0.5} />
        <ellipse cx="500" cy="342" rx="42" ry="12" fill={isPast ? '#c87878' : '#7d5f5a'} opacity={isPast ? 0.9 : 0.5} />

        {/* Present-only dust/cobweb decoration */}
        {!isPast && (
          <>
            <path d="M20,10 Q40,30 20,50 Q0,30 20,10" fill="none" stroke="#ccc" strokeWidth="0.7" opacity="0.4" />
            <path d="M760,20 Q780,40 760,60" fill="none" stroke="#ccc" strokeWidth="0.7" opacity="0.4" />
            <circle cx="400" cy="380" r="1.5" fill="#ddd" opacity="0.5" />
            <circle cx="450" cy="390" r="1" fill="#ddd" opacity="0.4" />
          </>
        )}

        {/* ── 병풍 4폭 (뒷벽) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('screen', handleScreen); }}
          role="button"
          aria-label="병풍"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleScreen()}
        >
          <ScreenPanels x={30} y={40} panelW={62} panelH={150} tone={isPast ? 'light' : 'dark'} />
        </g>

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
          <rect x="290" y="50" width="90" height="110" rx="3" fill={isPast ? '#f5f0e0' : '#c8c0b0'} stroke="#7a6040" strokeWidth="1.5" />
          <rect x="290" y="50" width="90" height="24" rx="3" fill={isPast ? '#d04040' : '#9a8a78'} />
          {isPast && (
            <>
              <text x="335" y="67" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">1978.8</text>
              <circle cx="313" cy="120" r="7" fill="none" stroke="#d04040" strokeWidth="1.3" />
              <text x="313" y="123" textAnchor="middle" fontSize="7" fill="#333">14</text>
              <circle cx="335" cy="120" r="4" fill="#333" />
              <text x="335" y="132" textAnchor="middle" fontSize="6" fill="#333">15</text>
              <text x="357" y="123" textAnchor="middle" fontSize="8" fill="#333" fontWeight="700">×</text>
              <text x="357" y="132" textAnchor="middle" fontSize="6" fill="#333">18</text>
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
          <rect x="410" y="200" width="120" height="90" rx="3" fill={isPast ? '#8b5e3c' : '#5e4a38'} stroke="#3a2810" strokeWidth="1.5" />
          <rect x="420" y="210" width="100" height="24" rx="2" fill={isPast ? '#a07850' : '#4a3a2c'}
            transform={drawerSolved ? 'translate(0, 6)' : undefined} />
          <rect x="420" y="240" width="100" height="24" rx="2" fill={isPast ? '#a07850' : '#4a3a2c'} />
          <rect x="420" y="270" width="100" height="14" rx="2" fill={isPast ? '#a07850' : '#4a3a2c'} />
          {!isPast && (
            <circle cx="470" cy="222" r="5" fill="#c8a050" stroke="#a07030" strokeWidth="1" />
          )}
        </g>

        {/* ── 가훈 액자 ── */}
        {/* 기울기는 바깥 그룹(SVG transform), 호버 리프트는 안쪽 그룹(CSS) —
            CSS transform이 SVG transform 속성을 덮어써 기울기가 풀리는 것 방지 */}
        <g transform={!isPast && !frameSolved ? 'rotate(-8 615 90)' : undefined}>
          <g
            className="hotspot-lift"
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); guard('frame', handleFrame); }}
            role="button"
            aria-label="가훈 액자"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleFrame()}
          >
            <rect x="575" y="60" width="80" height="60" rx="2" fill="#5a3810" stroke="#3a2408" strokeWidth="2" />
            <rect x="583" y="68" width="64" height="44" rx="1" fill="#f0e4c8" />
            <text x="615" y="96" textAnchor="middle" fontSize="14" fill="#3a2810" fontWeight="700">兄友弟恭</text>
          </g>
        </g>

        {/* ── 문갑 + 책 3권 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('bookchest', handleBookchest); }}
          role="button"
          aria-label="문갑"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleBookchest()}
        >
          <rect x="60" y="230" width="130" height="60" rx="2" fill={isPast ? '#7a5030' : '#5a4632'} stroke="#3a2810" strokeWidth="1.5" />
          {isPast && !bookchestSolved && (
            <>
              {/* 책 3권 세움 */}
              <rect x="70" y="188" width="20" height="42" fill="#7a3838" stroke="#3a1818" strokeWidth="1" />
              <text x="80" y="202" textAnchor="middle" fontSize="7" fill="#f0e0c0">Ⅰ</text>
              <text x="80" y="214" textAnchor="middle" fontSize="5.5" fill="#f0e0c0">샘터</text>

              <rect x="94" y="188" width="20" height="42" fill="#385878" stroke="#182838" strokeWidth="1" />
              <text x="104" y="202" textAnchor="middle" fontSize="7" fill="#f0e0c0">Ⅱ</text>
              <text x="104" y="214" textAnchor="middle" fontSize="5" fill="#f0e0c0">바다와 노인</text>

              <rect x="118" y="188" width="20" height="42" fill="#386838" stroke="#183818" strokeWidth="1" />
              <text x="128" y="202" textAnchor="middle" fontSize="7" fill="#f0e0c0">Ⅲ</text>
              <text x="128" y="214" textAnchor="middle" fontSize="5" fill="#f0e0c0">들꽃 도감</text>
            </>
          )}
          {isPast && bookchestSolved && (
            <text x="125" y="215" textAnchor="middle" fontSize="7" fill="#c8b890">빈 자리 — 책은 옮겨졌다</text>
          )}
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
          <rect x="670" y="200" width="90" height="60" rx="4" fill="#4a3a28" stroke="#2a1c10" strokeWidth="1.5" />
          <circle cx="695" cy="230" r="12" fill="#222" stroke="#555" strokeWidth="1" />
          <rect x="716" y="220" width="34" height="6" rx="2" fill={radioSolved && isPast ? '#ffd24a' : '#333'} />
          {radioSolved && isPast && <circle cx="695" cy="230" r="4" fill="#ffd24a" opacity="0.8" />}
        </g>

        {/* ── 서탁(사진 조립 진입점) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('desk', handleDesk); }}
          role="button"
          aria-label="서탁"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleDesk()}
        >
          <rect x="230" y="250" width="110" height="40" rx="2" fill={isPast ? '#8b5e3c' : '#5e4a38'} stroke="#3a2810" strokeWidth="1.5" />
          {!isPast && photoSolved && (
            <>
              <rect x="255" y="228" width="60" height="44" rx="2" fill="#e8dcc0" stroke="#8a6838" strokeWidth="1.5" />
              <rect x="261" y="234" width="48" height="32" fill="#3a3228" />
            </>
          )}
          {!isPast && !photoSolved && (
            <text x="285" y="245" textAnchor="middle" fontSize="7" fill="#c8b890">빈 서탁</text>
          )}
        </g>

        {/* 문 (장식 — 이동은 하단 RoomNav 버튼) */}
        <g aria-hidden="true">
          <rect x="730" y="290" width="60" height="10" rx="2" fill={isPast ? '#7a5030' : '#5a4632'} stroke="#3a2810" strokeWidth="1" opacity="0.5" />
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

      {/* ── 병풍 확대 오버레이 ── */}
      {screenOpen && (
        <div style={overlayStyles.overlay} onClick={() => setScreenOpen(false)}>
          <div style={{ ...overlayStyles.card, maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <button style={overlayStyles.closeBtn} onClick={() => setScreenOpen(false)} aria-label="닫기">✕</button>
            <h2 style={overlayStyles.title}>네 폭 병풍</h2>
            <svg viewBox="0 0 480 260" width="100%" style={{ display: 'block' }} aria-label="병풍 확대">
              <ScreenPanels x={0} y={0} panelW={120} panelH={240} tone="light" />
            </svg>
            <div style={overlayStyles.memo}>네 폭 병풍 — 계절이 뒤섞여 세워져 있다.</div>
          </div>
        </div>
      )}

      {/* ── 문갑 자물쇠 오버레이(책등 확대 + 자물쇠 열기) ── */}
      {bookchestOpen && !bookchestSolved && (
        <div style={overlayStyles.overlay} onClick={() => setBookchestOpen(false)}>
          <div style={overlayStyles.card} onClick={(e) => e.stopPropagation()}>
            <button style={overlayStyles.closeBtn} onClick={() => setBookchestOpen(false)} aria-label="닫기">✕</button>
            <h2 style={overlayStyles.title}>책상 위 책 세 권</h2>
            <div style={overlayStyles.bookRow}>
              <div style={{ ...overlayStyles.bookSpine, backgroundColor: '#7a3838' }}>
                <span style={overlayStyles.bookNum}>Ⅰ</span>
                <span style={overlayStyles.bookTitle}>샘터</span>
              </div>
              <div style={{ ...overlayStyles.bookSpine, backgroundColor: '#385878' }}>
                <span style={overlayStyles.bookNum}>Ⅱ</span>
                <span style={overlayStyles.bookTitle}>바다와 노인</span>
              </div>
              <div style={{ ...overlayStyles.bookSpine, backgroundColor: '#386838' }}>
                <span style={overlayStyles.bookNum}>Ⅲ</span>
                <span style={overlayStyles.bookTitle}>들꽃 도감</span>
              </div>
            </div>
            <div style={overlayStyles.memo}>번호 순서대로 각 제목의 첫 글자 — 자물쇠는 세 칸이다.</div>
            <button
              style={{ ...overlayStyles.confirmBtn, marginTop: '16px' }}
              onClick={() => setJamoOpen(true)}
            >
              자물쇠 열기
            </button>
          </div>
        </div>
      )}

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
                const isCircle = day === 14;
                const isDot = day === 15;
                const isX = day === 18;
                return (
                  <div
                    key={day}
                    style={{
                      ...overlayStyles.calDay,
                      ...(isCircle ? overlayStyles.calDayCircled : {}),
                    }}
                  >
                    {day}
                    {isDot && <span style={overlayStyles.calDot}>●</span>}
                    {isX && <span style={overlayStyles.calX}>×</span>}
                  </div>
                );
              })}
            </div>
            <div style={overlayStyles.memo}>표식이 세 개 — 무슨 뜻일까.</div>
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

      <JamoLock
        open={jamoOpen}
        title="문갑 자물쇠 — 세 칸"
        length={3}
        onSubmit={handleJamoSubmit}
        onClose={() => setJamoOpen(false)}
      />

      <PhotoAssembly
        open={photoOpen}
        onSubmit={handlePhotoSubmit}
        onClose={() => setPhotoOpen(false)}
      />

      {/* ── 회상 씬 ── */}
      {flashback && (
        <div style={overlayStyles.flashbackOverlay}>
          <div style={overlayStyles.flashbackText}>
            {FLASHBACK_LINES.slice(0, flashbackLine + 1).map((line, i) => (
              <p
                key={i}
                style={{
                  ...overlayStyles.flashbackLine,
                  opacity: i === flashbackLine ? 1 : 0.55,
                }}
              >
                {line}
              </p>
            ))}
          </div>
          {flashbackLine >= FLASHBACK_LINES.length - 1 && (
            <button style={overlayStyles.confirmBtn} onClick={closeFlashback}>
              계속하기
            </button>
          )}
        </div>
      )}

      <TapLabel name={ARMED_NAMES[armedId ?? ''] ?? null} />

      <Narration text={narration} onDone={() => setNarration(null)} />
    </div>
  );
}

const FLASHBACK_LINES = [
  '1978년 8월 14일 밤.',
  '형은 등잔 아래에서 편지를 썼다. 부치지 못할 편지를.',
  '"제가 그 아이를 막겠습니다."',
];

/** 병풍 4폭 — 계절이 뒤섞인 순서(국화-매화-학-물결)로 배치.
 *  각 폭의 사물 개수는 실제로 셀 수 있게 그린다(라벨 없음): 국화 7, 매화 5, 학 2, 물결 3. */
function ScreenPanels({
  x, y, panelW, panelH, tone,
}: {
  x: number; y: number; panelW: number; panelH: number; tone: 'light' | 'dark';
}) {
  const bg = tone === 'light' ? '#e0d0a8' : '#5a5248';
  const border = tone === 'light' ? '#8a6838' : '#3a352c';
  const panels: Array<'mum' | 'plum' | 'crane' | 'wave'> = ['mum', 'plum', 'crane', 'wave'];

  return (
    <g>
      {panels.map((kind, i) => {
        const px = x + i * panelW;
        return (
          <g key={kind}>
            <rect x={px} y={y} width={panelW - 4} height={panelH} fill={bg} stroke={border} strokeWidth="2" />
            <PanelArt kind={kind} px={px} py={y} w={panelW - 4} h={panelH} tone={tone} />
          </g>
        );
      })}
    </g>
  );
}

function PanelArt({
  kind, px, py, w, h, tone,
}: {
  kind: 'mum' | 'plum' | 'crane' | 'wave'; px: number; py: number; w: number; h: number; tone: 'light' | 'dark';
}) {
  const fade = tone === 'dark' ? 0.55 : 0.9;
  const cx = px + w / 2;

  if (kind === 'plum') {
    // 매화 5송이 (분홍, 5꽃잎) + 모서리 심볼: 눈송이 1개(꽃샘추위)
    const flowers = [
      { x: cx - 12, y: py + 30 },
      { x: cx + 10, y: py + 55 },
      { x: cx - 6, y: py + 85 },
      { x: cx + 14, y: py + 110 },
      { x: cx - 14, y: py + 135 },
    ];
    return (
      <g opacity={fade}>
        <line x1={cx} y1={py + 20} x2={cx} y2={py + h - 20} stroke="#5a4030" strokeWidth="2" />
        {flowers.map((f, i) => <Blossom key={i} cx={f.x} cy={f.y} />)}
        <Snowflake cx={px + 14} cy={py + 14} />
      </g>
    );
  }
  if (kind === 'wave') {
    // 물결 3겹 띠 + 모서리 심볼: 해 1개(여름)
    return (
      <g opacity={fade}>
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M${px + 8},${py + 60 + i * 40} Q${cx - 15},${py + 45 + i * 40} ${cx},${py + 60 + i * 40} Q${cx + 15},${py + 75 + i * 40} ${px + w - 8},${py + 60 + i * 40}`}
            fill="none"
            stroke="#3868a0"
            strokeWidth="3"
          />
        ))}
        <circle cx={px + w - 16} cy={py + 16} r="7" fill="#e8a838" />
      </g>
    );
  }
  if (kind === 'mum') {
    // 국화 7송이(노랑, 작지만 셀 수 있게 3x3 격자 배치 - 7개만) + 모서리 심볼: 낙엽(가을)
    const positions = [
      { x: cx - 16, y: py + 30 }, { x: cx + 14, y: py + 32 },
      { x: cx - 20, y: py + 62 }, { x: cx, y: py + 64 }, { x: cx + 18, y: py + 60 },
      { x: cx - 10, y: py + 96 }, { x: cx + 12, y: py + 98 },
    ];
    return (
      <g opacity={fade}>
        {positions.map((p, i) => <MumFlower key={i} cx={p.x} cy={p.y} />)}
        <path d={`M${px + 12},${py + 12} L${px + 20},${py + 20} L${px + 12},${py + 22} Z`} fill="#b06838" />
      </g>
    );
  }
  // crane: 학 2마리(흰 새 실루엣) + 모서리 심볼: 눈송이들(겨울)
  return (
    <g opacity={fade}>
      <CraneBird cx={cx - 10} cy={py + 70} />
      <CraneBird cx={cx + 14} cy={py + 110} />
      <Snowflake cx={px + 14} cy={py + 14} />
      <Snowflake cx={px + w - 16} cy={py + 24} />
    </g>
  );
}

function Blossom({ cx, cy }: { cx: number; cy: number }) {
  const petals = Array.from({ length: 5 }).map((_, i) => {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const dx = Math.cos(angle) * 5;
    const dy = Math.sin(angle) * 5;
    return <circle key={i} cx={cx + dx} cy={cy + dy} r="4" fill="#e08ca0" stroke="#a05068" strokeWidth="0.5" />;
  });
  return (
    <g>
      {petals}
      <circle cx={cx} cy={cy} r="2" fill="#f0d040" />
    </g>
  );
}

function MumFlower({ cx, cy }: { cx: number; cy: number }) {
  const petals = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const dx = Math.cos(angle) * 4;
    const dy = Math.sin(angle) * 4;
    return <circle key={i} cx={cx + dx} cy={cy + dy} r="2.4" fill="#e8c840" />;
  });
  return (
    <g>
      {petals}
      <circle cx={cx} cy={cy} r="2" fill="#a07820" />
    </g>
  );
}

function CraneBird({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g fill="#f5f0e0" stroke="#888" strokeWidth="0.5">
      <ellipse cx={cx} cy={cy} rx="14" ry="6" />
      <path d={`M${cx - 12},${cy - 2} L${cx - 24},${cy - 14}`} strokeWidth="1.5" />
      <path d={`M${cx + 12},${cy + 2} L${cx + 10},${cy + 20}`} strokeWidth="1.5" />
      <path d={`M${cx + 10},${cy + 20} L${cx + 8},${cy + 20}`} strokeWidth="1.5" />
    </g>
  );
}

function Snowflake({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g stroke="#bcd8e8" strokeWidth="1">
      <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy} />
      <line x1={cx} y1={cy - 5} x2={cx} y2={cy + 5} />
      <line x1={cx - 3.5} y1={cy - 3.5} x2={cx + 3.5} y2={cy + 3.5} />
      <line x1={cx - 3.5} y1={cy + 3.5} x2={cx + 3.5} y2={cy - 3.5} />
    </g>
  );
}

const ARMED_NAMES: Record<string, string> = {
  screen: '병풍',
  calendar: '달력',
  drawer: '서랍장',
  frame: '가훈 액자',
  bookchest: '문갑',
  radio: '라디오',
  desk: '서탁',
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
    padding: '16px',
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
    position: 'relative',
  },
  calDayCircled: {
    border: '2px solid #d04040',
    color: '#d04040',
    fontWeight: 700,
  },
  calDot: {
    display: 'block',
    fontSize: '0.55rem',
    color: '#3a2810',
    lineHeight: 1,
  },
  calX: {
    display: 'block',
    fontSize: '0.6rem',
    color: '#a03030',
    fontWeight: 700,
    lineHeight: 1,
  },
  memo: {
    marginTop: '16px',
    padding: '10px 14px',
    backgroundColor: '#fffacd',
    color: '#664400',
    borderRadius: '6px',
    fontSize: '0.9rem',
  },
  bookRow: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  bookSpine: {
    width: '54px',
    height: '140px',
    borderRadius: '3px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '10px',
    gap: '10px',
    border: '1px solid rgba(0,0,0,0.3)',
  },
  bookNum: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#f0e0c0',
  },
  bookTitle: {
    writingMode: 'vertical-rl',
    fontSize: '0.85rem',
    color: '#f0e0c0',
    fontWeight: 600,
  },
  confirmBtn: {
    padding: '12px 20px',
    fontSize: '1rem',
    fontWeight: 600,
    backgroundColor: '#7a4f1e',
    color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.4)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  flashbackOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.92)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '28px',
    zIndex: 90,
    padding: '24px',
  },
  flashbackText: {
    maxWidth: '480px',
    textAlign: 'center',
  },
  flashbackLine: {
    color: '#e8d3a8',
    fontSize: '1.1rem',
    lineHeight: 1.8,
    transition: 'opacity 0.6s ease',
  },
};
