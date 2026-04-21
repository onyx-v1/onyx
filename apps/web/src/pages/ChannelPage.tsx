import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useChannelStore } from '../stores/channelStore';
import { useMessages } from '../hooks/useMessages';
import { MessageList } from '../components/messages/MessageList';
import { MessageInput } from '../components/messages/MessageInput';
import { MessageSelectionBar } from '../components/messages/MessageSelectionBar';
import { TypingIndicator } from '../components/messages/TypingIndicator';
import { useSelectionStore } from '../stores/selectionStore';
import { Message } from '@onyx/types';
import { Hash } from 'lucide-react';

export function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const { setActiveChannel, markRead } = useChannelStore();

  // Sync store whenever URL channelId changes (e.g. navigating from search results)
  useEffect(() => {
    if (!channelId) return;
    setActiveChannel(channelId);
    markRead(channelId);
  }, [channelId]);

  if (!channelId) return <Navigate to="/" replace />;
  return <ChannelView key={channelId} channelId={channelId} />;
}

// Separated so hooks only run when channelId is guaranteed truthy
function ChannelView({ channelId }: { channelId: string }) {
  const { channels } = useChannelStore();
  const { clearSelection } = useSelectionStore();
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const { messages, hasMore, isLoading, loadMore, error } = useMessages(channelId);

  const channel = channels.find((c) => c.id === channelId);

  // Clear any active selection when switching channels
  useEffect(() => { clearSelection(); }, [channelId]);

  const handleReply = (msg: Message) => setReplyTo(msg);
  const cancelReply = () => setReplyTo(null);

  return (
    <div className="flex flex-col h-full" style={{ animation: 'channel-enter 0.18s ease-out' }}>

      {/* Scrollable message area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <p style={{ fontSize: 14, color: 'var(--color-danger)' }}>Failed to load messages.</p>
            <button
              onClick={() => loadMore()}
              className="btn-ghost"
              style={{ fontSize: 13, color: 'var(--color-accent)' }}
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 && !isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Hash size={28} className="text-accent" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-primary">Welcome to #{channel?.name}</h3>
              <p className="text-base text-muted mt-1">This is the beginning of the channel. Say something!</p>
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

      {/* Typing + input + selection bar */}
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
