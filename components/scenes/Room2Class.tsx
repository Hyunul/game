'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../lib/GameContext';
import { canAttempt } from '../../lib/gameState';
import { playSfx, playBgm, playNote } from '../../lib/audio';
import { fx } from '../../lib/effects';
import Narration from '../Narration';
import Keypad from '../Keypad';
import TapLabel from '../TapLabel';
import { useTwoTap } from '../../lib/useTwoTap';

const NOTE_KEYS = [
  { note: 'C', freq: 261.63, label: '도' },
  { note: 'D', freq: 293.66, label: '레' },
  { note: 'E', freq: 329.63, label: '미' },
  { note: 'F', freq: 349.23, label: '파' },
  { note: 'G', freq: 392.00, label: '솔' },
  { note: 'A', freq: 440.00, label: '라' },
  { note: 'B', freq: 493.88, label: '시' },
];

const TARGET_SEQUENCE = ['C', 'E', 'G', 'E', 'C'];

export default function Room2Class() {
  const { state, dispatch } = useGame();
  const { solved, inventory, selectedItem, wrongAttempts } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const [timetableOpen, setTimetableOpen] = useState(false);
  const [keypadConfig, setKeypadConfig] = useState<{
    title: string; length: number; puzzleId: string;
  } | null>(null);
  const [shake, setShake] = useState(false);
  const [organSequence, setOrganSequence] = useState<string[]>([]);

  const prevWrongAttempts = useRef(wrongAttempts);
  const prevSolvedLen = useRef(solved.length);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (shakeTimer.current !== null) clearTimeout(shakeTimer.current);
  }, []);

  // Play class BGM on mount
  useEffect(() => {
    playBgm('class');
  }, []);

  // Shake on wrong answer
  useEffect(() => {
    if (wrongAttempts > prevWrongAttempts.current) {
      setShake(true);
      shakeTimer.current = setTimeout(() => setShake(false), 600);
    }
    prevWrongAttempts.current = wrongAttempts;
  }, [wrongAttempts]);

  // Trigger shard particles + sfx when class-final is solved
  useEffect(() => {
    if (solved.includes('class-final') && solved.length !== prevSolvedLen.current) {
      fx.shardParticles();
      playSfx('shard');
    }
    prevSolvedLen.current = solved.length;
  }, [solved]);

  function say(text: string) {
    setNarration(text);
  }

  // ── 시간표 ────────────────────────────────────────────────────────────────────
  function handleTimetable() {
    if (!solved.includes('class-timetable')) {
      dispatch({ type: 'SOLVE', puzzleId: 'class-timetable' });
      playSfx('pickup');
    }
    setTimetableOpen(true);
  }

  // ── 사물함 ────────────────────────────────────────────────────────────────────
  function handleLocker() {
    if (canAttempt(state, 'class-locker')) {
      setKeypadConfig({ title: '몇 번 사물함일까?', length: 2, puzzleId: 'class-locker' });
    } else if (solved.includes('class-locker')) {
      say('13번 사물함 — 이미 열려 있다.');
    } else {
      say('수많은 사물함… 몇 번이더라?');
    }
  }

  // ── 풍금 keys ─────────────────────────────────────────────────────────────────
  function handleOrganKey(note: string, freq: number) {
    playNote(freq);

    if (!inventory.includes('sheet-music')) return; // no sheet music — just play sound
    if (solved.includes('class-organ')) return;     // already solved

    // setState 업데이터 안에서 dispatch하면 렌더 중 상태 갱신 오류가 나므로
    // 시퀀스 판정은 이벤트 핸들러에서 직접 수행한다.
    const next = [...organSequence, note];
    const targetSlice = TARGET_SEQUENCE.slice(0, next.length);

    if (next.join(',') !== targetSlice.join(',')) {
      // Wrong note — reset
      playSfx('wrong');
      setOrganSequence([]);
      return;
    }

    if (next.length === TARGET_SEQUENCE.length) {
      // Full sequence matched
      setOrganSequence([]);
      dispatch({ type: 'ATTEMPT', puzzleId: 'class-organ', answer: 'C-E-G-E-C' });
      setTimeout(() => say('풍금 뚜껑 안쪽에서 분필이 굴러 나왔다.'), 50);
      return;
    }

    setOrganSequence(next);
  }

  // ── 풍금 body ─────────────────────────────────────────────────────────────────
  function handleOrganBody() {
    if (solved.includes('class-organ')) {
      say('풍금 뚜껑이 열려 있다. 분필이 있던 자리.');
    } else if (!inventory.includes('sheet-music')) {
      say('악보가 있다면 연주할 수 있을 텐데.');
    } else {
      say('건반을 눌러 악보대로 연주해보자: 도-미-솔-미-도');
    }
  }

  // ── 칠판 ─────────────────────────────────────────────────────────────────────
  function handleBoard() {
    if (solved.includes('class-board')) {
      say('칠판에 적힌 글씨가 선명하다: "교환일기는 화분 아래에"');
    } else if (selectedItem === 'chalk' && canAttempt(state, 'class-board')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'class-board', answer: '' });
      setTimeout(() => say('분필로 칠판을 문지르자 글씨가 나타났다! "교환일기는 화분 아래에"'), 50);
    } else {
      say('희미하게 무언가 적혀 있던 자국이 있다.');
    }
  }

  // ── 화분 ─────────────────────────────────────────────────────────────────────
  function handlePot() {
    if (solved.includes('class-board')) {
      if (!inventory.includes('diary')) {
        dispatch({ type: 'PICKUP', itemId: 'diary' });
        playSfx('pickup');
        say('화분 아래에서 교환일기를 찾았다! "우리의 비밀번호는 졸업하는 해"');
      } else {
        say('화분 아래 교환일기가 있던 자리 — 이미 가져갔다.');
      }
    } else {
      say('예쁜 화분이다. 흙냄새가 난다.');
    }
  }

  // ── 교탁 서랍 ─────────────────────────────────────────────────────────────────
  function handleDrawer() {
    if (solved.includes('class-final')) {
      say('서랍이 열려 있다. 텅 비어 있다.');
    } else if (canAttempt(state, 'class-final')) {
      setKeypadConfig({ title: '교탁 서랍의 자물쇠', length: 4, puzzleId: 'class-final' });
    } else {
      say('서랍이 잠겨 있다. 네 자리 숫자…');
    }
  }

  // ── Keypad submit ──────────────────────────────────────────────────────────
  function handleKeypadSubmit(answer: string) {
    if (!keypadConfig) return;
    const { puzzleId } = keypadConfig;
    dispatch({ type: 'ATTEMPT', puzzleId, answer });
    setKeypadConfig(null);
    if (puzzleId === 'class-locker' && answer === '13') {
      setTimeout(() => say('13번 사물함에서 낡은 풍금 악보를 찾았다!'), 50);
    }
  }

  const timetableSolved = solved.includes('class-timetable');
  const lockerSolved = solved.includes('class-locker');
  const organSolved = solved.includes('class-organ');
  const boardSolved = solved.includes('class-board');
  const finalSolved = solved.includes('class-final');

  // Timetable grid data: rows = 1~4교시, cols = 월화수목금
  const days = ['월', '화', '수', '목', '금'];
  const periods = ['1교시', '2교시', '3교시', '4교시'];

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className={shake ? 'shake' : undefined}
    >
      <svg
        viewBox="0 0 800 400"
        width="100%"
        style={{ display: 'block' }}
        aria-label="초등학교 교실 장면"
      >
        <defs>
          <filter id="boardTextGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Background: cream classroom wall ── */}
        <rect width="800" height="400" fill="#e8e0c8" />

        {/* Floor */}
        <rect x="0" y="310" width="800" height="90" fill="#c8aa70" />
        <line x1="0" y1="310" x2="800" y2="310" stroke="#a08040" strokeWidth="2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <line
            key={`fl-${i}`}
            x1="0" y1={320 + i * 16}
            x2="800" y2={320 + i * 16}
            stroke="#b09050" strokeWidth="0.5" opacity="0.5"
          />
        ))}

        {/* ── Chalkboard (칠판) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={() => guard('board', handleBoard)}
          role="button"
          aria-label="칠판"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleBoard()}
        >
          {/* Board frame */}
          <rect x="80" y="30" width="420" height="220" rx="4" fill="#2a4a2a" stroke="#1a3a1a" strokeWidth="3" />
          {/* Board surface */}
          <rect x="88" y="38" width="404" height="204" rx="2" fill="#2e5a2e" />
          {/* Faint erased chalk marks */}
          <line x1="100" y1="80" x2="200" y2="75" stroke="#4a8a4a" strokeWidth="1" opacity="0.3" />
          <line x1="120" y1="120" x2="280" y2="110" stroke="#4a8a4a" strokeWidth="1.5" opacity="0.25" />
          <line x1="150" y1="160" x2="320" y2="155" stroke="#4a8a4a" strokeWidth="1" opacity="0.2" />
          <line x1="220" y1="95" x2="360" y2="90" stroke="#4a8a4a" strokeWidth="0.8" opacity="0.3" />
          {/* Board text revealed after class-board solved */}
          {boardSolved && (
            <text
              x="290"
              y="145"
              textAnchor="middle"
              fontSize="20"
              fill="#f0f0c0"
              fontWeight="600"
              filter="url(#boardTextGlow)"
              style={{ fontFamily: '"Malgun Gothic", sans-serif' }}
            >
              교환일기는 화분 아래에
            </text>
          )}
          {/* Chalk tray */}
          <rect x="88" y="238" width="404" height="8" rx="1" fill="#1a3a1a" />
          {!inventory.includes('chalk') && !solved.includes('class-organ') && (
            <rect x="100" y="240" width="14" height="4" rx="1" fill="#f0f0e0" opacity="0.8" />
          )}
        </g>

        {/* ── 시간표 poster ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={() => guard('timetable', handleTimetable)}
          role="button"
          aria-label="시간표"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleTimetable()}
        >
          {/* Poster backing */}
          <rect x="516" y="30" width="120" height="130" rx="3" fill="#f5f0e0" stroke="#c8b080" strokeWidth="1.5" />
          {/* Header */}
          <rect x="516" y="30" width="120" height="20" rx="3" fill="#4a7a9a" />
          <text x="576" y="44" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">시 간 표</text>
          {/* Grid headers (days) */}
          {days.map((d, i) => (
            <text key={`d-${i}`} x={535 + i * 20} y="62" textAnchor="middle" fontSize="8" fill="#444">{d}</text>
          ))}
          {/* Period rows */}
          {periods.map((p, row) => (
            <g key={`row-${row}`}>
              <text x="518" y={75 + row * 20} fontSize="7" fill="#666">{row + 1}</text>
              {days.map((_, col) => {
                const isHighlighted = col === 2 && row === 2; // 수요일(3번째), 3교시 → 좌표 (3,3)
                return (
                  <rect
                    key={`cell-${row}-${col}`}
                    x={525 + col * 20}
                    y={65 + row * 20}
                    width="18"
                    height="16"
                    rx="1"
                    fill={isHighlighted ? '#e05050' : 'none'}
                    stroke="#ccc"
                    strokeWidth="0.5"
                    opacity={isHighlighted ? 0.8 : 1}
                  />
                );
              })}
            </g>
          ))}
          {timetableSolved && (
            <text x="576" y="158" textAnchor="middle" fontSize="7" fill="#c04040">좌표 (3,3)?</text>
          )}
        </g>

        {/* ── 사물함 (locker wall) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={() => guard('locker', handleLocker)}
          role="button"
          aria-label="사물함"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleLocker()}
        >
          {/* Locker frame */}
          <rect x="645" y="80" width="145" height="170" rx="3" fill="#8a7a60" stroke="#6a5a40" strokeWidth="2" />
          {/* Locker grid: 5 cols × 4 rows = 1~20 (정답 13번 포함) */}
          {Array.from({ length: 4 }).map((_, row) =>
            Array.from({ length: 5 }).map((_, col) => {
              const num = row * 5 + col + 1;
              const isTarget = num === 13;
              return (
                <g key={`lk-${row}-${col}`}>
                  <rect
                    x={650 + col * 27}
                    y={85 + row * 40}
                    width="24"
                    height="36"
                    rx="2"
                    fill={isTarget && lockerSolved ? '#c8a050' : '#a09070'}
                    stroke="#6a5a40"
                    strokeWidth="1"
                  />
                  <circle
                    cx={662 + col * 27}
                    cy={112 + row * 40}
                    r="2.5"
                    fill="#5a4a30"
                  />
                  <text
                    x={662 + col * 27}
                    y={100 + row * 40}
                    textAnchor="middle"
                    fontSize="7"
                    fill="#3a2a10"
                    opacity="0.7"
                  >
                    {num}
                  </text>
                </g>
              );
            })
          )}
        </g>

        {/* ── 풍금 (organ) ── */}
        <g role="group" aria-label="풍금">
          {/* Organ body — clickable for flavor text */}
          <g
            className="hotspot"
            style={{ cursor: 'pointer' }}
            onClick={() => guard('organ', handleOrganBody)}
            role="button"
            aria-label="풍금 몸체"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleOrganBody()}
          >
            {/* Main body */}
            <rect x="82" y="250" width="240" height="60" rx="4" fill="#7a5030" stroke="#5a3810" strokeWidth="2" />
            {/* Lid */}
            <rect
              x="82" y="240" width="240" height="14"
              rx="3"
              fill={organSolved ? '#9a7050' : '#6a4020'}
              stroke="#5a3810" strokeWidth="1.5"
            />
            {organSolved && (
              /* Open lid shadow */
              <rect x="82" y="234" width="240" height="10" rx="2" fill="#4a2808" opacity="0.4" transform="rotate(-5 202 240)" />
            )}
            {/* Organ legs */}
            <rect x="100" y="308" width="12" height="20" rx="2" fill="#5a3810" />
            <rect x="294" y="308" width="12" height="20" rx="2" fill="#5a3810" />
            {/* Sheet music stand — visible if has sheet-music */}
            {inventory.includes('sheet-music') && (
              <>
                <rect x="175" y="222" width="50" height="20" rx="2" fill="#f5eecc" stroke="#c8a060" strokeWidth="1" />
                <text x="200" y="236" textAnchor="middle" fontSize="8" fill="#664400">♩♪ 악보 ♪♩</text>
              </>
            )}
          </g>

          {/* Organ keys — 7 white keys */}
          {NOTE_KEYS.map(({ note, freq, label }, i) => {
            const kx = 92 + i * 32;
            return (
              <g
                key={`key-${note}`}
                className="hotspot"
                style={{ cursor: 'pointer' }}
                onClick={() => handleOrganKey(note, freq)}
                role="button"
                aria-label={`풍금 ${label} 건반`}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleOrganKey(note, freq)}
              >
                {/* Enlarged hit area */}
                <rect x={kx - 4} y={248} width="36" height="58" rx="2" fill="transparent" pointerEvents="all" />
                <rect
                  x={kx}
                  y={253}
                  width="28"
                  height="48"
                  rx="2"
                  fill={organSequence[organSequence.length - 1] === note ? '#f0e060' : '#f5f0e8'}
                  stroke="#c0b090"
                  strokeWidth="1"
                />
                <text x={kx + 14} y={294} textAnchor="middle" fontSize="8" fill="#666">{label}</text>
              </g>
            );
          })}
        </g>

        {/* ── 교탁 with drawer ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={() => guard('drawer', handleDrawer)}
          role="button"
          aria-label="교탁 서랍"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleDrawer()}
        >
          {/* Desk top */}
          <rect x="340" y="250" width="160" height="16" rx="3" fill="#9a7a40" stroke="#7a5a20" strokeWidth="1.5" />
          {/* Desk body */}
          <rect x="348" y="265" width="144" height="50" rx="3" fill="#8a6a30" stroke="#6a4a10" strokeWidth="1.5" />
          {/* Drawer */}
          <rect
            x="358"
            y={finalSolved ? "278" : "272"}
            width="124"
            height="30"
            rx="2"
            fill={finalSolved ? '#7a5a20' : '#9a7a40'}
            stroke="#5a3a10"
            strokeWidth="1"
          />
          {/* Drawer handle */}
          <rect x="408" y={finalSolved ? "290" : "284"} width="24" height="6" rx="3" fill="#c8a050" stroke="#a08030" strokeWidth="1" />
          {/* Lock icon on drawer */}
          {!finalSolved && (
            <>
              <rect x="434" y="275" width="9" height="7" rx="1" fill="#7a5a20" stroke="#5a3a10" strokeWidth="0.8" />
              <rect x="436" y="272" width="5" height="4" rx="2.5" fill="none" stroke="#7a5a20" strokeWidth="1.2" />
            </>
          )}
          {/* Desk legs */}
          <rect x="355" y="314" width="10" height="20" rx="2" fill="#7a5a20" />
          <rect x="475" y="314" width="10" height="20" rx="2" fill="#7a5a20" />
        </g>

        {/* ── 화분 (potted plant, window-side) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={() => guard('pot', handlePot)}
          role="button"
          aria-label="화분"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handlePot()}
        >
          {/* Window frame behind */}
          <rect x="540" y="175" width="90" height="100" rx="2" fill="#d0e8f0" stroke="#a0b8c8" strokeWidth="2" opacity="0.6" />
          <line x1="585" y1="175" x2="585" y2="275" stroke="#a0b8c8" strokeWidth="1" opacity="0.7" />
          <line x1="540" y1="225" x2="630" y2="225" stroke="#a0b8c8" strokeWidth="1" opacity="0.7" />
          {/* Pot */}
          <rect x="558" y="268" width="54" height="40" rx="4" fill="#c07030" stroke="#a05010" strokeWidth="1.5" />
          <rect x="554" y="264" width="62" height="10" rx="3" fill="#b06020" stroke="#904010" strokeWidth="1" />
          {/* Soil */}
          <ellipse cx="585" cy="270" rx="26" ry="5" fill="#5a3a1a" opacity="0.8" />
          {/* Plant leaves */}
          <ellipse cx="575" cy="240" rx="16" ry="28" fill="#3a7a3a" opacity="0.85" transform="rotate(-15 575 240)" />
          <ellipse cx="595" cy="238" rx="14" ry="26" fill="#4a8a4a" opacity="0.8" transform="rotate(12 595 238)" />
          <ellipse cx="585" cy="235" rx="10" ry="22" fill="#5a9a5a" opacity="0.75" />
          {/* Diary hint marker */}
          {boardSolved && !inventory.includes('diary') && (
            <circle cx="610" cy="264" r="5" fill="#f0d040" opacity="0.9">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
            </circle>
          )}
        </g>

        {/* ── Sequence progress indicator ── */}
        {organSequence.length > 0 && (
          <g>
            {TARGET_SEQUENCE.map((n, i) => (
              <circle
                key={`seq-${i}`}
                cx={360 + i * 18}
                cy={20}
                r="7"
                fill={i < organSequence.length ? '#f0d040' : 'none'}
                stroke="#c8a050"
                strokeWidth="1.5"
              />
            ))}
          </g>
        )}
      </svg>

      {/* ── Timetable overlay ── */}
      {timetableOpen && (
        <div style={overlayStyles.overlay} onClick={() => setTimetableOpen(false)}>
          <div style={overlayStyles.card} onClick={(e) => e.stopPropagation()}>
            <button
              style={overlayStyles.closeBtn}
              onClick={() => setTimetableOpen(false)}
              aria-label="닫기"
            >
              ✕
            </button>
            <h2 style={overlayStyles.title}>시 간 표</h2>
            <table style={overlayStyles.table}>
              <thead>
                <tr>
                  <th style={overlayStyles.th}></th>
                  {days.map((d) => (
                    <th key={d} style={overlayStyles.th}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((p, row) => (
                  <tr key={row}>
                    <td style={overlayStyles.td}>{p}</td>
                    {days.map((_, col) => {
                      const isHighlighted = col === 2 && row === 2;
                      return (
                        <td
                          key={col}
                          style={{
                            ...overlayStyles.td,
                            ...(isHighlighted ? overlayStyles.tdHighlighted : {}),
                          }}
                        >
                          {isHighlighted ? '★' : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={overlayStyles.memo}>
              색칠된 칸: <strong>수요일(3번째) × 3교시</strong> — 좌표 (3,3)… 사물함에도 같은 자리가 있다?
            </div>
          </div>
        </div>
      )}

      {/* ── Keypad ── */}
      <Keypad
        open={!!keypadConfig}
        title={keypadConfig?.title ?? ''}
        length={keypadConfig?.length ?? 4}
        onSubmit={handleKeypadSubmit}
        onClose={() => setKeypadConfig(null)}
      />

      {/* ── Two-tap label (touch devices) ── */}
      <TapLabel name={CLASS_ARMED_NAMES[armedId ?? ''] ?? null} />

      {/* ── Narration ── */}
      <Narration text={narration} onDone={() => setNarration(null)} />
    </div>
  );
}

const CLASS_ARMED_NAMES: Record<string, string> = {
  board: '칠판',
  timetable: '시간표',
  locker: '사물함',
  organ: '풍금',
  drawer: '교탁',
  pot: '화분',
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
    maxWidth: '420px',
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
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  th: {
    padding: '6px 10px',
    textAlign: 'center',
    fontWeight: 700,
    color: 'rgba(232,211,168,0.7)',
    borderBottom: '1px solid rgba(232,211,168,0.2)',
    fontSize: '0.85rem',
  },
  td: {
    padding: '6px 10px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(232,211,168,0.1)',
    fontSize: '0.85rem',
  },
  tdHighlighted: {
    backgroundColor: '#c04040',
    color: '#fff',
    fontWeight: 700,
    borderRadius: '4px',
  },
  memo: {
    marginTop: '16px',
    padding: '10px 14px',
    backgroundColor: 'rgba(232,211,168,0.1)',
    border: '1px solid rgba(232,211,168,0.2)',
    borderRadius: '6px',
    fontSize: '0.85rem',
  },
};
