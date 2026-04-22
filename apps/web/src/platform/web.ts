/**
 * Platform Bridge — web implementation
 *
 * This runs when the app is accessed in a normal browser
 * or from the Electron shell (both load the live web app).
 */

import type { PlatformAPI } from './index';

const webPlatform: PlatformAPI = {
  isNative:  false,
  isDesktop: typeof window !== 'undefined' && '__onyx' in window && (window as any).__onyx?.platform === 'electron',

  ready: () => Promise.resolve(),
};

export default webPlatform;
