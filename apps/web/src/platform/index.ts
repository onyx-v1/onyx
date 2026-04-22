/**
 * Platform Bridge — Public API
 *
 * This is the ONLY file components should import from.
 * Never import Capacitor or Electron APIs directly in components.
 *
 * Usage:
 *   import { platform } from '../platform';
 *   platform.ready().then(() => { ... });
 */

export interface PlatformAPI {
  /** True when running inside Capacitor (Android) */
  isNative: boolean;
  /** True when running inside Electron (Windows desktop) */
  isDesktop: boolean;
  /** Resolves when the native bridge is ready to accept calls */
  ready: () => Promise<void>;
}

// Runtime detection — no bundler tricks, pure runtime check
const isCapacitor =
  typeof window !== 'undefined' &&
  !!(window as any).Capacitor?.isNativePlatform?.();

// Synchronous resolution — no dynamic import latency for components
let _platform: PlatformAPI;

if (isCapacitor) {
  // Lazy load Capacitor impl — ensures Capacitor SDK never ships in web/Electron bundles
  const mod = require('./native');
  _platform = mod.default;
} else {
  const mod = require('./web');
  _platform = mod.default;
}

export const platform = _platform;

// Convenience flags — use these directly in components
export const isNative  = _platform.isNative;
export const isDesktop = _platform.isDesktop;
