'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../../lib/GameContext';
import { canAttemptWith } from '../../../lib/gameState';
import { playSfx, playBgm } from '../../../lib/audio';
import { fx } from '../../../lib/effects';
import Narration from '../../Narration';
import TapLabel from '../../TapLabel';
import RoomNav from '../../RoomNav';
import Keypad from '../../Keypad';
import { useTwoTap } from '../../../lib/useTwoTap';
import { useShake } from '../../../lib/useShake';
import EqualizerBars from '../../ep4/EqualizerBars';
import SpliceEditor from '../../ep4/SpliceEditor';

/** ep4 골방 — 진실의 방. 차가운 청록 톤의 녹음실. */
export default function Ep4Golbang() {
  const { state, dispatch, episode } = useGame();
  const { solved, wrongAttempts } = state;

  const { guard, armedId } = useTwoTap();
  const [narration, setNarration] = useState<string | null>(null);
  const shake = useShake(wrongAttempts);
  const [eqOpen, setEqOpen] = useState(false);
  const [spliceOpen, setSpliceOpen] = useState(false);
  const [rxOpen, setRxOpen] = useState(false);
  const navGuard = useRef(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { playBgm('ep4'); }, []);
  useEffect(() => () => {
    if (navTimer.current !== null) clearTimeout(navTimer.current);
  }, []);

  function canAttempt(puzzleId: string) {
    return canAttemptWith(episode, state, puzzleId);
  }
  function say(text: string) { setNarration(text); }

  const eggSolved = solved.includes('ep4-eggwall');
  const eqSolved = solved.includes('ep4-eq');
  const rxSolved = solved.includes('ep4-rx');
  const spliceSolved = solved.includes('ep4-splice');

  // ── 계란판 벽 ──
  function handleEggwall() {
    if (eggSolved) { say('벽감이 드러나 있다. 릴 원본과 끊어진 조각, 라벨 없는 테이프 — 전부 챙겼다.'); return; }
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-eggwall', answer: '' });
    playSfx('pickup');
    say('색이 바래지 않은 한 장을 떼자 — 벽감이다. 릴 원본 상자, 끊어진 테이프 조각, 그리고 라벨이 빈 테이프 하나.');
  }

  // ── 녹음기 이퀄라이저 ──
  function handleRecorder() {
    if (eqSolved) { say('노이즈 필터가 걷혔다. 이제 어떤 테이프든 맑게 들린다.'); return; }
    if (canAttempt('ep4-eq')) { setEqOpen(true); return; }
    say('커다란 녹음기. 전원은 들어오는데 스피커에서 지직음뿐이다. 벽부터 살펴보자.');
  }
  function handleEqSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-eq', answer });
    setEqOpen(false);
  }

  // ── 처방전 (책상) ──
  function handleDesk() {
    if (rxSolved) { say('진단일 — 10월 2일. 내 생일 이틀 전. 사진 뒷면의 "결과 발표"는 오디션이 아니었다.'); return; }
    if (canAttempt('ep4-rx')) { setRxOpen(true); return; }
    say('책상 위 처방전 묶음 — 자개장에서 가져와야 볼 수 있을 것이다. 달력의 규칙도 아직이다.');
  }
  function handleRxSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-rx', answer });
    if (answer === '1002') {
      setRxOpen(false);
      say('두 기호 모두 10월 2일에서 시작한다. 진단일 — 내 생일 이틀 전이다.');
    }
  }

  // ── 릴 상자 (스플라이스) ──
  function handleReelbox() {
    if (spliceSolved) { say('이어 붙인 오디션 테이프는 챙겨두었다. 릴 가장자리에 "203" — 마루의 데크를 그 카운터로 감아 들어보자.'); return; }
    if (canAttempt('ep4-splice')) { setSpliceOpen(true); return; }
    say('릴 상자. 끊어진 조각들이 있다 — 벽감을 먼저 열어야 한다.');
  }
  function handleSpliceSubmit(answer: string) {
    dispatch({ type: 'ATTEMPT', puzzleId: 'ep4-splice', answer });
    if (answer === '3-1-4-2-5') {
      setSpliceOpen(false);
      playSfx('splice');
    }
  }

  // ── 이동 ──
  function goRoom(room: 'ep4-maru') {
    if (navGuard.current) return;
    navGuard.current = true;
    fx.roomTransition();
    playSfx('door');
    navTimer.current = setTimeout(() => {
      dispatch({ type: 'ENTER_ROOM', room });
      navGuard.current = false;
    }, 600);
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} className={shake}>
      <svg viewBox="0 0 800 400" width="100%" style={{ display: 'block' }} aria-label="골방 — 어머니의 녹음실">
        {/* 차가운 청록 톤 */}
        <rect width="800" height="400" fill="#101c1a" />
        <rect x="0" y="310" width="800" height="90" fill="#1a2825" />
        {/* 갓전구 */}
        <g aria-hidden="true">
          <line x1="400" y1="0" x2="400" y2="40" stroke="#0a1210" strokeWidth="3" />
          <circle cx="400" cy="50" r="10" fill="#bfe8da" opacity="0.9" />
          <circle cx="400" cy="50" r="26" fill="#bfe8da" opacity="0.12" />
        </g>

        {/* ── 계란판 벽 (왼쪽 전체) ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('eggwall', handleEggwall); }}
          role="button" aria-label="계란판 벽" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleEggwall()}>
          {Array.from({ length: 12 }).map((_, i) => {
            const col = i % 3, row = Math.floor(i / 3);
            const fresh = i === 4; // 색이 다른 한 장
            const removed = eggSolved && fresh;
            return removed ? (
              <g key={i}>
                <rect x={40 + col * 62} y={90 + row * 52} width="58" height="48" rx="3" fill="#050a08" stroke="#1a2825" strokeWidth="1.5" />
                {/* 벽감 속 물건 */}
                <rect x={54 + col * 62} y={108 + row * 52} width="30" height="16" rx="2" fill="#3a3226" />
              </g>
            ) : (
              <g key={i}>
                <rect x={40 + col * 62} y={90 + row * 52} width="58" height="48" rx="3"
                  fill={fresh ? '#8a8468' : '#5a5646'} stroke="#3a3830" strokeWidth="1.5" />
                {[0, 1, 2].map((b) => (
                  <circle key={b} cx={54 + col * 62 + b * 16} cy={106 + row * 52} r="6"
                    fill="none" stroke={fresh ? '#6a6650' : '#46443a'} strokeWidth="1.5" />
                ))}
                {[0, 1, 2].map((b) => (
                  <circle key={b} cx={54 + col * 62 + b * 16} cy={124 + row * 52} r="6"
                    fill="none" stroke={fresh ? '#6a6650' : '#46443a'} strokeWidth="1.5" />
                ))}
              </g>
            );
          })}
          <text x="134" y="80" textAnchor="middle" fontSize="12" fill="#9ac8ba">계란판 벽</text>
        </g>

        {/* ── 녹음기 (중앙) ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('recorder', handleRecorder); }}
          role="button" aria-label="녹음기" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleRecorder()}>
          <rect x="330" y="200" width="160" height="100" rx="6" fill="#2a3a36" stroke="#0e1816" strokeWidth="2.5" />
          <circle cx="368" cy="232" r="16" fill="#0c1210" stroke="#7ac8b8" strokeWidth="1.5" />
          <circle cx="452" cy="232" r="16" fill="#0c1210" stroke="#7ac8b8" strokeWidth="1.5" />
          {/* EQ 슬라이더 3개 */}
          {[386, 406, 426].map((x, i) => (
            <g key={x}>
              <line x1={x + 12} y1="262" x2={x + 12} y2="292" stroke="#0e1816" strokeWidth="4" />
              <rect x={x + 6} y={eqSolved ? [278, 266, 272][i] : 274} width="12" height="7" rx="2" fill="#9ac8ba" />
            </g>
          ))}
          {/* 파형 종이 */}
          <rect x="498" y="212" width="44" height="56" rx="2" fill="#e8e0cc" stroke="#8a8468" strokeWidth="1.5" transform="rotate(6 520 240)" />
          <path d="M 506 244 L 512 240 L 518 228 L 524 236 L 530 232" stroke="#3a4a46" strokeWidth="2" fill="none" transform="rotate(6 520 240)" />
          <text x="410" y="190" textAnchor="middle" fontSize="12" fill="#9ac8ba">녹음기</text>
        </g>

        {/* ── 책상 + 처방전 (오른쪽) ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('desk', handleDesk); }}
          role="button" aria-label="책상 위 처방전" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleDesk()}>
          <rect x="600" y="240" width="160" height="14" rx="3" fill="#3a4a44" stroke="#0e1816" strokeWidth="2" />
          <rect x="612" y="254" width="12" height="70" fill="#2a3a34" />
          <rect x="736" y="254" width="12" height="70" fill="#2a3a34" />
          <rect x="636" y="216" width="52" height="30" rx="2" fill="#e8e0cc" stroke="#8a8468" strokeWidth="1.5" transform="rotate(-5 662 231)" />
          <text x="662" y="234" textAnchor="middle" fontSize="10" fill="#5a6a64" transform="rotate(-5 662 231)">● ▲</text>
          <text x="680" y="206" textAnchor="middle" fontSize="12" fill="#9ac8ba">책상</text>
        </g>

        {/* ── 릴 상자 (바닥) ── */}
        <g className="hotspot" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); guard('reelbox', handleReelbox); }}
          role="button" aria-label="릴 상자" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleReelbox()}>
          <rect x="530" y="330" width="110" height="46" rx="4" fill="#3a3226" stroke="#1a1610" strokeWidth="2" />
          <circle cx="562" cy="352" r="14" fill="#141210" stroke="#8a7040" strokeWidth="2" />
          <circle cx="606" cy="352" r="14" fill="#141210" stroke="#8a7040" strokeWidth="2" />
          <text x="585" y="394" textAnchor="middle" fontSize="12" fill="#9ac8ba">릴 상자</text>
        </g>
      </svg>

      <RoomNav targets={[{ room: 'ep4-maru', label: '마루', side: 'left' as const }]}
        onGo={() => goRoom('ep4-maru')} />

      <EqualizerBars open={eqOpen} onSubmit={handleEqSubmit} onClose={() => setEqOpen(false)} />
      <SpliceEditor open={spliceOpen} onSubmit={handleSpliceSubmit} onClose={() => setSpliceOpen(false)} />
      <Keypad open={rxOpen} title="진단일 — 월·일 네 자리" length={4}
        onSubmit={handleRxSubmit} onClose={() => setRxOpen(false)} />

      <TapLabel name={ARMED_NAMES[armedId ?? ''] ?? null} />
      <Narration text={narration} onDone={() => setNarration(null)} />
    </div>
  );
}

const ARMED_NAMES: Record<string, string> = {
  eggwall: '계란판 벽',
  recorder: '녹음기',
  desk: '책상',
  reelbox: '릴 상자',
};
