import { create } from 'zustand';

interface SelectionState {
  active:      boolean;
  selectedIds: Set<string>;

  enterSelection: (firstId: string) => void;
  toggleMessage:  (id: string)      => void;
  clearSelection: ()                => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  active:      false,
  selectedIds: new Set(),

  enterSelection: (firstId) =>
    set({ active: true, selectedIds: new Set([firstId]) }),

  toggleMessage: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id); else next.add(id);
      // Auto-exit if nothing selected
      if (next.size === 0) return { active: false, selectedIds: next };
      return { selectedIds: next };
    }),

  clearSelection: () =>
    set({ active: false, selectedIds: new Set() }),
}));
