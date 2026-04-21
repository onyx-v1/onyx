import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useChannelStore } from '../stores/channelStore';
import { useMessages } from '../hooks/useMessages';
import { MessageList } from '../components/messages/MessageList';
import { MessageInput } from '../components/messages/MessageInput';
import { TypingIndicator } from '../components/messages/TypingIndicator';
import { Message } from '@onyx/types';
import { Hash } from 'lucide-react';

export function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const { channels } = useChannelStore();
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const channel = channels.find((c) => c.id === channelId);
  const { messages, hasMore, isLoading, loadMore } = useMessages(channelId ?? '');

  if (!channelId) return <Navigate to="/" replace />;

  return (
    // key forces full remount on channel switch — prevents stale scroll state
    <div key={channelId} className="flex flex-col h-full" style={{ animation: 'channel-enter 0.18s ease-out' }}>

      {/* Scrollable message area — always flex-1 so input stays at bottom */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {messages.length === 0 && !isLoading ? (
          /* Empty state — lives inside the flex-1 box */
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
            onReply={setReplyTo}
          />
        )}
      </div>

      {/* Typing + input — always anchored to bottom */}
      <TypingIndicator channelId={channelId} />
      <MessageInput
        channelId={channelId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
