import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TutorLayout from '../components/TutorLayout'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'

export default function TutorPrivate() {
  const { token } = useAuth()
  const [rate, setRate] = useState(() => { try { return Number(localStorage.getItem('tutorPrivateRate')) || 25 } catch { return 25 } })
  const [sessions, setSessions] = useState(() => { try { return JSON.parse(localStorage.getItem('tutorPrivateSessions')) || [] } catch { return [] } })
  useEffect(() => { try { localStorage.setItem('tutorPrivateRate', String(rate)) } catch {} }, [rate])
  useEffect(() => { try { localStorage.setItem('tutorPrivateSessions', JSON.stringify(sessions)) } catch {} }, [sessions])
  useEffect(() => {
    const load = async () => {
      try { const res = await fetch(`${API_URL}/private-sessions`, { headers: { Authorization: token?`Bearer ${token}`:undefined } }); if (res.ok) { const data = await res.json(); if (Array.isArray(data)) setSessions(data) } } catch {}
    }
    if (token) load()
  }, [token])

  const accept = async (id) => {
    setSessions(prev => prev.map(s => s.id===id ? { ...s, status: 'accepted' } : s))
    try { await fetch(`${API_URL}/private-sessions/${id}`, { method: 'PUT', headers: { 'Content-Type':'application/json', Authorization: token?`Bearer ${token}`:undefined }, body: JSON.stringify({ status: 'accepted' }) }) } catch {}
  }
  const decline = async (id) => {
    setSessions(prev => prev.map(s => s.id===id ? { ...s, status: 'declined' } : s))
    try { await fetch(`${API_URL}/private-sessions/${id}`, { method: 'PUT', headers: { 'Content-Type':'application/json', Authorization: token?`Bearer ${token}`:undefined }, body: JSON.stringify({ status: 'declined' }) }) } catch {}
  }

  const computeDuration = (range) => {
    try {
      if (!range) return ''
      const parts = String(range).split('-').map(x=>x.trim())
      if (parts.length < 2) return ''
      const [sh, sm] = parts[0].split(':').map(Number)
      const [eh, em] = parts[1].split(':').map(Number)
      if ([sh,sm,eh,em].some(n=> Number.isNaN(n))) return ''
      const mins = (eh*60+em) - (sh*60+sm)
      if (mins <= 0) return ''
      const h = Math.floor(mins/60)
      const m = mins%60
      return h>0 ? `${h}h${m?` ${m}m`:''}` : `${m}m`
    } catch { return '' }
  }

  return (
    <TutorLayout title="Private Sessions">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Your Hourly Rate</h2>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">$</span>
            <input value={rate} onChange={e=> setRate(Number(e.target.value)||0)} className="w-24 rounded-lg border border-gray-200 p-2" />
            <span className="text-gray-600">/ hour</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Students will see this rate on your profile for private sessions.</p>
        </div>

        <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Requests</h2>
          <div className="space-y-3">
            {sessions.length === 0 && <p className="text-sm text-gray-500">No private session requests yet.</p>}
            {sessions.map(s => {
              const derived = s.duration || computeDuration(s.sessionTime)
              return (
              <div key={s.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{s.studentName}</p>
                    {s.type==='monthly' ? (
                      <p className="text-sm text-gray-500">{s.topic} • {s.sessionsPerWeek} sessions/week • ${s.monthlyPrice}</p>
                    ) : (
                      <p className="text-sm text-gray-500">{s.topic} • {s.date}{s.sessionTime?` ${s.sessionTime}`:''}{derived?` • ${derived}`:''}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.status==='Accepted'?'bg-green-100 text-green-700': s.status==='Declined'?'bg-gray-100 text-gray-700':'bg-yellow-100 text-yellow-700'}`}>{s.status}</span>
                    {s.paid && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">Paid</span>}
                  </div>
                </div>
                {s.status==='Pending' && (
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={()=> accept(s.id)} className="h-9 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-sm">Accept</button>
                    <button onClick={()=> decline(s.id)} className="h-9 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-sm">Decline</button>
                  </div>
                )}
                {s.status==='accepted' && s.paid && (
                  <div className="mt-3">
                    <Link to={`/video/${s.id}`} className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold">
                      Join Session
                    </Link>
                  </div>
                )}
              </div>
              )
            })}
          </div>
        </div>
      </div>
    </TutorLayout>
  )
}

