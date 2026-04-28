// ── VoiceParticipant — LiveKit edition ────────────────────────────────────────
// Props come from LiveKit's useParticipants() / useLocalParticipant() hooks.
// No text-channel imports.

import { MicOff } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

interface Props {
  displayName: string;
  isMuted:     boolean;
  isSpeaking:  boolean;
  isSelf:      boolean;
  avatarUrl?:  string;
}

export function VoiceParticipantCard({ displayName, isMuted, isSpeaking, isSelf, avatarUrl }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 10, padding: '20px 12px', borderRadius: 16, position: 'relative',
      background: isSpeaking ? 'rgba(62,207,142,0.08)' : 'rgba(255,255,255,0.03)',
      border: isSpeaking ? '2px solid rgba(62,207,142,0.5)' : '2px solid rgba(255,255,255,0.06)',
      transition: 'all 0.15s ease',
      minWidth: 110,
    }}>
      {/* Speaking ring around avatar */}
      <div style={{
        borderRadius: '50%',
        boxShadow: isSpeaking ? '0 0 0 3px #3ecf8e, 0 0 16px rgba(62,207,142,0.4)' : 'none',
        transition: 'box-shadow 0.15s ease',
      }}>
        <Avatar displayName={displayName} avatarUrl={avatarUrl} size="lg" />
      </div>

      {/* Mute badge */}
      {isMuted && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          width: 22, height: 22, borderRadius: '50%',
          background: 'rgba(240,64,64,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MicOff size={11} color="#fff" />
        </div>
      )}

      {/* Name */}
      <div style={{ textAlign: 'center' }}>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 700,
          color: 'var(--color-primary)',
          maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {displayName}
          {isSelf && <span style={{ color: 'var(--color-accent)', marginLeft: 4 }}>(you)</span>}
        </p>
        {isSpeaking && (
          <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--color-online)', fontWeight: 600 }}>
            speaking
          </p>
        )}
      </div>
    </div>
  );
}
