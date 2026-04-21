import { createContext, useContext } from 'react';

/**
 * Provides isMobile + drawer state to the whole tree.
 * Populated by AppShell — consume with useMobileCtx().
 */
export interface MobileCtx {
  isMobile:     boolean;
  drawerOpen:   boolean;
  openDrawer:   () => void;
  closeDrawer:  () => void;
  toggleDrawer: () => void;
}

export const MobileContext = createContext<MobileCtx>({
  isMobile:     false,
  drawerOpen:   false,
  openDrawer:   () => {},
  closeDrawer:  () => {},
  toggleDrawer: () => {},
});

export function useMobileCtx() {
  return useContext(MobileContext);
}
