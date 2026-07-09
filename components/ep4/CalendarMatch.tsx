'use client';
import { useState, useEffect } from 'react';
import { playSfx } from '../../lib/audio';
import { useEscape } from '../../lib/useEscape';

interface Props {
  open: boolean;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

// 달력의 동그라미 5개 중 3개만 약봉투 날짜 도장과 겹친다.
// 나머지 2개(9/11, 9/28)는 함정 — 전부 진료일은 아니었다.
const CIRCLES = [4, 11, 18, 25, 28]; // 9월
const STAMPS = [4, 18, 25];

/** 달력 대조 — 약봉투 도장을 달력 동그라미에 겹친다 (탭 방식: 도장 선택 → 날짜 선택) */
export default function CalendarMatch({ open, onSubmit, onClose }: Props) {
  const [placed, setPlaced] = useState<Record<number, number | null>>({}); // stamp → day
  const [selStamp, setSelStamp] = useState<number | null>(null);
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);

  useEscape(open, onClose);
  useEffect(() => { if (open) { setPlaced({}); setSelStamp(null); setShake(false); setDone(false); } }, [open]);

  const allPlaced = STAMPS.every((st) => placed[st] === st);

  useEffect(() => {
    if (!open || !allPlaced || done) return;
    // setDone이 이 effect를 재실행시켜 cleanup으로 타이머를 지우지 않도록,
    // 제출 타이머는 done 전용 effect에서 건다
    setDone(true);
    playSfx('correct');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPlaced, open, done]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => onSubmit('matched'), 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (!open) return null;

  function pickStamp(st: number) {
    if (done || placed[st] != null) return;
    playSfx('click');
    setSelStamp((cur) => (cur === st ? null : st));
  }

  function dropOnDay(day: number) {
    if (done || selStamp == null) return;
    if (selStamp === day) {
      playSfx('pickup');
      setPlaced((p) => ({ ...p, [selStamp]: day }));
      setSelStamp(null);
    } else {
      // 미끄러져 돌아오는 연출
      playSfx('wrong');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setSelStamp(null);
    }
  }

  // 달력 격자: 9월 1일 = 일요일 가정, 5주
  const firstDow = 0;
  const weeks: (number | null)[][] = [];
  let day = 1 - firstDow;
  for (let w = 0; w < 5; w++) {
    const row: (number | null)[] = [];
    for (let d = 0; d < 7; d++, day++) row.push(day >= 1 && day <= 30 ? day : null);
    weeks.push(row);
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <style>{`@keyframes ep4slip { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }`}</style>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        <h2 style={styles.title}>벽걸이 달력 — 9월</h2>
        <p style={styles.instruction}>
          동그라미 간격이 이상하다. 약봉투의 날짜 도장을 골라, 겹친다고 생각하는 동그라미에 대보자.
        </p>

        <div style={{ ...styles.calendar, animation: shake ? 'ep4slip 0.4s' : undefined }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <div key={d} style={styles.dow}>{d}</div>
          ))}
          {weeks.flat().map((d, i) => {
            const circled = d != null && CIRCLES.includes(d);
            const matched = d != null && placed[d] === d;
            return (
              <div key={i}
                onClick={() => d != null && circled && dropOnDay(d)}
                style={{
                  ...styles.day,
                  cursor: circled && selStamp != null && !done ? 'pointer' : 'default',
                  ...(circled ? styles.dayCircled : null),
                  ...(matched ? styles.dayMatched : null),
                  ...(circled && selStamp != null && !matched ? { filter: 'brightness(1.3)' } : null),
                }}
                role={circled ? 'button' : undefined}
                aria-label={d != null ? `9월 ${d}일${circled ? ' (동그라미)' : ''}` : undefined}
              >
                {d ?? ''}
                {matched && <span style={styles.stampMark}>{'✚'}</span>}
              </div>
            );
          })}
        </div>

        <p style={styles.stampsLabel}>약봉투의 날짜 도장</p>
        <div style={styles.stampRow}>
          {STAMPS.map((st) => {
            const used = placed[st] != null;
            return (
              <button key={st} onClick={() => pickStamp(st)} disabled={used || done}
                style={{
                  ...styles.stamp,
                  opacity: used ? 0.25 : 1,
                  ...(selStamp === st ? styles.stampSel : null),
                }}>
                9/{st}
              </button>
            );
          })}
        </div>

        <p style={styles.hintLine}>
          {done ? '세 도장이 동그라미에 정확히 포개진다. …오디션 일정이 아니었다.' :
            selStamp != null ? `9/${selStamp} 도장 — 달력의 동그라미를 눌러 겹쳐보라.` :
            '도장을 먼저 고르자.'}
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
    padding: '26px 28px', maxWidth: '430px', width: '95%', position: 'relative', color: '#e8d3a8',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none',
    color: '#e8d3a8', fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, padding: '4px',
  },
  title: { fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600, textAlign: 'center' },
  instruction: { fontSize: '0.83rem', opacity: 0.75, textAlign: 'center', marginBottom: '12px' },
  calendar: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px',
    backgroundColor: '#f2e8d0', borderRadius: '8px', padding: '10px', color: '#3a2a18',
  },
  dow: { fontSize: '0.68rem', textAlign: 'center', opacity: 0.6, fontWeight: 700 },
  day: {
    position: 'relative', minHeight: '32px', fontSize: '0.8rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
  },
  dayCircled: { boxShadow: 'inset 0 0 0 2px #c0392b', fontWeight: 700 },
  dayMatched: { backgroundColor: 'rgba(122,200,184,0.35)', boxShadow: 'inset 0 0 0 2px #2a7a6a' },
  stampMark: { position: 'absolute', top: '-4px', right: '-2px', fontSize: '0.6rem', color: '#2a7a6a' },
  stampsLabel: { fontSize: '0.75rem', opacity: 0.6, marginTop: '14px', textAlign: 'center' },
  stampRow: { display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px' },
  stamp: {
    minWidth: '64px', minHeight: '44px', fontSize: '0.9rem', fontWeight: 700,
    backgroundColor: '#3a2810', color: '#e8b0a0',
    borderWidth: '2px', borderStyle: 'dashed', borderColor: 'rgba(232,150,130,0.5)',
    borderRadius: '8px', cursor: 'pointer',
  },
  stampSel: { filter: 'brightness(1.4) drop-shadow(0 0 6px rgba(232,150,130,0.5))', borderStyle: 'solid' },
  hintLine: { fontSize: '0.8rem', opacity: 0.65, textAlign: 'center', marginTop: '14px', minHeight: '1.2em' },
};
