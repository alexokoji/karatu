import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from "../context/AuthContextSimple"

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      console.log('📝 Registration form submitted:', { name, email, role })
      const res = await register({ name, email, password, role })
      console.log('📝 Registration response:', res)
      if (res?.user?.role === 'student') {
        console.log('📝 Navigating to student dashboard')
        navigate('/student')
      } else if (res?.user?.role === 'tutor') {
        console.log('📝 Navigating to tutor dashboard')
        navigate('/tutor')
      } else if (res?.user?.role === 'admin') {
        console.log('📝 Navigating to admin dashboard')
        navigate('/admin')
      } else {
        console.log('📝 Navigating to home')
        navigate('/')
      }
    } catch (e) { 
      console.error('📝 Registration error:', e)
      setError('Registration failed') 
    } finally { 
      setLoading(false) 
    }
  }
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Account</h1>
      <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
        <input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-lg border border-gray-200 p-3" placeholder="Full name" />
        <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-lg border border-gray-200 p-3" placeholder="Email" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-lg border border-gray-200 p-3" placeholder="Password" />
        <select value={role} onChange={e=>setRole(e.target.value)} className="w-full rounded-lg border border-gray-200 p-3">
          {['student','tutor','admin'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button disabled={loading} className="w-full h-11 rounded-lg bg-primary-700 hover:bg-primary-800 text-white font-bold">{loading?'Creating...':'Create Account'}</button>
      </form>
      <p className="mt-3 text-sm">Have an account? <Link to="/login" className="text-primary-700 hover:underline">Log in</Link></p>
    </div>
  )
}


