import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { API_URL } from '../config'
import { useAuth } from "../context/AuthContextSimple"

function getAvg(slug) {
  try {
    const raw = localStorage.getItem(`tutorRatings:${slug}`)
    const arr = raw ? JSON.parse(raw) : []
    if (!arr.length) return 0
    return Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10
  } catch { return 0 }
}

export default function TutorProfile() {
  const { slug } = useParams()
  const { isAuthenticated, role, token, user } = useAuth()
  const [t, setTutor] = useState(null)
  const [avg, setAvg] = useState(0)
  const [hover, setHover] = useState(0)
  // Monthly schedules loaded from backend by tutor id
  const [monthly, setMonthly] = useState([])
  const rate = (() => { try { return Number(localStorage.getItem('tutorPrivateRate')) || 25 } catch { return 25 } })()
  const monthlyPrice = (sessionsPerWeek) => {
    // 4 weeks x sessions/week x 1h x rate
    const weeks = 4
    return weeks * sessionsPerWeek * rate
  }
  const requestSlot = async (slot) => {
    try {
      if (!isAuthenticated || role !== 'student') { alert('Please log in as a student to request a private session.'); return }
      const parts = String(slot.time).split('-').map(s=>s.trim())
      const start = parts[0] || slot.time
      const end = parts[1] || ''
      await fetch(`${API_URL}/private-sessions`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization: token?`Bearer ${token}`:undefined },
        body: JSON.stringify({
          studentId: user?.id,
          tutorId: t.id,
          studentName: user?.name || 'Student User',
          tutorName: t.name,
          topic: 'Private practice',
          date: slot.day,
          sessionTime: `${start}${end?` - ${end}`:''}`,
          status: 'Pending'
        })
      })
      alert('Request sent for the selected slot!')
    } catch {}
  }
  const subscribePlan = async (plan) => {
    try {
      if (!isAuthenticated || role !== 'student') { alert('Please log in as a student to subscribe.'); return }
      const sessionsPerWeek = (plan.sessions||[]).length
      if (!sessionsPerWeek) { alert('This plan has no sessions yet.'); return }
      const price = monthlyPrice(sessionsPerWeek)
      await fetch(`${API_URL}/private-sessions`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization: token?`Bearer ${token}`:undefined },
        body: JSON.stringify({
          studentId: user?.id,
          tutorId: t.id,
          studentName: user?.name || 'Student User',
          tutorName: t.name,
          topic: `Monthly subscription: ${plan.name}`,
          planId: plan.id,
          planName: plan.name,
          planSessions: plan.sessions,
          sessionsPerWeek,
          monthlyPrice: price,
          status: 'Pending',
          type: 'monthly'
        })
      })
      alert('Monthly subscription request sent!')
    } catch {}
  }
  useEffect(() => {
    const loadTutor = async () => {
      try {
        const res = await fetch(`${API_URL}/tutors`)
        if (res.ok) {
          const arr = await res.json()
          const found = Array.isArray(arr) ? arr.find(x => x.slug === slug) : null
          if (found) setTutor(found)
        }
      } catch {}
    }
    loadTutor()
    // Load monthly schedules for this tutor (public)
    const loadSchedules = async () => {
      try {
        // need tutor id to fetch schedules; wait until tutor is loaded
        if (!t) return
        const res = await fetch(`${API_URL}/schedules/${t.id}`)
        if (res.ok) {
          const list = await res.json()
          if (Array.isArray(list)) setMonthly(list)
        }
      } catch {}
    }
    loadSchedules()
    const loadRatings = async () => {
      try {
        if (!slug) return
        const res = await fetch(`${API_URL}/ratings/${slug}`)
        if (res.ok) {
          const arr = await res.json()
          if (Array.isArray(arr) && arr.length) {
            const average = Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10
            setAvg(average)
          }
        }
      } catch {}
    }
    loadRatings()
  }, [slug, t])
  if (!t) return <div className="px-4 md:px-10 lg:px-20 py-10">Loading...</div>
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <div className="mb-4"><Link to="/tutors" className="text-primary-700 hover:underline">← Back to Tutors</Link></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-center bg-cover" style={{backgroundImage:`url(${t.img})`}} />
            <div>
              <h1 className="text-2xl font-bold">{t.name}</h1>
              <p className="text-sm text-gray-500">Teaches {t.language}</p>
              <StarDisplay value={avg} />
              <p className="text-xs text-gray-500">Average: {avg} / 5</p>
            </div>
          </div>
          <video controls className="w-full rounded-lg" src={t.video} />
          <p className="mt-4 text-gray-600">Hello! I am {t.name}. I help learners master {t.language} with culture-rich lessons tailored to your pace.</p>
          {/* Hourly Availability section removed */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Monthly Schedules</h2>
            {monthly.length===0 || monthly.every(p=> (p.sessions||[]).length===0) ? (
              <p className="text-sm text-gray-500">No monthly plans yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {monthly.map(plan => (
                  <div key={plan.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{plan.name}</p>
                      <span className="text-xs text-gray-500">{(plan.sessions||[]).length} sessions/week</span>
                    </div>
                    <div className="text-xs text-gray-600 mb-3">
                      {(plan.sessions||[]).length>0 ? plan.sessions.map(s=> `${s.day} ${s.time} - ${nextHour(s.time)}`).join(' • ') : 'No sessions'}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">${monthlyPrice((plan.sessions||[]).length)}</span>
                      {isAuthenticated && role==='student' ? (
                        <button onClick={()=> subscribePlan(plan)} className="h-9 px-3 rounded-md bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold">Subscribe Monthly</button>
                      ) : (
                        <Link to="/student" className="h-9 px-3 inline-flex items-center rounded-md border border-primary-700 text-primary-700 hover:bg-primary-50 text-xs font-bold">Log in</Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <aside className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Rate this Tutor</h2>
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                onMouseEnter={()=> setHover(n)}
                onMouseLeave={()=> setHover(0)}
                onClick={async () => {
                  try {
                    // backend first
                    const res = await fetch(`${API_URL}/ratings/${t.slug}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: n }) })
                    if (res.ok) {
                      const arr = await res.json()
                      const average = arr.length ? Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10 : 0
                      setAvg(average)
                      return
                    }
                  } catch {}
                  // fallback to local
                  try {
                    const raw = localStorage.getItem(`tutorRatings:${t.slug}`)
                    const arr = raw ? JSON.parse(raw) : []
                    arr.push(n)
                    localStorage.setItem(`tutorRatings:${t.slug}`, JSON.stringify(arr))
                    const average = arr.length ? Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10 : 0
                    setAvg(average)
                  } catch {}
                }}
                className="relative h-8 w-8"
                aria-label={`${n} star${n>1?'s':''}`}
                title={`${n} star${n>1?'s':''}`}
              >
                <Star iconFill={hover ? (n<=hover?1:0) : 0} />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

function StarDisplay({ value }) {
  // value can be fractional 0..5
  const stars = [1,2,3,4,5]
  return (
    <div className="flex items-center gap-1">
      {stars.map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i-1)))
        return <Star key={i} iconFill={fill} />
      })}
    </div>
  )
}

function Star({ iconFill }) {
  // iconFill 0..1
  return (
    <span className="relative inline-block align-middle" style={{ width: 20, height: 20 }}>
      <span className="absolute inset-0 text-gray-300">★</span>
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${iconFill*100}%` }}>
        <span className="text-yellow-400">★</span>
      </span>
    </span>
  )
}

function nextHour(time) {
  try {
    const [h, m] = String(time).split(':').map(Number)
    const endH = (h + 1) % 24
    const pad = (n)=> String(n).padStart(2,'0')
    return `${pad(endH)}:${pad(m||0)}`
  } catch { return time }
}

