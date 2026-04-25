import React,{ useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone
      });
      if (res.data.success) {
        setDone(true);
        toast.success('Account created! Check your email.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card animate-fade" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>📧</div>
          <h2 className="auth-title">Check your inbox!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            We sent a verification link to <strong style={{ color: 'var(--text-primary)' }}>{form.email}</strong>.
            Click the link to activate your account.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Didn't receive it?{' '}
            <button
              style={{ background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', fontWeight: 600 }}
              onClick={async () => {
                try {
                  await api.post('/auth/resend-verification', { email: form.email });
                  toast.success('Verification email resent!');
                } catch {
                  toast.error('Failed to resend');
                }
              }}
            >
              Resend email
            </button>
          </p>
          <div style={{ marginTop: 24 }}>
            <Link to="/login" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade">
        <div className="auth-logo">
          <h1>💪 ALTITUDE FITNESS</h1>
          <p></p>
        </div>

        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join ALTITUDE FITNESS and track your fitness journey</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input className="input-field" type="text" placeholder="John Doe"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input className="input-field" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="input-group">
            <label className="input-label">Phone (optional)</label>
            <input className="input-field" type="tel" placeholder="+91 98765 43210"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input className="input-field" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <input className="input-field" type="password" placeholder="Repeat password"
              value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}