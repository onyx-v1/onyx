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
    <div className="flex flex-col h-full">
      {/* Empty state */}
      {messages.length === 0 && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Hash size={28} className="text-accent" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-semibold text-primary">Welcome to #{channel?.name}</h3>
            <p className="text-sm text-muted mt-1">This is the beginning of the channel. Say something!</p>
          </div>
        </div>
      )}

      {/* Message list */}
      {messages.length > 0 && (
        <MessageList
          messages={messages}
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
          onReply={setReplyTo}
        />
      )}

      {/* Typing indicator */}
      <TypingIndicator channelId={channelId} />

      {/* Input */}
      <MessageInput
        channelId={channelId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
