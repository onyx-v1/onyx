import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Loader2 } from 'lucide-react';

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
      setError(err.response?.data?.message || 'Login failed. Check your User ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-base relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(139,124,248,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-sm px-6 relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mb-4 shadow-lg shadow-accent/10">
            <span className="text-2xl font-bold text-gradient-accent">O</span>
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Onyx</h1>
          <p className="text-sm text-muted mt-1">Private community platform</p>
        </div>

        {/* Form card */}
        <div className="bg-elevated border border-white/5 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                User ID
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your user ID"
                className="input-field"
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>

            {error && (
              <p className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-lg border border-danger/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-subtle mt-6">
          Don't have access? Contact your community admin.
        </p>
      </div>
    </div>
  );
}
