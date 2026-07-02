'use client';
import { playSfx } from '../lib/audio';

export interface RoomNavTarget {
  room: string;
  label: string;
  side: 'left' | 'right';
}

interface Props {
  targets: RoomNavTarget[];
  onGo: (room: string) => void;
}

/** 장면 하단 모서리의 소형 방 이동 버튼. 거대한 문 히트박스를 대체한다. */
export default function RoomNav({ targets, onGo }: Props) {
  return (
    <>
      {targets.map((t) => (
        <button
          key={t.room}
          style={{
            ...styles.btn,
            ...(t.side === 'left' ? { left: '12px' } : { right: '12px' }),
          }}
          onClick={() => { playSfx('click'); onGo(t.room); }}
          aria-label={`${t.label}(으)로 이동`}
        >
          {t.side === 'left' ? `◀ ${t.label}` : `${t.label} ▶`}
        </button>
      ))}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  btn: {
    position: 'absolute',
    top: '12px',
    zIndex: 20,
    minHeight: '40px',
    padding: '8px 14px',
    backgroundColor: 'rgba(20,14,8,0.82)',
    color: '#e8d3a8',
    border: '1px solid rgba(232,211,168,0.35)',
    borderRadius: '999px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.02em',
  },
};
