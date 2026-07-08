'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { canAttemptWith } from '../../../lib/gameState';
import { playSfx, playBgm } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';
import TapLabel from '../../TapLabel';
import RoomNav from '../../RoomNav';
import OrderPicker from '../../puzzles/OrderPicker';
import CompareViewer from '../../puzzles/CompareViewer';
import NameLock from '../../puzzles/NameLock';
import { useTwoTap } from '../../../lib/useTwoTap';
import { useShake } from '../../../lib/useShake';
import {
  EP3_LEDGER_LINES, EP3_LETTER_LINES, EP3_TRUTH_PAIRS, EP3_TRUTH_REVEALS,
} from '../../../lib/puzzles-ep3';

const TRUTH_IDS = Object.keys(EP3_TRUTH_PAIRS);

/** 문갑의 편지봉투 — 전시 위치(e1~e6)와 소인. 번진 것은 가계부와 대조해 복원한다 */
const ENVELOPE_ITEMS = [
  { id: 'e1', label: '봉투 — 소인: 69년 봄', desc: '"재봉틀" 무렵' },
  { id: 'e2', label: '봉투 — 소인: (번짐) 가을', desc: '보름 쌀이 시작된 해' },
  { id: 'e3', label: '봉투 — 소인: 75년 가을', desc: '기록이 끝난 계절' },
  { id: 'e4', label: '봉투 — 소인: 68년 겨울', desc: '호적 메모의 겨울' },
  { id: 'e5', label: '봉투 — 소인: (번짐) 여름', desc: '약값 다음 해' },
  { id: 'e6', label: '봉투 — 소인: (번짐) 겨울', desc: '면사무소 일이 있던' },
];

