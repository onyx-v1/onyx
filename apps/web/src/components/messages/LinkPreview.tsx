import { useState, useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { apiClient } from '../../api/client';

/* Cache responses for the session — avoid re-fetching same URL */
const previewCache = new Map<string, PreviewData | null>();

interface PreviewData {
  url:         string;
  title:       string;
  description: string | null;
  image:       string | null;
  siteName:    string;
}

/* Extract the first http(s) URL from a message string */
export function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s<>"']+/);
  return m?.[0] ?? null;
}

interface Props { url: string; }

export function LinkPreview({ url }: Props) {
  const [data,    setData]    = useState<PreviewData | null | 'loading'>('loading');
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;

    if (previewCache.has(url)) {
      setData(previewCache.get(url)!);
      return;
    }

    setData('loading');
    apiClient
      .get<PreviewData | null>('/messages/link-preview', { params: { url } })
      .then(({ data: res }) => {
        if (cancelled.current) return;
        previewCache.set(url, res);
        setData(res);
      })
      .catch(() => {
        if (!cancelled.current) { previewCache.set(url, null); setData(null); }
      });

    return () => { cancelled.current = true; };
  }, [url]);

  if (data === 'loading' || data === null) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', gap: 12,
        marginTop: 6,
        maxWidth: 440,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: '3px solid var(--color-accent)',
        borderRadius: 8,
        padding: '10px 12px',
        textDecoration: 'none',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)')}
    >
      {/* Thumbnail */}
      {data.image && (
        <img
          src={data.image}
          alt=""
          style={{
            width: 64, height: 64, borderRadius: 6,
            objectFit: 'cover', flexShrink: 0,
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600, letterSpacing: '0.02em' }}>
            {data.siteName}
          </span>
          <ExternalLink size={9} style={{ color: 'var(--color-accent)', opacity: 0.7, flexShrink: 0 }} />
        </div>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 600,
          color: 'var(--color-primary)',
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}>
          {data.title}
        </p>
        {data.description && (
          <p style={{
            margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          } as React.CSSProperties}>
            {data.description}
          </p>
        )}
      </div>
    </a>
  );
}
