// ── VoicePage — LiveKit edition ────────────────────────────────────────────────
// Entry point for voice channels. Fetches LiveKit token, wraps VoiceRoom
// in <LiveKitRoom> provider. Completely separate from text channel pages.

import { useParams, Navigate } from 'react-router-dom';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { useChannelStore } from '../stores/channelStore';
import { useVoiceStore } from '../stores/voiceStore';
import { useVoice } from '../hooks/useVoice';
import { VoiceRoom } from '../components/voice/VoiceRoom';
import { Mic, Volume2, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function VoicePage() {
  const { channelId } = useParams<{ channelId: string }>();
  const { channels }  = useChannelStore();
  const { isConnected, livekitToken, livekitUrl } = useVoiceStore();
  const { joinVoice }  = useVoice();
  const [joining, setJoining] = useState(false);

  const channel = channels.find((c) => c.id === channelId);

  if (!channelId) return <Navigate to="/" replace />;

  const handleJoin = async () => {
    setJoining(true);
    await joinVoice(channelId);
    setJoining(false);
  };

  /* ── Already connected with a token → render the live room ── */
  if (isConnected && livekitToken && livekitUrl) {
    return (
      <LiveKitRoom
        serverUrl={livekitUrl}
        token={livekitToken}
        connect={true}
        audio={true}
        video={false}
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
      padding: 32,
    }}>
      {/* Icon */}
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: 'rgba(62,207,142,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Volume2 size={36} color="var(--color-online)" />
      </div>

      {/* Info */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: 'var(--color-primary)' }}>
          🔊 {channel?.name ?? 'Voice Channel'}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-muted)' }}>
          Join to talk with others in this channel
        </p>
      </div>

      {/* Join button */}
      <button
        onClick={handleJoin}
        disabled={joining}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 28px', borderRadius: 12, border: 'none',
          background: joining ? 'rgba(62,207,142,0.4)' : 'var(--color-online)',
          color: '#000', fontSize: 14, fontWeight: 800,
          cursor: joining ? 'default' : 'pointer',
          transition: 'all 0.15s',
        }}
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
