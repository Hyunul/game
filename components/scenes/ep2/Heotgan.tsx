'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { canAttemptWith } from '../../../lib/gameState';
import { playSfx, playBgm } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';
import TapLabel from '../../TapLabel';
import { useTwoTap } from '../../../lib/useTwoTap';
import { eraTint, handleWatchUse } from './era';

const EVIDENCE_IDS = ['ev-letter', 'ev-note', 'ev-gear', 'ev-watch', 'ev-diary'];

export default function Heotgan() {
  const { state, dispatch, episode } = useGame();
  const { solved, lastResult, era, inventory, selectedItem } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [nightEvent, setNightEvent] = useState(false);
  const nightTriggered = useRef(false);
  const navGuard = useRef(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLastResult = useRef<typeof lastResult>(null);

  useEffect(() => () => {
    if (navTimer.current !== null) clearTimeout(navTimer.current);
  }, []);

  function canAttempt(puzzleId: string) {
    return canAttemptWith(episode, state, puzzleId);
  }

  useEffect(() => {
    if (!nightEvent) {
      playBgm(era === 'past' ? 'ep2-past' : 'ep2-present');
    }
  }, [era, nightEvent]);

  useEffect(() => {
    if (lastResult === 'wrong' && lastResult !== prevLastResult.current) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    prevLastResult.current = lastResult;
  }, [lastResult]);

  // ── 밤 이벤트 조건 감시 ──
  useEffect(() => {
    if (nightTriggered.current) return;
    const hasAllEvidence = EVIDENCE_IDS.every((id) => inventory.includes(id));
    const lanternSolved = solved.includes('ep2-lantern');
    if (hasAllEvidence && lanternSolved && era === 'past') {
      nightTriggered.current = true;
      setNightEvent(true);
      playBgm('ep2-night');
      say('…담장 너머, 낚싯대를 둘러멘 작은 그림자가 밤길을 내려간다.');
    }
  }, [inventory, solved, era]);

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
      say('윤곽선과 견줘 보면… 낚싯대 하나와 양동이만 없다. 떠난 사람은 한 명이다.');
    } else {
      say('벽에 도구 윤곽선이 그려져 있다.');
    }
  }

  // ── 도구함 ──
  function handleToolbox() {
    if (nightEvent) return;
    if (handleWatchUse(state, dispatch)) return;
    if (solved.includes('ep2-toolbox')) {
      say('빈 도구함이다.');
      return;
    }
    if (canAttempt('ep2-toolbox')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-toolbox', answer: '' });
      fx.correctPulse();
      say('부서진 자물쇠 틈, 삭은 쪽지 — "8월 15일 보름, 밤낚시. 형한테는 비밀."');
    } else {
      say('녹슨 도구함. 자물쇠가 부서져 있다.');
    }
  }

  // ── 작업대(회중시계 뚜껑) ──
  function handleWorkbench() {
    if (nightEvent) return;
    if (handleWatchUse(state, dispatch)) return;
    if (solved.includes('ep2-watch-lid')) {
      say('시계는 이미 제 이야기를 들려주었다.');
      return;
    }
    if (selectedItem === 'oil-bottle' && canAttempt('ep2-watch-lid')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-watch-lid', answer: '' });
      fx.correctPulse();
      say('경첩에 기름을 치자 뚜껑이 열렸다. 물때… 11시 40분… 안쪽에 새겨진 글씨: "아우와 함께 — 아버지가".');
    } else {
      say('튼튼한 작업대. 여기라면 시계를 살펴볼 수 있겠다.');
    }
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
      className={shake ? 'shake' : undefined}
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
            <rect x="230" y="315" width="10" height="8" fill="#8a2020" opacity="0.7" />
          </g>
        )}

        {/* ── 문: 안방으로 ── */}
        {!nightEvent && (
          <g
            className="hotspot"
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); guard('door-anbang', () => goRoom('anbang')); }}
            role="button"
            aria-label="안방으로"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && goRoom('anbang')}
          >
            <rect x="20" y="240" width="55" height="60" rx="2" fill={isPast ? '#6a5030' : '#4a3c2c'} stroke="#3a2810" strokeWidth="2" />
            <rect x="15" y="218" width="65" height="18" rx="3" fill="#3a2810" opacity="0.85" />
            <text x="47" y="231" textAnchor="middle" fontSize="9" fill="#e8d3a8">안방으로</text>
          </g>
        )}
      </svg>

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

      <TapLabel name={ARMED_NAMES[armedId ?? ''] ?? null} />

      <Narration text={narration} onDone={() => setNarration(null)} />
    </div>
  );
}

const ARMED_NAMES: Record<string, string> = {
  'shed-door': '헛간 문',
  toolwall: '도구 걸이',
  toolbox: '도구함',
  workbench: '작업대',
  lantern: '랜턴',
  'door-anbang': '안방 문',
};
