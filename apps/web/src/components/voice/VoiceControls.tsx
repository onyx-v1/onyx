// ── VoiceControls — LiveKit edition ───────────────────────────────────────────
// Wires mute/deafen/leave buttons directly to LiveKit local participant track.
// No text-channel imports.

import { Mic, MicOff, Headphones, EarOff, PhoneOff } from 'lucide-react';
import { useLocalParticipant } from '@livekit/components-react';
import { useVoiceStore } from '../../stores/voiceStore';
import { useVoice } from '../../hooks/useVoice';

export function VoiceControls() {
  const { localParticipant } = useLocalParticipant();
  const { isMuted, isDeafened, setMuted, setDeafened } = useVoiceStore();
  const { leaveVoice } = useVoice();

  const handleMute = async () => {
    const next = !isMuted;
    await localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  };

  const handleDeafen = () => {
    const next = !isDeafened;
    setDeafened(next);
    // Deafen = mute incoming audio via HTMLAudioElement volume
    document.querySelectorAll<HTMLAudioElement>('audio[data-lk-audio]').forEach((el) => {
      el.volume = next ? 0 : 1;
    });
  };

  const btnBase: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    width: 64, padding: '12px 0', borderRadius: 12, border: 'none',
    cursor: 'pointer', fontSize: 10, fontWeight: 600,
    transition: 'all 0.15s',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      padding: '16px 24px',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(0,0,0,0.3)',
    }}>
      {/* Mute */}
      <button
        onClick={handleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
        style={{
          ...btnBase,
          background: isMuted ? 'rgba(240,64,64,0.2)' : 'rgba(255,255,255,0.06)',
          color: isMuted ? 'var(--color-danger)' : 'var(--color-muted)',
        }}
      >
        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        {isMuted ? 'Unmute' : 'Mute'}
      </button>

      {/* Deafen */}
      <button
        onClick={handleDeafen}
        title={isDeafened ? 'Undeafen' : 'Deafen'}
        style={{
          ...btnBase,
          background: isDeafened ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
          color: isDeafened ? '#f59e0b' : 'var(--color-muted)',
        }}
      >
        {isDeafened ? <EarOff size={20} /> : <Headphones size={20} />}
        {isDeafened ? 'Undeafen' : 'Deafen'}
      </button>

      {/* Leave */}
      <button
        onClick={leaveVoice}
        title="Leave voice"
        style={{
          ...btnBase,
          background: 'rgba(240,64,64,0.2)',
          color: 'var(--color-danger)',
        }}
      >
        <PhoneOff size={20} />
        Leave
      </button>
    </div>
  );
}
