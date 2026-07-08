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
  EP3_LEDGER_LINES, EP3_LETTER_LINES, EP3_TRUTH_REVEALS,
} from '../../../lib/puzzles-ep3';
import { EP3_TRUTH_IDS, resolveEp3TruthPair } from '../../../lib/ep3TruthPair';

const TRUTH_IDS = EP3_TRUTH_IDS;

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
    const result = resolveEp3TruthPair(answer, solved, canAttempt);
    switch (result.kind) {
    case 'new':
      dispatch({ type: 'ATTEMPT', puzzleId: result.puzzleId, answer });
      playSfx('shard');
      setReveal(EP3_TRUTH_REVEALS[result.puzzleId]);
      return;
    case 'already-found':
      setReveal(EP3_TRUTH_REVEALS[result.puzzleId]);
      return;
    case 'wrong':
      dispatch({ type: 'ATTEMPT', puzzleId: result.puzzleId, answer });
      return;
    case 'blocked':
      say('아직 두 기록을 견줄 준비가 되지 않았다.');
      setCompareOpen(false);
      return;
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

        {/* 창호지 문 (배경 장식) */}
        <g aria-hidden="true">
          <rect x="330" y="70" width="150" height="130" fill="#e8e0c8" stroke="#6a5030" strokeWidth="3" />
          <line x1="405" y1="72" x2="405" y2="198" stroke="#6a5030" strokeWidth="2.5" />
          <line x1="332" y1="114" x2="478" y2="114" stroke="#6a5030" strokeWidth="2" />
          <line x1="332" y1="158" x2="478" y2="158" stroke="#6a5030" strokeWidth="2" />
          <line x1="368" y1="72" x2="368" y2="198" stroke="#6a5030" strokeWidth="1.5" opacity="0.7" />
          <line x1="442" y1="72" x2="442" y2="198" stroke="#6a5030" strokeWidth="1.5" opacity="0.7" />
        </g>

        {/* ── 벽장 (바닥까지 내려선 장) ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('closet', handleCloset); }}
          role="button" aria-label="벽장" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleCloset()}
        >
          <rect x="60" y="70" width="180" height="240" fill="#6a4c2c" stroke="#3a2810" strokeWidth="2.5" />
          <line x1="150" y1="72" x2="150" y2="308" stroke="#3a2810" strokeWidth="2" />
          <line x1="62" y1="290" x2="238" y2="290" stroke="#3a2810" strokeWidth="1.5" opacity="0.6" />
          <circle cx="140" cy="180" r="4" fill="#c8b088" />
          <circle cx="160" cy="180" r="4" fill="#c8b088" />
          {closetSolved && (
            <g opacity="0.9">
              <rect x="72" y="90" width="66" height="16" fill="#e8dcc0" />
              <rect x="72" y="110" width="66" height="16" fill="#d8ccb0" />
              <rect x="72" y="130" width="66" height="16" fill="#e8dcc0" />
            </g>
          )}
        </g>

        {/* ── 반닫이 (최종) — 바닥에 놓인 궤 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('bandaji', handleBandaji); }}
          role="button" aria-label="봉인된 반닫이" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleBandaji()}
        >
          <rect x="540" y="200" width="200" height="110" rx="3" fill="#4a3018" stroke="#2a1c10" strokeWidth="3" />
          {/* 앞널 경계 (반닫이 여닫이 선) */}
          <line x1="540" y1="248" x2="740" y2="248" stroke="#2a1c10" strokeWidth="2.5" />
          {/* 짧은 발 */}
          <rect x="548" y="310" width="14" height="8" fill="#2a1c10" />
          <rect x="718" y="310" width="14" height="8" fill="#2a1c10" />
          {/* 놋 장석 */}
          <circle cx="640" cy="248" r="12" fill="#c8a94e" stroke="#8a6a2a" strokeWidth="2" />
          <rect x="554" y="210" width="12" height="30" rx="2" fill="#c8a94e" opacity="0.8" />
          <rect x="714" y="210" width="12" height="30" rx="2" fill="#c8a94e" opacity="0.8" />
          <rect x="554" y="268" width="12" height="30" rx="2" fill="#c8a94e" opacity="0.8" />
          <rect x="714" y="268" width="12" height="30" rx="2" fill="#c8a94e" opacity="0.8" />
          {/* 종이 봉인 — 여닫이 선을 가로질러 붙어 있다 */}
          {!sealBroken && (
            <rect x="624" y="220" width="32" height="56" fill="#efe3c0" stroke="#b8a070" strokeWidth="1"
              transform="rotate(4 640 248)" />
          )}
          {sealBroken && !solved.includes('ep3-name') && (
            <circle cx="640" cy="248" r="18" fill="#ffd24a" opacity="0.25" />
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
          <rect x="290" y="240" width="200" height="70" fill="#5a3e26" stroke="#3a2810" strokeWidth="2.5" />
          <line x1="390" y1="242" x2="390" y2="308" stroke="#3a2810" strokeWidth="1.5" />
          <circle cx="342" cy="274" r="4" fill="#c8b088" />
          <circle cx="438" cy="274" r="4" fill="#c8b088" />
          {/* 봉투 꽂이 — 문갑 위에 올려져 있다 */}
          <rect x="320" y="206" width="140" height="34" fill="#4a3018" stroke="#2a1c10" strokeWidth="1.5" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={328 + i * 22} y={postmarkSolved ? 212 : 210 + (i % 3) * 4} width="16" height="24"
              fill="#efe3c0" stroke="#b8a070" strokeWidth="1"
              transform={postmarkSolved ? undefined : `rotate(${(i % 2 ? 6 : -5)} ${336 + i * 22} 222)`} />
          ))}
          {/* 비밀칸 */}
          {postmarkSolved && <rect x="350" y="310" width="80" height="10" fill="#3a2810" />}
        </g>

        {/* ── 서안 (대조) — 방 앞쪽 가운데 ── */}
        <g
          className="hotspot"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('seoan', handleSeoan); }}
          role="button" aria-label="서안 — 기록을 펼친다" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleSeoan()}
        >
          {/* 상판 (도톰하게) */}
          <rect x="300" y="332" width="180" height="14" rx="3" fill="#7a5636" stroke="#4a3018" strokeWidth="1.5" />
          {/* 두루마리 다리 */}
          <path d="M 314 346 q -6 18 -10 24 M 466 346 q 6 18 10 24" stroke="#4a3018" strokeWidth="6" fill="none" strokeLinecap="round" />
          {/* 펼친 책 두 권 (상판 위) */}
          <g>
            <path d="M 322 330 L 356 322 L 390 330 L 390 334 L 356 327 L 322 334 Z" fill="#efe3c0" stroke="#8a7a58" strokeWidth="1.2" />
            <line x1="330" y1="329" x2="350" y2="325" stroke="#8a6a3a" strokeWidth="0.8" opacity="0.7" />
            <path d="M 396 330 L 430 322 L 464 330 L 464 334 L 430 327 L 396 334 Z" fill="#e0d0a8" stroke="#8a7a58" strokeWidth="1.2" />
            <line x1="436" y1="325" x2="456" y2="329" stroke="#a04030" strokeWidth="0.8" opacity="0.6" />
          </g>
          {foundCount > 0 && (
            <text x="390" y="314" textAnchor="middle" fontSize="12" fill="#7a4f1e">{foundCount}/5</text>
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
