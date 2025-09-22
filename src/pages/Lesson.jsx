import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'

export default function Lesson() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const course = searchParams.get('course')

  useEffect(() => {
    if (course && id) {
      const storageKey = `studentCourseProgress:${course}`
      try {
        const raw = localStorage.getItem(storageKey)
        const prev = raw ? JSON.parse(raw) : []
        if (!prev.includes(id)) {
          localStorage.setItem(storageKey, JSON.stringify([...prev, id]))
        }
      } catch {}
    }
  }, [course, id])
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <div className="mb-4"><Link to="/student" className="text-primary-700 hover:underline">← Back to Dashboard</Link></div>
      <h1 className="text-3xl font-bold mb-4">Lesson Player</h1>
      <p className="text-gray-600 mb-6">Now playing lesson: {id || 'sample'}</p>
      {course && <p className="text-sm text-gray-500 mb-6">Course: {course}</p>}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="aspect-video w-full rounded-lg bg-center bg-cover" style={{backgroundImage:'url(https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=1200)'}} />
        <div className="mt-4 flex gap-2">
          <button className="h-10 px-4 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold">Previous</button>
          <button className="h-10 px-4 rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 text-sm font-bold">Next</button>
        </div>
      </div>
    </div>
  )
}

