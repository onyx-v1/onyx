import { useState, useEffect } from 'react';

// Matches common mobile UA strings — not size-based
const MOBILE_UA_RE = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

/**
 * Detects whether the user is on a mobile/touch device.
 *
 * Strategy (order matters):
 *   1. UA regex — covers Android, iPhone, iPad, iPod, BlackBerry, Opera Mini
 *   2. pointer: coarse  — touch-primary pointer (phones/tablets)
 *   2b. pointer: fine   — excludes desktops with touchscreens (Surface in laptop mode)
 *   3. maxTouchPoints   — belt-and-suspenders fallback
 *
 * This is NOT screen-size based — a phone in landscape still returns true.
 */
function detectMobile(): boolean {
  if (typeof navigator === 'undefined') return false;

  // 1. Explicit mobile user-agents
  if (MOBILE_UA_RE.test(navigator.userAgent)) return true;

  // 2. Touch-primary pointer WITHOUT a fine (mouse) pointer
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const fine   = window.matchMedia('(pointer: fine)').matches;
  if (coarse && !fine) return true;

  // 3. Fallback: touch points available and no fine pointer
  return navigator.maxTouchPoints > 1 && !fine;
}

/**
 * Returns true when running on a mobile/touch device.
 * Re-evaluates on window resize (covers emulator DevTools toggling).
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => detectMobile());

  useEffect(() => {
    // Re-check when DevTools device emulation changes
    const handler = () => setIsMobile(detectMobile());
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isMobile;
}

/** Imperative getter — use inside event handlers or stores */
export const getIsMobile = detectMobile;
