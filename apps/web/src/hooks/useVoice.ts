// ── useVoice — LiveKit edition ─────────────────────────────────────────────────
// Completely isolated from text channel code.

import { useCallback } from 'react';
import { useVoiceStore } from '../stores/voiceStore';
import { apiClient } from '../api/client';

export function useVoice() {
  const { connect, disconnect, setMuted, setDeafened, isMuted, isDeafened } = useVoiceStore();

  /** Fetch a LiveKit token from the API and store it — VoicePage will connect. */
  const joinVoice = useCallback(async (channelId: string) => {
    try {
      const { data } = await apiClient.get<{ token: string; url: string }>(
        `voice/${channelId}/token`,
      );
      connect(channelId, data.token, data.url);
    } catch (err) {
      console.error('[Voice] Failed to get LiveKit token:', err);
      alert('Could not join voice channel. Please try again.');
    }
  }, [connect]);

  /**
   * Leave the voice channel — just clears store state.
   * VoicePage re-renders to show the join prompt (no navigation away from the channel).
   */
  const leaveVoice = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const toggleMute   = useCallback(() => setMuted(!isMuted),       [isMuted,    setMuted]);
  const toggleDeafen = useCallback(() => setDeafened(!isDeafened), [isDeafened, setDeafened]);

  return { joinVoice, leaveVoice, toggleMute, toggleDeafen };
}
