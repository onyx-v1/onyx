import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useChannelStore } from '../stores/channelStore';
import { useVoiceStore } from '../stores/voiceStore';
import { useVoice } from '../hooks/useVoice';
import { VoiceRoom } from '../components/voice/VoiceRoom';
import { Volume2, Mic } from 'lucide-react';

export function VoicePage() {
  const { channelId } = useParams<{ channelId: string }>();
  const { channels } = useChannelStore();
  const { isConnected, channelId: connectedChannelId } = useVoiceStore();
  const { joinVoice } = useVoice();

  const channel = channels.find((c) => c.id === channelId);

  if (!channelId) return <Navigate to="/" replace />;

  const isInThisRoom = isConnected && connectedChannelId === channelId;

  return (
    <div className="flex flex-col h-full">
      {isInThisRoom ? (
        <VoiceRoom channelName={channel?.name ?? ''} />
      ) : (
        /* Join prompt */
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-online/10 flex items-center justify-center">
            <Volume2 size={36} className="text-online" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-primary">🔊 {channel?.name}</h2>
            <p className="text-sm text-muted mt-2">Join to talk with others in this channel</p>
          </div>
          <button
            onClick={() => joinVoice(channelId)}
            className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
          >
            <Mic size={18} />
            Join Voice Channel
          </button>
          <p className="text-xs text-subtle">Microphone access will be requested</p>
        </div>
      )}
    </div>
  );
}
