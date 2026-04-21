import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Hash, Clock } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useChannelStore } from '../../stores/channelStore';
import { Message } from '@onyx/types';
import { format, isToday, isYesterday } from 'date-fns';

function formatDate(date: Date) {
  if (isToday(date))     return format(date, 'HH:mm');
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
  return format(date, 'MMM d, HH:mm');
}

/** Highlights the matched query substring in bold accent colour. */
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

interface SearchResult extends Message {
  channel?: { id: string; name: string };
}

export function SearchPanel() {
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState<SearchResult[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [open,       setOpen]       = useState(false);
  const [scope,      setScope]      = useState<'channel' | 'all'>('channel');
  const [activeIdx,  setActiveIdx]  = useState(0);

  const inputRef    = useRef<HTMLInputElement>(null);
  const panelRef    = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate    = useNavigate();
  const { channels, activeChannelId } = useChannelStore();
  const activeChannel = channels.find((c) => c.id === activeChannelId);

  /* ── Debounced search ───────────────────────────────────────────── */
  const runSearch = useCallback(async (q: string, s: 'channel' | 'all') => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q });
      if (s === 'channel' && activeChannelId) params.set('channelId', activeChannelId);
      const { data } = await apiClient.get<SearchResult[]>(`/messages/search?${params}`);
      setResults(data);
      setActiveIdx(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [activeChannelId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => runSearch(query, scope), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, scope, runSearch]);

  /* ── Close on outside click ─────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Global Ctrl+K / Cmd+K shortcut ────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const goToResult = (r: SearchResult) => {
    navigate(`/channel/${r.channelId}`);
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) goToResult(results[activeIdx]);
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  };

  /* ── Get channel name for a result ─────────────────────────────── */
  const channelName = (r: SearchResult) => {
    const ch = channels.find((c) => c.id === r.channelId);
    return ch ? ch.name : r.channelId;
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Search input */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-input)', padding: '7px 12px',
          borderRadius: 8, border: `1px solid ${open ? 'rgba(139,124,248,0.4)' : 'transparent'}`,
          transition: 'border-color 0.15s', cursor: 'text', width: 200,
        }}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        <Search size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search… (Ctrl+K)"
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontSize: 13, color: 'var(--color-primary)', width: '100%',
          }}
        />
        {query && (
          <button
            onClick={(e) => { e.stopPropagation(); setQuery(''); setResults([]); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-subtle)', display: 'flex' }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Results panel */}
      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            width: 420, background: 'var(--color-elevated)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            zIndex: 1000,
          }}
        >
          {/* Scope toggle */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {(['channel', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setScope(s); runSearch(query, s); }}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: scope === s ? 'rgba(139,124,248,0.18)' : 'transparent',
                  color: scope === s ? 'var(--color-accent)' : 'var(--color-muted)',
                  transition: 'background 0.12s',
                }}
              >
                {s === 'channel' ? `# ${activeChannel?.name ?? 'current'}` : 'All channels'}
              </button>
            ))}
          </div>

          {/* Body */}
          {!query.trim() ? (
            <div style={{ padding: '16px 16px', textAlign: 'center', color: 'var(--color-subtle)', fontSize: 13 }}>
              Type at least 2 characters to search
            </div>
          ) : loading ? (
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>Searching…</span>
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <Search size={28} style={{ color: 'var(--color-subtle)', marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0 }}>No results for "{query}"</p>
            </div>
          ) : (
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              <div style={{ padding: '6px 12px 2px', fontSize: 11, color: 'var(--color-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((r, i) => (
                <div
                  key={r.id}
                  onClick={() => goToResult(r)}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 3,
                    padding: '9px 14px', cursor: 'pointer',
                    background: i === activeIdx ? 'rgba(255,255,255,0.05)' : 'transparent',
                    borderLeft: i === activeIdx ? '2px solid var(--color-accent)' : '2px solid transparent',
                    transition: 'background 0.08s',
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                >
                  {/* Author + channel + time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                      {r.author.displayName}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--color-subtle)' }}>
                      <Hash size={10} />
                      {channelName(r)}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-subtle)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} />
                      {formatDate(new Date(r.createdAt))}
                    </span>
                  </div>
                  {/* Content with highlighted match */}
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Highlighted text={r.content} query={query} />
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
