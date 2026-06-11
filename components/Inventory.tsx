'use client';
import { useGame } from '../lib/GameContext';
import { ITEMS } from '../lib/puzzles';
import { playSfx } from '../lib/audio';
import { ItemId } from '../lib/types';

const SLOT_COUNT = 6;

export default function Inventory() {
  const { state, dispatch } = useGame();

  function handleSlotClick(itemId: ItemId) {
    playSfx('click');
    const next = state.selectedItem === itemId ? null : itemId;
    dispatch({ type: 'SELECT_ITEM', itemId: next });
  }

  const selectedItem = state.selectedItem ? ITEMS[state.selectedItem] : null;

  return (
    <div style={styles.wrapper}>
      {selectedItem && (
        <div style={styles.desc}>{selectedItem.desc}</div>
      )}
      <div style={styles.bar}>
        {Array.from({ length: Math.max(SLOT_COUNT, state.inventory.length) }, (_, i) => {
          const itemId = state.inventory[i] as ItemId | undefined;
          const item = itemId ? ITEMS[itemId] : null;
          const isSelected = itemId && state.selectedItem === itemId;
          return (
            <button
              key={i}
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
                <span style={styles.icon}>{item.icon}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
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
  bar: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '600px',
  },
  slot: {
    width: '52px',
    height: '52px',
    backgroundColor: 'rgba(232,211,168,0.05)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    flexShrink: 0,
  },
  icon: {
    fontSize: '1.6rem',
    lineHeight: 1,
  },
};
