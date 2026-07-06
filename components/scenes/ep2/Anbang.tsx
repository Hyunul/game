'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { canAttemptWith } from '../../../lib/gameState';
import { playSfx, playBgm, playNote } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';
import Keypad from '../../Keypad';
import ContradictionPicker from '../../puzzles/ContradictionPicker';
import TapLabel from '../../TapLabel';
import { useTwoTap } from '../../../lib/useTwoTap';
import { eraTint, handleWatchUse } from './era';
import RoomNav from '../../RoomNav';

// 꽃잎 수: 단추 배치 순서(화면상 좌→우)는 4-2-5-3 장으로 섞여 있다.
// 정답은 잎이 적은 순서(오름차순) 2-3-4-5로 누르는 것.
const SEWING_BUTTONS: { id: string; petals: number }[] = [
  { id: 'b0', petals: 4 },
  { id: 'b1', petals: 2 },
  { id: 'b2', petals: 5 },
  { id: 'b3', petals: 3 },
];
const SEWING_ORDER = ['2', '3', '4', '5'];

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
  const [columnOpen, setColumnOpen] = useState(false);
  const [contradictionOpen, setContradictionOpen] = useState(false);
  const [contradictionWrongSignal, setContradictionWrongSignal] = useState(0);
  const [sewingSequence, setSewingSequence] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [flashback, setFlashback] = useState(false);
  const [flashbackLine, setFlashbackLine] = useState(0);
  const navGuard = useRef(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLastResult = useRef<typeof lastResult>(null);
  const prevFloorboardSolved = useRef(solved.includes('ep2-floorboard'));

  useEffect(() => () => {
    if (navTimer.current !== null) clearTimeout(navTimer.current);
    if (flashbackTimer.current !== null) clearTimeout(flashbackTimer.current);
  }, []);

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

  // ── 회상 씬: ep2-floorboard 최초 해결 시 ──
  useEffect(() => {
    const nowSolved = solved.includes('ep2-floorboard');
    if (nowSolved && !prevFloorboardSolved.current) {
      setFlashback(true);
      setFlashbackLine(0);
    }
    prevFloorboardSolved.current = nowSolved;
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

  // ── 기둥 (A1) ──
  function handleColumn() {
    if (handleWatchUse(state, dispatch)) return;
    if (era === 'present') {
      say('페인트가 두껍게 덮여 있다. 무언가 있었던 자리 같은데.');
      return;
    }
    setColumnOpen(true);
    if (!solved.includes('ep2-column')) {
      dispatch({ type: 'SOLVE', puzzleId: 'ep2-column' });
      playSfx('pickup');
      say('눈금과 낙서를 옮겨 적었다. 틈에 사진 조각도 끼워져 있었다.');
    }
  }

  // ── 벽장 (A2) ──
  function handleCloset() {
    if (handleWatchUse(state, dispatch)) return;
    if (era === 'past') {
      say('어머니의 벽장. 함부로 열 수 없다.');
      return;
    }
    if (solved.includes('ep2-closet')) {
      say("벽장 안 — 호롱 기름병과 수틀. 수틀에는 '작은 꽃부터 피운다 — 어미'.");
      return;
    }
    if (canAttempt('ep2-closet')) {
      setKeypadConfig({ title: '태그: 우리 큰아이가 마지막으로 잰 키 — 어미', length: 3, puzzleId: 'ep2-closet' });
    } else {
      say("태그: '우리 큰아이가…' — 큰아이가 누구인지부터 알아야겠다.");
    }
  }

  // ── 반짇고리 (A3) ──
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
      say('단추 네 개 — 순서를 알 길이 없다.');
    }
  }

  function handleSewingButton(petals: number) {
    if (era === 'present') return;
    if (solved.includes('ep2-sewingbox')) return;
    if (!canAttempt('ep2-sewingbox')) {
      say('단추 네 개 — 순서를 알 길이 없다.');
      return;
    }
    playSfx('click');
    const next = [...sewingSequence, String(petals)];
    const targetSlice = SEWING_ORDER.slice(0, next.length);

    if (next.join(',') !== targetSlice.join(',')) {
      playSfx('wrong');
      setSewingSequence([]);
      return;
    }

    if (next.length === SEWING_ORDER.length) {
      setSewingSequence([]);
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-sewingbox', answer: '2-3-4-5' });
      setTimeout(() => {
        say('찰칵 — 반짇고리 안에 놋쇠 열쇠가 들어 있다.');
      }, 50);
      return;
    }

    setSewingSequence(next);
  }

  // ── 마루 널빤지 (A4/A5) ──
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
      say('양철상자 속, 어머니의 일기. 사흘치가 적혀 있다.');
    } else {
      say('낡은 마룻바닥. 어디를 봐야 할지 모르겠다.');
    }
  }

  // ── 문서함 (A6, 모순 찾기) ──
  function handleDocChest() {
    if (handleWatchUse(state, dispatch)) return;
    if (era === 'past') {
      say('아직 이 자리엔 아무것도 없다.');
      return;
    }
    if (solved.includes('ep2-contradiction')) {
      say('문서함은 비어 있다. 대조는 이미 끝났다.');
      return;
    }
    if (canAttempt('ep2-contradiction')) {
      setContradictionOpen(true);
    } else {
      say('문서가 더 필요하다. 일기, 조서, 벽보 — 셋을 모아 대조해야 한다.');
    }
  }

  function handleContradictionSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-contradiction', answer });
    if (answer === 'D2-2|D5-1') {
      setContradictionOpen(false);
      setTimeout(() => {
        say('…소문은 둘이라 했지만, 이장은 한 사람만 보았다. 맨손으로. — 무언가 크게 어긋나 있다.');
      }, 50);
    } else {
      setContradictionWrongSignal((n) => n + 1);
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
        say("벽장 안 — 호롱 기름병과 수틀. 수틀에는 '작은 꽃부터 피운다 — 어미'.");
      }
    }, 50);
  }

  // ── 문 ──
  function goRoom(room: 'sarangbang' | 'heotgan') {
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

  const closetSolved = solved.includes('ep2-closet');
  const floorboardSolved = solved.includes('ep2-floorboard');
  const sewingboxSolved = solved.includes('ep2-sewingbox');
  const columnSolved = solved.includes('ep2-column');
  const contradictionSolved = solved.includes('ep2-contradiction');
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
        {/* 장판 결 */}
        <line x1="0" y1="320" x2="450" y2="318" stroke={isPast ? '#a37c48' : '#5e574f'} strokeWidth="1" opacity="0.6" />
        <line x1="0" y1="360" x2="450" y2="356" stroke={isPast ? '#a37c48' : '#5e574f'} strokeWidth="1" opacity="0.5" />

        {/* 벽 몰딩 */}
        <line x1="0" y1="30" x2="800" y2="30" stroke={isPast ? '#c8a878' : '#7d7468'} strokeWidth="3" opacity="0.6" />

        {/* 창문 (오른쪽 위, 장식) */}
        <g aria-hidden="true">
          <rect x="560" y="55" width="110" height="85" rx="2" fill={isPast ? '#f7ecd0' : '#7d7468'} stroke="#7a6040" strokeWidth="2" />
          <line x1="615" y1="55" x2="615" y2="140" stroke="#7a6040" strokeWidth="2" />
          <line x1="560" y1="97" x2="670" y2="97" stroke="#7a6040" strokeWidth="2" />
          {isPast && <rect x="562" y="57" width="106" height="81" fill="#ffe9a8" opacity="0.35" />}
        </g>

        {/* 이불장 위 이불 (장식) */}
        <g aria-hidden="true">
          <rect x="452" y="196" width="130" height="84" rx="3" fill={isPast ? '#8b5e3c' : '#5e4a38'} stroke="#3a2810" strokeWidth="1.5" />
          <rect x="460" y="176" width="114" height="14" rx="6" fill={isPast ? '#c87878' : '#7d5f5a'} />
          <rect x="464" y="162" width="106" height="14" rx="6" fill={isPast ? '#7898c8' : '#5f6a7d'} />
        </g>

        {/* Present-only dust/cobweb decoration */}
        {!isPast && (
          <>
            <path d="M20,10 Q40,30 20,50 Q0,30 20,10" fill="none" stroke="#ccc" strokeWidth="0.7" opacity="0.4" />
            <path d="M760,20 Q780,40 760,60" fill="none" stroke="#ccc" strokeWidth="0.7" opacity="0.4" />
          </>
        )}

        {/* ── 기둥 (A1) ── */}
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
              <line x1="180" y1="88" x2="206" y2="88" stroke="#3a2810" strokeWidth="1.5" />
              <text x="210" y="93" fontSize="8" fill="#3a2810">榮秀 175</text>
              <line x1="180" y1="118" x2="206" y2="118" stroke="#3a2810" strokeWidth="1.5" />
              <text x="210" y="123" fontSize="8" fill="#3a2810">榮浩 168</text>
              <line x1="180" y1="148" x2="206" y2="148" stroke="#3a2810" strokeWidth="1.5" />
              <text x="210" y="153" fontSize="8" fill="#3a2810">順伊 152</text>
              <text
                x="193" y="180" textAnchor="middle" fontSize="6.5" fill="#5a3818"
                fontStyle="italic" transform="rotate(-6 193 180)"
              >
                빨리 커서 형만큼
              </text>
              <text
                x="193" y="190" textAnchor="middle" fontSize="6.5" fill="#5a3818"
                fontStyle="italic" transform="rotate(-6 193 190)"
              >
                큰 놈 잡을 거다 — 浩
              </text>
            </>
          )}
          {!isPast && (
            <rect x="178" y="70" width="30" height="80" fill="#c8c0b0" opacity="0.85" />
          )}
        </g>

        {/* ── 벽장 (A2) ── */}
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
              <text x="95" y="112" textAnchor="middle" fontSize="8" fill="#4a3820">우리 큰아이가 마지막으로 잰 키 — 어미</text>
            </>
          )}
          {!isPast && closetSolved && (
            <>
              {/* open door */}
              <rect x="40" y="120" width="55" height="140" rx="2" fill="#4a3a28" stroke="#2a1c10" strokeWidth="1.5" transform="rotate(-25 40 260)" opacity="0.9" />
              {/* 기름병 + 수틀 */}
              <rect x="100" y="220" width="16" height="24" rx="2" fill="#8a6838" stroke="#5a3818" strokeWidth="1" />
              <rect x="122" y="200" width="46" height="34" rx="4" fill="#e8d3a8" stroke="#a07030" strokeWidth="1" />
              <text x="145" y="220" textAnchor="middle" fontSize="5.5" fill="#4a2810">작은 꽃부터</text>
            </>
          )}
        </g>

        {/* ── 문갑 + 반짇고리 (A3) ── */}
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
              <text x="320" y="163" textAnchor="middle" fontSize="7" fill="#4a2810">반짇고리</text>
            </>
          )}
          {isPast && sewingboxSolved && (
            <rect x="290" y="170" width="60" height="30" rx="4" fill="#c85858" stroke="#7a3030" strokeWidth="1.5" opacity="0.6" />
          )}
        </g>

        {/* ── 반짇고리 단추 4개, 꽃잎 각인 (과거, 미해결) ── */}
        {isPast && !sewingboxSolved && (
          <g>
            {SEWING_BUTTONS.map((btn, i) => (
              <g
                key={btn.id}
                className="hotspot"
                style={{ cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); handleSewingButton(btn.petals); }}
                role="button"
                aria-label={`단추 (꽃잎 ${btn.petals}장)`}
                tabIndex={0}
              >
                <ButtonFlower cx={296 + i * 22} cy={185} petals={btn.petals} />
              </g>
            ))}
            {/* sequence progress */}
            {sewingSequence.length > 0 && (
              <g>
                {sewingSequence.map((p, i) => (
                  <circle key={i} cx={296 + i * 12} cy={155} r={4} fill="#c85858" stroke="#7a3030" strokeWidth="0.5" />
                ))}
              </g>
            )}
          </g>
        )}

        {/* ── 마루 널빤지 5장 (A4/A5) ── */}
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

        {/* ── 문서함 (A6) — 현재, 낮은 궤 ── */}
        {!isPast && (
          <g
            className="hotspot"
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); guard('docchest', handleDocChest); }}
            role="button"
            aria-label="문서함"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleDocChest()}
          >
            <rect x="230" y="255" width="110" height="34" rx="2" fill="#4a3a28" stroke="#2a1c10" strokeWidth="1.5" />
            <rect x="238" y="260" width="94" height="8" rx="1" fill="#3a2c1e" />
            <circle cx="285" cy="272" r="4" fill={contradictionSolved ? '#5a4a3a' : '#c8a050'} stroke="#8a6030" strokeWidth="1" />
            {!contradictionSolved && (
              <text x="285" y="250" textAnchor="middle" fontSize="7" fill="#c8b890">문서함</text>
            )}
          </g>
        )}

      </svg>

      <RoomNav
        targets={[
          { room: 'sarangbang', label: '사랑방', side: 'left' },
          { room: 'heotgan', label: '마당', side: 'right' },
        ]}
        onGo={(room) => goRoom(room as 'sarangbang' | 'heotgan')}
      />

      {/* Era 색조 오버레이 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundColor: eraTint(era) }} />

      {/* ── 기둥 확대 오버레이 ── */}
      {columnOpen && isPast && (
        <div style={overlayStyles.overlay} onClick={() => setColumnOpen(false)}>
          <div style={overlayStyles.card} onClick={(e) => e.stopPropagation()}>
            <button style={overlayStyles.closeBtn} onClick={() => setColumnOpen(false)} aria-label="닫기">✕</button>
            <h2 style={overlayStyles.title}>기둥 눈금</h2>
            <div style={overlayStyles.columnRows}>
              <div style={overlayStyles.columnRow}>榮秀 175</div>
              <div style={overlayStyles.columnRow}>榮浩 168</div>
              <div style={overlayStyles.columnRow}>順伊 152</div>
            </div>
            <div style={overlayStyles.memo}>
              눈금 아래, 흘려 쓴 낙서: &ldquo;빨리 커서 형만큼 큰 놈 잡을 거다 — 浩&rdquo;
            </div>
          </div>
        </div>
      )}

      <Keypad
        open={!!keypadConfig}
        title={keypadConfig?.title ?? ''}
        length={keypadConfig?.length ?? 3}
        onSubmit={handleKeypadSubmit}
        onClose={() => setKeypadConfig(null)}
      />

      <ContradictionPicker
        open={contradictionOpen}
        sentences={CONTRADICTION_SENTENCES}
        wrongSignal={contradictionWrongSignal}
        onSubmit={handleContradictionSubmit}
        onClose={() => setContradictionOpen(false)}
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
  '1978년 8월 16일 새벽.',
  '어머니는 젖은 옷을 말없이 빨았다.',
  '그리고 아무에게도 말하지 않기로 했다.',
];

