import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import api from '../../utils/api';

/* ─────────────────────────────────────────────
   Responsive styles injected once at module level
───────────────────────────────────────────── */
const RESPONSIVE_CSS = `
  /* ── Dashboard layout ── */
  .dash-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 28px;
    gap: 12px;
  }
  .dash-header-actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
  }

  /* ── Stat cards: 4 cols → 2 cols → 1 col ── */
  .stats-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }

  /* ── Secondary stats: 3 cols → 3 cols (smaller) → 1 col ── */
  .stats-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }

  /* ── Bottom two-panel grid ── */
  .dash-bottom-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  /* ── Tablet (≤ 768px) ── */
  @media (max-width: 768px) {
    .dash-header {
      flex-direction: column;
      gap: 14px;
      margin-bottom: 20px;
    }
    .dash-header-actions {
      width: 100%;
    }
    .dash-header-actions a {
      flex: 1;
      text-align: center;
    }

    .stats-grid-4 {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .stats-grid-3 {
      gap: 10px;
      margin-bottom: 20px;
    }

    .dash-bottom-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }

  /* ── Mobile (≤ 480px) ── */
  @media (max-width: 480px) {
    .stats-grid-4 {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .stats-grid-3 {
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .stat-card {
      padding: 14px 12px !important;
    }

    .dash-page-title {
      font-size: 20px !important;
    }

    .dash-page-subtitle {
      font-size: 11px !important;
    }

    .dash-secondary-value {
      font-size: 26px !important;
    }

    .dash-secondary-label {
      font-size: 10px !important;
      letter-spacing: 0.5px !important;
    }

    .dash-secondary-card {
      padding: 14px 10px !important;
    }

    .dash-row-item {
      padding: 8px 10px !important;
    }

    .dash-row-name {
      font-size: 12px !important;
    }

    .dash-row-sub {
      font-size: 10px !important;
    }

    .dash-row-amount {
      font-size: 13px !important;
    }
  }
`;

