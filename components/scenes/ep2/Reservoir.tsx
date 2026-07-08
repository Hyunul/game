'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { canAttemptWith } from '../../../lib/gameState';
import { playSfx, playBgm } from '../../../lib/audio';
import TapLabel from '../../TapLabel';
import { useTwoTap } from '../../../lib/useTwoTap';

interface Card {
  num: number;
  icon: string;
  text: string;
  source: string;
}

const CARDS: Card[] = [
  { num: 1, icon: '🎣', text: '8월 14일 — 형이 영호의 낚싯대를 빼앗아 헛간에 잠갔다', source: '어머니의 일기' },
  { num: 2, icon: '💌', text: '8월 14일 밤 — 형은 부치지 못할 편지를 썼다', source: '형의 편지' },
  { num: 3, icon: '🌒', text: '8월 15일 초저녁 — 영호가 몰래 집을 나섰다', source: '일기·필적 감정' },
  { num: 4, icon: '🏃', text: '밤 11시 — 고함. 한 사람이 맨손으로 물가로 달려갔다', source: '이장 조서' },
  { num: 5, icon: '⌚', text: '밤 11시 40분 — 회중시계가 물속에서 멈췄다', source: '열린 회중시계' },
  { num: 6, icon: '🪣', text: '그날 밤의 짐 — 낚싯대 하나와 양동이, 1인분뿐', source: '도구 걸이' },
  { num: 7, icon: '🌅', text: '8월 16일 새벽 — 영호가 젖은 채 홀로 돌아왔다', source: '일기' },
];

// 고정 셔플 순서 (스펙: 무작위 순서로 제시, 순서 고정)
const SHUFFLE_ORDER = [4, 1, 6, 3, 7, 2, 5];

