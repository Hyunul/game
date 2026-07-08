'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../lib/GameContext';
import { canAttempt } from '../../lib/gameState';
import { playSfx, playBgm } from '../../lib/audio';
import { fx } from '../../lib/effects';
import Narration from '../Narration';
import Keypad from '../Keypad';
import TapLabel from '../TapLabel';
import { useTwoTap } from '../../lib/useTwoTap';
import { useShake } from '../../lib/useShake';

export default function Room1Home() {
  const { state, dispatch } = useGame();
  const { solved, inventory, selectedItem, wrongAttempts } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [keypadConfig, setKeypadConfig] = useState<{
    title: string; length: number; puzzleId: string;
  } | null>(null);
  const shake = useShake(wrongAttempts);

  // Play home BGM on mount
  useEffect(() => {
    playBgm('home');
  }, []);

  // Trigger shard particles + sfx when home-final is solved
  const prevSolvedLen = useRef(solved.length);
  useEffect(() => {
    if (solved.includes('home-final') && solved.length !== prevSolvedLen.current) {
      fx.shardParticles();
      playSfx('shard');
    }
    prevSolvedLen.current = solved.length;
  }, [solved]);

  function say(text: string) {
    setNarration(text);
  }

  // ── Calendar ──────────────────────────────────────────────────────────────
  function handleCalendar() {
    if (!solved.includes('home-calendar')) {
      setCalendarOpen(true);
      dispatch({ type: 'SOLVE', puzzleId: 'home-calendar' });
      playSfx('pickup');
    } else {
      setCalendarOpen(true);
    }
  }

  // ── Family photo ──────────────────────────────────────────────────────────
  function handlePhoto() {
    dispatch({ type: 'PICKUP', itemId: 'photo' });
    say('사진 뒷면에 \'채널 7\'이라고 적혀 있다.');
  }

  // ── Phone ─────────────────────────────────────────────────────────────────
  function handlePhone() {
    if (canAttempt(state, 'home-phone')) {
      setKeypadConfig({ title: '다이얼을 돌려보자', length: 4, puzzleId: 'home-phone' });
    } else if (solved.includes('home-phone')) {
      say('수화기 너머: "…TV를 켜보렴."');
    } else {
      say('지금은 걸 곳이 없다.');
    }
  }

  // ── TV ────────────────────────────────────────────────────────────────────
  function handleTv() {
    if (solved.includes('home-tv')) {
      // already solved; screen shows 1987 — no extra action needed
      say('"1987" — 화면이 선명하게 빛나고 있다.');
    } else if (canAttempt(state, 'home-tv')) {
      setKeypadConfig({ title: '채널을 맞춰보자', length: 1, puzzleId: 'home-tv' });
    } else {
      say('지직… 아무것도 나오지 않는다.');
    }
  }

  // ── Backscratcher ─────────────────────────────────────────────────────────
  function handleBackscratcher() {
    if (!inventory.includes('backscratcher')) {
      dispatch({ type: 'PICKUP', itemId: 'backscratcher' });
      playSfx('pickup');
      say('할머니의 효자손이다.');
    }
  }

  // ── Sewing box / wardrobe ──────────────────────────────────────────────────
  function handleSewingbox() {
    if (selectedItem === 'backscratcher' && canAttempt(state, 'home-sewingbox')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'home-sewingbox', answer: '' });
      say('효자손으로 반짇고리를 끌어내렸다! 작은 열쇠가 들어 있다.');
    } else {
      say('장롱 위에 반짇고리가 보이지만 손이 닿지 않는다.');
    }
  }

  // ── Mother-of-pearl chest (final) ─────────────────────────────────────────
  function handleChest() {
    if (selectedItem === 'sewingbox-key' && canAttempt(state, 'home-final')) {
      setKeypadConfig({ title: '자개장 자물쇠', length: 4, puzzleId: 'home-final' });
    } else {
      say('자개나비가 빛나는 옛날 장롱. 열쇠 구멍과 숫자판이 있다.');
    }
  }

  // ── Keypad submit ──────────────────────────────────────────────────────────
  function handleKeypadSubmit(answer: string) {
    if (!keypadConfig) return;
    const { puzzleId } = keypadConfig;
    dispatch({ type: 'ATTEMPT', puzzleId, answer });
    setKeypadConfig(null);
    if (puzzleId === 'home-phone') {
      // result will be checked via lastResult; show narration on correct
      // use a tiny timeout so reducer has run
      setTimeout(() => {
        // We can't read new state here, but we know the answer is 0508
        if (answer === '0508') {
          setNarration('수화기 너머: "…TV를 켜보렴."');
        }
      }, 50);
    }
  }

  const backscratcherPickedUp = inventory.includes('backscratcher');
  const sewingboxSolved = solved.includes('home-sewingbox');
  const tvSolved = solved.includes('home-tv');
  const finalSolved = solved.includes('home-final');
  const calendarSolved = solved.includes('home-calendar');

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className={shake}
    >
      <svg
        viewBox="0 0 800 400"
        width="100%"
        style={{ display: 'block' }}
        aria-label="옛날 우리 집 안방 장면"
      >
        {/* ── Background: warm wallpaper ── */}
        <rect width="800" height="400" fill="#d4b896" />

        {/* Floral wallpaper pattern (repeating circles) */}
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 12 }).map((_, col) => (
            <circle
              key={`wp-${row}-${col}`}
              cx={col * 68 + (row % 2) * 34}
              cy={row * 55}
              r="8"
              fill="none"
              stroke="#c4a07a"
              strokeWidth="1"
              opacity="0.4"
            />
          ))
        )}

        {/* Floor (장판 — warm yellow-green linoleum) */}
        <rect x="0" y="310" width="800" height="90" fill="#c8b46a" />
        <line x1="0" y1="310" x2="800" y2="310" stroke="#a89040" strokeWidth="2" />
        {/* Floor grain lines */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`fl-${i}`}
            x1="0" y1={320 + i * 13}
            x2="800" y2={320 + i * 13}
            stroke="#b8a050" strokeWidth="0.5" opacity="0.5"
          />
        ))}

        {/* ── Left wall area ── */}
        {/* Wardrobe (장롱) */}
        <rect x="30" y="160" width="140" height="150" rx="4" fill="#8b5e3c" stroke="#6b4020" strokeWidth="2" />
        <rect x="35" y="165" width="62" height="140" rx="2" fill="#7a5030" />
        <rect x="101" y="165" width="64" height="140" rx="2" fill="#7a5030" />
        {/* Wardrobe handles */}
        <circle cx="96" cy="242" r="5" fill="#c8a050" stroke="#a07030" strokeWidth="1" />
        <circle cx="108" cy="242" r="5" fill="#c8a050" stroke="#a07030" strokeWidth="1" />
        {/* Wardrobe top decorative strip */}
        <rect x="30" y="160" width="140" height="14" rx="4" fill="#9b6e4c" />

        {/* Sewing box (반짇고리) on top of wardrobe, or lower if solved */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={() => guard('sewingbox', handleSewingbox)}
          role="button"
          aria-label="장롱 위 반짇고리"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleSewingbox()}
          transform={sewingboxSolved ? 'translate(0, 50)' : 'translate(0, 0)'}
        >
          {/* Enlarged hit area */}
          <rect x="62" y="128" width="72" height="44" rx="4" fill="transparent" pointerEvents="all" />
          {/* Sewing box body */}
          <rect x="68" y="135" width="60" height="30" rx="4" fill="#e8c090" stroke="#c8a060" strokeWidth="1.5" />
          <rect x="68" y="135" width="60" height="10" rx="4" fill="#f0d0a0" />
          {/* Decorative flower on lid */}
          <circle cx="98" cy="140" r="4" fill="#e05050" opacity="0.7" />
          <circle cx="94" cy="143" r="3" fill="#e05050" opacity="0.5" />
          <circle cx="102" cy="143" r="3" fill="#e05050" opacity="0.5" />
        </g>

        {/* ── Calendar (벽걸이 달력) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={() => guard('calendar', handleCalendar)}
          role="button"
          aria-label="벽걸이 달력"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleCalendar()}
        >
          {/* Nail */}
          <circle cx="310" cy="62" r="3" fill="#888" />
          {/* String */}
          <line x1="310" y1="65" x2="280" y2="78" stroke="#888" strokeWidth="1" />
          <line x1="310" y1="65" x2="340" y2="78" stroke="#888" strokeWidth="1" />
          {/* Calendar body */}
          <rect x="268" y="76" width="84" height="100" rx="3" fill="#f5f0e8" stroke="#c8a878" strokeWidth="1.5" />
          {/* Header strip */}
          <rect x="268" y="76" width="84" height="22" rx="3" fill="#d04040" />
          <text x="310" y="92" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">5월</text>
          {/* Grid lines */}
          {[0,1,2,3,4,5,6].map((i) => (
            <text key={`d-${i}`} x={274 + i * 12} y="112" fontSize="8" fill="#999" textAnchor="middle">
              {['일','월','화','수','목','금','토'][i]}
            </text>
          ))}
          {/* Day 8 circled */}
          <circle cx={274 + 2 * 12} cy="128" r="7" fill="none" stroke="#d04040" strokeWidth="1.5" />
          <text x={274 + 2 * 12} y="132" textAnchor="middle" fontSize="9" fill="#333">8</text>
          {/* Memo ribbon */}
          {calendarSolved && (
            <>
              <rect x="272" y="152" width="76" height="20" rx="2" fill="#fffacd" stroke="#c8a060" strokeWidth="1" />
              <text x="310" y="165" textAnchor="middle" fontSize="7" fill="#664400">우리 가족 기념일</text>
            </>
          )}
        </g>

        {/* ── Family photo (가족사진 액자) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={() => guard('photo', handlePhoto)}
          role="button"
          aria-label="가족사진 액자"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handlePhoto()}
        >
          {/* Frame */}
          <rect x="390" y="60" width="80" height="66" rx="3" fill="#7a5030" stroke="#5a3810" strokeWidth="2" />
          <rect x="396" y="66" width="68" height="54" rx="1" fill="#d4c0a0" />
          {/* Photo content - simple family silhouette */}
          <rect x="396" y="66" width="68" height="54" rx="1" fill="#e8d8b8" />
          <ellipse cx="415" cy="92" rx="7" ry="9" fill="#c8a878" />
          <ellipse cx="430" cy="88" rx="7" ry="9" fill="#c8a878" />
          <ellipse cx="450" cy="92" rx="6" ry="8" fill="#c8a878" />
          <text x="430" y="112" textAnchor="middle" fontSize="7" fill="#886040" opacity="0.7">가족사진</text>
          {/* Glint if photo picked up */}
          {inventory.includes('photo') && (
            <circle cx="464" cy="66" r="5" fill="#ffd24a" opacity="0.6" />
          )}
        </g>

        {/* ── Dial phone (다이얼 전화기) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={() => guard('phone', handlePhone)}
          role="button"
          aria-label="다이얼 전화기"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handlePhone()}
        >
          {/* Small table */}
          <rect x="500" y="260" width="100" height="50" rx="3" fill="#9b6e4c" stroke="#7a5030" strokeWidth="1" />
          {/* Phone body */}
          <rect x="508" y="228" width="84" height="40" rx="8" fill="#2a2420" stroke="#444" strokeWidth="1.5" />
          {/* Handset */}
          <rect x="512" y="222" width="76" height="14" rx="7" fill="#1a1410" stroke="#333" strokeWidth="1" />
          {/* Dial circle */}
          <circle cx="550" cy="248" r="14" fill="#1a1410" stroke="#555" strokeWidth="1.5" />
          <circle cx="550" cy="248" r="9" fill="#333" />
          {/* Dial holes */}
          {Array.from({ length: 9 }).map((_, i) => {
            const angle = (i / 9) * 2 * Math.PI - Math.PI / 2;
            return (
              <circle
                key={`dh-${i}`}
                cx={550 + 11 * Math.cos(angle)}
                cy={248 + 11 * Math.sin(angle)}
                r="2"
                fill="#555"
              />
            );
          })}
          {/* Solved indicator */}
          {solved.includes('home-phone') && (
            <circle cx="585" cy="228" r="4" fill="#4a9" opacity="0.8" />
          )}
        </g>

        {/* ── CRT TV (브라운관 TV) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={() => guard('tv', handleTv)}
          role="button"
          aria-label="브라운관 TV"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleTv()}
        >
          {/* TV cabinet */}
          <rect x="610" y="170" width="170" height="140" rx="8" fill="#2a2220" stroke="#3a3028" strokeWidth="2" />
          {/* Screen bezel */}
          <rect x="622" y="180" width="120" height="90" rx="6" fill="#111" stroke="#222" strokeWidth="1.5" />
          {/* Screen */}
          {tvSolved ? (
            <>
              <rect x="626" y="184" width="112" height="82" rx="4" fill="#001a00" />
              {/* Glowing "1987" */}
              <text
                x="682"
                y="230"
                textAnchor="middle"
                fontSize="28"
                fill="#00ff44"
                fontWeight="700"
                style={{ fontFamily: 'monospace' }}
                filter="url(#tvGlow)"
              >
                1987
              </text>
            </>
          ) : (
            /* Static gray screen */
            <rect x="626" y="184" width="112" height="82" rx="4" fill="#3a3a3a" />
          )}
          {/* TV knobs */}
          <circle cx="758" cy="200" r="6" fill="#444" stroke="#333" strokeWidth="1" />
          <circle cx="758" cy="220" r="6" fill="#444" stroke="#333" strokeWidth="1" />
          <circle cx="758" cy="240" r="6" fill="#444" stroke="#333" strokeWidth="1" />
          {/* TV legs */}
          <rect x="630" y="308" width="18" height="20" rx="2" fill="#2a2220" />
          <rect x="752" y="308" width="18" height="20" rx="2" fill="#2a2220" />
          {/* Defs for glow */}
          <defs>
            <filter id="tvGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </g>

        {/* ── Backscratcher (효자손) in corner ── */}
        {!backscratcherPickedUp && (
          <g
            className="hotspot"
            style={{ cursor: 'pointer' }}
            onClick={() => guard('backscratcher', handleBackscratcher)}
            role="button"
            aria-label="효자손"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleBackscratcher()}
          >
            {/* Enlarged hit area */}
            <rect x="190" y="278" width="44" height="70" rx="4" fill="transparent" pointerEvents="all" />
            {/* Leaning in corner */}
            <line x1="200" y1="290" x2="215" y2="310" stroke="#9b6e4c" strokeWidth="6" strokeLinecap="round" />
            <line x1="215" y1="310" x2="215" y2="340" stroke="#c8a060" strokeWidth="4" strokeLinecap="round" />
            {/* Hand tip */}
            <ellipse cx="200" cy="288" rx="6" ry="4" fill="#c8a060" transform="rotate(-20 200 288)" />
          </g>
        )}

        {/* ── Mother-of-pearl chest (자개장) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={() => guard('chest', handleChest)}
          role="button"
          aria-label="자개장"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleChest()}
        >
          {/* Chest body */}
          <rect x="220" y="220" width="130" height="90" rx="4" fill="#4a3018" stroke="#2a1808" strokeWidth="2" />
          {/* Mother-of-pearl inlay (iridescent tiles) */}
          {[
            {x: 230, y: 235}, {x: 252, y: 235}, {x: 274, y: 235},
            {x: 230, y: 258}, {x: 252, y: 258}, {x: 274, y: 258},
            {x: 296, y: 235}, {x: 318, y: 235},
            {x: 296, y: 258}, {x: 318, y: 258},
          ].map((pos, i) => (
            <rect
              key={`mop-${i}`}
              x={pos.x} y={pos.y}
              width="18" height="18"
              rx="2"
              fill={['#c8e8f0','#d8f0e0','#e8d0f8','#f0e8c0'][i % 4]}
              opacity="0.75"
            />
          ))}
          {/* Butterfly motif */}
          <ellipse cx="285" cy="278" rx="12" ry="6" fill="#d0a850" opacity="0.7" />
          <ellipse cx="285" cy="278" rx="6" ry="4" fill="#e8c070" opacity="0.8" transform="rotate(30 285 278)" />
          <ellipse cx="285" cy="278" rx="6" ry="4" fill="#e8c070" opacity="0.8" transform="rotate(-30 285 278)" />
          {/* Lock */}
          <rect x="279" y="283" width="12" height="9" rx="2" fill="#8a6030" stroke="#5a3810" strokeWidth="1" />
          <rect x="281" y="280" width="8" height="5" rx="4" fill="none" stroke="#8a6030" strokeWidth="1.5" />
          {/* Keyhole */}
          <circle cx="285" cy="287" r="2" fill="#2a1808" />
          <line x1="285" y1="289" x2="285" y2="292" stroke="#2a1808" strokeWidth="1.5" />
          {/* Open drawer if solved */}
          {finalSolved && (
            <rect x="222" y="295" width="126" height="16" rx="2" fill="#3a2010" stroke="#2a1808" strokeWidth="1"
              transform="translate(0, 5)" />
          )}
        </g>
      </svg>

      {/* ── Calendar overlay ── */}
      {calendarOpen && (
        <div style={overlayStyles.overlay} onClick={() => setCalendarOpen(false)}>
          <div style={overlayStyles.card} onClick={(e) => e.stopPropagation()}>
            <button
              style={overlayStyles.closeBtn}
              onClick={() => setCalendarOpen(false)}
              aria-label="닫기"
            >
              ✕
            </button>
            <h2 style={overlayStyles.title}>5월 달력</h2>
            {/* Calendar grid */}
            <div style={overlayStyles.calGrid}>
              {['일','월','화','수','목','금','토'].map((d) => (
                <div key={d} style={overlayStyles.calHeader}>{d}</div>
              ))}
              {/* First week padding (May 1 = Monday = col index 1) */}
              <div />
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const isCircled = day === 8;
                return (
                  <div
                    key={day}
                    style={{
                      ...overlayStyles.calDay,
                      ...(isCircled ? overlayStyles.calDayCircled : {}),
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            {calendarSolved && (
              <div style={overlayStyles.memo}>
                📝 우리 가족 기념일 — <strong>0508</strong>
              </div>
            )}
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
      <TapLabel name={HOME_ARMED_NAMES[armedId ?? ''] ?? null} />

      {/* ── Narration ── */}
      <Narration text={narration} onDone={() => setNarration(null)} />
    </div>
  );
}

const HOME_ARMED_NAMES: Record<string, string> = {
  sewingbox: '반짇고리',
  calendar: '달력',
  photo: '가족사진',
  phone: '전화기',
  tv: 'TV',
  backscratcher: '효자손',
  chest: '자개장',
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
