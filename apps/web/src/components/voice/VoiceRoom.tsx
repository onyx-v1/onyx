import { useVoiceStore } from '../../stores/voiceStore';
import { useVoice } from '../../hooks/useVoice';
import { VoiceParticipantCard } from './VoiceParticipant';
import { VoiceControls } from './VoiceControls';
import { useAuthStore } from '../../stores/authStore';
import { Mic } from 'lucide-react';

interface Props { channelName: string; }

export function VoiceRoom({ channelName }: Props) {
  const { participants, isConnected } = useVoiceStore();
  const { user } = useAuthStore();

  if (!isConnected) return null;

  // Include self in participant list display
  const selfParticipant = {
    id: user?.id ?? '',
    displayName: user?.displayName ?? '',
    isMuted: useVoiceStore.getState().isMuted,
    isSpeaking: false,
  };

  const allParticipants = [
    selfParticipant,
    ...participants.filter((p) => p.id !== user?.id),
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Room header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
        <div className="w-2 h-2 rounded-full bg-online animate-pulse" />
        <span className="text-sm font-semibold text-primary">🔊 {channelName}</span>
        <span className="text-xs text-muted ml-auto">{allParticipants.length} connected</span>
      </div>

      {/* Participants grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {allParticipants.map((p) => (
            <VoiceParticipantCard key={p.id} participant={p} isSelf={p.id === user?.id} />
          ))}
        </div>
      </div>

      {/* Controls */}
      <VoiceControls />
    </div>
  );
}
