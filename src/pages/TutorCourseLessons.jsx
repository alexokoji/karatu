import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import TutorLayout from '../components/TutorLayout'

export default function TutorCourseLessons() {
  const { slug } = useParams()
  const [courses, setCourses] = useState(() => { try { return JSON.parse(localStorage.getItem('tutorCourses')) || [] } catch { return [] } })
  const idx = useMemo(() => courses.findIndex(c=>c.slug===slug), [courses, slug])
  const course = idx >= 0 ? courses[idx] : null
  const [draft, setDraft] = useState({ title: '', duration: '10m', videoUrl: '', noteName: '', noteDataUrl: '' })
  const [dragId, setDragId] = useState(null)

  const saveCourses = (next) => { setCourses(next); try { localStorage.setItem('tutorCourses', JSON.stringify(next)) } catch {} }
  const addLesson = () => {
    if (idx < 0 || !draft.title) return
    const next = [...courses]
    const lessons = Array.isArray(next[idx].lessonsData) ? next[idx].lessonsData : []
    lessons.push({ id: Date.now().toString(), title: draft.title, duration: draft.duration, videoUrl: draft.videoUrl, noteName: draft.noteName, noteDataUrl: draft.noteDataUrl })
    next[idx] = { ...next[idx], lessonsData: lessons, syllabus: lessons.map((l,i)=>({ order: i+1, title: l.title })) }
    saveCourses(next)
    setDraft({ title: '', duration: '10m', videoUrl: '', noteName: '', noteDataUrl: '' })
  }
  const removeLesson = (lessonId) => {
    if (idx < 0) return
    const next = [...courses]
    const lessons = (next[idx].lessonsData || []).filter(l=> l.id !== lessonId)
    next[idx] = { ...next[idx], lessonsData: lessons, syllabus: lessons.map((l,i)=>({ order: i+1, title: l.title })) }
    saveCourses(next)
  }
  const moveLesson = (fromIndex, toIndex) => {
    if (idx < 0) return
    if (toIndex < 0) return
    const cur = courses[idx]
    const lessons = [...(cur.lessonsData || [])]
    if (fromIndex >= lessons.length || toIndex >= lessons.length) return
    const [moved] = lessons.splice(fromIndex, 1)
    lessons.splice(toIndex, 0, moved)
    const next = [...courses]
    next[idx] = { ...cur, lessonsData: lessons, syllabus: lessons.map((l,i)=>({ order: i+1, title: l.title })) }
    saveCourses(next)
  }
  const onDragStart = (id) => setDragId(id)
  const onDropOver = (targetId) => {
    if (!dragId || dragId === targetId) return
    const list = courses[idx]?.lessonsData || []
    const from = list.findIndex(l=>l.id===dragId)
    const to = list.findIndex(l=>l.id===targetId)
    if (from >= 0 && to >= 0) moveLesson(from, to)
    setDragId(null)
  }

  if (!course) return (
    <TutorLayout title="Manage Lessons">
      <p className="text-gray-600">Course not found.</p>
    </TutorLayout>
  )

  const lessons = course.lessonsData || []
  return (
    <TutorLayout title={`Manage Lessons — ${course.title}`}>
      <div className="mb-4"><Link to="/tutor/courses" className="text-primary-700 hover:underline">← Back to Courses</Link></div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Lessons</h2>
          <div className="space-y-3">
            {lessons.map((l, i) => (
              <div
                key={l.id}
                draggable
                onDragStart={()=> onDragStart(l.id)}
                onDragOver={(e)=> e.preventDefault()}
                onDrop={()=> onDropOver(l.id)}
                className="rounded-lg border border-gray-200 p-4 flex items-center justify-between cursor-move"
              >
                <div>
                  <p className="font-semibold text-gray-900">{l.title}</p>
                  <p className="text-sm text-gray-500">{l.duration}{l.videoUrl ? ' • Video attached' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=> moveLesson(i, i-1)} className="h-9 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-sm">Up</button>
                  <button onClick={()=> moveLesson(i, i+1)} className="h-9 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-sm">Down</button>
                  <button onClick={()=> removeLesson(l.id)} className="h-9 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-sm">Delete</button>
                </div>
              </div>
            ))}
            {lessons.length === 0 && <p className="text-sm text-gray-500">No lessons yet. Add one on the right.</p>}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Add Lesson</h2>
          <div className="space-y-3">
            <input value={draft.title} onChange={e=>setDraft(d=>({...d, title:e.target.value}))} className="w-full rounded-lg border border-gray-200 p-3" placeholder="Lesson title" />
            <div className="grid grid-cols-2 gap-3">
              <input value={draft.duration} onChange={e=>setDraft(d=>({...d, duration:e.target.value}))} className="rounded-lg border border-gray-200 p-3" placeholder="Duration (e.g. 12m)" />
              <input value={draft.videoUrl} onChange={e=>setDraft(d=>({...d, videoUrl:e.target.value}))} className="rounded-lg border border-gray-200 p-3" placeholder="Video URL (optional)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Lesson Notes (PDF/Image)</label>
              <input type="file" accept="application/pdf,image/*" onChange={e=> {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => setDraft(d=>({...d, noteName: file.name, noteDataUrl: String(reader.result)}))
                reader.readAsDataURL(file)
              }} className="text-sm" />
              {draft.noteName && <p className="mt-1 text-xs text-gray-500">Attached: {draft.noteName}</p>}
            </div>
            <button onClick={addLesson} className="h-11 px-5 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold w-full">Add Lesson</button>
          </div>
        </div>
      </div>
    </TutorLayout>
  )
}

