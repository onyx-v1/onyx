import { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { useDeletePrefsStore } from '../../stores/deletePrefsStore';

export function DeleteToast() {
  const { toast, clearToast } = useDeletePrefsStore();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 18px',
        background: 'var(--color-elevated)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.18s ease-out',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'rgba(62,207,142,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Check size={12} style={{ color: 'var(--color-online)' }} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 500 }}>{toast}</span>
      <button
        onClick={clearToast}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-muted)', padding: 2, display: 'flex',
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}
