import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_URL } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('authRole') || 'guest'); // 'guest' | 'student' | 'tutor' | 'admin'
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('authUser')) } catch { return null } }); // { id, name, email }
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || '');
  const [isLoading, setIsLoading] = useState(true);
  
  // Aggressive fallback timeout to ensure loading never gets stuck
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      console.log('🔐 EMERGENCY FALLBACK - forcing loading to false')
      setIsLoading(false)
    }, 3000) // 3 second absolute timeout
    
    return () => clearTimeout(fallbackTimeout)
  }, [])
  
  // Additional emergency fallback
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('🚨 EMERGENCY: Loading state stuck, forcing false')
        setIsLoading(false)
      }
    }, 5000) // 5 second emergency timeout
    
    return () => clearTimeout(emergencyTimeout)
  }, [isLoading])
  
  useEffect(() => { try { if (user) localStorage.setItem('authUser', JSON.stringify(user)); else localStorage.removeItem('authUser') } catch {} }, [user])
  useEffect(() => { if (role) localStorage.setItem('authRole', role) }, [role])
  useEffect(() => { if (token) localStorage.setItem('authToken', token); else localStorage.removeItem('authToken') }, [token])

  // hydrate from backend if token exists
  useEffect(() => {
    const hydrate = async () => {
      console.log('🔐 Starting hydration check...')
      console.log('🔐 Token exists:', !!token)
      console.log('🔐 API_URL:', API_URL)
      
      if (!token) {
        console.log('🔐 No token found, setting loading to false immediately')
        setIsLoading(false)
        return
      }
      
      // Immediate timeout as backup
      const immediateTimeout = setTimeout(() => {
        console.log('🔐 Immediate timeout - forcing loading to false')
        setIsLoading(false)
      }, 2000) // 2 second immediate timeout
      
      try {
        console.log('🔐 Attempting to hydrate with token...')
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
        
        const res = await fetch(`${API_URL}/auth/me`, { 
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
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
          console.log('🔐 Auth state hydrated successfully')
        }
      } catch (error) {
        console.error('🔐 Auth hydration failed:', error)
        // Clear auth on any error
        setRole('guest')
        setUser(null)
        setToken('')
      } finally {
        clearTimeout(immediateTimeout)
        console.log('🔐 Setting loading to false')
        setIsLoading(false)
      }
    }
    
    // Add a small delay to ensure state is ready
    setTimeout(hydrate, 100)
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


