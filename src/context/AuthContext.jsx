import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_URL } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('authRole') || 'guest'); // 'guest' | 'student' | 'tutor' | 'admin'
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('authUser')) } catch { return null } }); // { id, name, email }
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || '');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => { try { if (user) localStorage.setItem('authUser', JSON.stringify(user)); else localStorage.removeItem('authUser') } catch {} }, [user])
  useEffect(() => { if (role) localStorage.setItem('authRole', role) }, [role])
  useEffect(() => { if (token) localStorage.setItem('authToken', token); else localStorage.removeItem('authToken') }, [token])

  // hydrate from backend if token exists
  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }
      try {
        console.log('Hydrating auth state with token:', token)
        const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error('bad')
        const data = await res.json()
        console.log('Auth hydration response:', data)
        if (data?.user) {
          setRole(data.user.role)
          setUser({ id: data.user.id, name: data.user.name })
          console.log('Auth state hydrated:', { role: data.user.role, user: data.user })
        }
      } catch (error) {
        console.error('Auth hydration failed:', error)
        setRole('guest'); setUser(null); setToken('')
      } finally {
        setIsLoading(false)
      }
    }
    hydrate()
  }, [])

  const value = useMemo(() => ({
    role,
    user,
    token,
    isLoading,
    isAuthenticated: role !== 'guest',
    setUser,
    async register({ name, email, password, role }) {
      const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, role }) })
      if (!res.ok) throw new Error('Registration failed')
      const data = await res.json()
      setToken(data.token); setRole(data.user.role); setUser({ id: data.user.id, name: data.user.name, email: data.user.email })
      return data
    },
    async login({ email, password }) {
      const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      if (!res.ok) {
        console.error('Login failed with status:', res.status)
        throw new Error('Login failed')
      }
      const data = await res.json()
      console.log('Login response:', data)
      
      // Update all state synchronously
      setToken(data.token)
      setRole(data.user.role)
      setUser({ id: data.user.id, name: data.user.name, email: data.user.email })
      setIsLoading(false)
      
      console.log('Auth state updated:', {
        token: data.token,
        role: data.user.role,
        user: { id: data.user.id, name: data.user.name, email: data.user.email }
      })
      
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


