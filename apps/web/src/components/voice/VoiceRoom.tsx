// ── VoiceRoom — LiveKit edition ────────────────────────────────────────────────
// Renders inside <LiveKitRoom>. Uses LiveKit hooks for real participant data.
// No text-channel imports.

import {
  useParticipants, useLocalParticipant,
  RoomAudioRenderer, useIsSpeaking,
  useConnectionState,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { useVoiceStore } from '../../stores/voiceStore';
import { VoiceParticipantCard } from './VoiceParticipant';
import { VoiceControls } from './VoiceControls';
import { Loader2 } from 'lucide-react';

interface Props { channelName: string; }

// Per-participant wrapper — reads its own speaking state
function ParticipantCard({ participant, isSelf }: { participant: any; isSelf: boolean }) {
  const isSpeaking = useIsSpeaking(participant);
  return (
    <VoiceParticipantCard
      displayName={participant.name ?? participant.identity}
      isMuted={!participant.isMicrophoneEnabled}
      isSpeaking={isSpeaking}
      isSelf={isSelf}
    />
  );
}

export function VoiceRoom({ channelName }: Props) {
  const participants           = useParticipants();
  const { localParticipant }  = useLocalParticipant();
  const connectionState        = useConnectionState();
  const isConnected            = useVoiceStore((s) => s.isConnected);

  if (!isConnected) return null;

  const isConnecting = connectionState === ConnectionState.Connecting
                    || connectionState === ConnectionState.Reconnecting;

  const remoteParticipants = participants.filter(
    (p) => p.identity !== localParticipant.identity,
  );
  const totalCount = 1 + remoteParticipants.length; // self + remote

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── LiveKit renders all audio tracks automatically ── */}
      <RoomAudioRenderer />

      {/* ── Room header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        {isConnecting ? (
          <Loader2 size={12} style={{ color: 'var(--color-muted)', animation: 'spin 1s linear infinite' }} />
        ) : (
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--color-online)',
            boxShadow: '0 0 6px rgba(62,207,142,0.6)',
            animation: 'pulse 2s infinite',
          }} />
        )}
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>
          🔊 {channelName}
        </span>

        {/* Connection state pill */}
        {isConnecting && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
          }}>
            {connectionState === ConnectionState.Reconnecting ? 'Reconnecting…' : 'Connecting…'}
          </span>
        )}

        <span style={{ fontSize: 12, color: 'var(--color-muted)', marginLeft: 'auto' }}>
          {totalCount} {totalCount === 1 ? 'participant' : 'participants'}
        </span>
      </div>

      {/* ── Participant grid ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {remoteParticipants.length === 0 ? (
          /* Empty state — waiting for others */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: 12, opacity: 0.5,
          }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>
              Waiting for others to join…
            </p>
          </div>
        ) : null}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
          alignContent: 'start',
        }}>
          {/* Self first */}
          <ParticipantCard participant={localParticipant} isSelf={true} />
          {/* Remote participants */}
          {remoteParticipants.map((p) => (
            <ParticipantCard key={p.identity} participant={p} isSelf={false} />
          ))}
        </div>
      </div>

      {/* ── Controls ── */}
      <VoiceControls />
    </div>
  );
}
