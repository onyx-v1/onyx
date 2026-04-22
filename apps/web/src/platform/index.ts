/**
 * Platform Bridge — Public API
 *
 * This is the ONLY file components should import from.
 * Never import Capacitor or Electron APIs directly in components.
 */

import webPlatform    from './web';
import nativePlatform from './native';

export interface NotificationOptions {
  title:      string;
  body:       string;
  channelId?: string;
}

export interface PlatformAPI {
  /** True when running inside Capacitor (Android) */
  isNative: boolean;
  /** True when running inside Electron (Windows desktop) */
  isDesktop: boolean;
  /** Resolves when the native bridge is ready */
  ready: () => Promise<void>;
  /** Show a native OS notification */
  showNotification: (opts: NotificationOptions) => void;
  /** Register a handler called when user clicks a notification toast */
  onNotificationClick: (cb: (channelId: string) => void) => void;
}

const isCapacitor =
  typeof window !== 'undefined' &&
  !!(window as any).Capacitor?.isNativePlatform?.();

export const platform: PlatformAPI = isCapacitor ? nativePlatform : webPlatform;

export const isNative  = platform.isNative;
export const isDesktop = platform.isDesktop;
