import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from "./context/AuthContextSimple"
import { API_URL } from '../config'

export default function Tutors() {
  const { role, isAuthenticated } = useAuth()
  const rate = (() => { try { return Number(localStorage.getItem('tutorPrivateRate')) || 25 } catch { return 25 } })()
  const [tutors, setTutors] = useState([])
  const [schedulesByTutorId, setSchedulesByTutorId] = useState({})
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await fetch(`${API_URL}/tutors`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) setTutors(data)
        }
      } catch {}
    }
    fetchTutors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Load public schedules for each tutor (for student discovery)
  useEffect(() => {
    const loadAllSchedules = async () => {
      try {
        const entries = await Promise.all((tutors||[]).map(async (t) => {
          try {
            const res = await fetch(`${API_URL}/schedules/${t.id}`)
            if (!res.ok) return [t.id, []]
            const list = await res.json()
            return [t.id, Array.isArray(list) ? list : []]
          } catch { return [t.id, []] }
        }))
        const map = Object.fromEntries(entries)
        setSchedulesByTutorId(map)
      } catch {}
    }
    if ((tutors||[]).length) loadAllSchedules()
  }, [tutors])
  const getAvgLocal = (slug) => { try { const raw = localStorage.getItem(`tutorRatings:${slug}`); const arr = raw ? JSON.parse(raw) : []; if (!arr.length) return 0; return Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10 } catch { return 0 } }
  const [remoteRatings, setRemoteRatings] = useState({})
  useEffect(() => {
    const load = async () => {
      for (const t of tutors) {
        try { const res = await fetch(`${API_URL}/ratings/${t.slug}`); if (res.ok) { const arr = await res.json(); const avg = arr.length ? Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10 : 0; setRemoteRatings(prev => ({ ...prev, [t.slug]: avg })) } } catch {}
      }
    }
    load()
  }, [])
  const promoted = (() => { try { return JSON.parse(localStorage.getItem('promotedTutors')) || [] } catch { return [] } })()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(() => params.get('q') || '')
  const [lang, setLang] = useState(() => params.get('lang') || 'All')
  const [minRating, setMinRating] = useState(() => Number(params.get('rating') || 0))
  const [sortBy, setSortBy] = useState(() => params.get('sort') || 'Rating (High→Low)')
  const banned = (() => { try { return JSON.parse(localStorage.getItem('bannedTutors')) || [] } catch { return [] } })()
  useEffect(() => {
    const next = new URLSearchParams()
    if (query) next.set('q', query)
    if (lang !== 'All') next.set('lang', lang)
    if (minRating) next.set('rating', String(minRating))
    if (sortBy !== 'Rating (High→Low)') next.set('sort', sortBy)
    setParams(next, { replace: true })
  }, [query, lang, minRating, sortBy])

  const filtered = useMemo(() => {
    const base = tutors
      .map(t => ({...t, rating: (remoteRatings[t.slug] ?? getAvgLocal(t.slug)) }))
      .filter(t => !banned.includes(t.slug))
      .filter(t => (lang==='All' || t.lang===lang) && t.rating >= minRating && (t.name.toLowerCase().includes(query.toLowerCase()) || t.role.toLowerCase().includes(query.toLowerCase())))
    if (sortBy === 'Name (A→Z)') return base.sort((a,b) => a.name.localeCompare(b.name))
    if (sortBy === 'Name (Z→A)') return base.sort((a,b) => b.name.localeCompare(a.name))
    if (sortBy === 'Rating (Low→High)') return base.sort((a,b) => a.rating - b.rating)
    return base.sort((a,b) => b.rating - a.rating)
  }, [tutors, banned, lang, minRating, query, sortBy])
  const languages = useMemo(() => Array.from(new Set(filtered.map(t => t.lang))), [filtered])
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Meet Our Expert Tutors</h1>
      <div className="mb-6 flex flex-wrap items-center gap-3 sticky top-16 z-10 bg-white/80 backdrop-blur px-3 py-2 border border-gray-200 rounded-md">
        <input value={query} onChange={e=>setQuery(e.target.value)} className="rounded-md border border-gray-200 p-2 text-sm" placeholder="Search tutors" />
        <select value={lang} onChange={e=>setLang(e.target.value)} className="rounded-md border border-gray-200 p-2 text-sm">
          {['All','Yoruba','Igbo','Swahili'].map(l=> <option key={l}>{l}</option>)}
        </select>
        <select value={minRating} onChange={e=>setMinRating(Number(e.target.value))} className="rounded-md border border-gray-200 p-2 text-sm">
          {[0,1,2,3,4,5].map(n=> <option key={n} value={n}>Min {n}★</option>)}
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="rounded-md border border-gray-200 p-2 text-sm">
          {['Rating (High→Low)','Rating (Low→High)','Name (A→Z)','Name (Z→A)'].map(s=> <option key={s}>{s}</option>)}
        </select>
        <button onClick={()=> { setQuery(''); setLang('All'); setMinRating(0); setSortBy('Rating (High→Low)') }} className="rounded-md border border-gray-200 p-2 text-sm hover:bg-gray-50">Reset</button>
      </div>

      {languages.map(language => {
        const list = filtered.filter(t => t.lang === language)
        if (list.length === 0) return null
        return (
          <div key={language} className="mb-10">
            <h2 className="text-2xl font-bold mb-4">{language} Tutors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {list.map((t)=> (
                <div key={t.slug} className="flex flex-col items-center gap-4 text-center rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="w-32 h-32 bg-center bg-cover rounded-full" style={{backgroundImage:`url(${t.img})`}} />
                  <div>
                    <p className="text-lg font-bold">{t.name}</p>
                    <p className="text-sm text-primary-700">{t.role}</p>
                    <p className="text-xs text-gray-500">Rating: {(remoteRatings[t.slug] ?? getAvgLocal(t.slug))} ★</p>
                    {/* Monthly schedule summary */}
                    {(() => {
                      const plans = schedulesByTutorId[t.id] || []
                      if (!plans.length) return null
                      const sessionsPerPlan = plans.map(p => (p.sessions||[]).length)
                      const maxSessions = Math.max(0, ...sessionsPerPlan)
                      const planLabel = plans.length === 1 ? '1 plan' : `${plans.length} plans`
                      return (
                        <p className="mt-1 text-xs text-gray-600">{planLabel} • up to {maxSessions} sessions/week</p>
                      )
                    })()}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Link to="/courses" className="h-10 px-4 inline-flex items-center rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold hover-pulse">View Courses</Link>
                    <Link to={`/tutors/${t.slug}`} className="h-10 px-4 inline-flex items-center rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 text-sm font-bold hover-lift">View Profile</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  );
}
