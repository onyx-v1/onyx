import { MicOff } from 'lucide-react';
import { VoiceParticipant } from '@onyx/types';
import { Avatar } from '../ui/Avatar';

interface Props {
  participant: VoiceParticipant;
  isSelf: boolean;
}

export function VoiceParticipantCard({ participant, isSelf }: Props) {
  return (
    <div className="voice-participant-card relative">
      {/* Speaking ring */}
      <div
        className={`relative ${participant.isSpeaking ? 'animate-speaking-ring' : ''}`}
        style={{
          borderRadius: '50%',
          boxShadow: participant.isSpeaking ? '0 0 0 3px #3ecf8e' : undefined,
          transition: 'box-shadow 0.15s ease',
        }}
      >
        <Avatar displayName={participant.displayName} size="lg" />
      </div>

      {/* Mute badge */}
      {participant.isMuted && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-danger/90 rounded-full flex items-center justify-center">
          <MicOff size={10} className="text-white" />
        </div>
      )}

      {/* Name */}
      <div className="text-center">
        <p className="text-xs font-semibold text-primary truncate max-w-full">
          {participant.displayName}
          {isSelf && <span className="text-accent ml-1">(you)</span>}
        </p>
        {participant.isSpeaking && (
          <p className="text-[10px] text-online">speaking</p>
        )}
      </div>
    </div>
  );
}
