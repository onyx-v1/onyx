import { useState, useEffect, useRef } from 'react';

/* ── Curated emoji set by category ──────────────────────────────────────── */
const CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    icon: '😀',
    emojis: ['😀','😂','🥲','😍','🥰','😎','🤔','😅','😭','😤','🙄','😱','🥺','😏','🤗','😴','🤩','😬','🫡','🤭'],
  },
  {
    label: 'Gestures',
    icon: '👍',
    emojis: ['👍','👎','👏','🙌','🤝','🤞','✌️','🤟','💪','🫶','🤙','🖖','👋','🤚','🫸','🙏','🫂','💅'],
  },
  {
    label: 'Hearts',
    icon: '❤️',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','💕','💞','💓','💗','💖','💘','💝','💯','♥️','🫀'],
  },
  {
    label: 'Animals',
    icon: '🐶',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐸','🐧','🐦','🦆','🦅','🦉','🦋','🐝','🐢'],
  },
  {
    label: 'Food',
    icon: '🍕',
    emojis: ['🍕','🍔','🌮','🍜','🍣','🍦','🍰','🎂','🍺','☕','🧋','🍷','🥂','🍾','🍩','🍪','🍫','🥐','🥞','🧇'],
  },
  {
    label: 'Objects',
    icon: '🎮',
    emojis: ['🎮','💻','📱','🎵','🏆','🚀','💡','📸','💰','🔥','⭐','🌈','🌙','🎉','🎊','✨','💫','🎯','🔮','🪄'],
  },
];

interface Props {
  onSelect: (emoji: string) => void;
  onClose:  () => void;
}

export function EmojiPicker({ onSelect, onClose }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const cat = CATEGORIES[activeIdx];

  return (
    <div
      ref={ref}
      style={{
        width: 300, background: 'var(--color-elevated)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        animation: 'slideUp 0.15s ease-out',
        userSelect: 'none',
      }}
    >
      {/* Category tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '4px 6px 0',
        gap: 2,
      }}>
        {CATEGORIES.map((c, i) => (
          <button
            key={c.label}
            title={c.label}
            onClick={() => setActiveIdx(i)}
            style={{
              flex: 1, fontSize: 16, padding: '6px 4px',
              border: 'none', borderRadius: '6px 6px 0 0',
              background: i === activeIdx ? 'rgba(139,124,248,0.15)' : 'transparent',
              borderBottom: i === activeIdx ? '2px solid var(--color-accent)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
          >
            {c.icon}
          </button>
        ))}
      </div>

      {/* Category label */}
      <p style={{
        margin: 0, padding: '6px 12px 4px',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
        color: 'var(--color-subtle)', textTransform: 'uppercase',
      }}>
        {cat.label}
      </p>

      {/* Emoji grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)',
        gap: 2, padding: '2px 8px 10px',
        maxHeight: 180, overflowY: 'auto',
      }}>
        {cat.emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose(); }}
            title={emoji}
            style={{
              fontSize: 18, lineHeight: 1,
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', borderRadius: 6,
              background: 'transparent',
              cursor: 'pointer',
              transition: 'background 0.08s, transform 0.08s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
