import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { API_URL } from '../config'

export default function Courses() {
  const persisted = (() => { try { return JSON.parse(localStorage.getItem('tutorCourses')) || [] } catch { return [] } })()
  const [apiCourses, setApiCourses] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async () => {
      try { const res = await fetch(`${API_URL}/courses`); if (res.ok) { const data = await res.json(); if (Array.isArray(data)) setApiCourses(data) } } catch {}
      setLoading(false)
    }
    load()
  }, [])
  const tutorPublished = useMemo(() => {
    const src = apiCourses.length ? apiCourses : persisted
    return src.filter(c => c.published).map(c => ({
      title: c.title,
      price: Number(c.price) || 0,
      lessons: (c.lessonsData?.length || 12),
      level: c.level || 'Beginner',
      img: 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1000',
      slug: c.slug,
      tutorName: c.tutorName || 'Tutor User',
      language: c.language || 'Yoruba',
    }))
  }, [apiCourses, persisted])
  const courses = tutorPublished

  // attach optional thumbs from tutor courses map
  const slugToThumb = Object.fromEntries(persisted.filter(c=>c.published && c.thumb).map(c=>[c.slug, c.thumb]))
  const [promoted, setPromoted] = useState(() => { try { return JSON.parse(localStorage.getItem('promotedCourses')) || [] } catch { return [] } })
  useEffect(() => {
    const loadPromos = async () => {
      try { const res = await fetch(`${API_URL}/promotions`); if (res.ok) { const list = await res.json(); if (Array.isArray(list)) setPromoted(list) } } catch {}
    }
    loadPromos()
  }, [])
  const promotedCourses = tutorPublished.filter(c => promoted.includes(c.slug))
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(() => params.get('q') || '')
  const [lang, setLang] = useState(() => params.get('lang') || 'All')
  const [level, setLevel] = useState(() => params.get('level') || 'All')
  const [minPrice, setMinPrice] = useState(() => params.get('min') || '')
  const [maxPrice, setMaxPrice] = useState(() => params.get('max') || '')
  const tutorNames = useMemo(() => {
    const names = new Set()
    tutorPublished.forEach(c => { if (c.tutorName) names.add(c.tutorName) })
    return ['All', ...Array.from(names)]
  }, [tutorPublished])
  const [tutor, setTutor] = useState(() => params.get('tutor') || 'All')
  const [sortBy, setSortBy] = useState(() => params.get('sort') || 'Relevance')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const activeCount = useMemo(() => {
    let n = 0
    if (query) n++
    if (lang !== 'All') n++
    if (level !== 'All') n++
    if (minPrice) n++
    if (maxPrice) n++
    if (tutor !== 'All') n++
    if (sortBy !== 'Relevance') n++
    return n
  }, [query, lang, level, minPrice, maxPrice, tutor, sortBy])

  // keep URL in sync with filters
  useEffect(() => {
    const next = new URLSearchParams()
    if (query) next.set('q', query)
    if (lang !== 'All') next.set('lang', lang)
    if (level !== 'All') next.set('level', level)
    if (minPrice) next.set('min', String(minPrice))
    if (maxPrice) next.set('max', String(maxPrice))
    if (tutor !== 'All') next.set('tutor', tutor)
    if (sortBy !== 'Relevance') next.set('sort', sortBy)
    setParams(next, { replace: true })
  }, [query, lang, level, minPrice, maxPrice, tutor, sortBy])
  const filtered = useMemo(() => courses.filter(c => {
    const matchesQuery = c.title.toLowerCase().includes(query.toLowerCase())
    const matchesLang = lang==='All' || (c.language||'').toLowerCase()===lang.toLowerCase()
    const matchesLevel = level==='All' || c.level===level
    const matchesMin = minPrice==='' || c.price >= Number(minPrice)
    const matchesMax = maxPrice==='' || c.price <= Number(maxPrice)
    const matchesTutor = tutor==='All' || (c.tutorName||'').toLowerCase()===tutor.toLowerCase()
    return matchesQuery && matchesLang && matchesLevel && matchesMin && matchesMax && matchesTutor
  }).sort((a,b) => {
    if (sortBy==='Price (Low→High)') return a.price - b.price
    if (sortBy==='Price (High→Low)') return b.price - a.price
    if (sortBy==='Title (A→Z)') return a.title.localeCompare(b.title)
    return 0
  }), [courses, query, lang, level, minPrice, maxPrice, tutor, sortBy])
  const languages = useMemo(() => {
    const set = new Set(filtered.map(c => c.language || 'Other'))
    return Array.from(set)
  }, [filtered])
  const promotedSlugs = new Set(promotedCourses.map(c => c.slug))
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl md:text-4xl font-bold">Explore Our Courses</h1>
        <button onClick={()=> setMobileFiltersOpen(true)} className="lg:hidden inline-flex items-center h-10 px-4 rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 text-sm">
          Filters
          {activeCount > 0 && <span className="ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary-600 text-white text-[11px]">{activeCount}</span>}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 hidden lg:block">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sticky top-20">
            <h3 className="text-sm font-semibold mb-3">Filters</h3>
            <div className="space-y-3">
              <input value={query} onChange={e=>setQuery(e.target.value)} className="w-full rounded-md border border-gray-200 p-2 text-sm" placeholder="Search courses" />
              <select value={lang} onChange={e=>setLang(e.target.value)} className="w-full rounded-md border border-gray-200 p-2 text-sm">
                {['All','Yoruba','Igbo','Swahili'].map(l=> <option key={l}>{l}</option>)}
              </select>
              <select value={level} onChange={e=>setLevel(e.target.value)} className="w-full rounded-md border border-gray-200 p-2 text-sm">
                {['All','Beginner','Intermediate','Advanced'].map(l=> <option key={l}>{l}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <input value={minPrice} onChange={e=>setMinPrice(e.target.value)} className="w-1/2 rounded-md border border-gray-200 p-2 text-sm" placeholder="Min $" />
                <input value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} className="w-1/2 rounded-md border border-gray-200 p-2 text-sm" placeholder="Max $" />
              </div>
              <select value={tutor} onChange={e=>setTutor(e.target.value)} className="w-full rounded-md border border-gray-200 p-2 text-sm">
                {tutorNames.map(n => <option key={n}>{n}</option>)}
              </select>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="w-full rounded-md border border-gray-200 p-2 text-sm">
                {['Relevance','Price (Low→High)','Price (High→Low)','Title (A→Z)'].map(s => <option key={s}>{s}</option>)}
              </select>
              <button onClick={()=> { setQuery(''); setLang('All'); setLevel('All'); setMinPrice(''); setMaxPrice(''); setTutor('All'); setSortBy('Relevance') }} className="w-full rounded-md border border-gray-200 p-2 text-sm hover:bg-gray-50">Reset</button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">
          {!loading && promotedCourses.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3">Featured Courses</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {promotedCourses.map((c)=> (
                  <div key={c.title} className="flex flex-col rounded-lg border border-purple-200 overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50/20">
                    <div className="w-full h-28 md:h-32 bg-center bg-no-repeat bg-cover" style={{backgroundImage:`url(${slugToThumb[c.slug] || c.img})`}} />
                    <div className="p-3 flex flex-col flex-grow">
                      <h3 className="text-sm font-bold line-clamp-2">{c.title}</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">By {c.tutorName}</p>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500">
                        <div className="flex gap-2"><span>{c.lessons}L</span><span>{c.level}</span></div>
                        <div className="text-primary-700 text-sm font-bold">${'{'}c.price{'}'}</div>
                      </div>
                      <Link to={`/courses/${c.slug}`} className="mt-3 self-start text-primary-700 text-sm font-bold hover:underline">Details →</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {languages.map(language => {
            const list = filtered.filter(c => (c.language || 'Other') === language && !promotedSlugs.has(c.slug))
            if (list.length === 0) return null
            return (
              <div key={language} className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{language} Courses</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {list.map((c)=> (
                    <div key={c.slug || c.title} className="flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 hover:border-primary-100 hover:bg-primary-50/20">
                      <div className="w-full h-48 bg-center bg-no-repeat bg-cover" style={{backgroundImage:`url(${slugToThumb[c.slug] || c.img})`}} />
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-xl font-bold">{c.title}</h3>
                        {c.tutorName && <p className="text-xs text-gray-500 mt-1">By {c.tutorName}</p>}
              <p className="text-sm text-gray-600 mt-2">Learn at your pace with cultural insights.</p>
              <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                <div className="flex gap-4"><span>{c.lessons} Lessons</span><span>{c.level}</span></div>
                <div className="text-primary-700 text-lg font-bold">${'{'}c.price{'}'}</div>
              </div>
                        <Link to={`/courses/${c.slug || c.title.toLowerCase().split(' ')[0]}`} className="mt-6 self-start text-primary-700 font-bold hover:underline">Learn More →</Link>
            </div>
          </div>
        ))}
      </div>
              </div>
            )
          })}
        </main>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={()=> setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Filters</h3>
              <button onClick={()=> setMobileFiltersOpen(false)} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-200">✕</button>
            </div>
            <div className="space-y-3">
              <input value={query} onChange={e=>setQuery(e.target.value)} className="w-full rounded-md border border-gray-200 p-2 text-sm" placeholder="Search courses" />
              <select value={lang} onChange={e=>setLang(e.target.value)} className="w-full rounded-md border border-gray-200 p-2 text-sm">
                {['All','Yoruba','Igbo','Swahili'].map(l=> <option key={l}>{l}</option>)}
              </select>
              <select value={level} onChange={e=>setLevel(e.target.value)} className="w-full rounded-md border border-gray-200 p-2 text-sm">
                {['All','Beginner','Intermediate','Advanced'].map(l=> <option key={l}>{l}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <input value={minPrice} onChange={e=>setMinPrice(e.target.value)} className="w-1/2 rounded-md border border-gray-200 p-2 text-sm" placeholder="Min $" />
                <input value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} className="w-1/2 rounded-md border border-gray-200 p-2 text-sm" placeholder="Max $" />
              </div>
              <select value={tutor} onChange={e=>setTutor(e.target.value)} className="w-full rounded-md border border-gray-200 p-2 text-sm">
                {tutorNames.map(n => <option key={n}>{n}</option>)}
              </select>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="w-full rounded-md border border-gray-200 p-2 text-sm">
                {['Relevance','Price (Low→High)','Price (High→Low)','Title (A→Z)'].map(s => <option key={s}>{s}</option>)}
              </select>
              <button onClick={()=> { setQuery(''); setLang('All'); setLevel('All'); setMinPrice(''); setMaxPrice(''); setTutor('All'); setSortBy('Relevance'); setMobileFiltersOpen(false) }} className="w-full rounded-md border border-gray-200 p-2 text-sm hover:bg-gray-50">Reset</button>
              <button onClick={()=> setMobileFiltersOpen(false)} className="w-full rounded-md bg-primary-600 text-white p-2 text-sm">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