// A6 모순 찾기 문장 데이터 — docPages에서 발췌.
const CONTRADICTION_SENTENCES = [
  {
    docId: 'D2', docName: '마을 벽보',
    sentences: [
      { id: 'D2-1', text: '"동생이 그랬다더라." — 부고 옆에 휘갈긴 낙서.' },
      { id: 'D2-2', text: '그날 밤 두 형제가 함께 낚시 짐을 지고 저수지로 가는 걸 봤다는 소문.' },
    ],
  },
  {
    docId: 'D4', docName: '어머니의 일기',
    sentences: [
      { id: 'D4-2', text: '8월 15일. 초저녁부터 영호가 보이지 않는다.' },
      { id: 'D4-3', text: '8월 16일 새벽. 영호가 젖은 채 혼자 돌아왔다.' },
    ],
  },
  {
    docId: 'D5', docName: '경찰 조서 (이장 진술)',
    sentences: [
      { id: 'D5-1', text: '한 사람이 맨손으로 물가로 달려가는 것이 보였다. 장비 같은 것은 아무것도 들고 있지 않았다.' },
    ],
  },
];

/** 반짇고리 단추 — SVG 원 둘레에 잎을 배치, petals 개수만큼 명확히 셀 수 있게 그린다. */
function ButtonFlower({ cx, cy, petals }: { cx: number; cy: number; petals: number }) {
  const petalEls = Array.from({ length: petals }).map((_, i) => {
    const angle = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const dx = Math.cos(angle) * 6;
    const dy = Math.sin(angle) * 6;
    return <circle key={i} cx={cx + dx} cy={cy + dy} r="3.2" fill="#e0b8c0" stroke="#8a4858" strokeWidth="0.6" />;
  });
  return (
    <g>
      <circle cx={cx} cy={cy} r="9" fill="#f0e0c8" stroke="#7a4f1e" strokeWidth="1" />
      {petalEls}
      <circle cx={cx} cy={cy} r="2.2" fill="#c88030" />
    </g>
  );
}

const ARMED_NAMES: Record<string, string> = {
  column: '기둥',
  closet: '벽장',
  sewingbox: '반짇고리',
  docchest: '문서함',
  'board-0': '마루 널빤지',
  'board-1': '마루 널빤지',
  'board-2': '마루 널빤지',
  'board-3': '마루 널빤지',
  'board-4': '마루 널빤지',
  'door-sarangbang': '사랑방 문',
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
  columnRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '1.4rem',
    fontWeight: 700,
    textAlign: 'center',
  },
  columnRow: {
    padding: '8px',
    backgroundColor: '#1a1008',
    borderRadius: '6px',
  },
  memo: {
    marginTop: '16px',
    padding: '10px 14px',
    backgroundColor: '#fffacd',
    color: '#664400',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontStyle: 'italic',
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
