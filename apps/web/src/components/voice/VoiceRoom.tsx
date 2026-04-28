// ── VoiceRoom — LiveKit edition ────────────────────────────────────────────────
// Renders inside <LiveKitRoom> (provided by VoicePage).
// Uses LiveKit hooks for real participant data and speaking detection.
// No text-channel imports.

import { useParticipants, useLocalParticipant, RoomAudioRenderer, useIsSpeaking } from '@livekit/components-react';
import { useVoiceStore } from '../../stores/voiceStore';
import { VoiceParticipantCard } from './VoiceParticipant';
import { VoiceControls } from './VoiceControls';

interface Props { channelName: string; }

// Per-participant card that reads its own speaking state via hook
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
  const participants          = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const isConnected           = useVoiceStore((s) => s.isConnected);

  if (!isConnected) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* LiveKit handles ALL audio subscriptions — one line */}
      <RoomAudioRenderer />

      {/* Room header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-online)', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>
          🔊 {channelName}
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-muted)', marginLeft: 'auto' }}>
          {participants.length} connected
        </span>
      </div>

      {/* Participants grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 12,
        }}>
          {/* Local participant (self) first */}
          <ParticipantCard participant={localParticipant} isSelf={true} />

          {/* Remote participants */}
          {participants
            .filter((p) => p.identity !== localParticipant.identity)
            .map((p) => (
              <ParticipantCard key={p.identity} participant={p} isSelf={false} />
            ))
          }
        </div>
      </div>

      {/* Controls bar */}
      <VoiceControls />
    </div>
  );
}
