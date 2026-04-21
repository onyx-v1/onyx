import { Mic, MicOff, Headphones, EarOff, PhoneOff } from 'lucide-react';
import { useVoiceStore } from '../../stores/voiceStore';
import { useVoice } from '../../hooks/useVoice';

export function VoiceControls() {
  const { isMuted, isDeafened } = useVoiceStore();
  const { toggleMute, toggleDeafen, leaveVoice } = useVoice();

  return (
    <div className="flex items-center justify-center gap-4 px-6 py-5 border-t border-white/5 bg-base/50">
      {/* Mute */}
      <button
        onClick={toggleMute}
        className={`flex flex-col items-center gap-1 w-16 py-3 rounded-xl transition-all duration-150 ${
          isMuted
            ? 'bg-danger/20 text-danger hover:bg-danger/30'
            : 'bg-elevated text-muted hover:bg-hover hover:text-primary'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        <span className="text-[10px]">{isMuted ? 'Unmute' : 'Mute'}</span>
      </button>

      {/* Deafen */}
      <button
        onClick={toggleDeafen}
        className={`flex flex-col items-center gap-1 w-16 py-3 rounded-xl transition-all duration-150 ${
          isDeafened
            ? 'bg-warning/20 text-warning hover:bg-warning/30'
            : 'bg-elevated text-muted hover:bg-hover hover:text-primary'
        }`}
        title={isDeafened ? 'Undeafen' : 'Deafen'}
      >
        {isDeafened ? <EarOff size={20} /> : <Headphones size={20} />}
        <span className="text-[10px]">{isDeafened ? 'Undeafen' : 'Deafen'}</span>
      </button>

      {/* Leave */}
      <button
        onClick={leaveVoice}
        className="flex flex-col items-center gap-1 w-16 py-3 rounded-xl bg-danger/20 text-danger hover:bg-danger/40 transition-all duration-150"
        title="Leave voice"
      >
        <PhoneOff size={20} />
        <span className="text-[10px]">Leave</span>
      </button>
    </div>
  );
}
