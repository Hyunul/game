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

        {/* Yard ground */}
        <rect x="0" y="300" width="800" height="100" fill={nightEvent ? '#1c2438' : isPast ? '#8ba85c' : '#6e675e'} />

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
                <rect x="510" y="150" width="100" height="60" fill="#3a2c1c" opacity="0.6" />
                {/* 흰 윤곽선 5개 (낫, 삽, 낚싯대x2, 양동이) */}
                <text x="520" y="163" fontSize="7" fill="#e8e0c8" opacity="0.7">낫</text>
                <text x="540" y="163" fontSize="7" fill="#e8e0c8" opacity="0.7">삽</text>
                <text x="560" y="163" fontSize="7" fill="#e8e0c8" opacity="0.7">낚싯대</text>
                <text x="585" y="163" fontSize="7" fill="#e8e0c8" opacity="0.7">낚싯대</text>
                <text x="520" y="200" fontSize="7" fill="#e8e0c8" opacity="0.7">양동이</text>
                {/* 실제 걸린 도구 3개만 (낫, 삽, 낚싯대1) — 낚싯대2/양동이 자리 빔 */}
                <circle cx="524" cy="170" r="5" fill="#8a8a70" />
                <circle cx="544" cy="170" r="5" fill="#8a8a70" />
                <line x1="562" y1="168" x2="562" y2="185" stroke="#8a6838" strokeWidth="2" />
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
            <text x="47" y="232" textAnchor="middle" fontSize="9" fill="#e8d3a8" opacity="0.8">안방으로</text>
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
