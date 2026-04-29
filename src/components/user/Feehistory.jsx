import React, { useEffect, useState } from 'react';
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
    <div style={{ paddingBottom: 24 }}>
      <style>{`
        .fee-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }

        @media (max-width: 768px) {
          .fee-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
        }

        @media (max-width: 400px) {
          .fee-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
        }

        .fee-stat-card {
          /* inherits .stat-card styles, just responsive overrides */
        }

        @media (max-width: 768px) {
          .fee-stat-card .stat-value {
            font-size: 22px !important;
          }
          .fee-stat-card.total-paid .stat-value {
            font-size: 18px !important;
          }
        }

        /* Page header */
        .fee-page-header {
          margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .fee-page-header {
            margin-bottom: 16px;
          }
          .fee-page-header .page-title {
            font-size: 22px !important;
          }
          .fee-page-header .page-subtitle {
            font-size: 12px !important;
          }
        }

        /* History item */
        .history-item-inner {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 8px;
        }

        .history-item-left {
          flex: 1;
          min-width: 0;
        }

        .history-item-right {
          text-align: right;
          flex-shrink: 0;
        }

        .history-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .history-amount {
          font-family: var(--font-display);
          font-size: 22px;
          color: var(--accent-green);
        }

        @media (max-width: 480px) {
          .history-item-inner {
            flex-direction: column;
            gap: 6px;
          }

          .history-item-right {
            text-align: left;
            width: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .history-item-right .date-time-stack {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
          }

          .history-item-right .renewed-by {
            margin-top: 0 !important;
          }

          .history-amount {
            font-size: 20px;
          }

          .history-badges {
            gap: 6px;
          }
        }

        /* Timeline section wrapper */
        .timeline-section {
          padding: 8px 24px 24px;
        }
        @media (max-width: 480px) {
          .timeline-section {
            padding: 8px 14px 20px;
          }
        }

        /* Table wrapper header */
        .timeline-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }
        @media (max-width: 480px) {
          .timeline-header {
            padding: 14px 16px;
          }
          .timeline-header h3 {
            font-size: 16px !important;
          }
        }

        /* History list item dot + line column */
        .history-dot-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding-top: 4px;
        }

        /* Coverage row wrapping on small screens */
        .coverage-text {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 6px;
          word-break: break-word;
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header fee-page-header">
        <div>
          <h1 className="page-title">FEE HISTORY</h1>
          <p className="page-subtitle">Your complete payment and subscription history</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid fee-stats-grid">
        <div className="stat-card green fee-stat-card total-paid">
          <div className="stat-label">Total Paid</div>
          <div className="stat-value" style={{ fontSize: 32 }}>₹{summary.total.toLocaleString()}</div>
          <div className="stat-sub">All time payments</div>
        </div>
        <div className="stat-card blue fee-stat-card">
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{summary.count}</div>
          <div className="stat-sub">Total renewals</div>
        </div>
        <div className="stat-card purple fee-stat-card">
          <div className="stat-label">Current Plan</div>
          <div className="stat-value">
            {member?.subscriptionType ?? '—'}
            <span style={{ fontSize: 16, fontWeight: 400 }}>M</span>
          </div>
          <div className="stat-sub">{member?.paymentType || '—'}</div>
        </div>
        <div className="stat-card orange fee-stat-card">
          <div className="stat-label">Next Due</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            {member?.nextDueDate ? format(new Date(member.nextDueDate), 'dd MMM') : '—'}
          </div>
          <div className="stat-sub">
            {member?.nextDueDate ? format(new Date(member.nextDueDate), 'yyyy') : '—'}
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <div className="table-wrapper">
        <div className="timeline-header">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 1 }}>
            PAYMENT TIMELINE
          </h3>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <h3>No payment history yet</h3>
            <p style={{ fontSize: 14, marginTop: 8 }}>Your fee payments will appear here</p>
          </div>
        ) : (
          <div className="timeline-section">
            <ul className="history-list">
              {history.map((h, i) => (
                <li key={i} className="history-item">
                  {/* Dot + line */}
                  <div className="history-dot-col">
                    <div
                      className="history-dot"
                      style={{ background: i === 0 ? 'var(--accent-green)' : 'var(--border-light)' }}
                    />
                    {i < history.length - 1 && (
                      <div
                        style={{
                          width: 1,
                          flex: 1,
                          minHeight: 20,
                          background: 'var(--border)',
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: 8 }}>
                    <div className="history-item-inner">
                      {/* Left: amount + badges + coverage */}
                      <div className="history-item-left">
                        <div className="history-badges">
                          <span className="history-amount">
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

                        <div className="coverage-text">
                          Coverage:{' '}
                          {h.fromDate ? format(new Date(h.fromDate), 'dd MMM yyyy') : '—'}
                          {' → '}
                          {h.toDate ? format(new Date(h.toDate), 'dd MMM yyyy') : '—'}
                        </div>

                        {h.notes && (
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              marginTop: 4,
                              fontStyle: 'italic',
                            }}
                          >
                            "{h.notes}"
                          </div>
                        )}
                      </div>

                      {/* Right: date + time + renewedBy */}
                      <div className="history-item-right">
                        <div className="date-time-stack">
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {h.paymentDate ? format(new Date(h.paymentDate), 'dd MMM yyyy') : '—'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {h.paymentDate ? format(new Date(h.paymentDate), 'hh:mm a') : ''}
                          </div>
                        </div>
                        {h.renewedBy && (
                          <div
                            className="renewed-by"
                            style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}
                          >
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