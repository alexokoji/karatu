import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('authRole') || 'guest'); // 'guest' | 'student' | 'tutor' | 'admin'
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('authUser')) } catch { return null } }); // { id, name, email }
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || '');
  useEffect(() => { try { if (user) localStorage.setItem('authUser', JSON.stringify(user)); else localStorage.removeItem('authUser') } catch {} }, [user])
  useEffect(() => { if (role) localStorage.setItem('authRole', role) }, [role])
  useEffect(() => { if (token) localStorage.setItem('authToken', token); else localStorage.removeItem('authToken') }, [token])

  // hydrate from backend if token exists
  useEffect(() => {
    const hydrate = async () => {
      if (!token) return
      try {
        const res = await fetch('http://localhost:4000/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('bad')
        const data = await res.json()
        if (data?.user) {
          setRole(data.user.role)
          setUser({ id: data.user.id, name: data.user.name })
        }
      } catch {
        setRole('guest'); setUser(null); setToken('')
      }
    }
    hydrate()
  }, [])

  const value = useMemo(() => ({
    role,
    user,
    token,
    isAuthenticated: role !== 'guest',
    setUser,
    async register({ name, email, password, role }) {
      const res = await fetch('http://localhost:4000/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, role }) })
      if (!res.ok) throw new Error('Registration failed')
      const data = await res.json()
      setToken(data.token); setRole(data.user.role); setUser({ id: data.user.id, name: data.user.name, email: data.user.email })
      return data
    },
    async login({ email, password }) {
      const res = await fetch('http://localhost:4000/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      if (!res.ok) throw new Error('Login failed')
      const data = await res.json()
      setToken(data.token); setRole(data.user.role); setUser({ id: data.user.id, name: data.user.name, email: data.user.email })
      return data
    },
    loginStudent: (u) => { setRole('student'); if (u) setUser(u); },
    loginTutor: (u) => { setRole('tutor'); if (u) setUser(u); },
    loginAdmin: (u) => { setRole('admin'); if (u) setUser(u); },
    logout: () => { setRole('guest'); setUser(null); setToken(''); },
  }), [role, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


