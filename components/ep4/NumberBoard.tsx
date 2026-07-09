'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

// 테이프 번호 = 생일 나이. 7·10·15·20·25·30·40 — 35만 비어 있다.
const TAPES = [7, 10, 15, 20, 25, 30, 40];
const SLOTS = [5, 10, 15, 20, 25, 30, 35, 40]; // 수직선 눈금 (5 단위)
const MISSING = 35;
// 뒤섞인 전시 순서
const SHUFFLED = [20, 7, 30, 15, 40, 10, 25];

/** 숫자 수열 보드 — 테이프 번호를 눈금에 놓아 규칙과 빠진 수를 찾는다 */
export default function NumberBoard({ open, onSubmit, onClose }: Props) {
  const [placed, setPlaced] = useState<Record<number, number>>({}); // slot → tape
  const [sel, setSel] = useState<number | null>(null);
  const [blankDone, setBlankDone] = useState(false);

  useEscape(open, onClose);
  useEffect(() => { if (open) { setPlaced({}); setSel(null); setBlankDone(false); } }, [open]);

  const allPlaced = TAPES.every((t) => Object.values(placed).includes(t));

  if (!open) return null;

  function pick(t: number) {
    if (Object.values(placed).includes(t)) return;
    playSfx('click');
    setSel((c) => (c === t ? null : t));
  }

  function drop(slot: number) {
    if (sel == null || placed[slot] != null || slot === MISSING) return;
    if (sel === slot) {
      playSfx('pickup');
      setPlaced((p) => ({ ...p, [slot]: sel }));
      setSel(null);
    } else {
      playSfx('wrong');
      setSel(null);
    }
  }

  // 7은 5 눈금과 10 눈금 사이 — 특별 처리: 5 슬롯에 놓는 것으로 간주하지 않고
  // 눈금 대신 "나이 순 자리"에 놓는 UI로 단순화: slot 값 = tape 값.
  // (SLOTS는 시각 눈금일 뿐, 드롭 대상은 tape 값 자리)

  function dropBlank() {
    if (!allPlaced || blankDone) return;
    setBlankDone(true);
    playSfx('correct');
    setTimeout(() => onSubmit(`missing-${MISSING}`), 1000);
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>테이프 번호 늘어놓기</h2>
        <p style={styles.instruction}>
          상자의 테이프 일곱 개와 라벨 없는 테이프 하나.
          번호를 골라 수직선 위 제자리에 놓아보자.
        </p>

        {/* 수직선 보드 */}
        <div style={styles.board}>
          {SLOTS.map((slot) => {
            const isTapeSlot = TAPES.includes(slot) || slot === MISSING;
            const has = placed[slot] != null;
            const isBlankTarget = slot === MISSING && allPlaced;
            if (slot === 5) {
              // 5 눈금 자리에는 7 테이프가 걸친다 — 7 자리로 표시
              return (
                <div key={slot} style={styles.slotCol}>
                  <div
                    onClick={() => drop(7)}
                    style={{
                      ...styles.slot,
                      ...(placed[7] != null ? styles.slotFilled : null),
                      cursor: sel != null && placed[7] == null ? 'pointer' : 'default',
                    }}
                    role="button" aria-label="7 자리"
                  >
                    {placed[7] != null ? '007' : ''}
                  </div>
                  <span style={styles.tick}>7</span>
                </div>
              );
            }
            return (
              <div key={slot} style={styles.slotCol}>
                <div
                  onClick={() => (isBlankTarget ? dropBlank() : drop(slot))}
                  style={{
                    ...styles.slot,
                    ...(has ? styles.slotFilled : null),
                    ...(slot === MISSING
                      ? blankDone ? styles.slotBlankDone
                        : allPlaced ? styles.slotBlankReady : styles.slotGap
                      : null),
                    cursor:
                      (isBlankTarget && !blankDone) || (sel != null && !has && isTapeSlot && slot !== MISSING)
                        ? 'pointer' : 'default',
                  }}
                  role="button"
                  aria-label={slot === MISSING ? '빈 눈금' : `${slot} 자리`}
                >
                  {slot === MISSING
                    ? blankDone ? '035' : allPlaced ? '?' : ''
                    : has ? String(placed[slot]).padStart(3, '0') : ''}
                </div>
                <span style={styles.tick}>{slot}</span>
              </div>
            );
          })}
        </div>

        {/* 테이프 카드 */}
        <p style={styles.trayLabel}>상자 속 테이프</p>
        <div style={styles.tray}>
          {SHUFFLED.map((t) => {
            const used = Object.values(placed).includes(t);
            return (
              <button key={t} onClick={() => pick(t)} disabled={used || blankDone}
                style={{ ...styles.tape, opacity: used ? 0.2 : 1, ...(sel === t ? styles.tapeSel : null) }}>
                {String(t).padStart(3, '0')}
              </button>
            );
          })}
          <button
            onClick={dropBlank}
            disabled={!allPlaced || blankDone}
            style={{ ...styles.tape, ...styles.blankTape, opacity: blankDone ? 0.2 : 1 }}
            aria-label="라벨 없는 테이프"
          >
            {'　'}
          </button>
        </div>

        <p style={styles.hintLine}>
          {blankDone ? '서른다섯. — 올해, 내 나이다.' :
            allPlaced ? '한 눈금만 비어 있다. 라벨 없는 테이프를 눌러 그 자리에 놓자.' :
            sel != null ? `${String(sel).padStart(3, '0')} — 수직선의 제자리를 눌러라.` :
            '7, 10, 15, 20… 이 수들은 무엇일까.'}
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(10,6,2,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: '16px',
  },
  card: {
    backgroundColor: '#2e1f10', border: '1px solid rgba(232,211,168,0.3)', borderRadius: '12px',
    padding: '26px 24px', maxWidth: '480px', width: '96%', position: 'relative', color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#e8d3a8', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.83rem', opacity: 0.75, textAlign: 'center', marginBottom: '14px', lineHeight: 1.6 },
  board: {
    display: 'flex', justifyContent: 'space-between', gap: '4px',
    borderBottom: '2px solid #8a5a33', paddingBottom: '4px', marginBottom: '4px',
  },
  slotCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 },
  slot: {
    width: '100%', minHeight: '44px', borderRadius: '6px',
    border: '1px dashed rgba(232,211,168,0.3)', backgroundColor: 'rgba(0,0,0,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.72rem', fontFamily: 'monospace',
  },
  slotFilled: { borderStyle: 'solid', borderColor: '#c8a86a', backgroundColor: '#3a2810' },
  slotGap: { borderColor: 'rgba(232,211,168,0.12)' },
  slotBlankReady: {
    borderColor: '#e8b84a', borderStyle: 'solid',
    boxShadow: '0 0 8px rgba(232,184,74,0.5)', fontSize: '1rem', fontWeight: 700,
  },
  slotBlankDone: { borderStyle: 'solid', borderColor: '#7ac8b8', backgroundColor: '#1e302c', color: '#7ae8d8' },
  tick: { fontSize: '0.68rem', opacity: 0.6 },
  trayLabel: { fontSize: '0.75rem', opacity: 0.6, marginTop: '14px', textAlign: 'center' },
  tray: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '8px' },
  tape: {
    minWidth: '58px', minHeight: '42px', fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700,
    backgroundColor: '#3a2810', color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.3)', borderRadius: '6px', cursor: 'pointer',
  },
  tapeSel: { filter: 'brightness(1.4) drop-shadow(0 0 6px rgba(200,168,106,0.6))' },
  blankTape: { borderStyle: 'dashed', backgroundColor: '#241a10' },
  hintLine: { fontSize: '0.8rem', opacity: 0.65, textAlign: 'center', marginTop: '14px', minHeight: '1.2em' },
};
