import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Hash, Volume2, Pin, Search, X, Clock } from 'lucide-react';
import { useChannelStore } from '../stores/channelStore';
import { useMessages } from '../hooks/useMessages';
import { useMobileCtx } from '../context/MobileContext';
import { MessageList } from '../components/messages/MessageList';
import { MessageInput } from '../components/messages/MessageInput';
import { MessageSelectionBar } from '../components/messages/MessageSelectionBar';
import { TypingIndicator } from '../components/messages/TypingIndicator';
import { PinnedPanel } from '../components/ui/PinnedPanel';
import { useSelectionStore } from '../stores/selectionStore';
import { apiClient } from '../api/client';
import { Message } from '@onyx/types';
import { formatTimestampIST } from '../utils/time';

/* ── helpers ──────────────────────────────────────────────────────────────── */
function fmtDate(d: Date) {
  if (isToday(d))     return format(d, 'HH:mm');
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`;
  return format(d, 'MMM d, HH:mm');
}

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(139,124,248,0.28)', color: 'var(--color-accent-hover)', borderRadius: 2 }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/* ── route guard ──────────────────────────────────────────────────────────── */
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

/* ── channel view ─────────────────────────────────────────────────────────── */
function ChannelView({ channelId }: { channelId: string }) {
  const { channels }             = useChannelStore();
  const { clearSelection }       = useSelectionStore();
  const { isMobile }             = useMobileCtx();
  const navigate                 = useNavigate();
  const [replyTo, setReplyTo]    = useState<Message | null>(null);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
      background: isMobile ? 'var(--color-base)' : undefined,
    }}>

      {/* ── Mobile header ──────────────────────────────────────────── */}
      {isMobile && (
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 0,
          height: 'calc(env(safe-area-inset-top) + 56px)',
          flexShrink: 0,
          background: '#141414',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
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

          {/* Right action buttons — only for text channels */}
          {channel?.type === 'TEXT' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: 10, height: 56 }}>

              {/* Search button */}
              <button
                onClick={() => setSearchOpen(true)}
                style={{
                  width: 38, height: 38,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none', cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                } as React.CSSProperties}
              >
                <Search size={15} style={{ color: '#a0a0a0' }} />
              </button>

              {/* Pin button */}
              <div style={{ position: 'relative' }}>
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
                    style={{ transform: 'rotate(45deg)', color: pinnedOpen ? 'var(--color-accent)' : '#a0a0a0' }}
                  />
                </button>
                {pinnedOpen && (
                  <div style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top) + 60px)', right: 8, left: 8, zIndex: 100 }}>
                    <PinnedPanel onClose={() => setPinnedOpen(false)} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Message area ──────────────────────────────────────────── */}
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

      {/* ── Mobile search overlay ──────────────────────────────────── */}
      {isMobile && searchOpen && (
        <MobileSearch
          channelId={channelId}
          channelName={channel?.name ?? ''}
          onClose={() => setSearchOpen(false)}
          onNavigate={(msgId, chId) => {
            setSearchOpen(false);
            navigate(`/channel/${chId}?highlight=${msgId}`);
          }}
        />
      )}
    </div>
  );
}

/* ── Mobile full-screen search overlay ───────────────────────────────────── */
interface MobileSearchProps {
  channelId:   string;
  channelName: string;
  onClose:     () => void;
  onNavigate:  (msgId: string, channelId: string) => void;
}

interface SearchResult extends Message {
  channel?: { id: string; name: string };
}

function MobileSearch({ channelId, channelName, onClose, onNavigate }: MobileSearchProps) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [scope,   setScope]   = useState<'channel' | 'all'>('channel');
  const inputRef  = useRef<HTMLInputElement>(null);
  const debounce  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { channels } = useChannelStore();

  // Auto-focus the input when the overlay opens
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const runSearch = useCallback(async (q: string, s: 'channel' | 'all') => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q });
      if (s === 'channel') params.set('channelId', channelId);
      const { data } = await apiClient.get<SearchResult[]>(`/messages/search?${params}`);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!query.trim()) { setResults([]); return; }
    debounce.current = setTimeout(() => runSearch(query, scope), 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query, scope, runSearch]);

  const channelName_ = (r: SearchResult) => {
    const ch = channels.find((c) => c.id === r.channelId);
    return ch ? ch.name : r.channelId;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--color-base)',
      display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)',
    }}>

      {/* ── Search bar row ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        {/* Cancel / back */}
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer',
            color: 'var(--color-accent)',
            WebkitTapHighlightColor: 'transparent',
          } as React.CSSProperties}
        >
          <ArrowLeft size={18} />
        </button>

        {/* Search input */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-input)',
          borderRadius: 10, padding: '9px 12px',
          border: '1px solid rgba(139,124,248,0.25)',
        }}>
          <Search size={15} style={{ color: '#a0a0a0', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 15, color: '#f2f2f2',
              caretColor: 'var(--color-accent)',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#606060' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Scope toggle ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8,
        padding: '10px 14px',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        {(['channel', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setScope(s); runSearch(query, s); }}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: scope === s ? 'var(--color-accent-muted)' : 'var(--color-input)',
              color: scope === s ? 'var(--color-accent)' : '#a0a0a0',
              transition: 'all 0.15s',
              WebkitTapHighlightColor: 'transparent',
            } as React.CSSProperties}
          >
            {s === 'channel' ? `#${channelName}` : 'All channels'}
          </button>
        ))}
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>

        {!query.trim() ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10 }}>
            <Search size={32} style={{ color: '#303030' }} />
            <p style={{ fontSize: 14, color: '#606060', margin: 0 }}>Type to search messages</p>
            <p style={{ fontSize: 12, color: '#404040', margin: 0 }}>Minimum 2 characters</p>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
            <span style={{ fontSize: 14, color: '#606060' }}>Searching…</span>
          </div>
        ) : results.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10 }}>
            <Search size={32} style={{ color: '#303030' }} />
            <p style={{ fontSize: 14, color: '#606060', margin: 0 }}>No results for "{query}"</p>
          </div>
        ) : (
          <>
            {/* Count */}
            <div style={{ padding: '8px 14px 4px', fontSize: 11, color: '#505050', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>

            {/* Result rows */}
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => onNavigate(r.id, r.channelId)}
                style={{
                  width: '100%', display: 'flex', flexDirection: 'column', gap: 4,
                  padding: '12px 16px',
                  background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  WebkitTapHighlightColor: 'transparent',
                } as React.CSSProperties}
              >
                {/* Author + channel + time row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f2f2f2' }}>
                    {r.author.displayName}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#505050' }}>
                    <Hash size={9} />
                    {channelName_(r)}
                  </span>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#505050' }}>
                    <Clock size={9} />
                    {formatTimestampIST(new Date(r.createdAt))}
                  </span>
                </div>

                {/* Message content with highlighted match */}
                <p style={{
                  margin: 0, fontSize: 13, color: '#a0a0a0', lineHeight: 1.5,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                } as React.CSSProperties}>
                  <Highlighted text={r.content} query={query} />
                </p>
              </button>
            ))}

            {/* Bottom safe area spacer */}
            <div style={{ height: 'env(safe-area-inset-bottom)' }} />
          </>
        )}
      </div>
    </div>
  );
}
