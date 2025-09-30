import { useEffect, useState } from 'react'
import TutorLayout from '../components/TutorLayout'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'

export default function TutorSchedule() {
  const { token } = useAuth()
  // Removed one-off hourly availability; monthly schedules below are the source of truth
  // Monthly schedules: unlimited plans, each with 1h sessions; prevent time clashes
  const [monthly, setMonthly] = useState(() => {
    try {
      const raw = localStorage.getItem('tutorMonthlySchedules')
      return raw ? JSON.parse(raw) : [ { id:'plan-a', name:'Plan A', sessions:[] } ]
    } catch { return [{ id:'plan-a', name:'Plan A', sessions:[] }] }
  })
  useEffect(()=> { try { localStorage.setItem('tutorMonthlySchedules', JSON.stringify(monthly)) } catch {} }, [monthly])
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/schedules`, { headers: { Authorization: token?`Bearer ${token}`:undefined } })
        if (res.ok) {
          const list = await res.json()
          if (Array.isArray(list)) setMonthly(list)
        }
      } catch {}
    }
    if (token) load()
  }, [token])
  useEffect(() => {
    const save = async () => {
      try {
        await fetch(`${API_URL}/schedules`, { method: 'PUT', headers: { 'Content-Type':'application/json', Authorization: token?`Bearer ${token}`:undefined }, body: JSON.stringify(monthly) })
      } catch {}
    }
    if (token) save()
  }, [monthly, token])
  const [editor, setEditor] = useState({ planId: 'plan-a', day: 'Mon', time: '10:00' })
  const addPlan = () => setMonthly(prev => [...prev, { id: `plan-${Date.now()}`, name: `Plan ${String.fromCharCode(65 + prev.length)}`, sessions: [] }])
  const removePlan = (planId) => setMonthly(prev => prev.filter(p => p.id !== planId))
  const [crossPlanWarning, setCrossPlanWarning] = useState('')

  const toMinutes = (hhmm) => {
    try {
      const [h, m] = String(hhmm).split(':').map(Number)
      if (Number.isNaN(h) || Number.isNaN(m)) return null
      return h * 60 + m
    } catch { return null }
  }
  const overlapsOneHour = (startA, startB) => {
    const a = toMinutes(startA)
    const b = toMinutes(startB)
    if (a==null || b==null) return false
    const endA = a + 60
    const endB = b + 60
    return a < endB && b < endA
  }
  const addMonthlySession = () => {
    setCrossPlanWarning('')
    const newTime = editor.time
    const newDay = editor.day
    // warn if clashes with other plans
    const clashOther = monthly.some(pl => pl.id !== editor.planId && pl.sessions.some(s => s.day===newDay && overlapsOneHour(s.time, newTime)))
    if (clashOther) {
      setCrossPlanWarning('This time overlaps with a session in another plan. Please choose a different time.')
      return
    }
    // block if clashes within same plan
    setMonthly(prev => prev.map(p => {
      if (p.id !== editor.planId) return p
      const wouldClash = p.sessions.some(s => s.day===newDay && overlapsOneHour(s.time, newTime))
      if (wouldClash) return p
      // basic HH:MM validation
      if (toMinutes(newTime) == null) return p
      return { ...p, sessions: [...p.sessions, { id: Date.now(), day: newDay, time: newTime }] }
    }))
  }
  const removeMonthlySession = (planId, id) => setMonthly(prev => prev.map(p => p.id===planId ? { ...p, sessions: p.sessions.filter(s=> s.id!==id) } : p))
  const renamePlan = (planId, name) => setMonthly(prev => prev.map(p => p.id===planId ? { ...p, name } : p))
  return (
    <TutorLayout title="Schedule">
      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Monthly Schedules</h2>
            <button onClick={addPlan} className="h-9 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-sm">Add Plan</button>
          </div>
          <p className="text-sm text-gray-500 mb-2">Create plans with one-hour sessions. We’ll prevent conflicting times within a plan and warn on clashes across plans.</p>
          {crossPlanWarning && <p className="mb-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">{crossPlanWarning}</p>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {monthly.map(plan => (
              <div key={plan.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <input value={plan.name} onChange={e=> renamePlan(plan.id, e.target.value)} className="font-semibold text-base border-b border-transparent focus:border-gray-300 outline-none" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{plan.sessions.length} sessions/week</span>
                    {monthly.length>1 && <button onClick={()=> removePlan(plan.id)} className="h-8 px-2 rounded-md border border-gray-200 hover:bg-gray-50 text-xs">Delete</button>}
                  </div>
                </div>
                <div className="space-y-2">
                  {plan.sessions.length===0 && <p className="text-sm text-gray-500">No sessions added yet.</p>}
                  {plan.sessions.map(s => (
                    <div key={s.id} className="flex items-center justify-between rounded-md border border-gray-200 p-2">
                      <span className="text-sm">{s.day} • {s.time} - {nextHour(s.time)}</span>
                      <button onClick={()=> removeMonthlySession(plan.id, s.id)} className="h-8 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-xs">Remove</button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <select value={editor.planId===plan.id?editor.day:'Mon'} onChange={e=> setEditor(ed=> ({...ed, planId: plan.id, day: e.target.value}))} className="rounded-md border border-gray-200 p-2 text-sm">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=> <option key={d}>{d}</option>)}
                  </select>
                  <input value={editor.planId===plan.id?editor.time:'10:00'} onChange={e=> setEditor(ed=> ({...ed, planId: plan.id, time: e.target.value}))} className="rounded-md border border-gray-200 p-2 text-sm" placeholder="Start (e.g. 10:00)" />
                  <button onClick={()=> { setEditor(ed=> ({...ed, planId: plan.id})); addMonthlySession() }} className="h-9 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-sm">Add 1h</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TutorLayout>
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

