import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const adminNav = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/members',   icon: '👥', label: 'Members' },
    { path: '/admin/expiring',  icon: '⚠️',  label: 'Expiring Soon' },
  ];

  const memberNav = [
    { path: '/member/dashboard', icon: '🏠', label: 'My Dashboard' },
    { path: '/member/history',   icon: '💳', label: 'Fee History' },
  ];

  const navItems = user?.role === 'admin' ? adminNav : memberNav;

  const sidebarContent = (
    <>
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
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
            {user?.role}
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ width: '100%' }}
          onClick={handleLogout}
        >
          🚪 Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="app-layout">

      {/* ── Desktop sidebar (always visible ≥ 769px) ── */}
      <aside className="sidebar">
        {sidebarContent}
      </aside>

      {/* ── Mobile: overlay backdrop ── */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile: slide-in drawer ── */}
      <aside className={`sidebar-drawer ${sidebarOpen ? 'open' : ''}`}>
        {sidebarContent}
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">

        {/* Mobile top bar */}
        <header className="mobile-header">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle navigation"
            aria-expanded={sidebarOpen}
          >
            <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`} />
          </button>

          <span className="mobile-header-title">💪 ALTITUDE</span>

          <div className="mobile-header-user">
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {user?.role}
            </span>
          </div>
        </header>

        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}