import { useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Pin } from 'lucide-react';
import { Message } from '@onyx/types';
import { MessageOrPin, isPinEvent, PinEvent } from '../../stores/messageStore';
import { MessageItem } from './MessageItem';
import { istDayKey, formatDayLabelIST } from '../../utils/time';

interface Props {
  messages:   MessageOrPin[];
  hasMore:    boolean;
  isLoading:  boolean;
  onLoadMore: () => void;
  onReply:    (message: Message) => void;
}

/* ── Day separator — Discord-style horizontal rule with centred date pill ── */
const DaySeparator = memo(function DaySeparator({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '12px 20px 6px',
      gap: 12,
      userSelect: 'none',
    }}>
      {/* Left rule */}
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />

      {/* Date pill */}
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: 'var(--color-subtle)',
        background: 'var(--color-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 20,
        padding: '3px 10px',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {label}
      </span>

      {/* Right rule */}
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
    </div>
  );
});

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
  const rafRef            = useRef<number>(0);

  // Keep onReply stable so MessageItem memo is never busted by parent re-renders
  const onReplyRef = useRef(onReply);
  useEffect(() => { onReplyRef.current = onReply; }, [onReply]);
  const stableOnReply = useCallback((msg: Message) => onReplyRef.current(msg), []);

  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  // Stable jump-to-message: sets ?highlight=id which the effect below picks up
  const stableOnJump = useCallback((msgId: string) => {
    setSearchParams((p) => { p.set('highlight', msgId); return p; }, { replace: true });
  }, [setSearchParams]);


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
      const container = containerRef.current;
      if (container && savedScrollHeight.current > 0) {
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
    if (rafRef.current) return;
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

  /* ── Build render list: inject DaySeparator between IST day changes ─ */
  const renderItems = useMemo(() => {
    const out: React.ReactNode[] = [];
    let lastDay = '';

    grouped.forEach(({ item, compact }, idx) => {
      // Determine the IST day key for this item
      const date = isPinEvent(item)
        ? new Date((item as PinEvent).createdAt ?? Date.now())
        : new Date((item as Message).createdAt);

      const dayKey = istDayKey(date);

      if (dayKey !== lastDay) {
        out.push(
          <DaySeparator
            key={`day-${dayKey}`}
            label={formatDayLabelIST(date)}
          />
        );
        lastDay = dayKey;
      }

      if (isPinEvent(item)) {
        out.push(<PinSystemRow key={item.id} event={item as PinEvent} />);
      } else {
        const msg = item as Message;
        out.push(
          <MessageItem
            key={msg.id}
            message={msg}
            compact={compact}
            onReply={stableOnReply}
            onJumpToMessage={stableOnJump}
            isHighlighted={msg.id === highlightId}
          />
        );
      }
    });

    return out;
  }, [grouped, highlightId, stableOnReply, stableOnJump]);

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

      {/* Messages with day separators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {renderItems}
      </div>

      {/* Scroll-to-bottom anchor */}
      <div ref={bottomRef} style={{ height: 1 }} />
    </div>
  );
}
