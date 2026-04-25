import  React,{ createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('gym_token');
      const savedUser = localStorage.getItem('gym_user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            setMember(res.data.member);
            localStorage.setItem('gym_user', JSON.stringify(res.data.user));
          }
        } catch {
          localStorage.removeItem('gym_token');
          localStorage.removeItem('gym_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('gym_token', res.data.token);
      localStorage.setItem('gym_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_user');
    setUser(null);
    setMember(null);
  };

  const refreshMember = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setMember(res.data.member);
      }
    } catch (err) {
      console.error('Refresh member error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, member, loading, login, logout, refreshMember, setMember }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;