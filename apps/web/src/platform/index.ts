/**
 * Platform Bridge — Public API
 * Import ONLY from this file in components/hooks.
 */

import webPlatform    from './web';
import nativePlatform from './native';

export interface NotificationOptions {
  title:      string;
  body:       string;
  channelId?: string;
}

export type UpdateState =
  | { state: 'checking' }
  | { state: 'available';    version: string }
  | { state: 'downloading';  percent: number; bytesPerSecond: number }
  | { state: 'ready';        version: string }
  | { state: 'not-available' }
  | { state: 'error';        message: string };

export interface PlatformAPI {
  isNative:   boolean;
  isDesktop:  boolean;
  ready:      () => Promise<void>;
  // Notifications
  showNotification:   (opts: NotificationOptions) => void;
  onNotificationClick:(cb: (channelId: string) => void) => void;
  // Updates (desktop only — no-ops on other platforms)
  checkForUpdates:  (() => void) | undefined;
  onUpdateStatus:   ((cb: (s: UpdateState) => void) => void) | undefined;
  quitAndInstall:   (() => void) | undefined;
}

const isCapacitor =
  typeof window !== 'undefined' &&
  !!(window as any).Capacitor?.isNativePlatform?.();

export const platform: PlatformAPI = isCapacitor ? nativePlatform : webPlatform;
export const isNative  = platform.isNative;
export const isDesktop = platform.isDesktop;
