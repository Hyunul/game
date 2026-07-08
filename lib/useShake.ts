'use client';
import { useState, useEffect, useRef } from 'react';

/**
 * useShake — 오답 신호(카운터 증가)마다 shake 애니메이션을 확실히 재생하는 훅.
 *
 * signal은 증가하는 카운터(예: state.wrongAttempts, 필요시 + 로컬 오답 카운터).
 * 반환값은 씬 루트에 그대로 넣을 className('shake' | 'shake2' | undefined).
 * - 애니메이션 중 재오답이 와도 signal 홀짝에 따라 클래스명을 교대해
 *   CSS 애니메이션이 강제 재시작된다(같은 클래스 재적용은 재생 안 됨).
 * - 이전 타이머를 항상 정리해 누수와 언마운트 후 setState를 막는다.
 * - mount/resume 시 signal이 0→N으로 점프해도 발화하지 않는다(ref 초기값).
 */
export function useShake(signal: number): string | undefined {
  const [shaking, setShaking] = useState(false);
  const prev = useRef(signal);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (signal > prev.current) {
      if (timer.current !== null) clearTimeout(timer.current);
      setShaking(true);
      timer.current = setTimeout(() => setShaking(false), 600);
    }
    prev.current = signal;
  }, [signal]);

  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);

  if (!shaking) return undefined;
  return signal % 2 === 0 ? 'shake' : 'shake2';
}
