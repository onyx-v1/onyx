import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'dark' | 'purple';

export interface ChatBg {
  id:    string;   // filename without path e.g. "Midnight Atlas.png"
  label: string;   // display name
}

export const CHAT_BACKGROUNDS: ChatBg[] = [
  { id: 'Midnight Atlas.png', label: 'Midnight Atlas'  },
  { id: 'Void Marble.png',    label: 'Void Marble'     },
  { id: 'Nebula Grid.png',    label: 'Nebula Grid'     },
  { id: 'Obsidian Vein.png',  label: 'Obsidian Vein'   },
];

export function chatBgUrl(id: string) {
  return `/chat-backgrounds/${encodeURIComponent(id)}`;
}

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
    label:       'OLED Purple',
    description: 'Pure black with vibrant purple branding',
    swatches:    ['#000000', '#9d8fff'],
  },
];

interface ThemeState {
  theme:             ThemeId;
  chatBackground:    string | null;
  sidebarOpen:       boolean;
  setTheme:          (id: ThemeId) => void;
  setChatBackground: (id: string | null) => void;
  toggleSidebar:     () => void;
}

/** Writes data-theme attribute to <html> — CSS variables do the rest */
function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute('data-theme', id);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      chatBackground: null,
      sidebarOpen: true,
      setTheme: (id) => {
        set({ theme: id });
        applyTheme(id);
      },
      setChatBackground: (id) => set({ chatBackground: id }),
      toggleSidebar:     ()   => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
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
