import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PaymentModal from '../components/PaymentModal'
import TutorLayout from '../components/TutorLayout'
import { useAuth } from '../context/AuthContext'

export default function TutorCourses() {
  const { token, user } = useAuth()
  const [courses, setCourses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tutorCourses')) || [] } catch { return [] }
  })
  const [form, setForm] = useState({ title: '', price: '', language: 'Yoruba', published: false, thumb: '', description: '', syllabusText: '' })
  const [formError, setFormError] = useState('')
  useEffect(() => { try { localStorage.setItem('tutorCourses', JSON.stringify(courses)) } catch {} }, [courses])
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('http://localhost:4000/courses')
        if (!res.ok) throw new Error('bad')
        const data = await res.json()
        // keep only this tutor's courses if tutorName matches
        setCourses(prev => {
          if (Array.isArray(data) && data.length) return data
          return prev
        })
      } catch {
        // fallback to localStorage (already in state)
      }
    }
    load()
  }, [])

  const addCourse = async () => {
    const priceNum = Number(form.price)
    if (!form.title) { setFormError('Title is required'); return }
    if (!form.price || isNaN(priceNum) || priceNum <= 0) { setFormError('Enter a valid price'); return }
    const slug = form.title.toLowerCase().split(' ').join('-')
    const syllabus = form.syllabusText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
      .map((t, i) => ({ order: i+1, title: t }))
    const toSave = { slug, title: form.title, price: priceNum, language: form.language, published: form.published, thumb: form.thumb, description: form.description, syllabus, tutorName: user?.name || 'Tutor User' }
    try {
      const res = await fetch('http://localhost:4000/courses', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token?{ Authorization: `Bearer ${token}` }: {}) }, body: JSON.stringify(toSave) })
      if (res.ok) {
        const created = await res.json()
        setCourses(prev => [created, ...prev])
      } else {
        setCourses(prev => [{ id: Date.now(), ...toSave }, ...prev])
      }
    } catch {
      setCourses(prev => [{ id: Date.now(), ...toSave }, ...prev])
    }
    setForm({ title: '', price: '', language: form.language, published: false, thumb: '', description: '', syllabusText: '' })
    setFormError('')
  }
  const togglePublish = async (idx) => {
    const c = courses[idx]
    const next = { ...c, published: !c.published }
    setCourses(prev => prev.map((row,i)=> i===idx ? next : row))
    try {
      if (c.id) {
        await fetch(`http://localhost:4000/courses/${c.id}` , { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token?{ Authorization: `Bearer ${token}` }: {}) }, body: JSON.stringify({ published: next.published }) })
      }
    } catch {}
  }
  const removeCourse = async (idx) => {
    const c = courses[idx]
    setCourses(prev => prev.filter((_,i)=> i!==idx))
    try {
      if (c.id) {
        await fetch(`http://localhost:4000/courses/${c.id}`, { method: 'DELETE', headers: { ...(token?{ Authorization: `Bearer ${token}` }: {}) } })
      }
    } catch {}
  }
  const [editingIndex, setEditingIndex] = useState(-1)
  const [editDraft, setEditDraft] = useState({ title: '', price: '', language: 'Yoruba', thumb: '', description: '', syllabusText: '' })
  const [editError, setEditError] = useState('')

  const handleFileToDataUrl = (file, cb) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => cb(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <TutorLayout title="My Courses">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.map((c, idx) => (
              <div key={c.id} className="rounded-lg border border-gray-200 p-4">
                {editingIndex === idx ? (
                  <div className="space-y-2">
                    <input value={editDraft.title} onChange={e=>setEditDraft(d=>({...d, title:e.target.value}))} className="w-full rounded-lg border border-gray-200 p-2" placeholder="Course title" />
                    <div className="grid grid-cols-2 gap-2">
                      <select value={editDraft.language} onChange={e=>setEditDraft(d=>({...d, language:e.target.value}))} className="rounded-lg border border-gray-200 p-2">
                        {['Yoruba','Igbo','Hausa','Swahili'].map(l=> <option key={l}>{l}</option>)}
                      </select>
                      <input value={editDraft.price} onChange={e=>setEditDraft(d=>({...d, price:e.target.value}))} className="rounded-lg border border-gray-200 p-2" placeholder="Price (USD)" />
                    </div>
                    <input value={editDraft.thumb} onChange={e=>setEditDraft(d=>({...d, thumb:e.target.value}))} className="w-full rounded-lg border border-gray-200 p-2" placeholder="Thumbnail URL (optional)" />
                    <div className="flex items-center gap-3">
                      <input type="file" accept="image/*" onChange={e=> handleFileToDataUrl(e.target.files?.[0], dataUrl => setEditDraft(d=>({...d, thumb: String(dataUrl)})))} className="text-sm" />
                      {editDraft.thumb && <span className="text-xs text-gray-500">Image selected</span>}
                    </div>
                    <textarea value={editDraft.description} onChange={e=>setEditDraft(d=>({...d, description:e.target.value}))} className="w-full rounded-lg border border-gray-200 p-2" rows="3" placeholder="Short description" />
                    <textarea value={editDraft.syllabusText} onChange={e=>setEditDraft(d=>({...d, syllabusText:e.target.value}))} className="w-full rounded-lg border border-gray-200 p-2" rows="4" placeholder="Syllabus (one item per line)" />
                    {editError && <p className="text-xs text-red-600">{editError}</p>}
                    <div className="flex gap-2">
                      <button onClick={async ()=> { const priceNum = Number(editDraft.price); if (!editDraft.title) { setEditError('Title is required'); return } if (!editDraft.price || isNaN(priceNum) || priceNum <= 0) { setEditError('Enter a valid price'); return } const updated = (course=>{ const syllabus = (editDraft.syllabusText||'').split('\n').map(s=>s.trim()).filter(Boolean).map((t,j)=>({order:j+1,title:t})); return { ...course, title: editDraft.title, price: priceNum, language: editDraft.language, thumb: editDraft.thumb, description: editDraft.description, syllabus, slug: editDraft.title ? editDraft.title.toLowerCase().split(' ').join('-') : course.slug } })(courses[idx]); setCourses(prev => prev.map((course,i)=> i===idx ? updated : course)); setEditingIndex(-1); setEditError(''); try { if (updated.id) { await fetch(`http://localhost:4000/courses/${updated.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token?{ Authorization: `Bearer ${token}` }: {}) }, body: JSON.stringify(updated) }) } } catch {} }} className="h-9 px-3 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-sm">Save</button>
                      <button onClick={()=> setEditingIndex(-1)} className="h-9 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-md bg-center bg-cover bg-gray-100" style={{ backgroundImage: `url(${c.thumb || 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=400'})` }} />
                        <div>
                          <p className="font-semibold text-gray-900">{c.title}</p>
                          <p className="text-sm text-gray-500">{c.language} • ${c.price}</p>
                          {c.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.description}</p>}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{c.published ? 'Published' : 'Draft'}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={()=> togglePublish(idx)} className="h-9 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-sm">{c.published ? 'Unpublish' : 'Publish'}</button>
                      <button onClick={()=> { setEditingIndex(idx); setEditDraft({ title: c.title, price: String(c.price), language: c.language, thumb: c.thumb || '' }) }} className="h-9 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-sm">Edit</button>
                      <button onClick={()=> removeCourse(idx)} className="h-9 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-sm">Delete</button>
                      <Link to={`/tutor/courses/${c.slug}/lessons`} className="h-9 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-sm inline-flex items-center">Manage Lessons</Link>
                      <PromoteButton slug={c.slug} title={c.title} />
                    </div>
                    <a href={`/courses/${c.slug}`} className="mt-3 inline-block text-sm text-primary-700 hover:underline">View as student</a>
                  </>
                )}
              </div>
            ))}
            {courses.length === 0 && <p className="text-sm text-gray-500">No courses yet. Create one on the right.</p>}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Create Course</h2>
          <div className="space-y-3">
            <input value={form.title} onChange={e=>setForm(f=>({...f, title:e.target.value}))} className="w-full rounded-lg border border-gray-200 p-3" placeholder="Course title" />
            <select value={form.language} onChange={e=>setForm(f=>({...f, language:e.target.value}))} className="w-full rounded-lg border border-gray-200 p-3">
              {['Yoruba','Igbo','Hausa','Swahili'].map(l=> <option key={l}>{l}</option>)}
            </select>
            <input value={form.price} onChange={e=>setForm(f=>({...f, price:e.target.value}))} className="w-full rounded-lg border border-gray-200 p-3" placeholder="Price (USD)" />
            <input value={form.thumb} onChange={e=>setForm(f=>({...f, thumb:e.target.value}))} className="w-full rounded-lg border border-gray-200 p-3" placeholder="Thumbnail URL (optional)" />
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={e=> handleFileToDataUrl(e.target.files?.[0], dataUrl => setForm(f=>({...f, thumb: String(dataUrl)})))} className="text-sm" />
              {form.thumb && <span className="text-xs text-gray-500">Image selected</span>}
            </div>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))} className="w-full rounded-lg border border-gray-200 p-3" rows="3" placeholder="Short description" />
            <textarea value={form.syllabusText} onChange={e=>setForm(f=>({...f, syllabusText:e.target.value}))} className="w-full rounded-lg border border-gray-200 p-3" rows="4" placeholder="Syllabus (one item per line)" />
            <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.published} onChange={e=>setForm(f=>({...f, published:e.target.checked}))} /> Publish immediately</label>
            {formError && <p className="text-xs text-red-600">{formError}</p>}
            <button onClick={addCourse} className="h-11 px-5 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold w-full">Add Course</button>
          </div>
        </div>
      </div>
    </TutorLayout>
  )
}

function PromoteButton({ slug, title }) {
  const [open, setOpen] = useState(false)
  const amount = 10
  return (
    <>
      <button onClick={()=> setOpen(true)} className="h-9 px-3 rounded-md border border-purple-200 hover:bg-purple-50 text-sm text-purple-700">Promote</button>
      <PaymentModal
        open={open}
        onClose={()=> setOpen(false)}
        amount={amount}
        currency="USD"
        description={`Promote ${title} on the platform`}
        onConfirm={() => {
          try {
            const reqRaw = localStorage.getItem('promotionRequests')
            const reqs = reqRaw ? JSON.parse(reqRaw) : []
            if (!reqs.includes(slug)) { reqs.push(slug); localStorage.setItem('promotionRequests', JSON.stringify(reqs)) }
          } catch {}
          setOpen(false)
        }}
      />
    </>
  )
}

