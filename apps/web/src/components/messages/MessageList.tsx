import { useEffect, useRef, useMemo, useCallback, memo } from 'react';
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

/* ── Pin system row ──────────────────────────────────────────────────── */
const PinSystemRow = memo(function PinSystemRow({ event }: { event: PinEvent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 20px', opacity: 0.65 }}>
      <div style={{ width: 36, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <Pin size={12} style={{ color: 'var(--color-accent)', transform: 'rotate(45deg)' }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
        <strong style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{event.pinnedByName}</strong>
        {' pinned a message'}
      </span>
    </div>
  );
});

/* ── Group consecutive messages from same author within 5 minutes ────── */
function groupMessages(items: MessageOrPin[]) {
  let lastReal: Message | null = null;
  return items.map((item) => {
    if (isPinEvent(item)) return { item, compact: false };
    const msg    = item as Message;
    const prev   = lastReal;
    const compact =
      !!prev &&
      !msg.replyTo &&
      !msg.deleted &&
      prev.author.id === msg.author.id &&
      new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000;
    lastReal = msg;
    return { item, compact };
  });
}

/* ── MessageList ─────────────────────────────────────────────────────── */
export function MessageList({ messages, hasMore, isLoading, onLoadMore, onReply }: Props) {
  const containerRef      = useRef<HTMLDivElement>(null);
  const bottomRef         = useRef<HTMLDivElement>(null);
  const isAtBottom        = useRef(true);
  const savedScrollHeight = useRef(0);
  const lastMessageCount  = useRef(messages.length);
  const didHighlight      = useRef(false);
  const rafRef            = useRef<number>(0);           // throttle token

  // Keep onReply stable so MessageItem memo is never busted by parent re-renders
  const onReplyRef = useRef(onReply);
  useEffect(() => { onReplyRef.current = onReply; }, [onReply]);
  const stableOnReply = useCallback((msg: Message) => onReplyRef.current(msg), []);

  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  // Memoize grouping — only recomputes when the messages array changes
  const grouped = useMemo(() => groupMessages(messages), [messages]);

  /* ── Scroll to highlighted message ──────────────────────────────── */
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

  /* ── Auto-scroll to bottom on new incoming messages ─────────────── */
  useEffect(() => {
    const prevCount = lastMessageCount.current;
    const nextCount = messages.length;

    if (nextCount > prevCount) {
      // Messages were added (new message or load-more)
      const container = containerRef.current;
      if (container && savedScrollHeight.current > 0) {
        // Restore scroll position after prepending older messages
        container.scrollTop += container.scrollHeight - savedScrollHeight.current;
        savedScrollHeight.current = 0;
      } else if (isAtBottom.current && !highlightId) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }

    lastMessageCount.current = nextCount;
  }, [messages.length]);

  /* ── Scroll event — rAF-throttled to avoid jank ─────────────────── */
  const handleScroll = useCallback(() => {
    if (rafRef.current) return; // already a frame queued
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = containerRef.current;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      isAtBottom.current = scrollHeight - scrollTop - clientHeight < 80;
      if (scrollTop < 120 && hasMore && !isLoading) {
        savedScrollHeight.current = scrollHeight;
        onLoadMore();
      }
    });
  }, [hasMore, isLoading, onLoadMore]);

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
              onReply={stableOnReply}
              isHighlighted={(item as Message).id === highlightId}
            />
          ),
        )}
      </div>

      {/* Scroll-to-bottom anchor */}
      <div ref={bottomRef} style={{ height: 1 }} />
    </div>
  );
}
