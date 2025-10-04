import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from "../context/AuthContextSimple"
import { API_URL } from '../config'

export default function AdminDashboard() {
  const { token } = useAuth()
  const [tutorCourses, setTutorCourses] = useState([])
  const [privateSessions, setPrivateSessions] = useState([])
  const [transactions, setTransactions] = useState([])
  const [promotedCourses, setPromotedCourses] = useState([])
  const [promotionRequests, setPromotionRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const getTutorAvg = (name) => {
    try {
      const slug = String(name || 'tutor-user').toLowerCase().split(' ').join('-')
      const raw = localStorage.getItem(`tutorRatings:${slug}`)
      const arr = raw ? JSON.parse(raw) : []
      if (!arr.length) return 0
      return Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10
    } catch { return 0 }
  }
  const togglePublish = (slug) => {
    try {
      const raw = localStorage.getItem('tutorCourses')
      const list = raw ? JSON.parse(raw) : []
      const idx = list.findIndex(c => c.slug === slug)
      if (idx >= 0) {
        list[idx].published = !list[idx].published
        localStorage.setItem('tutorCourses', JSON.stringify(list))
        window.location.reload()
      }
    } catch {}
  }
  const togglePromoted = (slug) => {
    try {
      const raw = localStorage.getItem('promotedCourses')
      const promos = raw ? JSON.parse(raw) : []
      const i = promos.indexOf(slug)
      if (i >= 0) { promos.splice(i,1) } else { promos.push(slug) }
      localStorage.setItem('promotedCourses', JSON.stringify(promos))
      window.location.reload()
    } catch {}
  }
  const [search, setSearch] = useState('')
  const [banned, setBanned] = useState([])
  
  // Load backend data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (token) {
          // Load all data from backend
          const [coursesRes, sessionsRes, txnRes, promotionsRes] = await Promise.all([
            fetch(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/private-sessions`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/promotions`, { headers: { Authorization: `Bearer ${token}` } })
          ])
          
          if (coursesRes.ok) setTutorCourses(await coursesRes.json())
          if (sessionsRes.ok) setPrivateSessions(await sessionsRes.json())
          if (txnRes.ok) setTransactions(await txnRes.json())
          if (promotionsRes.ok) setPromotionRequests(await promotionsRes.json())
          
          // Load promoted courses from localStorage for now
          try {
            const promoted = JSON.parse(localStorage.getItem('promotedCourses')) || []
            setPromotedCourses(promoted)
          } catch {}
          
          // Load banned tutors from localStorage for now
          try {
            const bannedTutors = JSON.parse(localStorage.getItem('bannedTutors')) || []
            setBanned(bannedTutors)
          } catch {}
        }
      } catch (error) {
        console.error('Failed to load admin data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [token])
  
  const saveBanned = (next) => { 
    setBanned(next)
    try { 
      localStorage.setItem('bannedTutors', JSON.stringify(next)) 
    } catch {} 
  }
  
  const courses = useMemo(()=> tutorCourses.filter(c=> c.title.toLowerCase().includes(search.toLowerCase())), [tutorCourses, search])
  const tutorNames = useMemo(()=> [...new Set(tutorCourses.map(c=> c.tutorName || 'Tutor User'))], [tutorCourses])
  const tutorSlugs = tutorNames.map(n => ({ name: n, slug: String(n).toLowerCase().split(' ').join('-') }))

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('stats')
  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    const ids = ['stats','courses','tutors','sessions','transactions','ratings','promotions']
    const elements = ids
      .map(id => {
        const el = document.getElementById(id)
        return el ? { id, el } : null
      })
      .filter(Boolean)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a,b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActiveSection(visible[0].target.id)
      },
      { root: null, rootMargin: '0px 0px -70% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    elements.forEach(({ el }) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  if (loading) {
    return (
      <div className="px-4 md:px-10 lg:px-20 py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button onClick={()=> setSidebarOpen(true)} className="lg:hidden inline-flex items-center h-10 px-4 rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 text-sm">Menu</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sticky top-20">
            <nav className="flex flex-col gap-1 text-sm">
              <button onClick={()=> scrollTo('stats')} className={`text-left px-3 py-2 rounded-md hover:bg-gray-50 ${activeSection==='stats' ? 'bg-primary-50 text-primary-800' : ''}`}>Overview</button>
              <button onClick={()=> scrollTo('courses')} className={`text-left px-3 py-2 rounded-md hover:bg-gray-50 ${activeSection==='courses' ? 'bg-primary-50 text-primary-800' : ''}`}>Manage Courses</button>
              <button onClick={()=> scrollTo('tutors')} className={`text-left px-3 py-2 rounded-md hover:bg-gray-50 ${activeSection==='tutors' ? 'bg-primary-50 text-primary-800' : ''}`}>Manage Tutors</button>
              <button onClick={()=> scrollTo('sessions')} className={`text-left px-3 py-2 rounded-md hover:bg-gray-50 ${activeSection==='sessions' ? 'bg-primary-50 text-primary-800' : ''}`}>Private Sessions</button>
              <button onClick={()=> scrollTo('transactions')} className={`text-left px-3 py-2 rounded-md hover:bg-gray-50 ${activeSection==='transactions' ? 'bg-primary-50 text-primary-800' : ''}`}>Transactions</button>
              <button onClick={()=> scrollTo('ratings')} className={`text-left px-3 py-2 rounded-md hover:bg-gray-50 ${activeSection==='ratings' ? 'bg-primary-50 text-primary-800' : ''}`}>Ratings Moderation</button>
              <button onClick={()=> scrollTo('promotions')} className={`text-left px-3 py-2 rounded-md hover:bg-gray-50 ${activeSection==='promotions' ? 'bg-primary-50 text-primary-800' : ''}`}>Promotion Requests</button>
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="lg:col-span-9">
      <div id="stats" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Stat title="Courses" value={tutorCourses.length} />
        <Stat title="Private Sessions" value={privateSessions.length} />
        <Stat title="Transactions" value={transactions.length} />
      </div>

      <div id="courses" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Manage Courses</h2>
          <input value={search} onChange={e=>setSearch(e.target.value)} className="rounded-md border border-gray-200 p-2 text-sm" placeholder="Search courses" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Tutor</th>
                <th className="py-2 pr-4">Language</th>
                <th className="py-2 pr-4">Tutor Rating</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Promoted</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="py-2 pr-4">{c.title}</td>
                  <td className="py-2 pr-4">{c.tutorName || 'Tutor User'}</td>
                  <td className="py-2 pr-4">{c.language}</td>
                  <td className="py-2 pr-4">{getTutorAvg(c.tutorName)}</td>
                  <td className="py-2 pr-4">${c.price}</td>
                  <td className="py-2 pr-4">{c.published ? 'Published' : 'Draft'}</td>
                  <td className="py-2 pr-4">{promotedCourses.includes(c.slug) ? 'Yes' : 'No'}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/courses/${c.slug}`} className="h-8 px-3 rounded-md border border-gray-200 hover:bg-gray-50">View</Link>
                      <button onClick={()=> togglePublish(c.slug)} className="h-8 px-3 rounded-md border border-gray-200 hover:bg-gray-50">{c.published ? 'Unpublish' : 'Publish'}</button>
                      <button onClick={()=> togglePromoted(c.slug)} className="h-8 px-3 rounded-md border border-gray-200 hover:bg-gray-50">{promotedCourses.includes(c.slug) ? 'Unfeature' : 'Feature'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div id="tutors" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Manage Tutors</h2>
          <div className="space-y-2">
            {tutorSlugs.map(({name, slug}) => {
              const isBanned = banned.includes(slug)
              return (
                <div key={slug} className="rounded-lg border border-gray-200 p-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{name}</p>
                    <p className="text-xs text-gray-500">Rating: {getTutorAvg(name)} ★</p>
                  </div>
                  <button onClick={()=> saveBanned(isBanned ? banned.filter(s=>s!==slug) : [...banned, slug])} className={`h-8 px-3 rounded-md border ${isBanned ? 'border-red-200 hover:bg-red-50 text-red-700' : 'border-gray-200 hover:bg-gray-50'}`}>{isBanned ? 'Unban' : 'Ban'}</button>
                </div>
              )
            })}
          </div>
        </div>
        <div id="sessions" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Private Sessions</h2>
          <div className="space-y-2">
            {privateSessions.map(s => (
              <div key={s.id} className="rounded-lg border border-gray-200 p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{s.studentName} ↔ {s.tutorName}</p>
                  <p className="text-xs text-gray-500">{s.date} • {s.duration}</p>
                </div>
                <div className="text-xs">{s.status}{s.paid ? ' • Paid' : ''}</div>
              </div>
            ))}
          </div>
        </div>

        <div id="transactions" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Ref</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-top border-gray-100">
                    <td className="py-2 pr-4">{new Date(t.date).toLocaleString()}</td>
                    <td className="py-2 pr-4">{t.type}</td>
                    <td className="py-2 pr-4">{t.ref}</td>
                    <td className="py-2 pr-4">{t.currency} ${t.amount}</td>
                    <td className="py-2 pr-4">{t.refunded ? 'Refunded' : 'Paid'}</td>
                    <td className="py-2 pr-4">
                      {!t.refunded && (
                        <button onClick={()=> {
                          try {
                            const raw = localStorage.getItem('studentTransactions')
                            const arr = raw ? JSON.parse(raw) : []
                            const idx = arr.findIndex(x=> x.id===t.id)
                            if (idx>=0) { arr[idx].refunded = true; localStorage.setItem('studentTransactions', JSON.stringify(arr)) }
                            window.location.reload()
                          } catch {}
                        }} className="h-8 px-3 rounded-md border border-gray-200 hover:bg-gray-50">Mark Refunded</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div id="ratings" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Ratings Moderation</h2>
          <div className="space-y-2">
            {tutorSlugs.map(({name, slug}) => {
              const raw = localStorage.getItem(`tutorRatings:${slug}`)
              const ratings = raw ? JSON.parse(raw) : []
              return (
                <div key={slug} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{name}</p>
                    <p className="text-xs text-gray-500">Avg: {getTutorAvg(name)} ★</p>
                  </div>
                  {ratings.length === 0 ? (
                    <p className="text-xs text-gray-500">No ratings yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {ratings.map((r, i) => (
                        <button key={i} onClick={() => {
                          try {
                            const after = ratings.filter((_,idx)=> idx!==i)
                            localStorage.setItem(`tutorRatings:${slug}`, JSON.stringify(after))
                            window.location.reload()
                          } catch {}
                        }} className="h-8 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-xs">{r}★ ×</button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div id="promotions" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mt-6">
        <h2 className="text-lg font-semibold mb-3">Promotion Requests</h2>
        <div className="space-y-2">
          {promotionRequests.length === 0 && <p className="text-sm text-gray-500">No requests.</p>}
          {promotionRequests.map(slug => (
            <div key={slug} className="rounded-lg border border-gray-200 p-3 flex items-center justify-between">
              <span>{slug}</span>
              <div className="flex items-center gap-2">
                <button onClick={()=> { togglePromoted(slug); try { const raw = localStorage.getItem('promotionRequests'); const reqs = raw ? JSON.parse(raw) : []; localStorage.setItem('promotionRequests', JSON.stringify(reqs.filter(s=> s!==slug))) } catch {} }} className="h-8 px-3 rounded-md border border-gray-200 hover:bg-gray-50">Approve</button>
                <button onClick={()=> { try { const raw = localStorage.getItem('promotionRequests'); const reqs = raw ? JSON.parse(raw) : []; localStorage.setItem('promotionRequests', JSON.stringify(reqs.filter(s=> s!==slug))) } catch {} }} className="h-8 px-3 rounded-md border border-gray-200 hover:bg-gray-50">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
        </main>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={()=> setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Admin Menu</h3>
              <button onClick={()=> setSidebarOpen(false)} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-200">✕</button>
            </div>
            <nav className="flex flex-col gap-1 text-sm">
              <button onClick={()=> { scrollTo('stats'); setSidebarOpen(false) }} className={`text-left px-3 py-2 rounded-md hover:bg-gray-50 ${activeSection==='stats' ? 'bg-primary-50 text-primary-800' : ''}`}>Overview</button>
              <button onClick={()=> { scrollTo('courses'); setSidebarOpen(false) }} className={`text-left px-3 py-2 rounded-md hover:bg-gray-50 ${activeSection==='courses' ? 'bg-primary-50 text-primary-800' : ''}`}>Manage Courses</button>
              <button onClick={()=> { scrollTo('tutors'); setSidebarOpen(false) }} className={`text-left px-3 py-2 rounded-md hover:bg-gray-50 ${activeSection==='tutors' ? 'bg-primary-50 text-primary-800' : ''}`}>Manage Tutors</button>
              <button onClick={()=> { scrollTo('sessions'); setSidebarOpen(false) }} className={`text-left px-3 py-2 rounded-md hover:bg-gray-50 ${activeSection==='sessions' ? 'bg-primary-50 text-primary-800' : ''}`}>Private Sessions</button>
              <button onClick={()=> { scrollTo('transactions'); setSidebarOpen(false) }} className={`text-left px-3 py-2 rounded-md hover:bg-gray-50 ${activeSection==='transactions' ? 'bg-primary-50 text-primary-800' : ''}`}>Transactions</button>
              <button onClick={()=> { scrollTo('ratings'); setSidebarOpen(false) }} className={`text-left px-3 py-2 rounded-md hover:bg-gray-50 ${activeSection==='ratings' ? 'bg-primary-50 text-primary-800' : ''}`}>Ratings Moderation</button>
              <button onClick={()=> { scrollTo('promotions'); setSidebarOpen(false) }} className={`text-left px-3 py-2 rounded-md hover:bg-gray-50 ${activeSection==='promotions' ? 'bg-primary-50 text-primary-800' : ''}`}>Promotion Requests</button>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ title, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

