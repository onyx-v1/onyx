import { useEffect, useRef, useCallback } from 'react';
import { Send, X, CornerUpLeft } from 'lucide-react';
import { Message } from '@onyx/types';
import { getSocket } from '../../hooks/useSocket';

interface Props {
  channelId: string;
  replyTo: Message | null;
  onCancelReply: () => void;
}

export function MessageInput({ channelId, replyTo, onCancelReply }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef  = useRef('');              // avoids state for perf-sensitive input
  const isTyping    = useRef(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null); // per-instance, not global

  /* ── Stop typing helper ─────────────────────────────────────────── */
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

  /* ── Clean up typing state when channel changes or component unmounts */
  useEffect(() => () => stopTyping(), [channelId]);

  /* ── Auto-resize textarea ──────────────────────────────────────── */
  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, []);

  /* ── Input handler ──────────────────────────────────────────────── */
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    contentRef.current = e.target.value;
    autoResize();
    if (e.target.value.trim()) startTyping(); else stopTyping();
    // Force re-render so send button updates
    e.currentTarget.dispatchEvent(new Event('input-updated'));
  }, [autoResize, startTyping, stopTyping]);

  /* ── Send ──────────────────────────────────────────────────────── */
  const handleSend = useCallback(() => {
    const trimmed = contentRef.current.trim();
    if (!trimmed) return;

    getSocket()?.emit('message:send', {
      channelId,
      content: trimmed,
      ...(replyTo ? { replyToId: replyTo.id } : {}),
    });

    // Clear textarea
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.style.height = 'auto';
    }
    contentRef.current = '';
    onCancelReply();
    stopTyping();
  }, [channelId, replyTo, onCancelReply, stopTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  /* ── Focus input when channel changes ──────────────────────────── */
  useEffect(() => {
    textareaRef.current?.focus();
    // Reset content for new channel
    if (textareaRef.current) textareaRef.current.value = '';
    contentRef.current = '';
  }, [channelId]);

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
            padding: '7px 14px',
            background: 'var(--color-elevated)',
            borderRadius: 'var(--radius-control) var(--radius-control) 0 0',
            borderLeft: '2px solid var(--color-accent)',
          }}
        >
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

      {/* ── Input box ────────────────────────────────────────────── */}
      <div className="message-input-box">
        <textarea
          ref={textareaRef}
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
            border: 'none',
          }}
        />

        <button
          onClick={handleSend}
          title="Send (Enter)"
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'opacity 0.15s, transform 0.1s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          <Send size={15} style={{ color: '#fff' }} />
        </button>
      </div>
    </div>
  );
}
