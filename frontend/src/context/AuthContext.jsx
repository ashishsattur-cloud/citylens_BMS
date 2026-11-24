import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('citylens.user') || 'null'); } catch { return null; } });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('citylens.token')));
  useEffect(() => {
    if (!localStorage.getItem('citylens.token')) { setLoading(false); return; }
    api.get('/auth/me').then(({ data }) => { setUser(data.user); localStorage.setItem('citylens.user', JSON.stringify(data.user)); }).catch(() => { localStorage.removeItem('citylens.token'); localStorage.removeItem('citylens.user'); setUser(null); }).finally(() => setLoading(false));
  }, []);
  async function authenticate(path, body) {
    const { data } = await api.post(path, body);
    localStorage.setItem('citylens.token', data.token); localStorage.setItem('citylens.user', JSON.stringify(data.user)); setUser(data.user); return data.user;
  }
  const value = useMemo(() => ({ user, loading, login: (body) => authenticate('/auth/login', body), register: (body) => authenticate('/auth/register', body), logout: () => { localStorage.removeItem('citylens.token'); localStorage.removeItem('citylens.user'); setUser(null); } }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
