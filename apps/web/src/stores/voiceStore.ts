import { create } from 'zustand';

// ── Voice store — LiveKit edition ─────────────────────────────────────────────
// Stores only connection state and UI toggles.
// Actual participant list & audio is managed by LiveKit SDK hooks inside voice components.

interface VoiceState {
  channelId:     string | null;
  livekitToken:  string | null;
  livekitUrl:    string | null;
  isMuted:       boolean;
  isDeafened:    boolean;
  isConnected:   boolean;

  connect:    (channelId: string, token: string, url: string) => void;
  disconnect: () => void;
  setMuted:   (muted: boolean) => void;
  setDeafened:(deafened: boolean) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  channelId:    null,
  livekitToken: null,
  livekitUrl:   null,
  isMuted:      false,
  isDeafened:   false,
  isConnected:  false,

  connect: (channelId, token, url) =>
    set({ channelId, livekitToken: token, livekitUrl: url, isConnected: true, isMuted: false, isDeafened: false }),

  disconnect: () =>
    set({ channelId: null, livekitToken: null, livekitUrl: null, isConnected: false, isMuted: false, isDeafened: false }),

  setMuted:    (isMuted)    => set({ isMuted }),
  setDeafened: (isDeafened) => set({ isDeafened }),
}));
