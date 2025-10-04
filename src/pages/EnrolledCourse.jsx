import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from "../context/AuthContextSimple"
import PaymentModal from '../components/PaymentModal'

export default function EnrolledCourse() {
  const { slug } = useParams()
  const { token, user } = useAuth()
  const courseTitle = (slug || 'course').split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
  const tutorCourses = (() => { try { return JSON.parse(localStorage.getItem('tutorCourses')) || [] } catch { return [] } })()
  const tutorMatch = tutorCourses.find(c => c.slug === slug && c.published)
  const lessons = tutorMatch && Array.isArray(tutorMatch.lessonsData) && tutorMatch.lessonsData.length > 0
    ? tutorMatch.lessonsData
    : [
      { id: '1', title: 'Introduction & Greetings', duration: '12m' },
      { id: '2', title: 'Alphabet & Tones', duration: '18m' },
      { id: '3', title: 'Numbers & Counting', duration: '22m' },
    ]
  const storageKey = `studentCourseProgress:${slug}`
  const [completed, setCompleted] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })
  const isPaidForCourse = (() => { try { const raw = localStorage.getItem('studentCoursePayments'); const arr = raw ? JSON.parse(raw) : []; return arr.includes(slug) } catch { return false } })()
  const [payOpen, setPayOpen] = useState(false)
  const coursePrice = tutorMatch ? Number(tutorMatch.price) || 0 : 0
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(completed)) } catch {}
  }, [completed])
  const progress = useMemo(() => Math.round((completed.length / lessons.length) * 100), [completed])
  const firstIncomplete = useMemo(() => lessons.find(l => !completed.includes(l.id)) || lessons[0], [completed, lessons])
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <div className="mb-4"><Link to="/student" className="text-primary-700 hover:underline">← Back to Dashboard</Link></div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{courseTitle}</h1>
          <p className="text-gray-600 mb-4">Your enrolled course overview, progress and lessons.</p>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 text-sm text-gray-600">Overall progress: <span className="font-semibold text-gray-900">{progress}%</span></div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Current Streak</p>
                <p className="text-lg font-bold">3 days</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Lessons Completed</p>
                <p className="text-lg font-bold">5</p>
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Lessons</h2>
              <div className="flex items-center gap-2">
                <Link to={`/lessons/${firstIncomplete.id}?course=${slug}`} className="h-10 px-4 inline-flex items-center rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold">Continue</Link>
                {completed.length > 0 && completed.length < lessons.length && (
                  <button onClick={() => setCompleted(lessons.map(l=>l.id))} className="h-10 px-4 rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 text-sm font-bold">Mark all done</button>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {lessons.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{l.title}</span>
                    {!isPaidForCourse && <span className="text-xs text-gray-500">(Locked)</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{l.duration}</span>
                    {isPaidForCourse ? (
                      <>
                        {l.noteDataUrl && (
                          <a href={l.noteDataUrl} download={l.noteName || 'lesson-notes'} className="text-sm text-primary-700 hover:underline">Notes</a>
                        )}
                        {l.videoUrl && (
                          <a href={l.videoUrl} target="_blank" rel="noreferrer" className="text-sm text-primary-700 hover:underline">Video</a>
                        )}
                        <Link to={`/lessons/${l.id}?course=${slug}`} className="text-sm text-primary-700 hover:underline">Open</Link>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={completed.includes(l.id)} onChange={(e) => {
                            setCompleted(prev => e.target.checked ? Array.from(new Set([...prev, l.id])) : prev.filter(id => id !== l.id))
                          }} />
                          <span className="text-gray-600">Done</span>
                        </label>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="w-full md:w-80 shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Resources</h3>
            <ul className="text-sm list-disc pl-5 text-gray-700">
              <li className="mb-1"><Link to="/resources" className="text-primary-700 hover:underline">Download lesson notes</Link></li>
              <li className="mb-1"><Link to="/quiz" className="text-primary-700 hover:underline">Practice quizzes</Link></li>
              <li><Link to="/video" className="text-primary-700 hover:underline">Join a live session</Link></li>
            </ul>
            {!isPaidForCourse && (
              <div className="mt-4">
                {coursePrice > 0 && <p className="mb-2 text-sm text-gray-600">Price: <span className="font-semibold text-gray-900">USD ${coursePrice}</span></p>}
                <button onClick={() => setPayOpen(true)} className="w-full h-10 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold">Pay to Unlock</button>
              </div>
            )}
          </div>
        </aside>
      </div>
      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        amount={coursePrice || 1}
        currency="USD"
        description={`Unlock access to all lessons in ${courseTitle}`}
        onConfirm={async () => {
          try {
            const raw = localStorage.getItem('studentCoursePayments')
            const arr = raw ? JSON.parse(raw) : []
            if (!arr.includes(slug)) { arr.push(slug); localStorage.setItem('studentCoursePayments', JSON.stringify(arr)) }
            const trRaw = localStorage.getItem('studentTransactions')
            const tr = trRaw ? JSON.parse(trRaw) : []
            const txn = { id: Date.now(), type: 'Course', ref: slug, amount: coursePrice || 1, currency: 'USD', date: new Date().toISOString(), userId: user?.id }
            tr.unshift(txn)
            localStorage.setItem('studentTransactions', JSON.stringify(tr))
            // persist on backend
            try {
              await fetch('http://localhost:4000/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : undefined },
                body: JSON.stringify({ 
                  type: 'Course', 
                  ref: slug, 
                  amount: coursePrice || 1, 
                  currency: 'USD', 
                  userId: user?.id,
                  courseId: tutorMatch?.id,
                  tutorId: tutorMatch?.tutorId,
                  status: 'completed'
                })
              })
            } catch {}
            // Credit tutor earnings log
            try {
              const earningsRaw = localStorage.getItem('tutorEarningsLog')
              const earnings = earningsRaw ? JSON.parse(earningsRaw) : []
              const tutorName = tutorMatch?.tutorName || 'Tutor User'
              earnings.unshift({ id: `E-${txn.id}`, date: txn.date, tutor: tutorName, course: courseTitle, amount: txn.amount, source: 'Course' })
              localStorage.setItem('tutorEarningsLog', JSON.stringify(earnings))
            } catch {}
            setPayOpen(false)
            window.location.reload()
          } catch {}
        }}
      />
    </div>
  )
}

