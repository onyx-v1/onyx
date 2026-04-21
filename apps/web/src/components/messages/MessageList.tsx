import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Message } from '@onyx/types';
import { MessageItem } from './MessageItem';

interface Props {
  messages: Message[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onReply: (message: Message) => void;
}

export function MessageList({ messages, hasMore, isLoading, onLoadMore, onReply }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef<number>(0);
  const isAtBottom = useRef(true);

  // Auto-scroll to bottom on new messages if user is at bottom
  useEffect(() => {
    if (isAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Preserve scroll position when loading old messages
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const diff = container.scrollHeight - prevScrollHeight.current;
    if (diff > 0 && prevScrollHeight.current > 0) container.scrollTop += diff;
  }, [messages]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    isAtBottom.current = scrollHeight - scrollTop - clientHeight < 80;
    if (scrollTop < 100 && hasMore && !isLoading) {
      prevScrollHeight.current = scrollHeight;
      onLoadMore();
    }
  };

  // Group consecutive messages from the same author (within 5 min)
  const grouped = messages.reduce<Array<{ message: Message; compact: boolean }>>((acc, msg, i) => {
    const prev = messages[i - 1];
    const compact =
      !!prev &&
      prev.author.id === msg.author.id &&
      !msg.replyTo &&
      new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000;
    acc.push({ message: msg, compact });
    return acc;
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-2 py-4"
      onScroll={handleScroll}
    >
      {/* Load more spinner */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="text-muted animate-spin" />
        </div>
      )}

      {/* Messages */}
      <div className="flex flex-col gap-0.5">
        {grouped.map(({ message, compact }) => (
          <MessageItem
            key={message.id}
            message={message}
            compact={compact}
            onReply={() => onReply(message)}
          />
        ))}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
