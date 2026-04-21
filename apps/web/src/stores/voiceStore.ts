import { create } from 'zustand';
import { VoiceParticipant } from '@onyx/types';

interface VoiceState {
  channelId: string | null;
  participants: VoiceParticipant[];
  isMuted: boolean;
  isDeafened: boolean;
  isConnected: boolean;

  join: (channelId: string) => void;
  leave: () => void;
  setParticipants: (peers: VoiceParticipant[]) => void;
  addParticipant: (peer: { id: string; displayName: string }) => void;
  removeParticipant: (peerId: string) => void;
  setSpeaking: (peerId: string, speaking: boolean) => void;
  setMuted: (muted: boolean) => void;
  setDeafened: (deafened: boolean) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  channelId: null,
  participants: [],
  isMuted: false,
  isDeafened: false,
  isConnected: false,

  join: (channelId) => set({ channelId, isConnected: true, participants: [], isMuted: false, isDeafened: false }),

  leave: () => set({ channelId: null, isConnected: false, participants: [], isMuted: false, isDeafened: false }),

  setParticipants: (peers) => set({ participants: peers }),

  addParticipant: (peer) =>
    set((s) => {
      if (s.participants.find((p) => p.id === peer.id)) return s;
      return { participants: [...s.participants, { ...peer, isMuted: false, isSpeaking: false }] };
    }),

  removeParticipant: (peerId) =>
    set((s) => ({ participants: s.participants.filter((p) => p.id !== peerId) })),

  setSpeaking: (peerId, speaking) =>
    set((s) => ({
      participants: s.participants.map((p) => (p.id === peerId ? { ...p, isSpeaking: speaking } : p)),
    })),

  setMuted: (muted) => set({ isMuted: muted }),
  setDeafened: (deafened) => set({ isDeafened: deafened }),
}));
