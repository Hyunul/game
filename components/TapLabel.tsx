'use client';

interface TapLabelProps {
  name: string | null;
}

/**
 * TapLabel — shows a floating label at the bottom-center of the scene
 * when a hotspot is "armed" on a touch device (two-tap guard first tap).
 */
export default function TapLabel({ name }: TapLabelProps) {
  if (!name) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(10,6,2,0.82)',
        color: '#e8d3a8',
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: 600,
        pointerEvents: 'none',
        zIndex: 60,
        whiteSpace: 'nowrap',
        border: '1px solid rgba(232,211,168,0.35)',
      }}
    >
      {name} — 한 번 더 탭하면 상호작용
    </div>
  );
}