/* Inject styles once */
if (typeof document !== 'undefined' && !document.getElementById('admin-dash-styles')) {
  const style = document.createElement('style');
  style.id = 'admin-dash-styles';
  style.textContent = RESPONSIVE_CSS;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────── */
const StatCard = ({ label, value, sub, color, icon }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-label">{icon} {label}</div>
    <div className="stat-value">{value}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function AdminDashboard() {
  const [stats, setStats]       = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [recent, setRecent]     = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    try {
      const [membersRes] = await Promise.all([
        api.get('/members?limit=200'),
      ]);

      const members = membersRes.data.members || [];

      const today   = new Date();
      const active  = members.filter(m => m.isActive);
      const expired = members.filter(m => differenceInDays(new Date(m.nextDueDate), today) < 0);
      const exp7    = members.filter(m => {
        const d = differenceInDays(new Date(m.nextDueDate), today);
        return d >= 0 && d <= 7;
      });
      const totalRev = members.reduce((acc, m) => {
        const hist = m.feeHistory || [];
        return acc + hist.reduce((s, f) => s + (f.amount || 0), 0);
      }, 0);

      setStats({
        total:    members.length,
        active:   active.length,
        expired:  expired.length,
        expiring: exp7.length,
        revenue:  totalRev,
        trainers: members.filter(m => m.hasPersonalTrainer).length,
      });

      setExpiring(
        members
          .filter(m => {
            const d = differenceInDays(new Date(m.nextDueDate), today);
            return d >= 0 && d <= 7;
          })
          .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))
          .slice(0, 6)
      );

      const allFees = members.flatMap(m =>
        (m.feeHistory || []).map(f => ({ ...f, memberName: m.name, memberEmail: m.email }))
      );
      allFees.sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));
      setRecent(allFees.slice(0, 8));

    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', flexDirection: 'column', gap: 16,
      }}>
        <div className="loading-spinner" />
        <p style={{ color: 'var(--text-muted)', letterSpacing: 2, fontSize: 13 }}>
          LOADING DASHBOARD...
        </p>
      </div>
    );
  }

  return (
    <div>

      {/* ── Header ── */}
      <div className="dash-header">
        <div style={{ minWidth: 0 }}>
          <h1
            className="page-title dash-page-title"
            style={{ fontSize: 24, marginBottom: 4 }}
          >
            ADMIN DASHBOARD
          </h1>
          <p
            className="page-subtitle dash-page-subtitle"
            style={{ fontSize: 12, margin: 0 }}
          >
            {format(new Date(), 'EEEE, dd MMMM yyyy')} · Overview of your gym
          </p>
        </div>
        <div className="dash-header-actions">
          <Link to="/admin/members/add" className="btn btn-primary">+ Add Member</Link>
          <Link to="/admin/expiring" className="btn btn-ghost">⚠️ Expiring</Link>
        </div>
      </div>

      {/* ── Expiry alert banner ── */}
      {stats?.expiring > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          ⚠️{' '}
          <strong>
            {stats.expiring} member{stats.expiring !== 1 ? 's' : ''}
          </strong>{' '}
          expiring within 7 days.{' '}
          <Link
            to="/admin/expiring"
            style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}
          >
            View all →
          </Link>
        </div>
      )}

      {/* ── Primary stat cards (4 → 2 on mobile) ── */}
      <div className="stats-grid-4">
        <StatCard
          color="green" icon="👥"
          label="Total Members"
          value={stats?.total ?? '—'}
          sub={`${stats?.active ?? 0} active`}
        />
        <StatCard
          color="blue" icon="💰"
          label="Total Revenue"
          value={`₹${(stats?.revenue ?? 0).toLocaleString('en-IN')}`}
          sub="All-time"
        />
        <StatCard
          color="orange" icon="⚠️"
          label="Expiring Soon"
          value={stats?.expiring ?? '—'}
          sub="Within 7 days"
        />
        <StatCard
          color="purple" icon="🏋️"
          label="With Trainer"
          value={stats?.trainers ?? '—'}
          sub="Personal training"
        />
      </div>

      {/* ── Secondary stats row ── */}
      <div className="stats-grid-3">
        {[
          { label: 'Active',   value: stats?.active,  color: 'var(--accent-green)' },
          { label: 'Expired',  value: stats?.expired, color: 'var(--accent-red)'   },
          { label: 'Total',    value: stats?.total,   color: 'var(--accent-blue)'  },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="card dash-secondary-card"
            style={{ textAlign: 'center', padding: '18px 12px' }}
          >
            <div
              className="dash-secondary-value"
              style={{
                fontSize: 30, fontWeight: 800,
                color, fontFamily: 'var(--font-display)',
                lineHeight: 1,
              }}
            >
              {value ?? '—'}
            </div>
            <div
              className="dash-secondary-label"
              style={{
                fontSize: 11, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: 1, marginTop: 6,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom grid: expiring + recent payments ── */}
      <div className="dash-bottom-grid">

        {/* Expiring Soon */}
        <div className="card">
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 14,
          }}>
            <div className="card-title" style={{ margin: 0, fontSize: 14 }}>
              ⚠️ Expiring Soon
            </div>
            <Link to="/admin/expiring" className="btn btn-ghost btn-sm">View All</Link>
          </div>

          {expiring.length === 0 ? (
            <div style={{
              color: 'var(--text-muted)', fontSize: 13,
              textAlign: 'center', padding: '20px 0',
            }}>
              ✅ No members expiring in the next 7 days
            </div>
          ) : (
            expiring.map(m => {
              const days     = differenceInDays(new Date(m.nextDueDate), new Date());
              const isUrgent = days <= 2;
              return (
                <div
                  key={m._id}
                  className="dash-row-item"
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '10px 12px',
                    borderRadius: 8, marginBottom: 8,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                    <div
                      className="dash-row-name"
                      style={{
                        fontWeight: 600, fontSize: 13,
                        color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {m.name}
                    </div>
                    <div
                      className="dash-row-sub"
                      style={{ fontSize: 11, color: 'var(--text-muted)' }}
                    >
                      {format(new Date(m.nextDueDate), 'dd MMM yyyy')}
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 99,
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                    background: isUrgent ? '#3f0000' : '#2a1a00',
                    color: isUrgent ? 'var(--accent-red)' : '#f59e0b',
                  }}>
                    {days === 0 ? 'Today' : `${days}d`}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 14,
          }}>
            <div className="card-title" style={{ margin: 0, fontSize: 14 }}>
              💳 Recent Payments
            </div>
            <Link to="/admin/members" className="btn btn-ghost btn-sm">All Members</Link>
          </div>

          {recent.length === 0 ? (
            <div style={{
              color: 'var(--text-muted)', fontSize: 13,
              textAlign: 'center', padding: '20px 0',
            }}>
              No payment history yet
            </div>
          ) : (
            recent.map((f, i) => (
              <div
                key={i}
                className="dash-row-item"
                style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '10px 12px',
                  borderRadius: 8, marginBottom: 8,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                  <div
                    className="dash-row-name"
                    style={{
                      fontWeight: 600, fontSize: 13,
                      color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {f.memberName}
                  </div>
                  <div
                    className="dash-row-sub"
                    style={{ fontSize: 11, color: 'var(--text-muted)' }}
                  >
                    {format(new Date(f.paidDate), 'dd MMM yy')} · {f.paymentType} · {f.subscriptionMonths}M
                  </div>
                </div>
                <span
                  className="dash-row-amount"
                  style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent-green)', flexShrink: 0 }}
                >
                  ₹{(f.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}