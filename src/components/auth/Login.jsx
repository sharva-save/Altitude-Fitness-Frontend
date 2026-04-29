import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      if (res.success) {
        toast.success(`Welcome back, ${res.user.name}!`);
        navigate(res.user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      const needsVerif = err.response?.data?.needsVerification;
      if (needsVerif) {
        toast.error('Please verify your email first. Check your inbox!', { duration: 5000 });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade">
        <div className="auth-logo">
          <h1>💪 ALTITUDE FITNESS</h1>
          <p></p>
        </div>

        <h2 className="auth-title">Sign In</h2>
        <p className="auth-subtitle">Enter your credentials to access the portal</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          New member?{' '}
          <Link to="/register" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 600 }}>
            Create account
          </Link>
        </div>

        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          Admin?{' '}
          <Link to="/admin-register" style={{ color: 'var(--accent-orange)', textDecoration: 'none', fontWeight: 600 }}>
            Admin setup
          </Link>
        </div>
      </div>
    </div>
  );
}