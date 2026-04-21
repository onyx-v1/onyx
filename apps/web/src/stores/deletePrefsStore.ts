import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Callback receives whether to show "N messages deleted" feedback toast */
type OnConfirm = (showFeedback: boolean) => void;

interface DeletePrefsState {
  // ── Persisted user preferences ─────────────────────────────────
  /** Skip the confirmation modal for future deletes */
  skipDeleteConfirm: boolean;
  /** Whether to show "X messages deleted" toast after bulk deletes */
  showDeleteFeedback: boolean;
  /** User has already set a feedback preference — skip asking again */
  skipBulkFeedbackPrompt: boolean;

  // ── Ephemeral modal state (NOT persisted) ───────────────────────
  pending: { count: number; onConfirm: OnConfirm } | null;

  // ── Toast (ephemeral) ───────────────────────────────────────────
  toast: string | null;

  // ── Actions ─────────────────────────────────────────────────────
  /**
   * Call this instead of window.confirm.
   * Skips the modal automatically when all prefs are already set.
   */
  openDeleteConfirm: (count: number, onConfirm: OnConfirm) => void;

  confirmDelete: (opts: {
    dontAskAgain: boolean;
    feedback: boolean;
    rememberFeedback: boolean;
  }) => void;

  cancelDelete: () => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

export const useDeletePrefsStore = create<DeletePrefsState>()(
  persist(
    (set, get) => ({
      // Persisted defaults
      skipDeleteConfirm:       false,
      showDeleteFeedback:      true,
      skipBulkFeedbackPrompt:  false,

      // Ephemeral defaults
      pending: null,
      toast:   null,

      openDeleteConfirm: (count, onConfirm) => {
        const { skipDeleteConfirm, showDeleteFeedback, skipBulkFeedbackPrompt } = get();
        const needsConfirm        = !skipDeleteConfirm;
        const needsFeedbackPrompt = count > 3 && !skipBulkFeedbackPrompt;

        if (!needsConfirm && !needsFeedbackPrompt) {
          // All prefs are resolved — execute immediately
          onConfirm(count > 3 ? showDeleteFeedback : false);
          return;
        }

        set({ pending: { count, onConfirm } });
      },

      confirmDelete: ({ dontAskAgain, feedback, rememberFeedback }) => {
        const { pending } = get();
        if (!pending) return;

        const updates: Partial<DeletePrefsState> = { pending: null };
        if (dontAskAgain)    updates.skipDeleteConfirm      = true;
        if (rememberFeedback) {
          updates.showDeleteFeedback     = feedback;
          updates.skipBulkFeedbackPrompt = true;
        }

        set(updates);
        pending.onConfirm(feedback);
      },

      cancelDelete: () => set({ pending: null }),

      showToast:  (msg) => set({ toast: msg }),
      clearToast: ()    => set({ toast: null }),
    }),
    {
      name: 'onyx-delete-prefs',
      // Only persist preferences — not modal or toast state
      partialize: (s) => ({
        skipDeleteConfirm:      s.skipDeleteConfirm,
        showDeleteFeedback:     s.showDeleteFeedback,
        skipBulkFeedbackPrompt: s.skipBulkFeedbackPrompt,
      }),
    },
  ),
);
