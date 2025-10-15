import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from "../context/AuthContextSimple"

// Removed static COURSE_CONTENT fallback; rely on tutor-created courses only

export default function CourseDetails() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { role, isAuthenticated } = useAuth()
  const tutorCourses = (() => { try { return JSON.parse(localStorage.getItem('tutorCourses')) || [] } catch { return [] } })()
  const tutorMatch = tutorCourses.find(c => c.slug === slug && c.published)
  const course = tutorMatch ? {
    title: tutorMatch.title,
    img: tutorMatch.thumb || 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=1200',
    lessons: (tutorMatch.syllabus?.length || 12),
    level: 'Beginner',
    price: Number(tutorMatch.price) || 0,
    summary: tutorMatch.description || 'Learn with a dedicated tutor at your pace.',
    syllabus: tutorMatch.syllabus || [],
    tutorName: tutorMatch.tutorName || 'Tutor User',
  } : null

  const previewLessons = (course.syllabus || []).slice(0, 3)
  const isEnrolled = (() => { try { const raw = localStorage.getItem('studentEnrollments'); const arr = raw ? JSON.parse(raw) : []; return arr.includes(slug) } catch { return false } })()

  const handleStartCourse = () => {
    try {
      const raw = localStorage.getItem('studentEnrollments')
      const arr = raw ? JSON.parse(raw) : []
      if (!arr.includes(slug)) arr.push(slug)
      localStorage.setItem('studentEnrollments', JSON.stringify(arr))
    } catch {}
    navigate(`/student/courses/${slug}`)
  }

  const handleUnenroll = () => {
    try {
      const raw = localStorage.getItem('studentEnrollments')
      const arr = raw ? JSON.parse(raw) : []
      const next = arr.filter(s => s !== slug)
      localStorage.setItem('studentEnrollments', JSON.stringify(next))
    } catch {}
    navigate('/student')
  }

  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <div className="mb-4"><Link to="/courses" className="text-primary-700 hover:underline">← Back to Courses</Link></div>
      {!course ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-2">Course not found</h1>
          <p className="text-gray-600">This course is unavailable or has not been published.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <img src={course.img} alt={course.title} className="w-full h-72 object-cover" />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-gray-600">{course.summary}</p>
          {course.tutorName && <p className="text-sm text-gray-500">By {course.tutorName}</p>}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span>{course.lessons} Lessons</span>
            <span>{course.level}</span>
          </div>
          <div className="text-3xl font-black text-primary-700">${course.price}</div>
          <div className="flex gap-3 mt-2">
            {isAuthenticated && role === 'student' ? (
              isEnrolled ? (
                <>
                  <Link to={`/student/courses/${slug}`} className="h-11 px-6 inline-flex items-center justify-center rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold">Continue Course</Link>
                  <button onClick={handleUnenroll} className="h-11 px-6 rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 text-sm font-bold">Unenroll</button>
                </>
              ) : (
                <button onClick={handleStartCourse} className="h-11 px-6 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold">Start Course</button>
              )
            ) : (
              <Link to="/student" className="h-11 px-6 inline-flex items-center justify-center rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold">Enroll Now</Link>
            )}
            <Link to="/video" className="h-11 px-6 inline-flex items-center justify-center rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 text-sm font-bold">Try Live Session</Link>
          </div>
        </div>
      </div>
      {course && previewLessons.length > 0 && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Preview Lessons</h2>
          <ol className="list-decimal pl-6 space-y-1 text-gray-800">
            {previewLessons.map((item, idx) => (
              <li key={idx}>{item.title}</li>
            ))}
          </ol>
        </div>
      )}
      {course && course.syllabus && course.syllabus.length > 0 && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Syllabus</h2>
          <ol className="list-decimal pl-6 space-y-1 text-gray-800">
            {course.syllabus.map(item => (
              <li key={item.order} className="">{item.title}</li>
            ))}
          </ol>
        </div>
      )}
      )}
    </div>
  )
}

