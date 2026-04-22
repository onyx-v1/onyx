/**
 * Platform Bridge — Public API
 *
 * This is the ONLY file components should import from.
 * Never import Capacitor or Electron APIs directly in components.
 *
 * Usage:
 *   import { platform } from '../platform';
 *   if (platform.isNative) { ... }
 */

import webPlatform    from './web';
import nativePlatform from './native';

export interface PlatformAPI {
  /** True when running inside Capacitor (Android) */
  isNative: boolean;
  /** True when running inside Electron (Windows desktop) */
  isDesktop: boolean;
  /** Resolves when the native bridge is ready to accept calls */
  ready: () => Promise<void>;
}

// Runtime detection — evaluated once at module load
const isCapacitor =
  typeof window !== 'undefined' &&
  !!(window as any).Capacitor?.isNativePlatform?.();

export const platform: PlatformAPI = isCapacitor ? nativePlatform : webPlatform;

// Convenience flags
export const isNative  = platform.isNative;
export const isDesktop = platform.isDesktop;
