import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, CornerUpLeft, AtSign } from 'lucide-react';
import { Message } from '@onyx/types';
import { getSocket } from '../../hooks/useSocket';
import { useMembersStore, Member } from '../../stores/membersStore';

interface Props {
  channelId: string;
  replyTo: Message | null;
  onCancelReply: () => void;
}

const MAX_LENGTH = 2000;

// @everyone is always the first option
const EVERYONE: Member = { id: '__everyone__', username: 'everyone', displayName: 'Everyone (notify all)' };

export function MessageInput({ channelId, replyTo, onCancelReply }: Props) {
  const [hasContent,    setHasContent]    = useState(false);
  const [mentionQuery,  setMentionQuery]  = useState<string | null>(null); // null = closed
  const [mentionIndex,  setMentionIndex]  = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTyping    = useRef(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const members = useMembersStore((s) => s.members);

  // Filtered mention list: @everyone + members matching query
  const mentionList: Member[] = mentionQuery === null ? [] : [
    ...(EVERYONE.displayName.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        'everyone'.startsWith(mentionQuery.toLowerCase()) ? [EVERYONE] : []),
    ...members.filter(
      (m) =>
        m.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        m.displayName.toLowerCase().includes(mentionQuery.toLowerCase()),
    ),
  ];

  /* ── Stop typing ─────────────────────────────────────────────────── */
  const stopTyping = useCallback(() => {
    if (typingTimer.current) { clearTimeout(typingTimer.current); typingTimer.current = null; }
    if (isTyping.current) {
      isTyping.current = false;
      getSocket()?.emit('typing:stop', { channelId });
    }
  }, [channelId]);

  /* ── Start typing ────────────────────────────────────────────────── */
  const startTyping = useCallback(() => {
    if (!isTyping.current) {
      isTyping.current = true;
      getSocket()?.emit('typing:start', { channelId });
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 3000);
  }, [channelId, stopTyping]);

  /* ── Clean up on channel change ─────────────────────────────────── */
  useEffect(() => () => stopTyping(), [channelId]);

  /* ── Reset on channel change ────────────────────────────────────── */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
    setHasContent(false);
    setMentionQuery(null);
  }, [channelId]);

  /* ── Auto-resize ─────────────────────────────────────────────────── */
  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, []);

  /* ── Insert a mention at cursor ─────────────────────────────────── */
  const insertMention = useCallback((member: Member) => {
    const ta = textareaRef.current;
    if (!ta) return;

    // Use displayName as the mention handle (backend resolves by displayName)
    const handle = member.id === '__everyone__' ? 'everyone' : member.displayName;

    const cursor   = ta.selectionStart ?? ta.value.length;
    const before   = ta.value.slice(0, cursor);
    const after    = ta.value.slice(cursor);
    const replaced = before.replace(/@(\w*)$/, `@${handle} `);

    ta.value = replaced + after;
    const newPos = replaced.length;
    ta.setSelectionRange(newPos, newPos);
    ta.focus();

    setMentionQuery(null);
    setMentionIndex(0);
    setHasContent(ta.value.trim().length > 0);
    autoResize();
  }, [autoResize]);

  /* ── Input handler ───────────────────────────────────────────────── */
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length > MAX_LENGTH) e.target.value = val.slice(0, MAX_LENGTH);
    setHasContent(e.target.value.trim().length > 0);
    autoResize();
    if (e.target.value.trim()) startTyping(); else stopTyping();

    // Detect @mention trigger at cursor
    const cursor = e.target.selectionStart ?? e.target.value.length;
    const textBefore = e.target.value.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  }, [autoResize, startTyping, stopTyping]);

  /* ── Send ────────────────────────────────────────────────────────── */
  const handleSend = useCallback(() => {
    const trimmed = textareaRef.current?.value.trim() ?? '';
    if (!trimmed) return;
    getSocket()?.emit('message:send', {
      channelId, content: trimmed,
      ...(replyTo ? { replyToId: replyTo.id } : {}),
    });
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.style.height = 'auto';
    }
    setHasContent(false);
    setMentionQuery(null);
    onCancelReply();
    stopTyping();
  }, [channelId, replyTo, onCancelReply, stopTyping]);

  /* ── Keyboard handler ────────────────────────────────────────────── */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Dropdown navigation
    if (mentionQuery !== null && mentionList.length > 0) {
      if (e.key === 'ArrowDown')  { e.preventDefault(); setMentionIndex((i) => Math.min(i + 1, mentionList.length - 1)); return; }
      if (e.key === 'ArrowUp')    { e.preventDefault(); setMentionIndex((i) => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionList[mentionIndex]); return; }
      if (e.key === 'Escape')     { e.preventDefault(); setMentionQuery(null); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [mentionQuery, mentionList, mentionIndex, insertMention, handleSend]);

  const charCount = textareaRef.current?.value.length ?? 0;

  return (
    <div className="message-input-wrap" style={{ position: 'relative' }}>

      {/* ── @mention dropdown ─────────────────────────────────────── */}
      {mentionQuery !== null && mentionList.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 16,
            right: 16,
            marginBottom: 4,
            background: 'var(--color-elevated)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
            maxHeight: 220,
            overflowY: 'auto',
            zIndex: 100,
          }}
        >
          <div style={{ padding: '4px 8px 2px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Members — {mentionQuery ? `@${mentionQuery}` : 'type to filter'}
            </span>
          </div>
          {mentionList.map((m, i) => (
            <div
              key={m.id}
              onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 12px',
                cursor: 'pointer',
                background: i === mentionIndex ? 'rgba(255,255,255,0.06)' : 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={() => setMentionIndex(i)}
            >
              {m.id === '__everyone__' ? (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(240,159,64,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <AtSign size={13} style={{ color: '#f09f40' }} />
                </div>
              ) : (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(139,124,248,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  fontSize: 12, fontWeight: 600, color: 'var(--color-accent)',
                }}>
                  {m.displayName[0].toUpperCase()}
                </div>
              )}
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>
                  {m.id === '__everyone__' ? '@everyone' : m.displayName}
                </p>
                {m.id !== '__everyone__' && (
                  <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>
                    @{m.username}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Reply banner ─────────────────────────────────────────────── */}
      {replyTo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 4, padding: '7px 14px',
          background: 'var(--color-elevated)',
          borderRadius: 'var(--radius-control) var(--radius-control) 0 0',
          borderLeft: '2px solid var(--color-accent)',
        }}>
          <CornerUpLeft size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--color-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Replying to{' '}
            <strong style={{ color: 'var(--color-primary)' }}>{replyTo.author.displayName}</strong>
            {' — '}
            <span style={{ opacity: 0.6 }}>{replyTo.content}</span>
          </span>
          <button onClick={onCancelReply} className="btn-ghost" style={{ padding: 4 }}>
            <X size={13} style={{ color: 'var(--color-muted)' }} />
          </button>
        </div>
      )}

      {/* ── Input box ────────────────────────────────────────────────── */}
      <div className="message-input-box">
        <textarea
          ref={textareaRef}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Send a message… (@ to mention)"
          rows={1}
          maxLength={MAX_LENGTH}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            outline: 'none', resize: 'none', fontSize: 15,
            lineHeight: 1.6, color: 'var(--color-primary)', maxHeight: 180,
          }}
        />

        {/* Char counter near limit */}
        {hasContent && charCount > 1800 && (
          <span style={{ fontSize: 11, color: 'var(--color-danger)', flexShrink: 0 }}>
            {MAX_LENGTH - charCount}
          </span>
        )}

        <button
          onClick={handleSend}
          disabled={!hasContent}
          title="Send (Enter)"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: hasContent ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
            cursor: hasContent ? 'pointer' : 'default',
          }}
        >
          <Send size={15} style={{ color: hasContent ? '#fff' : 'var(--color-subtle)' }} />
        </button>
      </div>
    </div>
  );
}
