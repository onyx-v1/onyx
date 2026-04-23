import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Hash, Volume2, Pin } from 'lucide-react';
import { useChannelStore } from '../stores/channelStore';
import { useMessages } from '../hooks/useMessages';
import { useMobileCtx } from '../context/MobileContext';
import { MessageList } from '../components/messages/MessageList';
import { MessageInput } from '../components/messages/MessageInput';
import { MessageSelectionBar } from '../components/messages/MessageSelectionBar';
import { TypingIndicator } from '../components/messages/TypingIndicator';
import { PinnedPanel } from '../components/ui/PinnedPanel';
import { useSelectionStore } from '../stores/selectionStore';
import { Message } from '@onyx/types';

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

function ChannelView({ channelId }: { channelId: string }) {
  const { channels }             = useChannelStore();
  const { clearSelection }       = useSelectionStore();
  const { isMobile }             = useMobileCtx();
  const navigate                 = useNavigate();
  const [replyTo, setReplyTo]    = useState<Message | null>(null);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const { messages, hasMore, isLoading, loadMore, error } = useMessages(channelId);

  const channel = useMemo(
    () => channels.find((c) => c.id === channelId),
    [channels, channelId],
  );

  useEffect(() => { clearSelection(); }, [channelId]);

  const handleReply  = useCallback((msg: Message) => setReplyTo(msg), []);
  const cancelReply  = useCallback(() => setReplyTo(null), []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: isMobile ? '#0f0f0f' : undefined,
    }}>

      {/* ── Mobile header ─────────────────────────────────────────── */}
      {isMobile && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          height: 56, flexShrink: 0,
          background: '#141414',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 'env(safe-area-inset-top)',
        }}>
          {/* Back arrow */}
          <button
            onClick={() => navigate('/')}
            style={{
              width: 52, height: 56,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-accent)',
              WebkitTapHighlightColor: 'transparent',
            } as React.CSSProperties}
          >
            <ArrowLeft size={22} />
          </button>

          {/* Channel icon + name */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: channel?.type === 'VOICE'
                ? 'rgba(62,207,142,0.12)'
                : 'rgba(139,124,248,0.12)',
            }}>
              {channel?.type === 'VOICE' ? (
                <Volume2 size={15} style={{ color: 'var(--color-online)' }} />
              ) : (
                <Hash size={15} style={{ color: 'var(--color-accent)' }} />
              )}
            </div>
            <span style={{
              fontSize: 16, fontWeight: 700,
              color: '#f2f2f2',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              {channel?.name ?? '…'}
            </span>
          </div>

          {/* Pin button (text channels only) */}
          {channel?.type === 'TEXT' && (
            <div style={{ position: 'relative', marginRight: 8 }}>
              <button
                onClick={() => setPinnedOpen((v) => !v)}
                style={{
                  width: 38, height: 38,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 10,
                  background: pinnedOpen ? 'rgba(139,124,248,0.12)' : 'rgba(255,255,255,0.06)',
                  border: 'none', cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                } as React.CSSProperties}
              >
                <Pin
                  size={15}
                  style={{
                    transform: 'rotate(45deg)',
                    color: pinnedOpen ? 'var(--color-accent)' : '#a0a0a0',
                  }}
                />
              </button>
              {pinnedOpen && (
                <div style={{ position: 'fixed', top: 56, right: 8, left: 8, zIndex: 100 }}>
                  <PinnedPanel onClose={() => setPinnedOpen(false)} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Message area ─────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {error ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <p style={{ fontSize: 14, color: 'var(--color-danger)' }}>Failed to load messages.</p>
            <button onClick={loadMore} style={{ fontSize: 13, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Retry
            </button>
          </div>
        ) : messages.length === 0 && !isLoading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 32px' }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: 'rgba(139,124,248,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Hash size={26} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f2f2f2', margin: '0 0 4px' }}>
                Welcome to #{channel?.name}
              </h3>
              <p style={{ fontSize: 13, color: '#606060', margin: 0 }}>
                This is the beginning of this channel.
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

      {/* ── Input area ──────────────────────────────────────────── */}
      <TypingIndicator channelId={channelId} />
      <div style={{ position: 'relative', flexShrink: 0 }}>
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
