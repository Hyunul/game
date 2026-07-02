'use client';
import { useEffect, useState } from 'react';
import { loadGame, clearSave } from '../lib/save';
import { playSfx } from '../lib/audio';

export type EpisodeKey = 'ep1' | 'ep2';

interface Props {
  onSelect: (ep: EpisodeKey, resume: boolean) => void;
}

const EP1_SAVE_KEY = 'memory-box-save';
const EP2_SAVE_KEY = 'memory-box-save-ep2';
const EP1_CLEARED_KEY = 'memory-box-ep1-cleared';

interface CardMeta {
  key: EpisodeKey;
  title: string;
  genre: string;
  playtime: string;
  desc: string;
}

const CARDS: CardMeta[] = [
  {
    key: 'ep1',
    title: '기억의 상자',
    genre: '감성 방탈출',
    playtime: '20~30분',
    desc: '이삿짐 속에서 발견한 낡은 상자. 그 안의 물건들이 어릴 적 세 공간으로 데려다준다.',
  },
  {
    key: 'ep2',
    title: '궤짝 속 여름',
    genre: '추리 방탈출',
    playtime: '약 1시간',
    desc: '1978년 여름, 저수지에서 큰아버지가 세상을 떠났다. 궤짝 속 단서들이 그날 밤의 진실을 들려준다.',
  },
];

