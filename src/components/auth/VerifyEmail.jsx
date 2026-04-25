import React,{ useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
const called = useRef(false);
 useEffect(() => {
  if (called.current) return; 
  called.current = true;

  const verify = async () => {
    try {
      const res = await api.get(`/auth/verify/${token}`); 
      console.log("VERIFY SUCCESS:", res.data);
      setStatus('success');
      toast.success('Email verified successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.log("VERIFY ERROR FULL:", err);
      console.log("VERIFY ERROR RESPONSE:", err.response);
      setStatus('error');
    }
  };

  verify();
}, [token, navigate]);
  return (
    <div className="auth-page">
      <div className="auth-card animate-fade" style={{ textAlign: 'center' }}>
        {status === 'verifying' && (
          <>
            <div className="loading-spinner" style={{ margin: '0 auto 20px' }} />
            <h2 className="auth-title">Verifying your email...</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Please wait a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h2 className="auth-title" style={{ color: 'var(--accent-green)' }}>Email Verified!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Redirecting to your dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
            <h2 className="auth-title">Verification Failed</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              This link is invalid or has expired. Please request a new verification email.
            </p>
            <Link to="/login" className="btn btn-primary">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}

export function AdminRegister() {
  const [form, setForm] = useState({ name: '', email: '', password: '', adminCode: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/admin-register', form);
      if (res.data.success) {
        localStorage.setItem('gym_token', res.data.token);
        localStorage.setItem('gym_user', JSON.stringify(res.data.user));
        toast.success('Admin account created!');
        navigate('/admin/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admin registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade">
        <div className="auth-logo">
          <h1>💪 ALTITUDE FITNESS</h1>
          <p>Admin Setup</p>
        </div>

        <h2 className="auth-title">Admin Registration</h2>
        <p className="auth-subtitle">Create an admin account (requires secret key)</p>

        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          ⚠️ Only 2 admin accounts are allowed. You need the admin secret key.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input className="input-field" type="text" placeholder="Admin Name"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input className="input-field" type="email" placeholder="admin@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input className="input-field" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="input-group">
            <label className="input-label">Admin Secret Key</label>
            <input className="input-field" type="password" placeholder="Enter admin secret"
              value={form.secret} onChange={e => setForm({ ...form, adminCode: e.target.value })} required />
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating Admin...' : 'Create Admin Account →'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}