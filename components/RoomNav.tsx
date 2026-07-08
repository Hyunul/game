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

/** 방 이동 버튼. 데스크톱은 장면 상단 모서리, 모바일은 화면 하단 고정
 *  (장면이 작아져 상단 배치가 핫스팟을 가리는 것 방지) — 스타일은 effects.css. */
export default function RoomNav({ targets, onGo }: Props) {
  return (
    <>
      {targets.map((t) => (
        <button
          key={t.room}
          className={`room-nav-btn ${t.side === 'left' ? 'room-nav-left' : 'room-nav-right'}`}
          onClick={() => { playSfx('click'); onGo(t.room); }}
          aria-label={`${t.label}(으)로 이동`}
        >
          {t.side === 'left' ? `◀ ${t.label}` : `${t.label} ▶`}
        </button>
      ))}
    </>
  );
}
