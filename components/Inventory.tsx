'use client';
import { useState } from 'react';
import { useGame } from '../lib/GameContext';
import { playSfx } from '../lib/audio';
import { ItemId } from '../lib/types';
import DocViewer from './DocViewer';

const SLOT_COUNT = 6;

export default function Inventory() {
  const { state, dispatch, episode } = useGame();
  const [openDocId, setOpenDocId] = useState<string | null>(null);

  function handleSlotClick(itemId: ItemId) {
    playSfx('click');
    const next = state.selectedItem === itemId ? null : itemId;
    dispatch({ type: 'SELECT_ITEM', itemId: next });
  }

  function handleReadClick() {
    if (!selectedItem?.doc) return;
    playSfx('click');
    setOpenDocId(selectedItem.id);
  }

  const selectedItem = state.selectedItem ? episode.items[state.selectedItem] : null;
  const openDocItem = openDocId ? episode.items[openDocId] : null;

  return (
    <>
      {/* wrapper(z=40) 스택 컨텍스트 밖에 렌더 — 씬 오버레이(z=80)에 가려지지 않도록 */}
      <DocViewer item={openDocItem ?? null} onClose={() => setOpenDocId(null)} />
      <div style={styles.wrapper}>
      {selectedItem && (
        <div style={styles.desc}>
          {selectedItem.doc ? (
            <button style={styles.readBtn} onClick={handleReadClick}>
              📖 {selectedItem.desc} (읽기)
            </button>
          ) : (
            selectedItem.desc
          )}
        </div>
      )}
      <div className="inv-bar" style={styles.bar}>
        {Array.from({ length: Math.max(SLOT_COUNT, state.inventory.length) }, (_, i) => {
          const itemId = state.inventory[i] as ItemId | undefined;
          const item = itemId ? episode.items[itemId] : null;
          const isSelected = itemId && state.selectedItem === itemId;
          return (
            <button
              key={i}
              className="inv-slot"
              style={{
                ...styles.slot,
                border: isSelected
                  ? '2px solid #ffd24a'
                  : '2px dashed rgba(232,211,168,0.3)',
                cursor: item ? 'pointer' : 'default',
              }}
              onClick={() => item && handleSlotClick(itemId!)}
              title={item ? item.name : ''}
              aria-label={item ? item.name : '빈 슬롯'}
            >
              {item ? (
                <span className="inv-icon" style={styles.icon}>{item.icon}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(20,14,8,0.92)',
    borderTop: '1px solid rgba(232,211,168,0.2)',
    padding: '6px 12px 8px',
    zIndex: 40,
  },
  desc: {
    color: '#e8d3a8',
    fontSize: '0.8rem',
    marginBottom: '4px',
    fontStyle: 'italic',
    maxWidth: '600px',
    textAlign: 'center',
  },
  readBtn: {
    background: 'none',
    border: 'none',
    color: '#e8d3a8',
    fontSize: '0.8rem',
    fontStyle: 'italic',
    textDecoration: 'underline',
    cursor: 'pointer',
    padding: 0,
  },
  bar: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '600px',
  },
  slot: {
    // width/height는 .inv-slot(effects.css)에서 — 모바일 축소를 위해 클래스로 관리
    backgroundColor: 'rgba(232,211,168,0.05)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    flexShrink: 0,
  },
  icon: {
    // 크기는 .inv-icon(effects.css)에서
    lineHeight: 1,
  },
};
