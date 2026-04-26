import { useEffect, useRef } from 'react';
import { getSocket } from '../../hooks/useSocket';

const REACTIONS = ['😂', '💀', '😢', '❤️', '👍'] as const;

interface Props {
  messageId: string;
  myReactions: string[];  // emojis this user already reacted with
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

export function ReactionPicker({ messageId, myReactions, onClose, anchorRef }: Props) {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Position the picker above the anchor element
  useEffect(() => {
    const picker = pickerRef.current;
    const anchor = anchorRef.current;
    if (!picker || !anchor) return;

    const rect = anchor.getBoundingClientRect();
    const pw   = picker.offsetWidth;

    // Try to align right-edge of picker with right-edge of anchor, clamped to viewport
    let left = rect.right - pw;
    if (left < 4) left = 4;
    if (left + pw > window.innerWidth - 4) left = window.innerWidth - 4 - pw;

    picker.style.left = `${left}px`;
    picker.style.top  = `${rect.top - picker.offsetHeight - 6}px`;
    picker.style.position = 'fixed';
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const toggle = (emoji: string) => {
    getSocket()?.emit('reaction:toggle', { messageId, emoji });
    onClose();
  };

  return (
    <div
      ref={pickerRef}
      style={{
        display: 'flex', gap: 2, padding: '6px 8px',
        background: 'var(--color-elevated)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 200,
        animation: 'fadeIn 0.1s ease-out',
      }}
    >
      {REACTIONS.map((emoji) => {
        const active = myReactions.includes(emoji);
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            title={emoji}
            style={{
              fontSize: 20, lineHeight: 1,
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, border: 'none',
              background: active ? 'rgba(139,124,248,0.2)' : 'transparent',
              outline: active ? '1px solid rgba(139,124,248,0.5)' : 'none',
              cursor: 'pointer',
              transition: 'background 0.1s, transform 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
