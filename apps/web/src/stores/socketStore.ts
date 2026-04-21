import { create } from 'zustand';

interface SocketState {
  /** Incremented every time the socket connects — used as a reactive trigger */
  connectionId: number;
  setConnected: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  connectionId: 0,
  setConnected: () => set((s) => ({ connectionId: s.connectionId + 1 })),
}));
