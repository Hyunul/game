'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../lib/GameContext';
import { canAttempt } from '../../lib/gameState';
import { playSfx, playBgm } from '../../lib/audio';
import { fx } from '../../lib/effects';
import Narration from '../Narration';
import Keypad from '../Keypad';
import Whackamole from '../Whackamole';

const SNACKS = [
  { id: 'apollo',   name: '아폴로',   price: 100 },
  { id: 'jjondegi', name: '쫀드기',   price: 150 },
  { id: 'caramel',  name: '캐러멜',   price: 50  },
  { id: 'ramen',    name: '라면땅',   price: 200 },
  { id: 'ojipo',    name: '쥐포',     price: 250 },
  { id: 'gum',      name: '풍선껌',   price: 30  },
];

const CORRECT_SNACKS = new Set(['apollo', 'jjondegi', 'caramel']);

export default function Room3Store() {
  const { state, dispatch } = useGame();
  const { solved, selectedItem, lastResult } = state;

  const [narration, setNarration] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [whackOpen, setWhackOpen] = useState(false);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [crankAnim, setCrankAnim] = useState(false);

  const prevLastResult = useRef<typeof lastResult>(null);
  const prevSolvedLen = useRef(solved.length);

  useEffect(() => { playBgm('store'); }, []);

  useEffect(() => {
    if (lastResult === 'wrong' && lastResult !== prevLastResult.current) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    prevLastResult.current = lastResult;
  }, [lastResult]);

  useEffect(() => {
    if (solved.includes('store-final') && solved.length !== prevSolvedLen.current) {
      fx.shardParticles();
      playSfx('shard');
    }
    prevSolvedLen.current = solved.length;
  }, [solved]);

  function say(text: string) { setNarration(text); }

  const snacksSolved   = solved.includes('store-snacks');
  const arcadeSolved   = solved.includes('store-arcade');
  const paperdollSolved = solved.includes('store-paperdoll');
  const finalSolved    = solved.includes('store-final');

  // ── 진열대 / 쪽지 ──────────────────────────────────────────────────────────────
  function handleShelf() {
    if (snacksSolved) { say('텅 빈 쪽지. 할머니께 심부름을 다 했다.'); return; }
    setShelfOpen(true);
  }

  function toggleSnack(id: string) {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const total = SNACKS.filter((s) => selection.has(s.id)).reduce((sum, s) => sum + s.price, 0);

  function handleGiveGrandma() {
    if (total !== 300) {
      say('300원어치가 아니야.');
      playSfx('wrong');
      return;
    }
    const correct = selection.size === 3 && [...CORRECT_SNACKS].every((id) => selection.has(id));
    if (!correct) {
      say('음… 쪽지에 적힌 게 아닌데?');
      playSfx('wrong');
      return;
    }
    dispatch({ type: 'ATTEMPT', puzzleId: 'store-snacks', answer: '100+150+50' });
    setShelfOpen(false);
    setTimeout(() => say('옳지, 잘 골랐네. 심부름값이다! (100원을 받았다)'), 50);
  }

  // ── 오락기 ────────────────────────────────────────────────────────────────────
  function handleArcade() {
    if (!snacksSolved) { say('오락기가 조용히 잠들어 있다.'); return; }
    if (arcadeSolved) { say('오락기 화면에 CODE 24가 선명하게 빛나고 있다.'); return; }
    if (selectedItem !== 'coin-100') {
      say('동전을 넣어야 움직인다. (인벤토리에서 동전을 선택하고 눌러보자)');
      return;
    }
    if (canAttempt(state, 'store-arcade')) {
      setWhackOpen(true);
    }
  }

  function handleWhackClear() {
    dispatch({ type: 'ATTEMPT', puzzleId: 'store-arcade', answer: '' });
  }

  // ── 종이인형 책 ───────────────────────────────────────────────────────────────
  function handlePaperdoll() {
    if (!arcadeSolved) { say('알록달록한 종이인형 책이다.'); return; }
    if (paperdollSolved) { say('24쪽이 열린 채로 있다. 뽑기 동전이 있던 자리.'); return; }
    if (canAttempt(state, 'store-paperdoll')) {
      setKeypadOpen(true);
    }
  }

  function handleKeypadSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'store-paperdoll', answer });
    setKeypadOpen(false);
    if (answer === '24') {
      setTimeout(() => say('24쪽 사이에 반짝이는 뽑기 동전이 끼워져 있었다!'), 50);
    }
  }

  // ── 뽑기 기계 ─────────────────────────────────────────────────────────────────
  function handleGacha() {
    if (!paperdollSolved || finalSolved) {
      say('영롱한 캡슐들… 전용 동전이 필요하다.');
      return;
    }
    if (selectedItem !== 'coin-gacha') {
      say('영롱한 캡슐들… 전용 동전이 필요하다.');
      return;
    }
    if (canAttempt(state, 'store-final')) {
      setCrankAnim(true);
      setTimeout(() => {
        setCrankAnim(false);
        dispatch({ type: 'ATTEMPT', puzzleId: 'store-final', answer: '' });
      }, 1000);
    }
  }

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className={shake ? 'shake' : undefined}
    >
      <svg
        viewBox="0 0 800 400"
        width="100%"
        style={{ display: 'block' }}
        aria-label="학교 앞 문방구 장면"
      >
        {/* ── Background ── */}
        <rect width="800" height="400" fill="#3b1f0a" />
        {/* Floor */}
        <rect x="0" y="300" width="800" height="100" fill="#5c2e0a" />
        <line x1="0" y1="300" x2="800" y2="300" stroke="#7a4010" strokeWidth="2" />
        {/* Wall planks */}
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={`plank-${i}`} x="0" y={i * 55} width="800" height="54" fill={i % 2 === 0 ? '#3b1f0a' : '#441f08'} />
        ))}
        {/* Ceiling shelf strip */}
        <rect x="0" y="0" width="800" height="14" fill="#2a1008" />

        {/* ── 진열대 (snack shelf) + 쪽지 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={handleShelf}
          role="button"
          aria-label="과자 진열대"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleShelf()}
        >
          {/* Shelf back panel */}
          <rect x="30" y="30" width="300" height="200" rx="4" fill="#2a1208" stroke="#7a4010" strokeWidth="2" />
          {/* Shelf boards */}
          <rect x="30" y="95"  width="300" height="8" rx="2" fill="#7a4010" />
          <rect x="30" y="155" width="300" height="8" rx="2" fill="#7a4010" />
          <rect x="30" y="215" width="300" height="8" rx="2" fill="#7a4010" />

          {/* Snack items on shelf */}
          {/* Row 1: 아폴로(red cone), 쫀드기(yellow bag), 캐러멜(orange) */}
          <rect x="50"  y="65" width="26" height="30" rx="3" fill={snacksSolved ? '#ff444466' : '#ff4444'} />
          <text x="63"  y="87" textAnchor="middle" fontSize="7" fill="#fff">100</text>
          <rect x="100" y="62" width="28" height="33" rx="3" fill={snacksSolved ? '#f9c74f66' : '#f9c74f'} />
          <text x="114" y="87" textAnchor="middle" fontSize="7" fill="#333">150</text>
          <rect x="152" y="66" width="24" height="29" rx="3" fill={snacksSolved ? '#ff8c0066' : '#ff8c00'} />
          <text x="164" y="87" textAnchor="middle" fontSize="7" fill="#fff">50</text>
          {/* Row 2: 라면땅(green), 쥐포(brown), 풍선껌(pink) */}
          <rect x="50"  y="116" width="26" height="30" rx="3" fill="#4caf50" />
          <text x="63"  y="138" textAnchor="middle" fontSize="7" fill="#fff">200</text>
          <rect x="100" y="114" width="28" height="33" rx="3" fill="#8d4e15" />
          <text x="114" y="138" textAnchor="middle" fontSize="7" fill="#fff">250</text>
          <rect x="152" y="118" width="24" height="28" rx="3" fill="#e91e8c" />
          <text x="164" y="138" textAnchor="middle" fontSize="7" fill="#fff">30</text>

          {/* Snack labels row 1 */}
          <text x="63"  y="58" textAnchor="middle" fontSize="7" fill="#f9c74f">아폴로</text>
          <text x="114" y="58" textAnchor="middle" fontSize="7" fill="#f9c74f">쫀드기</text>
          <text x="164" y="58" textAnchor="middle" fontSize="7" fill="#f9c74f">캐러멜</text>
          {/* Snack labels row 2 */}
          <text x="63"  y="112" textAnchor="middle" fontSize="7" fill="#f9c74f">라면땅</text>
          <text x="114" y="112" textAnchor="middle" fontSize="7" fill="#f9c74f">쥐포</text>
          <text x="164" y="112" textAnchor="middle" fontSize="7" fill="#f9c74f">풍선껌</text>

          {/* 쪽지 (note) on shelf */}
          <rect
            x="200" y="55" width="110" height="55" rx="3"
            fill={snacksSolved ? '#e8d3a820' : '#e8d3a8'}
            stroke="#c8a060" strokeWidth="1.5"
          />
          <text x="255" y="72" textAnchor="middle" fontSize="10" fill={snacksSolved ? '#66666688' : '#333'}
            style={{ fontFamily: '"Malgun Gothic", sans-serif' }}>
            할머니가 -
          </text>
          <text x="255" y="88" textAnchor="middle" fontSize="10" fill={snacksSolved ? '#66666688' : '#333'}
            style={{ fontFamily: '"Malgun Gothic", sans-serif' }}>
            300원어치
          </text>
          <text x="255" y="102" textAnchor="middle" fontSize="10" fill={snacksSolved ? '#66666688' : '#333'}
            style={{ fontFamily: '"Malgun Gothic", sans-serif' }}>
            골라줘 ♥
          </text>
        </g>

        {/* ── 오락기 (arcade cabinet) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={handleArcade}
          role="button"
          aria-label="오락기"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleArcade()}
        >
          {/* Cabinet body */}
          <rect x="340" y="100" width="110" height="200" rx="6" fill="#1a1a40" stroke="#4040a0" strokeWidth="2" />
          {/* Screen */}
          <rect x="355" y="115" width="80" height="60" rx="4"
            fill={arcadeSolved ? '#00ff88' : '#000'}
            stroke={arcadeSolved ? '#00ff88' : '#333'} strokeWidth="1.5" />
          {arcadeSolved && (
            <>
              <text x="395" y="138" textAnchor="middle" fontSize="9" fill="#003322">CODE</text>
              <text x="395" y="160" textAnchor="middle" fontSize="22" fontWeight="900" fill="#003322">24</text>
            </>
          )}
          {!arcadeSolved && (
            <text x="395" y="148" textAnchor="middle" fontSize="9" fill="#334">— —</text>
          )}
          {/* Coin slot */}
          <rect x="385" y="182" width="20" height="5" rx="2" fill="#555" stroke="#777" strokeWidth="1" />
          <text x="395" y="179" textAnchor="middle" fontSize="7" fill="#888">↓100원</text>
          {/* Joystick */}
          <circle cx="380" cy="260" r="12" fill="#c00" stroke="#900" strokeWidth="1.5" />
          <rect x="376" y="248" width="8" height="14" rx="4" fill="#800" />
          {/* Buttons */}
          <circle cx="410" cy="256" r="8" fill="#f90" />
          <circle cx="426" cy="256" r="8" fill="#0af" />
          {/* Label */}
          <text x="395" y="295" textAnchor="middle" fontSize="9" fill="#6688cc">ARCADE</text>
        </g>

        {/* ── 종이인형 책 stack ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={handlePaperdoll}
          role="button"
          aria-label="종이인형 책"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handlePaperdoll()}
        >
          {/* Books stacked */}
          <rect x="475" y="200" width="70" height="10" rx="2" fill="#e05a80" stroke="#b03060" strokeWidth="1" />
          <rect x="478" y="192" width="68" height="10" rx="2" fill="#e87090" stroke="#b03060" strokeWidth="1" />
          <rect x="476" y="184" width="70" height="10" rx="2" fill="#f090a8" stroke="#b03060" strokeWidth="1" />
          <rect x="479" y="176" width="66" height="10" rx="2" fill="#f4a0b8" stroke="#b03060" strokeWidth="1" />
          {/* Top book open (if solved) */}
          {paperdollSolved ? (
            <>
              <rect x="476" y="156" width="70" height="22" rx="2" fill="#f9c7d8" stroke="#b03060" strokeWidth="1" />
              <line x1="511" y1="158" x2="511" y2="176" stroke="#b03060" strokeWidth="1" strokeDasharray="2 2" />
              <text x="493" y="170" textAnchor="middle" fontSize="7" fill="#b03060">24</text>
            </>
          ) : (
            <rect x="476" y="158" width="70" height="20" rx="2" fill="#fbb0c8" stroke="#b03060" strokeWidth="1" />
          )}
          <text x="511" y="222" textAnchor="middle" fontSize="8" fill="#fbb0c8">종이인형</text>
        </g>

        {/* ── 뽑기 기계 (gacha machine) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={handleGacha}
          role="button"
          aria-label="뽑기 기계"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleGacha()}
        >
          {/* Base */}
          <rect x="590" y="210" width="130" height="90" rx="6" fill="#2a1a50" stroke="#6040a0" strokeWidth="2" />
          {/* Globe */}
          <circle cx="655" cy="175" r="60" fill="#d0f0ff" fillOpacity="0.15" stroke="#6040a0" strokeWidth="2" />
          {/* Capsules inside globe */}
          {[
            { cx: 640, cy: 165, fill: finalSolved ? '#ffd700' : '#ff6b6b' },
            { cx: 665, cy: 155, fill: finalSolved ? '#ffd700' : '#6bffa0' },
            { cx: 650, cy: 185, fill: finalSolved ? '#ffd700' : '#6b9fff' },
            { cx: 670, cy: 180, fill: finalSolved ? '#ffd700' : '#ffb06b' },
          ].map((c, i) => (
            <ellipse key={i} cx={c.cx} cy={c.cy} rx="9" ry="6" fill={c.fill} opacity="0.85" />
          ))}
          {/* Crank */}
          <g
            style={{
              transformOrigin: '720px 230px',
              transform: crankAnim ? 'rotate(360deg)' : 'none',
              transition: crankAnim ? 'transform 1s linear' : 'none',
            }}
          >
            <circle cx="720" cy="230" r="8" fill="#f9c74f" stroke="#c8a030" strokeWidth="1.5" />
            <line x1="720" y1="230" x2="720" y2="210" stroke="#c8a030" strokeWidth="3" strokeLinecap="round" />
            <circle cx="720" cy="210" r="5" fill="#f9c74f" stroke="#c8a030" strokeWidth="1.5" />
          </g>
          {/* Coin slot */}
          <rect x="638" y="212" width="34" height="6" rx="3" fill="#333" stroke="#6040a0" strokeWidth="1" />
          <text x="655" y="210" textAnchor="middle" fontSize="7" fill="#a080e0">↓동전</text>
          <text x="655" y="295" textAnchor="middle" fontSize="9" fill="#a080e0">뽑기 기계</text>
        </g>

        {/* ── Scene label ── */}
        <text x="400" y="390" textAnchor="middle" fontSize="9" fill="#7a4010" opacity="0.5">
          학교 앞 문방구
        </text>
      </svg>

      {/* ── Snack shelf overlay ── */}
      {shelfOpen && (
        <div style={OL.overlay} onClick={() => setShelfOpen(false)}>
          <div style={OL.card} onClick={(e) => e.stopPropagation()}>
            <button style={OL.closeBtn} onClick={() => setShelfOpen(false)} aria-label="닫기">✕</button>
            <h2 style={OL.title}>300원어치 골라줘 — 할머니가</h2>
            <div style={OL.snackGrid}>
              {SNACKS.map((s) => {
                const on = selection.has(s.id);
                return (
                  <button
                    key={s.id}
                    style={{ ...OL.snackBtn, ...(on ? OL.snackBtnOn : {}) }}
                    onClick={() => toggleSnack(s.id)}
                  >
                    <span style={OL.snackName}>{s.name}</span>
                    <span style={OL.snackPrice}>{s.price}원</span>
                  </button>
                );
              })}
            </div>
            <div style={OL.totalRow}>
              합계: <strong style={{ color: total === 300 ? '#4caf50' : '#ff6b6b' }}>{total}원</strong>
              {' / 300원'}
            </div>
            <button style={OL.giveBtn} onClick={handleGiveGrandma}>할머니께 드리기</button>
          </div>
        </div>
      )}

      {/* ── Whack-a-mole ── */}
      <Whackamole
        open={whackOpen}
        onClear={handleWhackClear}
        onClose={() => setWhackOpen(false)}
      />

      {/* ── Keypad (paperdoll) ── */}
      <Keypad
        open={keypadOpen}
        title="몇 쪽을 펼칠까?"
        length={2}
        onSubmit={handleKeypadSubmit}
        onClose={() => setKeypadOpen(false)}
      />

      {/* ── Narration ── */}
      <Narration text={narration} onDone={() => setNarration(null)} />
    </div>
  );
}

const OL: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(10,6,2,0.80)',
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
    maxWidth: '400px',
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
    fontSize: '1rem',
    marginBottom: '18px',
    fontWeight: 600,
    textAlign: 'center',
    lineHeight: 1.4,
  },
  snackGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginBottom: '16px',
  },
  snackBtn: {
    padding: '10px 12px',
    backgroundColor: '#3a2810',
    border: '1.5px solid rgba(232,211,168,0.2)',
    borderRadius: '8px',
    color: '#e8d3a8',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.9rem',
  },
  snackBtnOn: {
    backgroundColor: '#7a4f1e',
    border: '1.5px solid #f9c74f',
  },
  snackName: { fontWeight: 600 },
  snackPrice: { opacity: 0.75, fontSize: '0.85rem' },
  totalRow: {
    textAlign: 'center',
    fontSize: '1rem',
    marginBottom: '16px',
  },
  giveBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    backgroundColor: '#7a4f1e',
    color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.4)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
