import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'dark' | 'purple';

export interface ThemeConfig {
  id:          ThemeId;
  label:       string;
  description: string;
  /** Preview swatch colors [base, accent] */
  swatches:    [string, string];
}

export const THEMES: ThemeConfig[] = [
  {
    id:          'dark',
    label:       'Pure Dark',
    description: 'OLED-optimised deep charcoal',
    swatches:    ['#181818', '#8b7cf8'],
  },
  {
    id:          'purple',
    label:       'Purple',
    description: 'Deep purple with vibrant accents',
    swatches:    ['#0e0a1a', '#a695fa'],
  },
];

interface ThemeState {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
}

/** Writes data-theme attribute to <html> — CSS variables do the rest */
function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute('data-theme', id);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (id) => {
        set({ theme: id });
        applyTheme(id);
      },
    }),
    { name: 'onyx-theme' },
  ),
);

/** Call once on app boot to restore the persisted theme immediately */
export function initTheme() {
  const stored = localStorage.getItem('onyx-theme');
  try {
    const parsed = stored ? JSON.parse(stored) : null;
    const id: ThemeId = parsed?.state?.theme ?? 'dark';
    applyTheme(id);
  } catch {
    applyTheme('dark');
  }
}
