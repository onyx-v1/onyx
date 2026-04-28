// ── useVoice — LiveKit edition ─────────────────────────────────────────────────
// Completely isolated from text channel code.
// Handles token fetch → store update → LiveKit connection lifecycle.

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoiceStore } from '../stores/voiceStore';
import { apiClient } from '../api/client';

export function useVoice() {
  const { connect, disconnect, setMuted, setDeafened, isMuted, isDeafened } = useVoiceStore();
  const navigate = useNavigate();

  /** Fetch a LiveKit token from the API and store it — VoicePage will connect. */
  const joinVoice = useCallback(async (channelId: string) => {
    try {
      const { token, url } = await apiClient
        .get(`voice/${channelId}/token`)
        .json<{ token: string; url: string }>();

      connect(channelId, token, url);
    } catch (err) {
      console.error('[Voice] Failed to get LiveKit token:', err);
      alert('Could not join voice channel. Please try again.');
    }
  }, [connect]);

  /** Disconnect from LiveKit room and go back to channel list. */
  const leaveVoice = useCallback(() => {
    disconnect();
    navigate('/');
  }, [disconnect, navigate]);

  const toggleMute    = useCallback(() => setMuted(!isMuted),       [isMuted,    setMuted]);
  const toggleDeafen  = useCallback(() => setDeafened(!isDeafened), [isDeafened, setDeafened]);

  return { joinVoice, leaveVoice, toggleMute, toggleDeafen };
}