export default function AnbangEp3() {
  const { state, dispatch, episode } = useGame();
  const { solved, wrongAttempts, selectedItem, inventory } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const shake = useShake(wrongAttempts);
  const [postmarkOpen, setPostmarkOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [reveal, setReveal] = useState<string | null>(null);
  const navGuard = useRef(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { playBgm('ep3'); }, []);
  useEffect(() => () => {
    if (navTimer.current !== null) clearTimeout(navTimer.current);
  }, []);

  function canAttempt(puzzleId: string) {
    return canAttemptWith(episode, state, puzzleId);
  }

  function say(text: string) { setNarration(text); }

  // ── 벽장 ──
  function handleCloset() {
    if (solved.includes('ep3-closet')) {
      say('벽장의 이불은 다시 개켜 두었다.');
      return;
    }
    if (selectedItem === 'cloth-map' && canAttempt('ep3-closet')) {
      dispatch({ type: 'ATTEMPT', puzzleId: 'ep3-closet', answer: '' });
      playSfx('pickup');
      say('평면도의 매듭 자리 — 이불 갈피 깊숙이 편지가 숨겨져 있었다.');
    } else {
      say('오래된 벽장. 이불이 켜켜이 쌓여 있다. 어디를 뒤져야 할지 막막하다.');
    }
  }

  // ── 문갑 (소인 연대기) ──
  function handleMungap() {
    if (solved.includes('ep3-postmark')) {
      say('시간순으로 꽂힌 봉투들. 비밀칸은 열렸다.');
      return;
    }
    if (canAttempt('ep3-postmark')) {
      setPostmarkOpen(true);
    } else {
      say('문갑 위 봉투 꽂이. 편지를 모두 모으면 순서를 맞춰볼 수 있겠다.');
    }
  }

  function handlePostmarkSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep3-postmark', answer });
    if (answer === 'e4-e1-e5-e2-e6-e3') {
      setPostmarkOpen(false);
      fx.correctPulse();
      say('마지막 봉투가 꽂히자 문갑 아래 비밀칸이 밀려 나왔다 — 자장가 악보와, 부치지 못한 답장.');
    }
  }

  // ── 서안 (대조 뷰어) ──
  function handleSeoan() {
    if (!inventory.includes('doc-ledger')) {
      say('나지막한 서안. 무언가 펼쳐 놓기 좋다.');
      return;
    }
    setCompareOpen(true);
  }

  function handleCompareSubmit(answer: string) {
    // 이 짝이 정답인 진실 조각을 찾는다
    const hit = TRUTH_IDS.find((pid) => EP3_TRUTH_PAIRS[pid] === answer && canAttempt(pid));
    if (hit) {
      dispatch({ type: 'ATTEMPT', puzzleId: hit, answer });
      playSfx('shard');
      setReveal(EP3_TRUTH_REVEALS[hit]);
      return;
    }
    // 오답 — 시도 가능한 아무 미해결 조각에 오답 제출 (오답음·흔들림 공용 처리)
    const target = TRUTH_IDS.find((pid) => canAttempt(pid));
    if (target) {
      dispatch({ type: 'ATTEMPT', puzzleId: target, answer });
    } else {
      say('아직 두 기록을 견줄 준비가 되지 않았다.');
      setCompareOpen(false);
    }
  }

  // ── 반닫이 (최종) ──
  function handleBandaji() {
    if (solved.includes('ep3-name')) return;
    if (canAttempt('ep3-name')) {
      setNameOpen(true);
    } else {
      const found = TRUTH_IDS.filter((pid) => solved.includes(pid)).length;
      say(found < TRUTH_IDS.length
        ? `봉인된 반닫이. 종이 봉인에 "다 맞추거든 열어라" — 진실 조각 ${found}/5.`
        : '봉인이 풀렸다. 그러나 자물쇠는 이름을 묻는다 — 단서가 더 필요하다.');
    }
  }

  function handleNameSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep3-name', answer });
    if (answer === '한-별') {
      setNameOpen(false);
      // 이후는 phase='epilogue' 전환으로 처리
    }
  }

  // ── 이동 ──
  function goMadang() {
    if (navGuard.current) return;
    navGuard.current = true;
    fx.roomTransition();
    playSfx('door');
    navTimer.current = setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room: 'madang' });
      navGuard.current = false;
    }, 600);
  }

  const closetSolved = solved.includes('ep3-closet');
  const postmarkSolved = solved.includes('ep3-postmark');
  const foundCount = TRUTH_IDS.filter((pid) => solved.includes(pid)).length;
  const sealBroken = foundCount >= TRUTH_IDS.length;

  const visibleLetterLines = EP3_LETTER_LINES.filter(
    (l) => !l.needsItem || inventory.includes(l.needsItem),
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} className={shake}>
      <svg
        viewBox="0 0 800 400"
        width="100%"
        style={{ display: 'block' }}
        aria-label="안방 장면"
      >
        {/* 방 배경 */}
        <rect width="800" height="400" fill="#bfa87e" />
        <rect x="0" y="300" width="800" height="100" fill="#96723f" />
        {[160, 320, 480, 640].map((x) => (
          <line key={x} x1={x} y1="302" x2={x} y2="400" stroke="#75582f" strokeWidth="1.5" opacity="0.4" />
        ))}

        {/* ── 벽장 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('closet', handleCloset); }}
          role="button" aria-label="벽장" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleCloset()}
        >
          <rect x="60" y="70" width="180" height="190" fill="#6a4c2c" stroke="#3a2810" strokeWidth="2.5" />
          <line x1="150" y1="72" x2="150" y2="258" stroke="#3a2810" strokeWidth="2" />
          <circle cx="140" cy="165" r="4" fill="#c8b088" />
          <circle cx="160" cy="165" r="4" fill="#c8b088" />
          {closetSolved && (
            <g opacity="0.9">
              <rect x="72" y="90" width="66" height="16" fill="#e8dcc0" />
              <rect x="72" y="110" width="66" height="16" fill="#d8ccb0" />
              <rect x="72" y="130" width="66" height="16" fill="#e8dcc0" />
            </g>
          )}
        </g>

        {/* ── 문갑 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('mungap', handleMungap); }}
          role="button" aria-label="문갑" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleMungap()}
        >
          <rect x="300" y="230" width="200" height="70" fill="#5a3e26" stroke="#3a2810" strokeWidth="2.5" />
          <line x1="400" y1="232" x2="400" y2="298" stroke="#3a2810" strokeWidth="1.5" />
          <circle cx="352" cy="264" r="4" fill="#c8b088" />
          <circle cx="448" cy="264" r="4" fill="#c8b088" />
          {/* 봉투 꽂이 */}
          <rect x="330" y="196" width="140" height="34" fill="#4a3018" stroke="#2a1c10" strokeWidth="1.5" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={338 + i * 22} y={postmarkSolved ? 202 : 200 + (i % 3) * 4} width="16" height="24"
              fill="#efe3c0" stroke="#b8a070" strokeWidth="1"
              transform={postmarkSolved ? undefined : `rotate(${(i % 2 ? 6 : -5)} ${346 + i * 22} 212)`} />
          ))}
          {/* 비밀칸 */}
          {postmarkSolved && <rect x="360" y="300" width="80" height="10" fill="#3a2810" />}
        </g>

        {/* ── 서안 (대조) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('seoan', handleSeoan); }}
          role="button" aria-label="서안 — 기록을 펼친다" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleSeoan()}
        >
          <rect x="560" y="262" width="170" height="12" fill="#6a4c2c" stroke="#4a3018" strokeWidth="1.5" />
          <line x1="574" y1="274" x2="570" y2="310" stroke="#4a3018" strokeWidth="4" />
          <line x1="716" y1="274" x2="720" y2="310" stroke="#4a3018" strokeWidth="4" />
          {/* 펼친 책 두 권 */}
          <path d="M 580 258 L 612 250 L 644 258 L 644 262 L 612 255 L 580 262 Z" fill="#efe3c0" stroke="#8a7a58" strokeWidth="1" />
          <path d="M 650 258 L 682 250 L 714 258 L 714 262 L 682 255 L 650 262 Z" fill="#e0d0a8" stroke="#8a7a58" strokeWidth="1" />
          {foundCount > 0 && (
            <text x="647" y="242" textAnchor="middle" fontSize="12" fill="#7a4f1e">{foundCount}/5</text>
          )}
        </g>

        {/* ── 반닫이 (최종) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('bandaji', handleBandaji); }}
          role="button" aria-label="봉인된 반닫이" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleBandaji()}
        >
          <rect x="300" y="96" width="200" height="90" fill="#4a3018" stroke="#2a1c10" strokeWidth="3" />
          <line x1="300" y1="140" x2="500" y2="140" stroke="#2a1c10" strokeWidth="2.5" />
          {/* 놋 장석 */}
          <circle cx="400" cy="140" r="12" fill="#c8a94e" stroke="#8a6a2a" strokeWidth="2" />
          <rect x="316" y="104" width="12" height="30" rx="2" fill="#c8a94e" opacity="0.8" />
          <rect x="472" y="104" width="12" height="30" rx="2" fill="#c8a94e" opacity="0.8" />
          {/* 종이 봉인 */}
          {!sealBroken && (
            <rect x="384" y="112" width="32" height="56" fill="#efe3c0" stroke="#b8a070" strokeWidth="1"
              transform="rotate(4 400 140)" />
          )}
          {sealBroken && !solved.includes('ep3-name') && (
            <circle cx="400" cy="140" r="18" fill="#ffd24a" opacity="0.25" />
          )}
        </g>
      </svg>

      <RoomNav
        targets={[{ room: 'madang', label: '마당', side: 'left' }]}
        onGo={goMadang}
      />

      <OrderPicker
        open={postmarkOpen}
        title="문갑 — 소인 연대기"
        instruction="봉투를 소인 날짜순으로 꽂자. 번진 소인은 가계부의 기록으로 복원할 수 있다."
        items={ENVELOPE_ITEMS}
        submitLabel="이 순서로 꽂는다"
        wrongSignal={wrongAttempts || undefined}
        onSubmit={handlePostmarkSubmit}
        onClose={() => setPostmarkOpen(false)}
      />

      <CompareViewer
        open={compareOpen}
        ledgerLines={EP3_LEDGER_LINES}
        letterLines={visibleLetterLines}
        foundCount={foundCount}
        totalCount={TRUTH_IDS.length}
        wrongSignal={wrongAttempts || undefined}
        reveal={reveal}
        onRevealDone={() => setReveal(null)}
        onSubmit={handleCompareSubmit}
        onClose={() => { setCompareOpen(false); setReveal(null); }}
      />

      <NameLock
        open={nameOpen}
        wrongSignal={wrongAttempts || undefined}
        onSubmit={handleNameSubmit}
        onClose={() => setNameOpen(false)}
      />

      <TapLabel name={ARMED_NAMES[armedId ?? ''] ?? null} />
      <Narration text={narration} onDone={() => setNarration(null)} />
    </div>
  );
}

const ARMED_NAMES: Record<string, string> = {
  closet: '벽장',
  mungap: '문갑',
  seoan: '서안',
  bandaji: '반닫이',
};
