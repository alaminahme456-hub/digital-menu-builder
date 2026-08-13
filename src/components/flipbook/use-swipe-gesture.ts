'use client';

import { useRef, useCallback, useEffect } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useSwipeGesture(handlers: SwipeHandlers, threshold = 50) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const handlersRef = useRef(handlers);
  
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const onTouchStart = useCallback((e: React.TouchEvent | TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Only trigger swipe if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        handlersRef.current.onSwipeLeft?.();
      } else {
        handlersRef.current.onSwipeRight?.();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [threshold]);

  return { onTouchStart, onTouchEnd };
}

/**
 * Detects if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detects if device can handle 3D transforms
 */
export function useCanAnimate(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const el = document.createElement('div');
    const canTransform = 'transform' in el.style || 'webkitTransform' in el.style;
    const has3D = 'perspective' in el.style || 'webkitPerspective' in el.style;
    return canTransform && has3D;
  } catch {
    return false;
  }
}
