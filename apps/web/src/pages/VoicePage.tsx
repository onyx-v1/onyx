// ── VoicePage — LiveKit edition ────────────────────────────────────────────────
// Entry point for voice channels. Completely separate from text channel pages.

import { useParams, Navigate } from 'react-router-dom';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { useChannelStore } from '../stores/channelStore';
import { useVoiceStore } from '../stores/voiceStore';
import { useVoice } from '../hooks/useVoice';
import { VoiceRoom } from '../components/voice/VoiceRoom';
import { Mic, Volume2, Loader2 } from 'lucide-react';
import { useState } from 'react';

// ── Discord-like audio constraints ─────────────────────────────────────────────
// echoCancellation  → removes your own speaker audio from the mic
// noiseSuppression  → kills background noise (fans, keyboard, etc.)
// autoGainControl   → normalises volume levels automatically
const AUDIO_OPTIONS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl:  true,
  channelCount:     1,   // mono is sufficient for voice — halves bandwidth
} as const;

export function VoicePage() {
  const { channelId } = useParams<{ channelId: string }>();
  const { channels }  = useChannelStore();
  const { isConnected, livekitToken, livekitUrl } = useVoiceStore();
  const { joinVoice } = useVoice();
  const [joining, setJoining] = useState(false);

  const channel = channels.find((c) => c.id === channelId);

  if (!channelId) return <Navigate to="/" replace />;

  const handleJoin = async () => {
    setJoining(true);
    await joinVoice(channelId);
    setJoining(false);
  };

  /* ── Connected → render the live room ── */
  if (isConnected && livekitToken && livekitUrl) {
    return (
      <LiveKitRoom
        serverUrl={livekitUrl}
        token={livekitToken}
        connect={true}
        audio={AUDIO_OPTIONS}   // ← real noise suppression
        video={false}
        // adaptiveStream: LiveKit dynamically adjusts quality based on bandwidth
        // dynacast:       only publishes at qualities actually subscribed to (saves upload)
        options={{ adaptiveStream: true, dynacast: true }}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        onDisconnected={() => useVoiceStore.getState().disconnect()}
      >
        <VoiceRoom channelName={channel?.name ?? ''} />
      </LiveKitRoom>
    );
  }

  /* ── Join prompt ── */
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
      height: '100%', padding: 32,
    }}>
      {/* Icon */}
      <div style={{
        width: 88, height: 88, borderRadius: 24,
        background: 'rgba(62,207,142,0.1)',
        border: '1px solid rgba(62,207,142,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Volume2 size={38} color="var(--color-online)" />
      </div>

      {/* Info */}
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: 'var(--color-primary)' }}>
          🔊 {channel?.name ?? 'Voice Channel'}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.6 }}>
          Join to talk with others in this channel
        </p>
      </div>

      {/* Join button */}
      <button
        onClick={handleJoin}
        disabled={joining}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 32px', borderRadius: 12, border: 'none',
          background: joining ? 'rgba(62,207,142,0.4)' : 'var(--color-online)',
          color: '#000', fontSize: 14, fontWeight: 800,
          cursor: joining ? 'default' : 'pointer',
          transition: 'all 0.15s',
          boxShadow: joining ? 'none' : '0 4px 20px rgba(62,207,142,0.3)',
        }}
        onMouseEnter={e => { if (!joining) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; }}
      >
        {joining
          ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Connecting…</>
          : <><Mic size={18} /> Join Voice Channel</>
        }
      </button>

      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-subtle)' }}>
        Microphone access will be requested
      </p>
    </div>
  );
}
