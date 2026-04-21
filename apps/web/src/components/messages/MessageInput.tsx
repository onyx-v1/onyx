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

  /* ── Typing indicators ─────────────────────────────────────────── */
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

  /* ── Auto-resize textarea ──────────────────────────────────────── */
  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    autoResize();
    if (e.target.value.trim()) sendTypingStart();
    else sendTypingStop();
  };

  /* ── Send ──────────────────────────────────────────────────────── */
  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    getSocket()?.emit('message:send', {
      channelId,
      content: trimmed,
      ...(replyTo ? { replyToId: replyTo.id } : {}),
    });

    setContent('');
    onCancelReply();
    sendTypingStop();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = !content.trim();

  return (
    <div className="message-input-wrap">
      {/* ── Reply banner ─────────────────────────────────────────── */}
      {replyTo && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
            padding: '8px 14px',
            background: 'var(--color-elevated)',
            borderRadius: 'var(--radius-control) var(--radius-control) 0 0',
            borderLeft: '3px solid var(--color-accent)',
          }}
        >
          <CornerUpLeft size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--color-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Replying to{' '}
            <strong style={{ color: 'var(--color-primary)' }}>{replyTo.author.displayName}</strong>
            {' — '}
            <span style={{ opacity: 0.65 }}>{replyTo.content}</span>
          </span>
          <button
            onClick={onCancelReply}
            style={{ color: 'var(--color-muted)', lineHeight: 0 }}
            className="btn-ghost"
            title="Cancel reply"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Input box ────────────────────────────────────────────── */}
      <div className="message-input-box">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Send a message…"
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            outline: 'none',
            resize: 'none',
            fontSize: 15,
            lineHeight: 1.6,
            color: 'var(--color-primary)',
            maxHeight: 180,
          }}
          className="placeholder:text-muted"
        />

        {/* Hint + Send button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {content.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--color-subtle)', whiteSpace: 'nowrap' }}>
              ⇧↵ newline
            </span>
          )}
          <button
            onClick={handleSend}
            disabled={isEmpty}
            title="Send (Enter)"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: isEmpty ? 'rgba(139,124,248,0.15)' : 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, transform 0.1s',
              cursor: isEmpty ? 'not-allowed' : 'pointer',
            }}
          >
            <Send
              size={16}
              style={{ color: isEmpty ? 'var(--color-subtle)' : '#fff', transform: isEmpty ? 'none' : 'none' }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
