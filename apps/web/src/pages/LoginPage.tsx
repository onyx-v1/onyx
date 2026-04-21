import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ArrowRight, Loader2 } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    try {
      await login(username.trim());
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid user ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-base)',
        gap: 32,
      }}
    >
      {/* Wordmark */}
      <h1
        style={{
          fontSize: 42,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: 'var(--color-primary)',
          margin: 0,
          lineHeight: 1,
        }}
      >
        Onyx
      </h1>

      {/* Input + arrow row */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--color-input)',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '4px 4px 4px 20px',
            width: 280,
            transition: 'border-color 0.15s',
          }}
          onFocus={() => {}}
          className="login-row"
        >
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            placeholder="Enter your user ID"
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={loading}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: 'var(--color-primary)',
              minWidth: 0,
            }}
          />

          {/* Arrow button */}
          <button
            type="submit"
            disabled={loading || !username.trim()}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: username.trim() && !loading ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)',
              border: 'none',
              cursor: username.trim() && !loading ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s, transform 0.1s',
            }}
            onMouseEnter={(e) => { if (username.trim()) (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >
            {loading
              ? <Loader2 size={15} style={{ color: 'var(--color-muted)', animation: 'spin 1s linear infinite' }} />
              : <ArrowRight size={15} style={{ color: username.trim() ? '#fff' : 'var(--color-subtle)' }} />
            }
          </button>
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: 12, color: 'var(--color-danger)', margin: 0 }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
