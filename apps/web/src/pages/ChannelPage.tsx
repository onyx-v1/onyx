import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Hash, Menu, Search } from 'lucide-react';
import { useChannelStore } from '../stores/channelStore';
import { useMessages } from '../hooks/useMessages';
import { useMobileCtx } from '../context/MobileContext';
import { MessageList } from '../components/messages/MessageList';
import { MessageInput } from '../components/messages/MessageInput';
import { MessageSelectionBar } from '../components/messages/MessageSelectionBar';
import { TypingIndicator } from '../components/messages/TypingIndicator';
import { useSelectionStore } from '../stores/selectionStore';
import { Message } from '@onyx/types';

/* ── Route guard ─────────────────────────────────────────────────────── */
export function ChannelPage() {
  const { channelId }              = useParams<{ channelId: string }>();
  const { setActiveChannel, markRead } = useChannelStore();

  useEffect(() => {
    if (!channelId) return;
    setActiveChannel(channelId);
    markRead(channelId);
  }, [channelId]);

  if (!channelId) return <Navigate to="/" replace />;
  return <ChannelView key={channelId} channelId={channelId} />;
}

/* ── Channel view ────────────────────────────────────────────────────── */
function ChannelView({ channelId }: { channelId: string }) {
  const { channels }               = useChannelStore();
  const { clearSelection }         = useSelectionStore();
  const { isMobile, openDrawer }   = useMobileCtx();
  const navigate                   = useNavigate();
  const [replyTo, setReplyTo]      = useState<Message | null>(null);
  const { messages, hasMore, isLoading, loadMore, error } = useMessages(channelId);

  const channel = useMemo(
    () => channels.find((c) => c.id === channelId),
    [channels, channelId],
  );

  useEffect(() => { clearSelection(); }, [channelId]);

  const handleReply = useCallback((msg: Message) => setReplyTo(msg), []);
  const cancelReply = useCallback(() => setReplyTo(null), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Mobile top bar (replaces desktop Header) ──────────────── */}
      {isMobile && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 12px',
            height: 52,
            flexShrink: 0,
            background: 'var(--color-base)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {/* Hamburger — open sidebar drawer */}
          <button
            onClick={openDrawer}
            title="Channels"
            style={{
              width: 36, height: 36, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--color-muted)',
            }}
          >
            <Menu size={18} />
          </button>

          {/* Channel name */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ color: 'var(--color-muted)', fontSize: 16 }}>
              {channel?.type === 'VOICE' ? '🔊' : '#'}
            </span>
            <span
              style={{
                fontSize: 15, fontWeight: 700,
                color: 'var(--color-primary)',
                overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              }}
            >
              {channel?.name ?? '…'}
            </span>
          </div>
        </div>
      )}

      {/* ── Message area ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {error ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <p style={{ fontSize: 14, color: 'var(--color-danger)' }}>Failed to load messages.</p>
            <button onClick={loadMore} className="btn-ghost" style={{ fontSize: 13, color: 'var(--color-accent)' }}>
              Retry
            </button>
          </div>
        ) : messages.length === 0 && !isLoading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 32px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(139,124,248,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hash size={24} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                Welcome to #{channel?.name}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-muted)', marginTop: 4 }}>
                This is the beginning of the channel. Say something!
              </p>
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            hasMore={hasMore}
            isLoading={isLoading}
            onLoadMore={loadMore}
            onReply={handleReply}
          />
        )}
      </div>

      {/* ── Input area ────────────────────────────────────────────── */}
      <TypingIndicator channelId={channelId} />
      <div style={{ position: 'relative' }}>
        <MessageSelectionBar channelId={channelId} />
        <MessageInput
          channelId={channelId}
          replyTo={replyTo}
          onCancelReply={cancelReply}
        />
      </div>
    </div>
  );
}
