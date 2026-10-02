import { useState } from 'react';
import { Scissors } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Login failed'); return; }
      localStorage.setItem('salon_token', data.token);
      onLogin();
    } catch {
      setError('Cannot connect to server. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.06) 0%, #0A0A0A 60%)' }}>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg,#C9A84C,#E8C96D)', boxShadow: '0 0 32px rgba(201,168,76,0.3)' }}>
            <Scissors className="w-7 h-7" style={{ color: '#0A0A0A' }} />
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-wide" style={{ color: '#F5F0E8' }}>
            Sukh&amp;Sen
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(245,240,232,0.35)' }}>Unisex Salon · Management</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7" style={{ background: '#111', border: '1px solid rgba(201,168,76,0.2)' }}>
          <h2 className="text-base font-semibold mb-5" style={{ color: '#F5F0E8' }}>Sign in to continue</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: 'rgba(245,240,232,0.5)' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ background: '#1a1a1a', border: '1px solid rgba(201,168,76,0.2)', color: '#F5F0E8' }}
                onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(201,168,76,0.2)'}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: 'rgba(245,240,232,0.5)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ background: '#1a1a1a', border: '1px solid rgba(201,168,76,0.2)', color: '#F5F0E8' }}
                onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(201,168,76,0.2)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all mt-2"
              style={{
                background: loading ? 'rgba(201,168,76,0.4)' : 'linear-gradient(135deg,#C9A84C,#E8C96D)',
                color: '#0A0A0A',
                opacity: loading ? 0.7 : 1,
              }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(245,240,232,0.2)' }}>
          Sukh&amp;Sen Salon Management System
        </p>
      </div>
    </div>
  );
}