export default function Reservoir() {
  const { state, dispatch, episode } = useGame();
  const { wrongAttempts } = state;
  const { guard, armedId } = useTwoTap();

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [slots, setSlots] = useState<(number | null)[]>([null, null, null, null, null, null, null]);
  // 오답 피드백 — 오버레이(z=70)가 열린 채라 Narration(z=45)은 가려지므로 패널 안에 표시
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const prevWrongAttempts = useRef(wrongAttempts);
  const lastWasMurderOrder = useRef(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (shakeTimer.current !== null) clearTimeout(shakeTimer.current);
  }, []);

  useEffect(() => {
    playBgm('ep2-night');
  }, []);

  useEffect(() => {
    if (wrongAttempts > prevWrongAttempts.current) {
      setShake(true);
      setFeedback(
        lastWasMurderOrder.current
          ? '…정말 그럴까? 조서를 다시 보자. 물가로 달려간 사람은 맨손이었다. 그리고 시계는, 그보다 뒤에 멈췄다.'
          : '무언가 앞뒤가 맞지 않는다…',
      );
      shakeTimer.current = setTimeout(() => setShake(false), 600);
    }
    prevWrongAttempts.current = wrongAttempts;
  }, [wrongAttempts]);

  function canAttempt(puzzleId: string) {
    return canAttemptWith(episode, state, puzzleId);
  }

  const placed = slots.filter((s) => s !== null) as number[];
  const pool = CARDS.filter((c) => !placed.includes(c.num));
  const poolOrdered = SHUFFLE_ORDER.map((n) => pool.find((c) => c.num === n)).filter(
    (c): c is Card => c !== undefined,
  );

  function placeCard(num: number) {
    const emptyIdx = slots.findIndex((s) => s === null);
    if (emptyIdx === -1) return;
    playSfx('click');
    setFeedback(null);
    const next = [...slots];
    next[emptyIdx] = num;
    setSlots(next);
  }

  function returnCard(idx: number) {
    playSfx('click');
    setFeedback(null);
    const next = [...slots];
    next[idx] = null;
    setSlots(next);
  }

  function handleSubmit() {
    if (placed.length !== 7 || !canAttempt('ep2-timeline')) return;
    const answer = slots.join('-');
    const idx4 = slots.indexOf(4);
    const idx5 = slots.indexOf(5);
    lastWasMurderOrder.current = idx4 !== -1 && idx5 !== -1 && idx4 > idx5;
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep2-timeline', answer });
  }

  function handleShoreClick() {
    setOverlayOpen(true);
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        viewBox="0 0 800 400"
        width="100%"
        style={{ display: 'block' }}
        aria-label="저수지 가는 길 장면"
      >
        {/* Night sky */}
        <rect width="800" height="400" fill="#0e1a3a" />
        {/* Moon */}
        <circle cx="650" cy="70" r="36" fill="#f0edd8" opacity="0.95" />
        {/* Stars */}
        {[
          { cx: 100, cy: 50 }, { cx: 200, cy: 90 }, { cx: 340, cy: 40 },
          { cx: 480, cy: 30 }, { cx: 560, cy: 100 }, { cx: 60, cy: 130 },
        ].map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={i % 2 === 0 ? 1.5 : 1} fill="#fff" opacity="0.75" />
        ))}

        {/* Water */}
        <rect x="0" y="230" width="800" height="170" fill="#16254a" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M0 ${250 + i * 28} Q 200 ${240 + i * 28} 400 ${250 + i * 28} T 800 ${250 + i * 28}`}
            stroke="#2a3f6e"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
        ))}
        {/* Moon reflection */}
        <ellipse cx="650" cy="260" rx="20" ry="8" fill="#f0edd8" opacity="0.3" />

        {/* Reeds */}
        {[40, 60, 90, 720, 750, 770].map((x, i) => (
          <path
            key={i}
            d={`M${x} 235 Q ${x + 5} 200 ${x - 3} 170`}
            stroke="#2c3a24"
            strokeWidth="3"
            fill="none"
            opacity="0.8"
          />
        ))}

        {/* Lantern light near shore */}
        <circle cx="400" cy="215" r="18" fill="#ffd24a" opacity="0.35" />
        <circle cx="400" cy="215" r="7" fill="#ffd24a" opacity="0.85" />

        {/* 물가 hotspot */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('shore', handleShoreClick); }}
          role="button"
          aria-label="물가"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && guard('shore', handleShoreClick)}
        >
          <ellipse cx="400" cy="232" rx="140" ry="14" fill="#000" opacity="0" />
          <text x="400" y="200" textAnchor="middle" fontSize="12" fill="#e8d3a8" opacity="0.7">
            물가를 살펴본다
          </text>
        </g>
      </svg>

      {overlayOpen && (
        <div style={overlayStyles.overlay}>
          <div className={shake ? 'shake' : undefined} style={overlayStyles.panel}>
            <h3 style={overlayStyles.title}>그날 밤의 타임라인</h3>
            <p style={overlayStyles.hint}>일곱 조각을 시간 순서대로 배열하세요.</p>
            {feedback && <p style={overlayStyles.feedback}>{feedback}</p>}

            {/* Slots */}
            <div style={overlayStyles.slotRow}>
              {slots.map((num, idx) => {
                const card = num !== null ? CARDS.find((c) => c.num === num) : null;
                return (
                  <div
                    key={idx}
                    style={overlayStyles.slot}
                    onClick={() => card && returnCard(idx)}
                    role={card ? 'button' : undefined}
                  >
                    {card ? (
                      <>
                        <span style={overlayStyles.slotIcon}>{card.icon}</span>
                        <span style={overlayStyles.slotNum}>{idx + 1}</span>
                      </>
                    ) : (
                      <span style={overlayStyles.slotEmpty}>{idx + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pool */}
            <div style={overlayStyles.pool}>
              {poolOrdered.map((card) => (
                <div
                  key={card.num}
                  style={overlayStyles.card}
                  onClick={() => placeCard(card.num)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && placeCard(card.num)}
                >
                  <span style={overlayStyles.cardIcon}>{card.icon}</span>
                  <span style={overlayStyles.cardTextWrap}>
                    <span style={overlayStyles.cardText}>{card.text}</span>
                    <span style={overlayStyles.cardSource}>{card.source}</span>
                  </span>
                </div>
              ))}
            </div>

            <button
              style={{
                ...overlayStyles.submitBtn,
                opacity: placed.length === 7 ? 1 : 0.4,
                pointerEvents: placed.length === 7 ? 'auto' : 'none',
              }}
              onClick={handleSubmit}
            >
              이것이 그날 밤의 진실
            </button>

            <button style={overlayStyles.closeBtn} onClick={() => setOverlayOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      )}

      <TapLabel name={armedId === 'shore' ? '물가를 살펴본다' : null} />
    </div>
  );
}

const overlayStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(6,4,10,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 70,
    padding: '16px',
  },
  panel: {
    backgroundColor: '#161225',
    border: '1px solid rgba(232,211,168,0.25)',
    borderRadius: '12px',
    padding: '20px',
    width: 'min(560px, 100%)',
    maxHeight: '90%',
    overflowY: 'auto',
  },
  title: {
    margin: '0 0 4px',
    color: '#ffd24a',
    fontSize: '1.1rem',
    textAlign: 'center',
  },
  hint: {
    margin: '0 0 16px',
    color: 'rgba(232,211,168,0.7)',
    fontSize: '0.82rem',
    textAlign: 'center',
  },
  feedback: {
    margin: '0 0 16px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(200,88,88,0.15)',
    border: '1px solid rgba(200,88,88,0.4)',
    color: '#e8b8a8',
    fontSize: '0.85rem',
    lineHeight: 1.6,
  },
  slotRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '18px',
    flexWrap: 'wrap',
  },
  slot: {
    width: '56px',
    height: '56px',
    borderRadius: '8px',
    border: '1px dashed rgba(232,211,168,0.4)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  slotIcon: { fontSize: '1.3rem' },
  slotNum: { fontSize: '0.6rem', color: 'rgba(232,211,168,0.5)' },
  slotEmpty: { fontSize: '0.85rem', color: 'rgba(232,211,168,0.3)' },
  pool: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '18px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(232,211,168,0.08)',
    border: '1px solid rgba(232,211,168,0.2)',
    cursor: 'pointer',
    color: '#e8d3a8',
    fontSize: '0.85rem',
  },
  cardIcon: { fontSize: '1.2rem' },
  cardTextWrap: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  cardText: { flex: 1 },
  cardSource: { fontSize: '0.68rem', color: 'rgba(232,211,168,0.45)' },
  submitBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '0.95rem',
    fontWeight: 600,
    backgroundColor: 'rgba(255,210,74,0.9)',
    color: '#1a1410',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  closeBtn: {
    width: '100%',
    padding: '8px',
    fontSize: '0.82rem',
    backgroundColor: 'transparent',
    color: 'rgba(232,211,168,0.6)',
    border: '1px solid rgba(232,211,168,0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
