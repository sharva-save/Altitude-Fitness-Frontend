import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import React from 'react';


export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const adminNav = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/members', icon: '👥', label: 'Members' },
    { path: '/admin/expiring', icon: '⚠️', label: 'Expiring Soon' },
  ];

  const memberNav = [
    { path: '/member/dashboard', icon: '🏠', label: 'My Dashboard' },
    { path: '/member/history', icon: '💳', label: 'Fee History' },
  ];

  const navItems = user?.role === 'admin' ? adminNav : memberNav;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>💪 ALTITUDE FITNESS</h1>
          <p>Gym Management</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">
            {user?.role === 'admin' ? 'Admin Panel' : 'Member Portal'}
          </div>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {user?.role}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}