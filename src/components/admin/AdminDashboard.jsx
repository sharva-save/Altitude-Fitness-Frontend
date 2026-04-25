// import { useNavigate, useLocation, Link } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import toast from 'react-hot-toast';
// import React from 'react';
// export default function Layout({ children }) {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const handleLogout = () => {
//     logout();
//     toast.success('Logged out successfully');
//     navigate('/login');
//   };

//   const isActive = (path) => location.pathname === path;

//   const adminNav = [
//     { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
//     { path: '/admin/members', icon: '👥', label: 'Members' },
//     { path: '/admin/expiring', icon: '⚠️', label: 'Expiring Soon' },
//   ];

//   const memberNav = [
//     { path: '/member/dashboard', icon: '🏠', label: 'My Dashboard' },
//     { path: '/member/history', icon: '💳', label: 'Fee History' },
//   ];

//   const navItems = user?.role === 'admin' ? adminNav : memberNav;

//   return (
//     <div className="app-layout">
//       <aside className="sidebar">
//         <div className="sidebar-logo">
//           <h1>💪 ALTITUDE FITNESS</h1>
//           <p>Gym Management</p>
//         </div>

//         <nav className="sidebar-nav">
//           <div className="nav-group-label">
//             {user?.role === 'admin' ? 'Admin Panel' : 'Member Portal'}
//           </div>
//           {navItems.map(item => (
//             <Link
//               key={item.path}
//               to={item.path}
//               className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
//             >
//               <span>{item.icon}</span>
//               <span>{item.label}</span>
//             </Link>
//           ))}
//         </nav>

//         <div className="sidebar-footer">
//           <div style={{ marginBottom: 12 }}>
//             <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
//             <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
//               {user?.role}
//             </div>
//           </div>
//           <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
//             🚪 Sign Out
//           </button>
//         </div>
//       </aside>

//       <main className="main-content">
//         <div className="page-container">
//           {children}
//         </div>
//       </main>
//     </div>
//   );
// }
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import api from '../../utils/api';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-label">{icon} {label}</div>
    <div className="stat-value">{value}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [recent, setRecent]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [membersRes, expiringRes] = await Promise.all([
        api.get('/members?limit=200'),
        api.get('/members?limit=200'),
      ]);

      const members = membersRes.data.members || [];

      // ── Compute stats ──────────────────────────────────────────────
      const today     = new Date();
      const active    = members.filter(m => m.isActive);
      const expired   = members.filter(m => differenceInDays(new Date(m.nextDueDate), today) < 0);
      const exp7      = members.filter(m => {
        const d = differenceInDays(new Date(m.nextDueDate), today);
        return d >= 0 && d <= 7;
      });
      const totalRev  = members.reduce((acc, m) => {
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

      // ── Expiring soon (sorted by days left) ───────────────────────
      setExpiring(
        members
          .filter(m => {
            const d = differenceInDays(new Date(m.nextDueDate), today);
            return d >= 0 && d <= 7;
          })
          .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))
          .slice(0, 6)
      );

      // ── Recent fee payments (flatten feeHistory, sort by paidDate) ─
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div className="loading-spinner" />
        <p style={{ color: 'var(--text-muted)', letterSpacing: 2, fontSize: 13 }}>LOADING DASHBOARD...</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title">ADMIN DASHBOARD</h1>
          <p className="page-subtitle">
            {format(new Date(), 'EEEE, dd MMMM yyyy')} · Overview of your gym
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/admin/members/add" className="btn btn-primary">+ Add Member</Link>
          <Link to="/admin/expiring" className="btn btn-ghost">⚠️ View Expiring</Link>
        </div>
      </div>

      {/* ── Expiry alert banner ───────────────────────────────────────── */}
      {stats?.expiring > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          ⚠️ <strong>{stats.expiring} member{stats.expiring !== 1 ? 's' : ''}</strong> expiring within 7 days.{' '}
          <Link to="/admin/expiring" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>
            View all →
          </Link>
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <StatCard
          color="green"
          icon="👥"
          label="Total Members"
          value={stats?.total ?? '—'}
          sub={`${stats?.active ?? 0} active`}
        />
        <StatCard
          color="blue"
          icon="💰"
          label="Total Revenue"
          value={`₹${(stats?.revenue ?? 0).toLocaleString('en-IN')}`}
          sub="All-time collections"
        />
        <StatCard
          color="orange"
          icon="⚠️"
          label="Expiring Soon"
          value={stats?.expiring ?? '—'}
          sub="Within 7 days"
        />
        <StatCard
          color="purple"
          icon="🏋️"
          label="With Trainer"
          value={stats?.trainers ?? '—'}
          sub="Personal training"
        />
      </div>

      {/* ── Secondary stats row ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Active Members',  value: stats?.active,  color: 'var(--accent-green)' },
          { label: 'Expired Members', value: stats?.expired, color: 'var(--accent-red)'   },
          { label: 'Total Members',   value: stats?.total,   color: 'var(--accent-blue)'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>
              {value ?? '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom grid: expiring + recent payments ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Expiring Soon */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title" style={{ margin: 0 }}>⚠️ Expiring Soon</div>
            <Link to="/admin/expiring" className="btn btn-ghost btn-sm">View All</Link>
          </div>

          {expiring.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              ✅ No members expiring in the next 7 days
            </div>
          ) : (
            expiring.map(m => {
              const days = differenceInDays(new Date(m.nextDueDate), new Date());
              const isUrgent = days <= 2;
              return (
                <div key={m._id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 8, marginBottom: 8,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {format(new Date(m.nextDueDate), 'dd MMM yyyy')}
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: isUrgent ? '#3f0000' : '#2a1a00',
                    color: isUrgent ? 'var(--accent-red)' : '#f59e0b'
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title" style={{ margin: 0 }}>💳 Recent Payments</div>
            <Link to="/admin/members" className="btn btn-ghost btn-sm">All Members</Link>
          </div>

          {recent.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              No payment history yet
            </div>
          ) : (
            recent.map((f, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', borderRadius: 8, marginBottom: 8,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{f.memberName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {format(new Date(f.paidDate), 'dd MMM yyyy')} · {f.paymentType} · {f.subscriptionMonths}M
                  </div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent-green)' }}>
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