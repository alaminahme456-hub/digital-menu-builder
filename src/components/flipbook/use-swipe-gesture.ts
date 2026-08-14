'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useSwipeGesture(handlers: SwipeHandlers, threshold = 40) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const handlersRef = useRef(handlers);
  const [isSwiping, setIsSwiping] = useState(false);
  const isScrolling = useRef(false);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const onTouchStart = useCallback((e: React.TouchEvent | TouchEvent) => {
    // Don't capture swipes on form elements, inputs, buttons, or modals
    const target = e.target as HTMLElement;
    if (
      target.closest('button, a, input, textarea, select, [role="slider"], [data-no-swipe], .no-swipe') ||
      target.closest('[data-radix-popper-content-wrapper]') ||
      target.tagName === 'IMG'
    ) {
      return;
    }

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isScrolling.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (touchStartX.current === null) return;

    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);

    // If vertical scroll is dominant and the content is scrollable, allow scrolling
    if (deltaY > deltaX && deltaY > 10) {
      // Check if the target container is scrollable and has room to scroll
      const target = e.target as HTMLElement;
      const scrollContainer = target.closest('[class*="overflow-y"], [class*="scroll"]');
      if (scrollContainer) {
        const el = scrollContainer as HTMLElement;
        const atTop = el.scrollTop <= 2;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;

        // If there's room to scroll vertically, let it scroll naturally
        if ((!atTop && !atBottom) || (deltaY > deltaX * 1.5)) {
          touchStartX.current = null;
          touchStartY.current = null;
          isScrolling.current = true;
          return;
        }
      } else {
        // No scroll container — let vertical scroll happen
        touchStartX.current = null;
        touchStartY.current = null;
        isScrolling.current = true;
        return;
      }
    }

    // Horizontal swipe detected
    if (deltaX > deltaY && deltaX > 10) {
      setIsSwiping(true);
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent | TouchEvent) => {
    const wasSwiping = isSwiping;
    setIsSwiping(false);

    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    const elapsed = Date.now() - touchStartTime.current;

    // Only trigger swipe if:
    // 1. Horizontal movement is dominant
    // 2. Distance exceeds threshold
    // 3. Was fast enough (under 500ms) or far enough
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const isFarEnough = Math.abs(deltaX) > threshold;
    const isFastEnough = elapsed < 500 && Math.abs(deltaX) > threshold * 0.5;

    if (isHorizontal && (isFarEnough || isFastEnough)) {
      if (deltaX < 0) {
        handlersRef.current.onSwipeLeft?.();
      } else {
        handlersRef.current.onSwipeRight?.();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [threshold, isSwiping]);

  return { onTouchStart, onTouchMove, onTouchEnd, isSwiping };
}

/**
 * Detects if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

/**
 * Detects if device can handle 3D transforms smoothly.
 * Uses a simple FPS test for low-end detection.
 */
export function useCanAnimate(): boolean {
  const [canAnimate, setCanAnimate] = useState(true);

  useEffect(() => {
    // Quick check for 3D support
    const el = document.createElement('div');
    const has3D = 'perspective' in el.style || 'webkitPerspective' in el.style;
    if (!has3D) {
      setCanAnimate(false);
      return;
    }

    // FPS-based detection: if device can't hit 30fps on a simple transform, disable
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const testAnimation = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        if (frameCount < 20) {
          // Less than 20fps = low-end device
          setCanAnimate(false);
        }
        cancelAnimationFrame(rafId);
        return;
      }
      el.style.transform = `translateX(${Math.sin(frameCount * 0.1) * 10}px)`;
      rafId = requestAnimationFrame(testAnimation);
    };

    rafId = requestAnimationFrame(testAnimation);

    return () => cancelAnimationFrame(rafId);
  }, []);

  return canAnimate;
}

/**
 * Hook to get dynamic book dimensions based on viewport
 */
export function useBookDimensions(aspectRatio: number = 3 / 4) {
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const calculate = () => {
      const vw = window.innerWidth;
      const vh = typeof window.visualViewport?.height === 'number'
        ? window.visualViewport.height
        : window.innerHeight;

      // Safe area insets
      const style = getComputedStyle(document.documentElement);
      const safeTop = parseInt(style.getPropertyValue('--sat') || '0', 10);
      const safeBottom = parseInt(style.getPropertyValue('--sab') || '0', 10);

      // Available height accounting for browser chrome
      const availHeight = vh - safeTop - safeBottom;

      // Padding for the book (12px each side on mobile)
      const padding = vw < 640 ? 16 : 32;
      const navHeight = 60; // Navigation controls

      // Calculate max book size maintaining aspect ratio
      const availWidth = vw - padding * 2;
      const availHeightForBook = availHeight - padding * 2 - navHeight;

      let bookWidth = availWidth;
      let bookHeight = bookWidth / aspectRatio;

      if (bookHeight > availHeightForBook) {
        bookHeight = availHeightForBook;
        bookWidth = bookHeight * aspectRatio;
      }

      setDims({
        width: Math.floor(Math.max(280, bookWidth)),
        height: Math.floor(Math.max(370, bookHeight)),
      });
    };

    calculate();
    window.addEventListener('resize', calculate);
    window.visualViewport?.addEventListener('resize', calculate);
    window.addEventListener('orientationchange', () => setTimeout(calculate, 100));

    return () => {
      window.removeEventListener('resize', calculate);
      window.visualViewport?.removeEventListener('resize', calculate);
    };
  }, [aspectRatio]);

  return dims;
}
