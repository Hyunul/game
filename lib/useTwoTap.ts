'use client';
import { useState, useCallback, useRef } from 'react';

/**
 * useTwoTap — two-tap interaction guard for touch devices.
 *
 * On devices where `(hover: none)` matches (touch-primary):
 *   - First tap arms the id (shows label), second tap executes fn.
 *   - Armed state auto-clears after 2.5 s.
 * On pointer/mouse devices: guard calls fn immediately.
 */
export function useTwoTap() {
  const [armedId, setArmedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const guard = useCallback((id: string, fn: () => void) => {
    const isTouch =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none)').matches;

    if (!isTouch) {
      fn();
      return;
    }

    if (armedId === id) {
      fn();
      setArmedId(null);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setArmedId(id);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setArmedId(null), 2500);
    }
  }, [armedId]);

  return { guard, armedId };
}
