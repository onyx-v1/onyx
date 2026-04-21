import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Pin } from 'lucide-react';
import { Message } from '@onyx/types';
import { MessageOrPin, isPinEvent, PinEvent } from '../../stores/messageStore';
import { MessageItem } from './MessageItem';

interface Props {
  messages:   MessageOrPin[];
  hasMore:    boolean;
  isLoading:  boolean;
  onLoadMore: () => void;
  onReply:    (message: Message) => void;
}

// ── Pin system row ────────────────────────────────────────────────────────────
function PinSystemRow({ event }: { event: PinEvent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '4px 20px',
      opacity: 0.65,
    }}>
      <div style={{
        width: 36, display: 'flex', justifyContent: 'center', flexShrink: 0,
      }}>
        <Pin size={12} style={{ color: 'var(--color-accent)', transform: 'rotate(45deg)' }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
        <strong style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          {event.pinnedByName}
        </strong>
        {' pinned a message'}
      </span>
    </div>
  );
}

// Group consecutive REAL messages from the same author within 5 minutes
function groupMessages(items: MessageOrPin[]) {
  let lastRealMsg: Message | null = null;
  return items.map((item) => {
    if (isPinEvent(item)) {
      return { item, compact: false };
    }
    const msg = item as Message;
    const prev = lastRealMsg;
    const compact =
      !!prev &&
      !msg.replyTo &&
      !msg.deleted &&
      prev.author.id === msg.author.id &&
      new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000;
    lastRealMsg = msg;
    return { item, compact };
  });
}

export function MessageList({ messages, hasMore, isLoading, onLoadMore, onReply }: Props) {
  const containerRef      = useRef<HTMLDivElement>(null);
  const bottomRef         = useRef<HTMLDivElement>(null);
  const isAtBottom        = useRef(true);
  const savedScrollHeight = useRef(0);
  const lastMessageCount  = useRef(messages.length);
  const didHighlight      = useRef(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  /* ── Scroll to highlighted message once messages load ───────────── */
  useEffect(() => {
    if (!highlightId || didHighlight.current) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`msg-${highlightId}`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      didHighlight.current = true;
      setTimeout(() => {
        setSearchParams((p) => { p.delete('highlight'); return p; }, { replace: true });
        didHighlight.current = false;
      }, 3000);
    }, 120);
    return () => clearTimeout(t);
  }, [highlightId, messages.length]);

  /* ── Auto-scroll to bottom when new messages arrive ─────────────── */
  useEffect(() => {
    if (isAtBottom.current && !highlightId) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    if (messages.length > lastMessageCount.current) {
      const container = containerRef.current;
      if (container && savedScrollHeight.current > 0) {
        container.scrollTop += container.scrollHeight - savedScrollHeight.current;
        savedScrollHeight.current = 0;
      }
    }
    lastMessageCount.current = messages.length;
  }, [messages.length]);

  /* ── Scroll handler ──────────────────────────────────────────────── */
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    isAtBottom.current = scrollHeight - scrollTop - clientHeight < 80;
    if (scrollTop < 120 && hasMore && !isLoading) {
      savedScrollHeight.current = scrollHeight;
      onLoadMore();
    }
  };

  const grouped = groupMessages(messages);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ flex: 1, overflowY: 'auto', padding: '8px 0 4px', display: 'flex', flexDirection: 'column' }}
    >
      {/* Load-older spinner */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <Loader2 size={16} style={{ color: 'var(--color-muted)', animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Messages + pin system rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {grouped.map(({ item, compact }) =>
          isPinEvent(item) ? (
            <PinSystemRow key={item.id} event={item} />
          ) : (
            <MessageItem
              key={item.id}
              message={item as Message}
              compact={compact}
              onReply={() => onReply(item as Message)}
              isHighlighted={(item as Message).id === highlightId}
            />
          ),
        )}
      </div>

      {/* Anchor for scroll-to-bottom */}
      <div ref={bottomRef} style={{ height: 1 }} />
    </div>
  );
}
