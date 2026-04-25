import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/globals.css';
import React from 'react';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import {VerifyEmail,AdminRegister} from './components/auth/VerifyEmail'
import Layout from './components/shared/Layout';
import AdminDashboard from './components/admin/AdminDashboard';
import MemberList from './components/admin/MemberList';
import ExpiringPage from './components/admin/ExpiringPage';
import UserDashboard from './components/user/UserDashboard';
import FeeHistory from './components/user/Feehistory'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="loading-page">
      <div className="loading-spinner" />
      <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 2 }}>LOADING...</p>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard'} replace />;

  return <Layout>{children}</Layout>;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="loading-spinner" /></div>;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard'} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Guest routes */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/admin-register" element={<GuestRoute><AdminRegister /></GuestRoute>} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/members" element={<ProtectedRoute role="admin"><MemberList /></ProtectedRoute>} />
      <Route path="/admin/members/add" element={<ProtectedRoute role="admin"><MemberList openAdd /></ProtectedRoute>} />
      <Route path="/admin/expiring" element={<ProtectedRoute role="admin"><ExpiringPage /></ProtectedRoute>} />

      {/* Member routes */}
      <Route path="/member/dashboard" element={<ProtectedRoute role="member"><UserDashboard /></ProtectedRoute>} />
      <Route path="/member/history" element={<ProtectedRoute role="member"><FeeHistory /></ProtectedRoute>} />
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
 return (
    <>
      <AppRoutes />   
      <Toaster position="top-right" />
    </>
 )
}
