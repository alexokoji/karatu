import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await login({ email, password })
      console.log('Login successful:', res)
      const role = res?.user?.role
      console.log('User role:', role)
      
      // Add a small delay to ensure state is updated
      setTimeout(() => {
        if (role === 'student') {
          console.log('Navigating to student dashboard')
          navigate('/student')
        } else if (role === 'tutor') {
          console.log('Navigating to tutor dashboard')
          navigate('/tutor')
        } else if (role === 'admin') {
          console.log('Navigating to admin dashboard')
          navigate('/admin')
        } else {
          console.log('Navigating to home')
          navigate('/')
        }
      }, 100)
    } catch (e) { 
      console.error('Login failed:', e)
      setError('Invalid email or password') 
    } finally { 
      setLoading(false) 
    }
  }
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Log In</h1>
      <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
        <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-lg border border-gray-200 p-3" placeholder="Email" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-lg border border-gray-200 p-3" placeholder="Password" />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button disabled={loading} className="w-full h-11 rounded-lg bg-primary-700 hover:bg-primary-800 text-white font-bold">{loading?'Signing in...':'Sign In'}</button>
      </form>
      <p className="mt-3 text-sm">No account? <Link to="/register" className="text-primary-700 hover:underline">Register</Link></p>
    </div>
  )
}


