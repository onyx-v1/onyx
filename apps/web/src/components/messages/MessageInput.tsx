import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, X, CornerUpLeft } from 'lucide-react';
import { Message } from '@onyx/types';
import { getSocket } from '../../hooks/useSocket';

interface Props {
  channelId: string;
  replyTo: Message | null;
  onCancelReply: () => void;
}

let typingTimeout: ReturnType<typeof setTimeout> | null = null;

export function MessageInput({ channelId, replyTo, onCancelReply }: Props) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTyping = useRef(false);

  const sendTypingStart = useCallback(() => {
    const socket = getSocket();
    if (!isTyping.current) {
      isTyping.current = true;
      socket?.emit('typing:start', { channelId });
    }
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isTyping.current = false;
      socket?.emit('typing:stop', { channelId });
    }, 3000);
  }, [channelId]);

  const sendTypingStop = useCallback(() => {
    if (typingTimeout) clearTimeout(typingTimeout);
    isTyping.current = false;
    getSocket()?.emit('typing:stop', { channelId });
  }, [channelId]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (e.target.value.trim()) sendTypingStart();
    else sendTypingStop();
    // Auto-resize
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'; }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const socket = getSocket();
    socket?.emit('message:send', {
      channelId,
      content: trimmed,
      ...(replyTo ? { replyToId: replyTo.id } : {}),
    });
    setContent('');
    onCancelReply();
    sendTypingStop();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 pb-4 pt-2 flex-shrink-0">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-input rounded-t-lg border-l-2 border-accent">
          <CornerUpLeft size={12} className="text-accent flex-shrink-0" />
          <span className="text-xs text-muted flex-1 truncate">
            Replying to <strong className="text-primary">{replyTo.author.displayName}</strong>
            {' — '}
            <span className="opacity-70">{replyTo.content}</span>
          </span>
          <button onClick={onCancelReply} className="text-muted hover:text-primary transition-colors">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-3 bg-input rounded-xl px-4 py-3 border border-transparent focus-within:border-accent/20 transition-colors">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          rows={1}
          className="flex-1 bg-transparent outline-none text-sm text-primary placeholder:text-muted resize-none leading-relaxed"
          style={{ maxHeight: 160 }}
        />
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
        >
          <Send size={14} className="text-white" />
        </button>
      </div>
    </div>
  );
}
