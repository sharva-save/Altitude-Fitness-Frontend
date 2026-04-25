import React,{ useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function FeeHistory() {
  const { member } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, count: 0 });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/members/me/fee-history');
      if (res.data.success) {
        const h = res.data.feeHistory || [];
        setHistory([...h].reverse());
        setSummary({
          total: h.reduce((acc, f) => acc + (f.amount || 0), 0),
          count: h.length,
        });
      }
    } catch {
      // fallback to member data from context
      if (member?.feeHistory) {
        const h = [...member.feeHistory].reverse();
        setHistory(h);
        setSummary({
          total: member.feeHistory.reduce((acc, f) => acc + (f.amount || 0), 0),
          count: member.feeHistory.length,
        });
      } else {
        toast.error('Failed to load fee history');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPaymentIcon = (type) => {
    const icons = { Cash: '💵', UPI: '📱', Card: '💳', 'Bank Transfer': '🏦', Cheque: '📄' };
    return icons[type] || '💳';
  };

  const getPlanColor = (months) => {
    if (months >= 12) return 'badge-purple';
    if (months >= 6) return 'badge-green';
    if (months >= 3) return 'badge-blue';
    return 'badge-gray';
  };

  if (loading) return (
    <div className="loading-page">
      <div className="loading-spinner" />
      <p style={{ color: 'var(--text-muted)' }}>Loading history...</p>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">FEE HISTORY</h1>
          <p className="page-subtitle">Your complete payment and subscription history</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card green">
          <div className="stat-label">Total Paid</div>
          <div className="stat-value" style={{ fontSize: 32 }}>₹{summary.total.toLocaleString()}</div>
          <div className="stat-sub">All time payments</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{summary.count}</div>
          <div className="stat-sub">Total renewals</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Current Plan</div>
          <div className="stat-value">{member?.subscriptionType ?? '—'}<span style={{ fontSize: 16, fontWeight: 400 }}>M</span></div>
          <div className="stat-sub">{member?.paymentType || '—'}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Next Due</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            {member?.nextDueDate ? format(new Date(member.nextDueDate), 'dd MMM') : '—'}
          </div>
          <div className="stat-sub">{member?.nextDueDate ? format(new Date(member.nextDueDate), 'yyyy') : '—'}</div>
        </div>
      </div>

      {/* History Timeline */}
      <div className="table-wrapper">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 1 }}>PAYMENT TIMELINE</h3>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <h3>No payment history yet</h3>
            <p style={{ fontSize: 14, marginTop: 8 }}>Your fee payments will appear here</p>
          </div>
        ) : (
          <div style={{ padding: '8px 24px 24px' }}>
            <ul className="history-list">
              {history.map((h, i) => (
                <li key={i} className="history-item">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 4 }}>
                    <div className="history-dot" style={{ background: i === 0 ? 'var(--accent-green)' : 'var(--border-light)' }} />
                    {i < history.length - 1 && (
                      <div style={{ width: 1, flex: 1, minHeight: 20, background: 'var(--border)', marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent-green)' }}>
                            ₹{(h.amount || 0).toLocaleString()}
                          </span>
                          <span className={`badge ${getPlanColor(h.subscriptionType)}`}>
                            {h.subscriptionType}M Plan
                          </span>
                          <span className="badge badge-gray">
                            {getPaymentIcon(h.paymentType)} {h.paymentType}
                          </span>
                          {i === 0 && <span className="badge badge-green">Latest</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                          Coverage: {h.fromDate ? format(new Date(h.fromDate), 'dd MMM yyyy') : '—'} →{' '}
                          {h.toDate ? format(new Date(h.toDate), 'dd MMM yyyy') : '—'}
                        </div>
                        {h.notes && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>
                            "{h.notes}"
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {h.paymentDate ? format(new Date(h.paymentDate), 'dd MMM yyyy') : '—'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {h.paymentDate ? format(new Date(h.paymentDate), 'hh:mm a') : ''}
                        </div>
                        {h.renewedBy && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                            by {h.renewedBy}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}