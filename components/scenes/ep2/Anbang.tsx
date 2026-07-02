'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { canAttemptWith } from '../../../lib/gameState';
import { playSfx, playBgm, playNote } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';
import Keypad from '../../Keypad';
import TapLabel from '../../TapLabel';
import { useTwoTap } from '../../../lib/useTwoTap';
import { handleWatchUse } from './era';

const SEWING_TARGET = ['R', 'Y', 'B', 'Y'];
const SEWING_COLORS: Record<string, string> = { R: '#c83c3c', Y: '#e0b830', B: '#3868c0' };
const BOARD_FREQS = [329.63, 349.23, 392.0, 440.0, 493.88]; // E4 F4 G4 A4 B4
const CREAK_BOARD_INDEX = 2; // 동쪽 세 번째 널 (0-indexed)

export default function Anbang() {
  const { state, dispatch, episode } = useGame();
  const { solved, lastResult, era, inventory } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const [keypadConfig, setKeypadConfig] = useState<{
    title: string; length: number; puzzleId: string;
  } | null>(null);
  const [sewingSequence, setSewingSequence] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const navGuard = useRef(false);
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

  // ── 기둥 키재기 ──
  function handleColumn() {
    if (handleWatchUse(state, dispatch)) return;
    if (era === 'present') {
      say('페인트가 두껍게 덮여 있다. 무언가 있었던 자리 같은데.');
      return;
    }
    if (!solved.includes('ep2-column')) {
      dispatch({ type: 'SOLVE', puzzleId: 'ep2-column' });
      playSfx('pickup');
    }
    say("기둥의 눈금 — '큰애 175 / 막내 168'. 형제가 나란히 키를 쟀던 자리다.");
  }

  // ── 벽장 ──
  function handleCloset() {
    if (handleWatchUse(state, dispatch)) return;
    if (era === 'past') {
      say('어머니의 벽장. 함부로 열 수 없다.');
      return;
    }
    if (solved.includes('ep2-closet')) {
      say('열린 벽장 — 꽃이 수놓인 방석이 보인다. 빨강-노랑-파랑-노랑 순서다.');
      return;
    }
    if (canAttempt('ep2-closet')) {
      setKeypadConfig({ title: '자물쇠: 네가 자란 만큼 — 어머니', length: 3, puzzleId: 'ep2-closet' });
    } else {
      say("자물쇠 태그: '네가 자란 만큼'… 무슨 숫자일까?");
    }
  }

  // ── 반짇고리 ──
  function handleSewingbox() {
    if (handleWatchUse(state, dispatch)) return;
    if (era === 'present') {
      say('먼지 쌓인 문갑. 그 위엔 아무것도 없다.');
      return;
    }
    if (solved.includes('ep2-sewingbox')) {
      say('빈 반짇고리. 놋쇠 열쇠는 이미 꺼냈다.');
      return;
    }
    if (!canAttempt('ep2-sewingbox')) {
      say('단추 네 개가 달린 잠금. 순서가 있는 듯하다.');
    }
  }

  function handleSewingButton(color: string) {
    if (era === 'present') return;
    if (solved.includes('ep2-sewingbox')) return;
    if (!canAttempt('ep2-sewingbox')) {
      say('단추 네 개가 달린 잠금. 순서가 있는 듯하다.');
      return;
    }
    playSfx('click');
    setSewingSequence((prev) => {
      const next = [...prev, color];
      const len = next.length;
      const targetSlice = SEWING_TARGET.slice(0, len);

      if (next.join(',') !== targetSlice.join(',')) {
        playSfx('wrong');
        return [];
      }

      if (len === SEWING_TARGET.length) {
        dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-sewingbox', answer: 'R-Y-B-Y' });
        setTimeout(() => {
          say('찰칵 — 반짇고리 안에 놋쇠 열쇠가 들어 있다. 어딘가 낯익은 반짇고리다…');
        }, 50);
        return [];
      }

      return next;
    });
  }

  // ── 마루 널빤지 ──
  function handleFloorboard(index: number) {
    if (handleWatchUse(state, dispatch)) return;

    if (era === 'past') {
      playNote(BOARD_FREQS[index]);
      if (index === CREAK_BOARD_INDEX) {
        if (!solved.includes('ep2-floor-creak')) {
          dispatch({ type: 'SOLVE', puzzleId: 'ep2-floor-creak' });
          playSfx('door');
        }
        say('동쪽 세 번째 널이 삐걱인다. 틈새에서 무언가 반짝였다.');
      } else {
        say('단단한 마룻바닥이다.');
      }
      return;
    }

    // present
    if (index !== CREAK_BOARD_INDEX) {
      say('낡은 마룻바닥. 어디를 봐야 할지 모르겠다.');
      return;
    }
    if (solved.includes('ep2-floorboard')) {
      say('널빤지를 들어낸 자리. 양철상자는 이미 비어 있다.');
      return;
    }
    if (canAttempt('ep2-floorboard')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-floorboard', answer: '' });
      fx.correctPulse();
      say("헐거워진 널빤지를 들어냈다. 양철상자 속, 어머니의 일기 — '16일 새벽. 막내가 젖어 돌아왔다. 아무에게도 말하지 않았다.'");
    } else {
      say('낡은 마룻바닥. 어디를 봐야 할지 모르겠다.');
    }
  }

  // ── Keypad submit ──
  function handleKeypadSubmit(answer: string) {
    if (!keypadConfig) return;
    const { puzzleId } = keypadConfig;
    dispatch({ type: 'ATTEMPT', puzzleId, answer });
    setKeypadConfig(null);
    setTimeout(() => {
      if (puzzleId === 'ep2-closet' && answer === '175') {
        say('벽장 안 — 호롱 기름병, 그리고 꽃이 수놓인 방석.');
      }
    }, 50);
  }

  // ── 문 ──
  function goRoom(room: 'sarangbang' | 'heotgan') {
    if (navGuard.current) return;
    navGuard.current = true;
    fx.roomTransition();
    playSfx('door');
    setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room });
      navGuard.current = false;
    }, 600);
  }

  const closetSolved = solved.includes('ep2-closet');
  const floorboardSolved = solved.includes('ep2-floorboard');
  const sewingboxSolved = solved.includes('ep2-sewingbox');
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
        aria-label="안방과 마루 장면"
        onClick={handleBackgroundClick}
      >
        {/* Background */}
        <rect width="800" height="400" fill={isPast ? '#e8cfa0' : '#8f8378'} />

        {/* 마루(porch) floor area */}
        <rect x="450" y="280" width="350" height="120" fill={isPast ? '#c8a468' : '#7a705f'} />
        <line x1="450" y1="280" x2="800" y2="280" stroke={isPast ? '#8a6838' : '#4a453f'} strokeWidth="2" />

        {/* 방 floor */}
        <rect x="0" y="280" width="450" height="120" fill={isPast ? '#b89058' : '#6e675e'} />

        {/* Present-only dust/cobweb decoration */}
        {!isPast && (
          <>
            <path d="M20,10 Q40,30 20,50 Q0,30 20,10" fill="none" stroke="#ccc" strokeWidth="0.7" opacity="0.4" />
            <path d="M760,20 Q780,40 760,60" fill="none" stroke="#ccc" strokeWidth="0.7" opacity="0.4" />
          </>
        )}

        {/* ── 기둥 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('column', handleColumn); }}
          role="button"
          aria-label="기둥"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleColumn()}
        >
          <rect x="180" y="40" width="26" height="250" fill={isPast ? '#8b5e3c' : '#4a3c2c'} stroke="#3a2810" strokeWidth="1.5" />
          {isPast && (
            <>
              <line x1="180" y1="90" x2="206" y2="90" stroke="#3a2810" strokeWidth="1.5" />
              <text x="210" y="94" fontSize="8" fill="#3a2810">큰애 175</text>
              <line x1="180" y1="130" x2="206" y2="130" stroke="#3a2810" strokeWidth="1.5" />
              <text x="210" y="134" fontSize="8" fill="#3a2810">막내 168</text>
            </>
          )}
          {!isPast && (
            <rect x="178" y="70" width="30" height="80" fill="#c8c0b0" opacity="0.85" />
          )}
        </g>

        {/* ── 벽장 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('closet', handleCloset); }}
          role="button"
          aria-label="벽장"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleCloset()}
        >
          <rect x="40" y="120" width="110" height="140" rx="2" fill={isPast ? '#7a5030' : '#5a4632'} stroke="#3a2810" strokeWidth="2" />
          {!isPast && !closetSolved && (
            <>
              <circle cx="140" cy="190" r="7" fill="#c8a050" stroke="#a07030" strokeWidth="1" />
              <text x="95" y="112" textAnchor="middle" fontSize="8" fill="#4a3820">네가 자란 만큼 — 어머니</text>
            </>
          )}
          {!isPast && closetSolved && (
            <>
              {/* open door */}
              <rect x="40" y="120" width="55" height="140" rx="2" fill="#4a3a28" stroke="#2a1c10" strokeWidth="1.5" transform="rotate(-25 40 260)" opacity="0.9" />
              {/* 방석 with 4 flowers R-Y-B-Y */}
              <rect x="95" y="200" width="50" height="40" rx="6" fill="#e8d3a8" stroke="#a07030" strokeWidth="1" />
              <circle cx="105" cy="212" r="4" fill={SEWING_COLORS.R} />
              <circle cx="118" cy="212" r="4" fill={SEWING_COLORS.Y} />
              <circle cx="131" cy="212" r="4" fill={SEWING_COLORS.B} />
              <circle cx="144" cy="212" r="4" fill={SEWING_COLORS.Y} />
            </>
          )}
        </g>

        {/* ── 문갑 + 반짇고리 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('sewingbox', handleSewingbox); }}
          role="button"
          aria-label="반짇고리"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleSewingbox()}
        >
          <rect x="260" y="200" width="120" height="60" rx="2" fill={isPast ? '#8b5e3c' : '#5e4a38'} stroke="#3a2810" strokeWidth="1.5" />
          {isPast && !sewingboxSolved && (
            <>
              <rect x="290" y="170" width="60" height="30" rx="4" fill="#c85858" stroke="#7a3030" strokeWidth="1.5" />
              <text x="320" y="163" textAnchor="middle" fontSize="7" fill="#4a2810">단추 네 개</text>
            </>
          )}
          {isPast && sewingboxSolved && (
            <rect x="290" y="170" width="60" height="30" rx="4" fill="#c85858" stroke="#7a3030" strokeWidth="1.5" opacity="0.6" />
          )}
        </g>

        {/* ── 반짇고리 단추 (과거, 미해결) ── */}
        {isPast && !sewingboxSolved && (
          <g>
            {(['R', 'Y', 'B'] as const).map((c, i) => (
              <circle
                key={c}
                className="hotspot"
                style={{ cursor: 'pointer' }}
                cx={300 + i * 20}
                cy={185}
                r={7}
                fill={SEWING_COLORS[c]}
                stroke="#2a1808"
                strokeWidth="1"
                onClick={(e) => { e.stopPropagation(); handleSewingButton(c); }}
                role="button"
                aria-label={`단추 ${c === 'R' ? '빨강' : c === 'Y' ? '노랑' : '파랑'}`}
                tabIndex={0}
              />
            ))}
            {/* sequence progress */}
            {sewingSequence.length > 0 && (
              <g>
                {sewingSequence.map((c, i) => (
                  <circle key={i} cx={296 + i * 12} cy={155} r={4} fill={SEWING_COLORS[c]} stroke="#2a1808" strokeWidth="0.5" />
                ))}
              </g>
            )}
          </g>
        )}

        {/* ── 마루 널빤지 5장 ── */}
        <g>
          {Array.from({ length: 5 }).map((_, i) => (
            <g
              key={i}
              className="hotspot"
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); guard(`board-${i}`, () => handleFloorboard(i)); }}
              role="button"
              aria-label={`마루 널빤지 ${i + 1}`}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleFloorboard(i)}
            >
              <rect
                x={470 + i * 64}
                y={300}
                width={58}
                height={90}
                fill={
                  i === CREAK_BOARD_INDEX && floorboardSolved && !isPast
                    ? '#2a2018'
                    : isPast ? '#b8935c' : '#736a5c'
                }
                stroke={isPast ? '#8a6838' : '#4a453f'}
                strokeWidth="1.5"
              />
              {i === CREAK_BOARD_INDEX && isPast && solved.includes('ep2-floor-creak') && (
                <circle cx={470 + i * 64 + 29} cy={345} r={5} fill="#ffe680" opacity="0.85" />
              )}
              {i === CREAK_BOARD_INDEX && floorboardSolved && !isPast && (
                <text x={470 + i * 64 + 29} y={350} textAnchor="middle" fontSize="7" fill="#c8b890">빈 자리</text>
              )}
            </g>
          ))}
        </g>

        {/* ── 방석(현재, 벽장 열린 뒤 별도로 마루 위엔 없음 — 벽장 안에 렌더) ── */}

        {/* ── 문: 사랑방으로 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('door-sarangbang', () => goRoom('sarangbang')); }}
          role="button"
          aria-label="사랑방으로"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && goRoom('sarangbang')}
        >
          <rect x="20" y="240" width="55" height="60" rx="2" fill={isPast ? '#6a5030' : '#4a3c2c'} stroke="#3a2810" strokeWidth="2" />
          <text x="47" y="232" textAnchor="middle" fontSize="9" fill="#e8d3a8" opacity="0.8">사랑방으로</text>
        </g>

        {/* ── 문: 마당으로(헛간) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('door-heotgan', () => goRoom('heotgan')); }}
          role="button"
          aria-label="마당으로"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && goRoom('heotgan')}
        >
          <rect x="730" y="330" width="60" height="60" rx="2" fill={isPast ? '#7a5030' : '#5a4632'} stroke="#3a2810" strokeWidth="2" />
          <text x="760" y="322" textAnchor="middle" fontSize="9" fill="#e8d3a8" opacity="0.8">마당으로</text>
        </g>
      </svg>

      <Keypad
        open={!!keypadConfig}
        title={keypadConfig?.title ?? ''}
        length={keypadConfig?.length ?? 3}
        onSubmit={handleKeypadSubmit}
        onClose={() => setKeypadConfig(null)}
      />

      <TapLabel name={ARMED_NAMES[armedId ?? ''] ?? null} />

      <Narration text={narration} onDone={() => setNarration(null)} />
    </div>
  );
}

const ARMED_NAMES: Record<string, string> = {
  column: '기둥',
  closet: '벽장',
  sewingbox: '반짇고리',
  'board-0': '마루 널빤지',
  'board-1': '마루 널빤지',
  'board-2': '마루 널빤지',
  'board-3': '마루 널빤지',
  'board-4': '마루 널빤지',
  'door-sarangbang': '사랑방 문',
  'door-heotgan': '마당 문',
};
