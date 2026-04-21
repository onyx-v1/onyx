import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type OnConfirm = () => void;

interface DeletePrefsState {
  // ── Persisted ──────────────────────────────────────────────────
  skipDeleteConfirm: boolean;

  // ── Ephemeral modal state ──────────────────────────────────────
  pending: { count: number; onConfirm: OnConfirm } | null;

  // ── Toast (ephemeral) ─────────────────────────────────────────
  toast: string | null;

  // ── Actions ───────────────────────────────────────────────────
  openDeleteConfirm: (count: number, onConfirm: OnConfirm) => void;
  confirmDelete:     (dontAskAgain: boolean) => void;
  cancelDelete:      () => void;
  showToast:         (msg: string) => void;
  clearToast:        () => void;
}

export const useDeletePrefsStore = create<DeletePrefsState>()(
  persist(
    (set, get) => ({
      skipDeleteConfirm: false,
      pending:           null,
      toast:             null,

      openDeleteConfirm: (count, onConfirm) => {
        if (get().skipDeleteConfirm) {
          onConfirm();
          return;
        }
        set({ pending: { count, onConfirm } });
      },

      confirmDelete: (dontAskAgain) => {
        const { pending } = get();
        if (!pending) return;
        if (dontAskAgain) set({ skipDeleteConfirm: true });
        set({ pending: null });
        pending.onConfirm();
      },

      cancelDelete: () => set({ pending: null }),

      showToast:  (msg) => set({ toast: msg }),
      clearToast: ()    => set({ toast: null }),
    }),
    {
      name: 'onyx-delete-prefs',
      partialize: (s) => ({ skipDeleteConfirm: s.skipDeleteConfirm }),
    },
  ),
);
