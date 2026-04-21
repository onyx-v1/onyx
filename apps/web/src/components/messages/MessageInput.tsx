import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, CornerUpLeft } from 'lucide-react';
import { Message } from '@onyx/types';
import { getSocket } from '../../hooks/useSocket';

interface Props {
  channelId: string;
  replyTo: Message | null;
  onCancelReply: () => void;
}

const MAX_LENGTH = 2000;

export function MessageInput({ channelId, replyTo, onCancelReply }: Props) {
  const [hasContent, setHasContent] = useState(false); // reactive flag for send button
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTyping    = useRef(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Stop typing ─────────────────────────────────────────────────── */
  const stopTyping = useCallback(() => {
    if (typingTimer.current) { clearTimeout(typingTimer.current); typingTimer.current = null; }
    if (isTyping.current) {
      isTyping.current = false;
      getSocket()?.emit('typing:stop', { channelId });
    }
  }, [channelId]);

  /* ── Start typing ───────────────────────────────────────────────── */
  const startTyping = useCallback(() => {
    if (!isTyping.current) {
      isTyping.current = true;
      getSocket()?.emit('typing:start', { channelId });
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 3000);
  }, [channelId, stopTyping]);

  /* ── Clean up when channel changes ─────────────────────────────── */
  useEffect(() => {
    return () => stopTyping();
  }, [channelId]);

  /* ── Reset input + focus on channel change ──────────────────────── */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
    setHasContent(false);
  }, [channelId]);

  /* ── Auto-resize ────────────────────────────────────────────────── */
  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, []);

  /* ── Input handler ──────────────────────────────────────────────── */
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    // Enforce max length
    if (val.length > MAX_LENGTH) {
      e.target.value = val.slice(0, MAX_LENGTH);
    }
    setHasContent(e.target.value.trim().length > 0);
    autoResize();
    if (e.target.value.trim()) startTyping(); else stopTyping();
  }, [autoResize, startTyping, stopTyping]);

  /* ── Send ──────────────────────────────────────────────────────── */
  const handleSend = useCallback(() => {
    const trimmed = textareaRef.current?.value.trim() ?? '';
    if (!trimmed) return;

    getSocket()?.emit('message:send', {
      channelId,
      content: trimmed,
      ...(replyTo ? { replyToId: replyTo.id } : {}),
    });

    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.style.height = 'auto';
    }
    setHasContent(false);
    onCancelReply();
    stopTyping();
  }, [channelId, replyTo, onCancelReply, stopTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  return (
    <div className="message-input-wrap">
      {/* Reply banner */}
      {replyTo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 4, padding: '7px 14px',
          background: 'var(--color-elevated)',
          borderRadius: 'var(--radius-control) var(--radius-control) 0 0',
          borderLeft: '2px solid var(--color-accent)',
        }}>
          <CornerUpLeft size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--color-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Replying to{' '}
            <strong style={{ color: 'var(--color-primary)' }}>{replyTo.author.displayName}</strong>
            {' — '}
            <span style={{ opacity: 0.6 }}>{replyTo.content}</span>
          </span>
          <button onClick={onCancelReply} className="btn-ghost" title="Cancel reply" style={{ padding: 4 }}>
            <X size={13} style={{ color: 'var(--color-muted)' }} />
          </button>
        </div>
      )}

      {/* Input box */}
      <div className="message-input-box">
        <textarea
          ref={textareaRef}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Send a message…"
          rows={1}
          maxLength={MAX_LENGTH}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            outline: 'none', resize: 'none', fontSize: 15,
            lineHeight: 1.6, color: 'var(--color-primary)', maxHeight: 180,
          }}
        />

        {/* Char counter near limit */}
        {hasContent && textareaRef.current && textareaRef.current.value.length > 1800 && (
          <span style={{ fontSize: 11, color: 'var(--color-danger)', flexShrink: 0 }}>
            {MAX_LENGTH - (textareaRef.current?.value.length ?? 0)}
          </span>
        )}

        <button
          onClick={handleSend}
          disabled={!hasContent}
          title="Send (Enter)"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: hasContent ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s, transform 0.1s',
            cursor: hasContent ? 'pointer' : 'default',
          }}
          onMouseEnter={(e) => { if (hasContent) (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          <Send size={15} style={{ color: hasContent ? '#fff' : 'var(--color-subtle)' }} />
        </button>
      </div>
    </div>
  );
}
