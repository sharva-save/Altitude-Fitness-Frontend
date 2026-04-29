import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { RenewModal } from './Memberform';

/* ── Responsive CSS ── */
const CSS = `
  .exp-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 24px;
  }
  .exp-filter-row {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  /* ── Desktop table (default) ── */
  .exp-mobile-cards { display: none; }
  .exp-desktop-table { display: block; }

  /* ── Mobile card layout ── */
  @media (max-width: 700px) {
    .exp-header {
      flex-direction: column;
      gap: 12px;
    }
    .exp-filter-row {
      width: 100%;
      justify-content: flex-start;
    }
    .exp-filter-row .btn { flex: 1; text-align: center; }

    .exp-desktop-table { display: none; }
    .exp-mobile-cards  { display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }

    .exp-card {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .exp-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }
    .exp-card-name { font-weight: 700; font-size: 14px; color: var(--text-primary); }
    .exp-card-trainer { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
    .exp-card-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .exp-card-field { display: flex; flex-direction: column; gap: 2px; }
    .exp-card-field-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-muted);
    }
    .exp-card-field-value { font-size: 13px; color: var(--text-secondary); }
    .exp-card-actions { display: flex; justify-content: flex-end; }

    .exp-page-title  { font-size: 20px !important; }
    .exp-page-sub    { font-size: 11px !important; }
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('exp-styles')) {
  const s = document.createElement('style');
  s.id = 'exp-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ── Days badge ── */
const getDaysTag = (daysLeft) => {
  if (daysLeft < 0)  return <span className="badge badge-red">Expired {Math.abs(daysLeft)}d ago</span>;
  if (daysLeft === 0) return <span className="badge badge-red">Expires Today!</span>;
  if (daysLeft <= 2) return <span className="badge badge-red">{daysLeft}d left ⚠️</span>;
  if (daysLeft <= 4) return <span className="badge badge-orange">{daysLeft}d left</span>;
  return <span className="badge badge-gray">{daysLeft}d left</span>;
};

export default function ExpiringPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays]       = useState(7);
  const [selected, setSelected] = useState(null);

  const fetchExpiring = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/expiring?days=${days}`);
      if (res.data.success) setMembers(res.data.members);
    } catch {
      toast.error('Failed to load expiring members');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchExpiring(); }, [fetchExpiring]);

  return (
    <div>
      {/* ── Header ── */}
      <div className="exp-header">
        <div>
          <h1 className="page-title exp-page-title">EXPIRING SOON</h1>
          <p className="page-subtitle exp-page-sub">
            {members.length} member{members.length !== 1 ? 's' : ''} expiring in the next {days} days
          </p>
        </div>
        <div className="exp-filter-row">
          {[2, 7, 14, 30].map(d => (
            <button
              key={d}
              className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <h3>No members expiring in {days} days</h3>
            <p style={{ fontSize: 14, marginTop: 8 }}>All memberships are valid</p>
          </div>
        ) : (
          <>
            {/* ── Desktop Table ── */}
            <div className="exp-desktop-table" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Contact</th>
                    <th>Plan</th>
                    <th>Next Due</th>
                    <th>Status</th>
                    <th>Last Payment</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr
                      key={m._id}
                      style={{
                        background:
                          m.daysLeft <= 1 ? 'rgba(255,68,68,0.05)' :
                          m.daysLeft <= 2 ? 'rgba(255,170,0,0.05)' : undefined,
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                        {m.hasPersonalTrainer && (
                          <span className="trainer-tag" style={{ marginTop: 4, display: 'inline-flex' }}>
                            🏋️ {m.personalTrainerName || 'PT'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{m.email}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.phone}</div>
                      </td>
                      <td><span className="badge badge-blue">{m.subscriptionType}M</span></td>
                      <td>
                        <div style={{ fontSize: 13 }}>
                          {m.nextDueDate ? format(new Date(m.nextDueDate), 'dd MMM yyyy') : '—'}
                        </div>
                      </td>
                      <td>{getDaysTag(m.daysLeft)}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>
                          <span className="badge badge-gray">{m.paymentType}</span>
                          {m.feeAmount > 0 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 6 }}>
                              ₹{m.feeAmount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => setSelected(m)}>
                          🔄 Renew
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="exp-mobile-cards">
              {members.map(m => (
                <div
                  key={m._id}
                  className="exp-card"
                  style={{
                    borderLeft: `3px solid ${
                      m.daysLeft <= 2 ? 'var(--accent-red)' :
                      m.daysLeft <= 4 ? '#f59e0b' :
                      'var(--border)'
                    }`,
                  }}
                >
                  {/* Name + status badge */}
                  <div className="exp-card-top">
                    <div>
                      <div className="exp-card-name">{m.name}</div>
                      {m.hasPersonalTrainer && (
                        <div className="exp-card-trainer">🏋️ {m.personalTrainerName || 'PT'}</div>
                      )}
                    </div>
                    {getDaysTag(m.daysLeft)}
                  </div>

                  {/* Detail grid */}
                  <div className="exp-card-meta">
                    <div className="exp-card-field">
                      <span className="exp-card-field-label">Contact</span>
                      <span className="exp-card-field-value" style={{ fontSize: 12, wordBreak: 'break-all' }}>{m.email}</span>
                      <span className="exp-card-field-value" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.phone}</span>
                    </div>
                    <div className="exp-card-field">
                      <span className="exp-card-field-label">Plan</span>
                      <span><span className="badge badge-blue">{m.subscriptionType}M</span></span>
                    </div>
                    <div className="exp-card-field">
                      <span className="exp-card-field-label">Due Date</span>
                      <span className="exp-card-field-value">
                        {m.nextDueDate ? format(new Date(m.nextDueDate), 'dd MMM yyyy') : '—'}
                      </span>
                    </div>
                    <div className="exp-card-field">
                      <span className="exp-card-field-label">Last Payment</span>
                      <span>
                        <span className="badge badge-gray">{m.paymentType}</span>
                        {m.feeAmount > 0 && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>₹{m.feeAmount}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="exp-card-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => setSelected(m)}>
                      🔄 Renew
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selected && (
        <RenewModal
          member={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => { setSelected(null); fetchExpiring(); }}
        />
      )}
    </div>
  );
}