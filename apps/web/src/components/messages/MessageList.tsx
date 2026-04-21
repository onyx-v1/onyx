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

// Group consecutive messages from the same author within 5 minutes
function groupMessages(messages: Message[]) {
  return messages.map((msg, i) => {
    const prev = messages[i - 1];
    const compact =
      !!prev &&
      !msg.replyTo &&
      !msg.deleted &&
      prev.author.id === msg.author.id &&
      new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000;
    return { message: msg, compact };
  });
}

export function MessageList({ messages, hasMore, isLoading, onLoadMore, onReply }: Props) {
  const containerRef       = useRef<HTMLDivElement>(null);
  const bottomRef          = useRef<HTMLDivElement>(null);
  const isAtBottom         = useRef(true);
  const savedScrollHeight  = useRef(0);  // only set when we're about to prepend old messages
  const lastMessageCount   = useRef(messages.length);

  /* ── Auto-scroll to bottom when new messages arrive ─────────────── */
  useEffect(() => {
    // Only scroll down if user was at the bottom before the new message
    if (isAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    // Reset savedScrollHeight after a prepend has been corrected
    if (messages.length > lastMessageCount.current) {
      const container = containerRef.current;
      if (container && savedScrollHeight.current > 0) {
        // Restore position after prepending older messages
        container.scrollTop += container.scrollHeight - savedScrollHeight.current;
        savedScrollHeight.current = 0;
      }
    }
    lastMessageCount.current = messages.length;
  }, [messages.length]);

  /* ── Scroll handler — track position + trigger load-more ────────── */
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;

    // Are we within 80px of the bottom?
    isAtBottom.current = scrollHeight - scrollTop - clientHeight < 80;

    // Near the top — load older messages
    if (scrollTop < 120 && hasMore && !isLoading) {
      savedScrollHeight.current = scrollHeight; // save before prepend
      onLoadMore();
    }
  };

  const grouped = groupMessages(messages);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 0 4px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Load-older spinner */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <Loader2 size={16} style={{ color: 'var(--color-muted)', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {grouped.map(({ message, compact }) => (
          <MessageItem
            key={message.id}
            message={message}
            compact={compact}
            onReply={() => onReply(message)}
          />
        ))}
      </div>

      {/* Anchor for scroll-to-bottom */}
      <div ref={bottomRef} style={{ height: 1 }} />
    </div>
  );
}
