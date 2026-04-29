import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify/${token}`);
        console.log('VERIFY SUCCESS:', res.data);
        setStatus('success');
        toast.success('Email verified successfully!');
        setTimeout(() => navigate('/login'), 2500);
      } catch (err) {
        console.error('VERIFY ERROR:', err);
        setStatus('error');
        setErrorMsg(err.response?.data?.message || 'Verification failed. The link may have expired.');
        toast.error('Verification failed');
      }
    };

    verify();
  }, [token, navigate]);

  /* ── Verifying (loading) ── */
  if (status === 'verifying') {
    return (
      <div className="auth-page">
        <div className="auth-card animate-fade" style={{ textAlign: 'center' }}>
          <div className="auth-verify-spinner" />
          <h2 className="auth-title" style={{ marginTop: 24 }}>Verifying your email…</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
            Please wait while we confirm your account.
          </p>
        </div>
      </div>
    );
  }

  /* ── Success ── */
  if (status === 'success') {
    return (
      <div className="auth-page">
        <div className="auth-card animate-fade" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 className="auth-title">Email Verified!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            Your account is now active. Redirecting you to login…
          </p>
          <Link
            to="/login"
            className="btn btn-primary btn-lg"
            style={{
              display: 'inline-block',
              textDecoration: 'none',
              padding: '0 32px',
              lineHeight: '50px',
              borderRadius: 12,
            }}
          >
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  return (
    <div className="auth-page">
      <div className="auth-card animate-fade" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
        <h2 className="auth-title">Verification Failed</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          {errorMsg}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <Link
            to="/register"
            className="btn btn-primary btn-lg"
            style={{
              display: 'inline-block',
              textDecoration: 'none',
              padding: '0 32px',
              lineHeight: '50px',
              borderRadius: 12,
              width: '100%',
              boxSizing: 'border-box',
              textAlign: 'center',
            }}
          >
            Register Again
          </Link>
          <Link
            to="/login"
            style={{ color: 'var(--accent-green)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;