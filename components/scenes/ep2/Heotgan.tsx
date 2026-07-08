'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { canAttemptWith } from '../../../lib/gameState';
import { playSfx, playBgm } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';
import TapLabel from '../../TapLabel';
import Keypad from '../../Keypad';
import HandwritingPicker from '../../puzzles/HandwritingPicker';
import { useTwoTap } from '../../../lib/useTwoTap';
import { useShake } from '../../../lib/useShake';
import { eraTint, handleWatchUse } from './era';
import RoomNav from '../../RoomNav';
import { EP2_ITEMS, EP2_NIGHT_GATE } from '../../../lib/puzzles-ep2';

// 밤 이벤트 게이트 — 정의는 lib/puzzles-ep2.ts(EP2_NIGHT_GATE)로 일원화.
// START resume의 방 게이트(roomGates)와 같은 목록을 공유한다.
export const NIGHT_GATE_PUZZLES = EP2_NIGHT_GATE;

const FLASHBACK_LINES = [
  '1978년 8월 15일 초저녁.',
  '영호는 담을 넘었다. 낚싯대 하나와 양동이를 챙겨서.',
  '형의 서랍 속 편지는, 아직 부쳐지지 않았다.',
];

export default function Heotgan() {
  const { state, dispatch, episode } = useGame();
  const { solved, wrongAttempts, era, selectedItem } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const shake = useShake(wrongAttempts);
  const [nightEvent, setNightEvent] = useState(false);
  const [toolboxKeypadOpen, setToolboxKeypadOpen] = useState(false);
  const [handwritingOpen, setHandwritingOpen] = useState(false);
  const [handwritingWrong, setHandwritingWrong] = useState(0);
  const [flashback, setFlashback] = useState(false);
  const [flashbackLine, setFlashbackLine] = useState(0);
  const nightTriggered = useRef(false);
  const navGuard = useRef(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevHandwritingSolved = useRef(solved.includes('ep2-handwriting'));

  useEffect(() => () => {
    if (navTimer.current !== null) clearTimeout(navTimer.current);
    if (flashbackTimer.current !== null) clearTimeout(flashbackTimer.current);
  }, []);

  function canAttempt(puzzleId: string) {
    return canAttemptWith(episode, state, puzzleId);
  }

  useEffect(() => {
    if (!nightEvent) {
      playBgm(era === 'past' ? 'ep2-past' : 'ep2-present');
    }
  }, [era, nightEvent]);

  // ── 밤 이벤트 조건 감시 (R1) ──
  useEffect(() => {
    if (nightTriggered.current) return;
    const allDone = NIGHT_GATE_PUZZLES.every((id) => solved.includes(id));
    if (allDone && era === 'past') {
      nightTriggered.current = true;
      setNightEvent(true);
      playBgm('ep2-night');
      say('…담장 너머, 낚싯대를 둘러멘 작은 그림자가 밤길을 내려간다.');
    }
  }, [solved, era]);

  // ── 회상 씬: ep2-handwriting 최초 해결 시 ──
  useEffect(() => {
    const nowSolved = solved.includes('ep2-handwriting');
    if (nowSolved && !prevHandwritingSolved.current) {
      setFlashback(true);
      setFlashbackLine(0);
    }
    prevHandwritingSolved.current = nowSolved;
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

  function closeFlashback() {
    if (flashbackTimer.current !== null) clearTimeout(flashbackTimer.current);
    setFlashback(false);
  }

  function say(text: string) {
    setNarration(text);
  }

  function handleBackgroundClick() {
    if (nightEvent) return;
    handleWatchUse(state, dispatch);
  }

  // ── 헛간 문 ──
  function handleShedDoor() {
    if (nightEvent) return;
    if (handleWatchUse(state, dispatch)) return;
    if (solved.includes('ep2-shed-door')) {
      say(era === 'past' ? '열린 헛간 문. 안이 보인다.' : '반쯤 무너진 헛간 문.');
      return;
    }
    if (era === 'present') {
      say('문이 무너져 반쯤 열려 있다. 안이 들여다보인다.');
      return;
    }
    if (selectedItem === 'brass-key' && canAttempt('ep2-shed-door')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-shed-door', answer: '' });
      playSfx('door');
      say('놋쇠 열쇠가 맞았다. 헛간 문이 열렸다.');
    } else {
      say('굵은 맹꽁이 자물쇠. 열쇠가 필요하다.');
    }
  }

  // ── 도구 걸이 ──
  function handleToolwall() {
    if (nightEvent) return;
    if (handleWatchUse(state, dispatch)) return;
    if (solved.includes('ep2-toolwall')) {
      say('빈 자리 두 곳 — 그날 밤 가져간 것들.');
      return;
    }
    if (canAttempt('ep2-toolwall')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-toolwall', answer: '' });
      fx.correctPulse();
      say('윤곽선과 견줘 보면… 낚싯대 하나와 양동이만 없다. 그리고 벽 틈 — 조서 사본과 사진 조각이 숨겨져 있었다.');
    } else {
      say('벽에 도구 윤곽선이 그려져 있다.');
    }
  }

  // ── 도구함 (도형 자물쇠) ──
  function handleToolbox() {
    if (nightEvent) return;
    if (handleWatchUse(state, dispatch)) return;
    if (solved.includes('ep2-toolbox')) {
      say('빈 도구함이다.');
      return;
    }
    if (canAttempt('ep2-toolbox')) {
      setToolboxKeypadOpen(true);
    } else {
      say('녹슨 도구함. 뚜껑에 페인트로 그린 도형 세 개가 있다.');
    }
  }

  function handleToolboxSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-toolbox', answer });
    setToolboxKeypadOpen(false);
    if (answer === '345') {
      fx.correctPulse();
      say('부서진 경첩 사이 — 서명 없는 쪽지가 나왔다.');
    }
  }

  // ── 필적 감정 (작업대) ──
  function handleHandwriting() {
    if (nightEvent) return;
    if (handleWatchUse(state, dispatch)) return;
    if (solved.includes('ep2-handwriting')) {
      say('흘려 쓴 획, 급한 기울기 — 영호의 글씨다. 그날 밤 저수지로 간 것은 영호였다.');
      return;
    }
    if (canAttempt('ep2-handwriting')) {
      setHandwritingOpen(true);
    } else {
      say('작업대 — 글씨를 대조하려면 표본이 더 필요하다. (쪽지·편지·낙서)');
    }
  }

  function handleHandwritingSubmit(answer: 'youngsu' | 'youngho') {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-handwriting', answer });
    if (answer === 'youngho') {
      setHandwritingOpen(false);
      fx.correctPulse();
      say('흘려 쓴 획, 급한 기울기 — 영호의 글씨다. 그날 밤 저수지로 간 것은 영호였다.');
    } else {
      setHandwritingWrong((n) => n + 1);
    }
  }

  // ── 작업대(회중시계 뚜껑 + 필적 감정) ──
  function handleWorkbench() {
    if (nightEvent) return;
    if (handleWatchUse(state, dispatch)) return;
    if (selectedItem === 'oil-bottle' && !solved.includes('ep2-watch-lid') && canAttempt('ep2-watch-lid')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-watch-lid', answer: '' });
      fx.correctPulse();
      say('경첩에 기름을 치자 뚜껑이 열렸다. 물때… 11시 40분… 안쪽에 새겨진 글씨: "아우와 함께 — 아버지가".');
      return;
    }
    handleHandwriting();
  }

  // ── 랜턴 ──
  function handleLantern() {
    if (nightEvent) return;
    if (handleWatchUse(state, dispatch)) return;
    if (solved.includes('ep2-lantern')) {
      say('따뜻하게 타오르는 랜턴.');
      return;
    }
    if (selectedItem === 'oil-bottle' && canAttempt('ep2-lantern')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-lantern', answer: '' });
      playSfx('pickup');
      say('기름을 채우고 성냥을 그었다. 랜턴이 따뜻하게 타오른다.');
    } else if (selectedItem !== 'oil-bottle') {
      say('기름 없는 낡은 랜턴. 성냥은 있지만 태울 것이 없다.');
    } else {
      say('심지가 말라 있다. 기름과 불씨가 다 필요하다.');
    }
  }

  // ── 밤 이벤트: 따라간다 ──
  function handleFollow() {
    fx.roomTransition();
    playSfx('door');
    navTimer.current = setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room: 'reservoir' });
    }, 600);
  }

  // ── 문 ──
  function goRoom(room: 'sarangbang' | 'anbang') {
    if (navGuard.current) return;
    navGuard.current = true;
    fx.roomTransition();
    playSfx('door');
    navTimer.current = setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room });
      navGuard.current = false;
    }, 600);
  }

  const isPast = era === 'past';
  const shedDoorSolved = solved.includes('ep2-shed-door');
  const toolwallSolved = solved.includes('ep2-toolwall');
  const watchLidSolved = solved.includes('ep2-watch-lid');
  const lanternSolved = solved.includes('ep2-lantern');

  // 헛간 내부 표시 조건: 과거는 shed-door 해결 후, 현재는 항상(문이 무너져 열림)
  const interiorVisible = isPast ? shedDoorSolved : true;

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className={shake}
    >
      <svg
        viewBox="0 0 800 400"
        width="100%"
        style={{ display: 'block' }}
        aria-label="헛간과 마당 장면"
        onClick={handleBackgroundClick}
      >
        {/* Background: sky/yard */}
        <rect width="800" height="400" fill={nightEvent ? '#0e1a3a' : isPast ? '#bde0f0' : '#8f8378'} />
        {nightEvent && (
          <>
            <circle cx="680" cy="70" r="34" fill="#f0edd8" opacity="0.95" />
            <circle cx="120" cy="50" r="1.5" fill="#fff" opacity="0.8" />
            <circle cx="220" cy="90" r="1" fill="#fff" opacity="0.7" />
            <circle cx="380" cy="40" r="1.5" fill="#fff" opacity="0.8" />
            <circle cx="540" cy="30" r="1" fill="#fff" opacity="0.6" />
          </>
        )}

        {/* 해/구름 (과거 낮, 밤 이벤트 전) */}
        {isPast && !nightEvent && (
          <g aria-hidden="true">
            <circle cx="110" cy="65" r="30" fill="#ffd24a" opacity="0.85" />
            <ellipse cx="300" cy="60" rx="46" ry="14" fill="#ffffff" opacity="0.75" />
            <ellipse cx="335" cy="52" rx="30" ry="11" fill="#ffffff" opacity="0.7" />
            <ellipse cx="620" cy="95" rx="38" ry="12" fill="#ffffff" opacity="0.6" />
          </g>
        )}

        {/* Yard ground */}
        <rect x="0" y="300" width="800" height="100" fill={nightEvent ? '#1c2438' : isPast ? '#8ba85c' : '#6e675e'} />
        {/* 마당 디테일: 흙길, 풀 포기 */}
        <ellipse cx="400" cy="360" rx="220" ry="26" fill={nightEvent ? '#252c42' : isPast ? '#b0925c' : '#7a705f'} opacity="0.7" />
        {!nightEvent && [90, 180, 640, 730].map((x, i) => (
          <path key={`grass-${i}`} d={`M ${x} 316 q 3 -12 6 0 q 3 -10 6 0 q 3 -12 6 0`} fill="none"
            stroke={isPast ? '#6f8c44' : '#5a544c'} strokeWidth="2" strokeLinecap="round" />
        ))}

        {/* 담장 (뒤편, 장식) */}
        <g aria-hidden="true">
          <rect x="0" y="230" width="330" height="70" fill={nightEvent ? '#2a2438' : isPast ? '#c8b088' : '#7d7468'} stroke="#7a6040" strokeWidth="1.5" />
          <line x1="0" y1="252" x2="330" y2="252" stroke="#7a6040" strokeWidth="1" opacity="0.5" />
          <line x1="0" y1="276" x2="330" y2="276" stroke="#7a6040" strokeWidth="1" opacity="0.5" />
          {[55, 130, 205, 280].map((x) => (
            <line key={`fpost-${x}`} x1={x} y1="230" x2={x} y2="300" stroke="#7a6040" strokeWidth="1.5" opacity="0.5" />
          ))}
          {/* 기와 */}
          <rect x="-6" y="220" width="342" height="12" rx="4" fill={nightEvent ? '#1a1626' : '#5a4632'} />
        </g>

        {/* 나무 (장식) */}
        <g aria-hidden="true">
          <rect x="368" y="200" width="16" height="100" rx="4" fill={nightEvent ? '#241c30' : '#6a4a2a'} />
          <ellipse cx="376" cy="170" rx="52" ry="44" fill={nightEvent ? '#1c2438' : isPast ? '#7aa050' : '#6a6458'} />
          <ellipse cx="345" cy="195" rx="30" ry="24" fill={nightEvent ? '#202a44' : isPast ? '#86ac5c' : '#726c60'} />
        </g>

        {/* ── 헛간 건물 (문 주변 몸체 + 지붕) ── */}
        <g aria-hidden="true">
          <rect x="460" y="130" width="330" height="170" fill={nightEvent ? '#241e34' : isPast ? '#9a7648' : '#5e5448'} stroke="#3a2810" strokeWidth="2" />
          {/* 벽 판자 결 */}
          {[492, 660, 724].map((x) => (
            <line key={`shedplank-${x}`} x1={x} y1="132" x2={x} y2="298" stroke="#3a2810" strokeWidth="1" opacity="0.35" />
          ))}
          {/* 지붕 */}
          <polygon points="445,132 805,132 775,88 475,88" fill={nightEvent ? '#181426' : '#5a4632'} stroke="#3a2810" strokeWidth="2" />
          {/* 작은 창 */}
          <rect x="690" y="170" width="56" height="44" rx="2" fill={nightEvent ? '#101426' : isPast ? '#5a4632' : '#3f382f'} stroke="#3a2810" strokeWidth="1.5" />
          <line x1="718" y1="170" x2="718" y2="214" stroke="#3a2810" strokeWidth="1.5" />
        </g>

        {/* ── 헛간 문 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('shed-door', handleShedDoor); }}
          role="button"
          aria-label="헛간 문"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleShedDoor()}
        >
          <rect x="500" y="140" width="120" height="160" rx="2" fill={isPast ? '#7a5a34' : '#4a3c2c'} stroke="#3a2810" strokeWidth="2"
            transform={!isPast ? 'rotate(-10 560 300)' : undefined} />
          {isPast && !shedDoorSolved && (
            <>
              <circle cx="560" cy="220" r="10" fill="#333" stroke="#111" strokeWidth="1.5" />
              <rect x="552" y="212" width="16" height="10" rx="2" fill="#222" stroke="#111" strokeWidth="1" />
            </>
          )}
        </g>

        {/* ── 헛간 내부 (interiorVisible) ── */}
        {interiorVisible && (
          <g>
            {/* 내부 배경판 */}
            <rect x="500" y="140" width="120" height="160" fill={isPast ? '#5a4530' : '#3a3228'} opacity="0.5" />

            {/* 도구 걸이 벽 (과거만) */}
            {isPast && (
              <g
                className="hotspot"
                style={{ cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); guard('toolwall', handleToolwall); }}
                role="button"
                aria-label="도구 걸이"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleToolwall()}
              >
                <rect x="504" y="146" width="112" height="100" fill="#3a2c1c" opacity="0.75" />
                {/* 흰 윤곽선 5개 — 걸려 있어야 할 도구 자리 */}
                {/* 낫 윤곽 */}
                <path d="M 516 158 q 10 -8 16 2 M 524 160 l 0 26" fill="none" stroke="#e8e0c8" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />
                {/* 삽 윤곽 */}
                <path d="M 546 156 l 0 22 M 541 178 h 10 l -2 12 h -6 z" fill="none" stroke="#e8e0c8" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />
                {/* 낚싯대 윤곽 x2 */}
                <line x1="566" y1="152" x2="572" y2="238" stroke="#e8e0c8" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />
                <line x1="584" y1="152" x2="590" y2="238" stroke="#e8e0c8" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />
                {/* 양동이 윤곽 */}
                <path d="M 598 216 h 16 l -3 18 h -10 z M 598 216 q 8 -8 16 0" fill="none" stroke="#e8e0c8" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />
                {/* 실제 걸린 도구 3개 (낫, 삽, 낚싯대1) — 낚싯대2·양동이 자리만 빔 */}
                <path d="M 516 158 q 10 -8 16 2" fill="none" stroke="#9a9a80" strokeWidth="3" strokeLinecap="round" />
                <line x1="524" y1="160" x2="524" y2="186" stroke="#8a6838" strokeWidth="3" strokeLinecap="round" />
                <line x1="546" y1="156" x2="546" y2="178" stroke="#8a6838" strokeWidth="3" strokeLinecap="round" />
                <path d="M 541 178 h 10 l -2 12 h -6 z" fill="#9a9a80" stroke="#6a6a50" strokeWidth="1" />
                <line x1="566" y1="152" x2="572" y2="238" stroke="#8a6838" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="572" y1="238" x2="576" y2="228" stroke="#c8c8b0" strokeWidth="0.8" />
              </g>
            )}

            {/* 작업대 + 회중시계 */}
            <g
              className="hotspot"
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); guard('workbench', handleWorkbench); }}
              role="button"
              aria-label="작업대"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleWorkbench()}
            >
              <rect x="510" y="255" width="70" height="30" fill={isPast ? '#6a4c2c' : '#4a3c2c'} stroke="#2a1c10" strokeWidth="1.5" />
              <rect x="518" y="245" width="14" height="12" fill="#333" stroke="#111" strokeWidth="1" />
              {watchLidSolved && <circle cx="525" cy="251" r="3" fill="#ffd24a" opacity="0.8" />}
            </g>

            {/* 랜턴 선반 (과거만) */}
            {isPast && (
              <g
                className="hotspot"
                style={{ cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); guard('lantern', handleLantern); }}
                role="button"
                aria-label="랜턴"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleLantern()}
              >
                <rect x="590" y="220" width="24" height="6" fill="#4a3820" />
                <rect x="595" y="200" width="14" height="18" rx="2"
                  fill={lanternSolved ? '#ffd24a' : '#555'} stroke="#222" strokeWidth="1" />
                {lanternSolved && <circle cx="602" cy="209" r="8" fill="#ffd24a" opacity="0.5" />}
              </g>
            )}
          </g>
        )}

        {/* ── 도구함(현재) ── */}
        {!isPast && (
          <g
            className="hotspot"
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); guard('toolbox', handleToolbox); }}
            role="button"
            aria-label="도구함"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleToolbox()}
          >
            <rect x="200" y="320" width="70" height="45" rx="2" fill="#5a4432" stroke="#2a1c10" strokeWidth="1.5" />
            {!solved.includes('ep2-toolbox') ? (
              <>
                {/* 삼각형(3변) */}
                <polygon points="212,340 220,326 228,340" fill="none" stroke="#c85a3a" strokeWidth="2" />
                {/* 사각형(4변) */}
                <rect x="230" y="327" width="12" height="12" fill="none" stroke="#3a7ac8" strokeWidth="2" />
                {/* 정오각형(5변) */}
                <polygon points="256,326 262,331 260,338 252,338 250,331" fill="none" stroke="#4a9a5a" strokeWidth="2" />
              </>
            ) : (
              <rect x="230" y="315" width="10" height="8" fill="#8a2020" opacity="0.7" />
            )}
          </g>
        )}

      </svg>

      {!nightEvent && (
        <RoomNav
          targets={[
            { room: 'anbang', label: '안방', side: 'left' },
            { room: 'sarangbang', label: '사랑방', side: 'right' },
          ]}
          onGo={(room) => goRoom(room as 'sarangbang' | 'anbang')}
        />
      )}

      {/* Era 색조 오버레이 */}
      {!nightEvent && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundColor: eraTint(era) }} />
      )}

      {/* 밤 이벤트: 따라간다 버튼 */}
      {nightEvent && narration === null && (
        <button
          onClick={handleFollow}
          style={{
            position: 'absolute',
            bottom: '48px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 32px',
            fontSize: '1rem',
            fontWeight: 600,
            backgroundColor: 'rgba(255,210,74,0.9)',
            color: '#1a1410',
            border: 'none',
            borderRadius: '999px',
            cursor: 'pointer',
            boxShadow: '0 0 24px rgba(255,210,74,0.6)',
          }}
        >
          따라간다
        </button>
      )}

      <Keypad
        open={toolboxKeypadOpen}
        title="도구함 자물쇠 — 도형이 말하는 숫자"
        length={3}
        onSubmit={handleToolboxSubmit}
        onClose={() => setToolboxKeypadOpen(false)}
      />

      <HandwritingPicker
        open={handwritingOpen}
        question="이 쪽지는 누구의 글씨인가?"
        noteText={EP2_ITEMS['doc-note'].docPages![0]}
        samples={[
          { id: 'youngsu', label: '형의 편지 (윤영수)', text: '아버지께. 오늘 영호와 크게 다투었습니다…', style: 'neat' },
          { id: 'youngho', label: '기둥의 낙서 (浩)', text: '빨리 커서 형만큼 큰 놈 잡을 거다 — 浩', style: 'cursive' },
        ]}
        wrongSignal={handwritingWrong || undefined}
        onSubmit={handleHandwritingSubmit}
        onClose={() => setHandwritingOpen(false)}
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

const overlayStyles: Record<string, React.CSSProperties> = {
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
};

const ARMED_NAMES: Record<string, string> = {
  'shed-door': '헛간 문',
  toolwall: '도구 걸이',
  toolbox: '도구함',
  workbench: '작업대',
  lantern: '랜턴',
  'door-anbang': '안방 문',
};
