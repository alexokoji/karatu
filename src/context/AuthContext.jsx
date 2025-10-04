import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_URL } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('authRole') || 'guest'); // 'guest' | 'student' | 'tutor' | 'admin'
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('authUser')) } catch { return null } }); // { id, name, email }
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || '');
  const [isLoading, setIsLoading] = useState(true);
  
  // Fallback timeout to ensure loading never gets stuck
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      console.log('🔐 Fallback timeout - forcing loading to false')
      setIsLoading(false)
    }, 10000) // 10 second absolute timeout
    
    return () => clearTimeout(fallbackTimeout)
  }, [])
  
  useEffect(() => { try { if (user) localStorage.setItem('authUser', JSON.stringify(user)); else localStorage.removeItem('authUser') } catch {} }, [user])
  useEffect(() => { if (role) localStorage.setItem('authRole', role) }, [role])
  useEffect(() => { if (token) localStorage.setItem('authToken', token); else localStorage.removeItem('authToken') }, [token])

  // hydrate from backend if token exists
  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        console.log('🔐 No token found, setting loading to false')
        setIsLoading(false)
        return
      }
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('🔐 Hydration timeout, setting loading to false')
        setIsLoading(false)
      }, 5000) // 5 second timeout
      
      try {
        console.log('🔐 Hydrating auth state with token:', token)
        console.log('🔐 API_URL for hydration:', API_URL)
        const res = await fetch(`${API_URL}/auth/me`, { 
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10000) // 10 second fetch timeout
        })
        console.log('🔐 Hydration response status:', res.status)
        if (!res.ok) {
          console.error('🔐 Hydration failed with status:', res.status)
          throw new Error('bad')
        }
        const data = await res.json()
        console.log('🔐 Auth hydration response:', data)
        if (data?.user) {
          setRole(data.user.role)
          setUser({ id: data.user.id, name: data.user.name })
          console.log('🔐 Auth state hydrated:', { role: data.user.role, user: data.user })
        }
      } catch (error) {
        console.error('🔐 Auth hydration failed:', error)
        // Only clear auth if it's a real error, not a network timeout
        if (error.name !== 'AbortError') {
          setRole('guest'); setUser(null); setToken('')
        }
      } finally {
        clearTimeout(timeoutId)
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
      console.log('🔐 Attempting registration:', { name, email, role })
      console.log('🔐 API_URL:', API_URL)
      try {
        const res = await fetch(`${API_URL}/auth/register`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ name, email, password, role }) 
        })
        console.log('🔐 Registration response status:', res.status)
        if (!res.ok) {
          const errorText = await res.text()
          console.error('🔐 Registration failed:', res.status, errorText)
          throw new Error('Registration failed')
        }
        const data = await res.json()
        console.log('🔐 Registration successful:', data)
        setToken(data.token); setRole(data.user.role); setUser({ id: data.user.id, name: data.user.name, email: data.user.email })
        return data
      } catch (error) {
        console.error('🔐 Registration error:', error)
        throw error
      }
    },
    async login({ email, password }) {
      console.log('🔐 Attempting login:', { email })
      console.log('🔐 API_URL:', API_URL)
      try {
        const res = await fetch(`${API_URL}/auth/login`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ email, password }) 
        })
        console.log('🔐 Login response status:', res.status)
        if (!res.ok) {
          const errorText = await res.text()
          console.error('🔐 Login failed:', res.status, errorText)
          throw new Error('Login failed')
        }
        const data = await res.json()
        console.log('🔐 Login successful:', data)
        
        // Update all state synchronously
        setToken(data.token)
        setRole(data.user.role)
        setUser({ id: data.user.id, name: data.user.name, email: data.user.email })
        setIsLoading(false)
        
        console.log('🔐 Auth state updated:', {
          token: data.token,
          role: data.user.role,
          user: { id: data.user.id, name: data.user.name, email: data.user.email }
        })
        
        return data
      } catch (error) {
        console.error('🔐 Login error:', error)
        throw error
      }
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