/** 에피소드 일러스트 (카드 헤더) */
function CardArt({ ep }: { ep: EpisodeKey }) {
  if (ep === 'ep1') {
    return (
      <svg viewBox="0 0 320 130" width="100%" style={{ display: 'block' }} aria-hidden="true">
        <rect width="320" height="130" fill="#241a10" />
        {/* 창빛 */}
        <polygon points="130,0 190,0 240,130 80,130" fill="#ffd24a" opacity="0.10" />
        {/* 상자 */}
        <rect x="115" y="62" width="90" height="50" rx="4" fill="#6a4023" stroke="#96622f" strokeWidth="2" />
        <rect x="112" y="52" width="96" height="15" rx="3" fill="#8a5630" stroke="#96622f" strokeWidth="2" />
        <rect x="152" y="56" width="14" height="7" rx="2" fill="#ffd24a" opacity="0.9" />
        {/* 떠오르는 기억 조각 */}
        <circle cx="120" cy="40" r="3" fill="#ffe9a8" opacity="0.9" />
        <circle cx="168" cy="26" r="4" fill="#ffd24a" opacity="0.8" />
        <circle cx="208" cy="42" r="2.5" fill="#ffe9a8" opacity="0.7" />
        <text x="160" y="34" textAnchor="middle" fontSize="13" opacity="0.9">📷</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 320 130" width="100%" style={{ display: 'block' }} aria-hidden="true">
      <rect width="320" height="130" fill="#101a30" />
      {/* 보름달 + 물결 */}
      <circle cx="248" cy="34" r="20" fill="#f0edd8" opacity="0.9" />
      <circle cx="242" cy="30" r="4" fill="#d8d4b8" opacity="0.5" />
      <path d="M0 104 q 20 -6 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0" fill="none" stroke="#5878a8" strokeWidth="2" opacity="0.6" />
      <path d="M0 116 q 20 -5 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0" fill="none" stroke="#48689a" strokeWidth="2" opacity="0.4" />
      {/* 궤짝 실루엣 */}
      <rect x="52" y="66" width="84" height="46" rx="5" fill="#241c30" stroke="#3a3450" strokeWidth="2" />
      <rect x="52" y="66" width="84" height="13" rx="5" fill="#302844" />
      <rect x="88" y="86" width="12" height="9" rx="2" fill="#8a7a50" />
      {/* 달빛 반사 */}
      <rect x="236" y="98" width="24" height="3" rx="1.5" fill="#f0edd8" opacity="0.35" />
      <rect x="230" y="108" width="36" height="3" rx="1.5" fill="#f0edd8" opacity="0.2" />
    </svg>
  );
}

export default function Hub({ onSelect }: Props) {
  const [saves, setSaves] = useState<{
    ep1: 'none' | 'progress';
    ep1Cleared: boolean;
    ep2: 'none' | 'progress' | 'cleared';
  }>({ ep1: 'none', ep1Cleared: false, ep2: 'none' });

  useEffect(() => {
    const ep1Save = loadGame(EP1_SAVE_KEY);
    const ep2Save = loadGame(EP2_SAVE_KEY);
    let ep1Cleared = false;
    try { ep1Cleared = localStorage.getItem(EP1_CLEARED_KEY) === '1'; } catch { /* noop */ }
    setSaves({
      ep1: ep1Save ? 'progress' : 'none',
      ep1Cleared,
      ep2: ep2Save ? (ep2Save.phase === 'epilogue' ? 'cleared' : 'progress') : 'none',
    });
  }, []);

  function start(ep: EpisodeKey, resume: boolean) {
    playSfx('click');
    if (!resume) clearSave(ep === 'ep1' ? EP1_SAVE_KEY : EP2_SAVE_KEY);
    onSelect(ep, resume);
  }

  return (
    <div style={styles.page}>
      {/* 다락방 무드 배경 */}
      <div style={styles.backdrop} aria-hidden="true" />

      <header style={styles.header}>
        <h1 style={styles.seriesTitle}>기억의 상자</h1>
        <p style={styles.seriesSub}>어른이 된 당신에게, 그 시절의 기억을</p>
      </header>

      <p style={styles.chooseLabel}>— 에피소드를 선택하세요 —</p>

      <div style={styles.cardRow}>
        {CARDS.map((c) => {
          const saveState = c.key === 'ep1' ? saves.ep1 : saves.ep2;
          const cleared = c.key === 'ep1' ? saves.ep1Cleared : saves.ep2 === 'cleared';
          const hasProgress = saveState === 'progress' || saveState === 'cleared';
          const primaryLabel =
            saveState === 'cleared' ? '다시 보기' : saveState === 'progress' ? '이어하기' : '시작하기';
          return (
            <section key={c.key} className="ep-card" style={styles.card} aria-label={c.title}>
              <div style={styles.art}>
                <CardArt ep={c.key} />
              </div>
              <div style={styles.body}>
                <div style={styles.titleRow}>
                  <h2 style={styles.cardTitle}>{c.title}</h2>
                  {cleared && <span style={styles.clearBadge}>완료</span>}
                </div>
                <div style={styles.badges}>
                  <span style={styles.badge}>{c.genre}</span>
                  <span style={styles.badge}>{c.playtime}</span>
                </div>
                <p style={styles.desc}>{c.desc}</p>
                <div style={styles.buttons}>
                  <button
                    className="ep-primary-btn"
                    style={styles.primaryBtn}
                    onClick={() => start(c.key, hasProgress)}
                  >
                    {primaryLabel}
                  </button>
                  {hasProgress && (
                    <button
                      className="ep-ghost-btn"
                      style={styles.ghostBtn}
                      onClick={() => start(c.key, false)}
                    >
                      처음부터
                    </button>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 20px 64px',
    position: 'relative',
    overflow: 'hidden',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: -1,
    background:
      'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,210,74,0.08), transparent 70%), ' +
      'radial-gradient(ellipse 120% 90% at 50% 110%, rgba(0,0,0,0.5), transparent 60%), ' +
      'linear-gradient(180deg, #171009 0%, #1a1410 45%, #14100b 100%)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  seriesTitle: {
    fontSize: 'clamp(2.2rem, 5.5vw, 3.4rem)',
    fontFamily: '"Georgia", "Batang", serif',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#e8d3a8',
    textShadow: '0 2px 18px rgba(255,210,74,0.18)',
    marginBottom: '10px',
  },
  seriesSub: {
    fontSize: '0.95rem',
    fontStyle: 'italic',
    color: 'rgba(232,211,168,0.65)',
  },
  chooseLabel: {
    fontSize: '0.8rem',
    letterSpacing: '0.2em',
    color: 'rgba(232,211,168,0.45)',
    marginBottom: '24px',
  },
  cardRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '28px',
    width: '100%',
    maxWidth: '900px',
  },
  card: {
    width: 'min(380px, 100%)',
    backgroundColor: 'rgba(36,26,16,0.92)',
    border: '1px solid rgba(232,211,168,0.18)',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 14px 44px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
  },
  art: {
    borderBottom: '1px solid rgba(232,211,168,0.12)',
  },
  body: {
    padding: '18px 22px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cardTitle: {
    fontSize: '1.3rem',
    fontFamily: '"Georgia", "Batang", serif',
    color: '#f0e0bc',
    letterSpacing: '0.05em',
  },
  clearBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#1a1410',
    backgroundColor: '#ffd24a',
    padding: '2px 10px',
    borderRadius: '999px',
  },
  badges: {
    display: 'flex',
    gap: '8px',
  },
  badge: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#ffd24a',
    border: '1px solid rgba(255,210,74,0.45)',
    backgroundColor: 'rgba(255,210,74,0.08)',
    padding: '3px 10px',
    borderRadius: '999px',
  },
  desc: {
    fontSize: '0.86rem',
    lineHeight: 1.65,
    color: 'rgba(232,211,168,0.8)',
    flex: 1,
  },
  buttons: {
    display: 'flex',
    gap: '10px',
    marginTop: '6px',
  },
  primaryBtn: {
    flex: 1,
    minHeight: '44px',
    fontSize: '0.95rem',
    fontWeight: 700,
    backgroundColor: '#7a4f1e',
    color: '#f0e0bc',
    border: '1px solid rgba(255,210,74,0.35)',
    borderRadius: '9px',
    cursor: 'pointer',
    letterSpacing: '0.04em',
  },
  ghostBtn: {
    minHeight: '44px',
    padding: '0 16px',
    fontSize: '0.85rem',
    fontWeight: 600,
    backgroundColor: 'transparent',
    color: 'rgba(232,211,168,0.75)',
    border: '1px solid rgba(232,211,168,0.3)',
    borderRadius: '9px',
    cursor: 'pointer',
  },
};
