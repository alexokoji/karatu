import { FaPlus, FaChevronRight, FaRegClock } from 'react-icons/fa'
import PaymentModal from '../components/PaymentModal'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function StudentDashboard() {
  const { token, user } = useAuth()
  const [lastViewed, setLastViewed] = useState(() => localStorage.getItem('studentLastCourse') || '')
  const [period, setPeriod] = useState('Weekly')
  const [courses, setCourses] = useState([])
  const [transactions, setTransactions] = useState([])
  const [privateSessions, setPrivateSessions] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [stats, setStats] = useState({ totalStudyTime: 0, weeklyChange: 0 })
  
  useEffect(() => { if (lastViewed) localStorage.setItem('studentLastCourse', lastViewed) }, [lastViewed])

  // Load backend data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load courses
        const coursesRes = await fetch(`${API_URL}/courses`)
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json()
          setCourses(coursesData)
        }
        
        // Load transactions for progress data
        if (token) {
          const txnRes = await fetch(`${API_URL}/transactions`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (txnRes.ok) {
            const txnData = await txnRes.json()
            setTransactions(txnData)
          }
          
          // Load private sessions
          const sessionsRes = await fetch(`${API_URL}/private-sessions`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (sessionsRes.ok) {
            const sessionsData = await sessionsRes.json()
            setPrivateSessions(sessionsData)
          }
          
          // Load quizzes (mock data for now - would come from backend)
          setQuizzes([
            { id: 1, title: 'Yoruba Quiz 1', due: 'Due: July 20, 2024', course: 'Yoruba for Beginners' },
            { id: 2, title: 'Igbo Quiz 2', due: 'Due: July 25, 2024', course: 'Igbo Intermediate' },
          ])
          
          // Calculate stats from transactions
          const totalStudyTime = txnData.reduce((sum, t) => sum + (t.type === 'Course' ? 45 : 0), 0) // 45 mins per course
          const weeklyChange = Math.floor(Math.random() * 20) + 5 // Simulate 5-25% change
          setStats({ totalStudyTime, weeklyChange })
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      }
    }
    loadData()
  }, [token])

  // Get enrolled courses from transactions
  const enrolledCourses = useMemo(() => {
    const courseTransactions = transactions.filter(t => t.type === 'Course' && t.status === 'completed')
    return courseTransactions.map(t => {
      const course = courses.find(c => c.id === t.courseId)
      if (!course) return null
      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        totalLessons: course.lessonsData?.length || 10,
        img: course.thumb || 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=800',
        tutorName: course.tutorName || 'Unknown Tutor'
      }
    }).filter(Boolean)
  }, [transactions, courses])

  // Fallback to static data if no backend data
  const staticEnrolled = [
    { title: 'Yoruba for Beginners', totalLessons: 10, img: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: 'Igbo Intermediate', totalLessons: 12, img: 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { title: 'Hausa Advanced', totalLessons: 8, img: 'https://images.pexels.com/photos/3184643/pexels-photo-3184643.jpeg?auto=compress&cs=tinysrgb&w=800' },
  ]
  const allEnrolled = enrolledCourses.length > 0 ? enrolledCourses : staticEnrolled
  const fallbackByCourse = {
    'Yoruba for Beginners': 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Igbo Intermediate': 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
    'Hausa Advanced': 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=800',
  };

  const progressData = useMemo(() => {
    // Generate study time data from transactions
    const now = new Date()
    let labels, data
    
    if (period === 'Weekly') {
      labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
      data = new Array(7).fill(0)
      // Simulate study time based on course completions
      transactions.forEach(t => {
        if (t.type === 'Course') {
          const day = new Date(t.date).getDay()
          data[day] += Math.random() * 60 + 30 // 30-90 minutes per course
        }
      })
    } else {
      labels = ['W1','W2','W3','W4']
      data = new Array(4).fill(0)
      transactions.forEach(t => {
        if (t.type === 'Course') {
          const week = Math.min(3, Math.floor((new Date(t.date).getDate() - 1) / 7))
          data[week] += Math.random() * 120 + 60 // 60-180 minutes per week
        }
      })
    }
    
    // Fallback to static data if no transactions
    if (transactions.length === 0) {
      const weekly = { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], data: [60, 40, 50, 70, 30, 20, 55] }
      const monthly = { labels: ['W1','W2','W3','W4'], data: [180, 220, 200, 240] }
      const src = period === 'Monthly' ? monthly : weekly
      labels = src.labels
      data = src.data
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Study time (mins)',
          data,
          borderColor: '#15803d',
          backgroundColor: 'rgba(34,197,94,0.15)',
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    }
  }, [period, transactions])

  const progressOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'top' }, title: { display: false } },
    interaction: { intersect: false, mode: 'nearest' },
    scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } },
  }
  return (
    <main className="flex-1 px-4 py-8 sm:px-6 md:px-10 lg:px-20 xl:px-40 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">My Dashboard</h1>
            <p className="mt-2 text-base text-gray-500">Welcome back! Let's continue your language journey.</p>
          </div>
          <Link to="/courses" className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-px active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2">
            <FaPlus />
            <span>Explore New Courses</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="col-span-1 lg:col-span-2">
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Enrolled Courses</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {allEnrolled.map((c) => (
                  <button onClick={() => setLastViewed(c.title)} key={c.title} className={`text-left group relative flex flex-col overflow-hidden rounded-xl border bg-white/70 backdrop-blur-sm shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-primary-200 active:translate-y-px active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 ${lastViewed === c.title ? 'border-primary-300 ring-2 ring-primary-200' : 'border-gray-200'}`}>
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary-50/60 via-transparent to-primary-100/60" />
                    <img
                      src={c.img}
                      alt={c.title}
                      className="h-40 w-full object-cover"
                      onError={(e) => { e.currentTarget.src = fallbackByCourse[c.title] || 'https://images.unsplash.com/photo-1515165562835-c3b8c1eaab2a?auto=format&fit=crop&w=800&q=80'; }}
                    />
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-bold text-gray-800">{c.title}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Completed: {(() => {
                          const slug = c.title.toLowerCase().split(' ').join('-')
                          try {
                            const raw = localStorage.getItem(`studentCourseProgress:${slug}`)
                            const done = raw ? JSON.parse(raw).length : 0
                            return Math.round(((done / (c.totalLessons || 1)) * 100) * 10) / 10
                          } catch { return 0 }
                        })()}%</p>
                        {lastViewed === c.title && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">Last viewed</span>
                        )}
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-primary-500" style={{ width: `${(() => {
                          const slug = c.title.toLowerCase().split(' ').join('-')
                          try {
                            const raw = localStorage.getItem(`studentCourseProgress:${slug}`)
                            const done = raw ? JSON.parse(raw).length : 0
                            return Math.min(100, Math.round((done / (c.totalLessons || 1)) * 100))
                          } catch { return 0 }
                        })()}%` }} />
                      </div>
                      <div className="mt-4">
                        <Link to={`/student/courses/${c.slug || c.title.toLowerCase().split(' ').join('-')}`} className="inline-flex items-center h-10 px-4 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold">Open</Link>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Progress Overview</h2>
              <div className="group relative rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-xl hover:border-primary-100 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2">
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary-50/60 via-transparent to-primary-100/60" />
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">Weekly Activity</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {stats.totalStudyTime > 0 ? `${Math.floor(stats.totalStudyTime / 60)}h ${stats.totalStudyTime % 60}m` : '8h 32m'}
                    </p>
                    <p className="text-sm font-medium text-primary-600">
                      +{stats.weeklyChange}% from last week
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {['Weekly','Monthly'].map(p => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold border ${
                          period === p ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >{p}</button>
                    ))}
                  </div>
                </div>
                <div className="mt-6 rounded-lg">
                  <div className="relative w-full h-48 sm:h-56 md:h-64">
                    <Line data={progressData} options={progressOptions} />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="col-span-1">
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">My Private Sessions</h2>
              {privateSessions.length > 0 ? (
                <div className="space-y-4">
                  {privateSessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="group relative rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm p-4 shadow-sm transition-all hover:shadow-xl hover:border-primary-100 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2">
                      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary-50/60 via-transparent to-primary-100/60" />
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-cover bg-center" style={{ backgroundImage: 'url(https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400)' }} />
                        <div className="flex-grow">
                          <h3 className="font-bold text-gray-800">{session.tutorName || 'Tutor'}</h3>
                          <p className="text-sm text-gray-500">{session.plan?.name || 'Monthly Plan'}</p>
                          <p className="mt-1 text-sm font-semibold text-primary-700 flex items-center gap-2">
                            <FaRegClock /> {session.status === 'accepted' ? 'Active' : session.status}
                          </p>
                          {session.status === 'accepted' && !session.paid && (
                            <PrivatePay sessionId={session.id} amount={session.plan?.price || 50} />
                          )}
                        </div>
                      </div>
                      {session.status === 'accepted' && session.paid && (
                        <Link to={`/video/${session.id}`} className="mt-4 w-full inline-flex items-center justify-center rounded-lg bg-primary-600 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-px active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2">Join Session</Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="group relative rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm p-4 shadow-sm transition-all hover:shadow-xl hover:border-primary-100 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2">
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary-50/60 via-transparent to-primary-100/60" />
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-cover bg-center" style={{ backgroundImage: 'url(https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400)' }} />
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-800">No Active Sessions</h3>
                      <p className="text-sm text-gray-500">Find a tutor to start learning</p>
                    </div>
                  </div>
                  <Link to="/tutors" className="mt-4 w-full inline-flex items-center justify-center rounded-lg bg-primary-600 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-px active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2">Find Tutors</Link>
                </div>
              )}
            </section>
            <Link to="/student/transactions" className="mb-8 inline-flex items-center h-10 px-4 rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 text-sm font-bold">View Transactions</Link>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Upcoming Quizzes</h2>
              <div className="space-y-4">
                {quizzes.map((q) => (
                  <div key={q.title} className="group relative flex items-center gap-4 rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm p-4 shadow-sm transition-all hover:shadow-xl hover:border-primary-100 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2">
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary-50/60 via-transparent to-primary-100/60" />
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                      <span className="text-lg font-bold">Q</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{q.title}</p>
                      <p className="text-sm text-gray-500">{q.due}</p>
                    </div>
                    <Link to={`/quiz/${q.title.toLowerCase().split(' ').join('-')}`} className="ml-auto text-gray-400 transition-colors group-hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 active:translate-y-px"><FaChevronRight /></Link>
                  </div>
                ))}
              </div>
            </section>

            {/* Private sessions removed from student side for monthly subscriptions */}
          </div>
        </div>
    </div>
    </main>
  )
}

function PrivatePay({ sessionId, amount }) {
  const [open, setOpen] = useState(false)
  const { token } = useAuth()
  
  const handlePayment = async () => {
    try {
      // Mark session as paid
      const res = await fetch(`http://localhost:4000/private-sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paid: true })
      })
      
      if (res.ok) {
        // Create transaction
        await fetch('http://localhost:4000/transactions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            type: 'Private Session',
            amount: amount,
            currency: 'USD',
            status: 'completed',
            description: 'Private session payment'
          })
        })
        
        setOpen(false)
        window.location.reload()
      }
    } catch (error) {
      console.error('Payment failed:', error)
    }
  }
  
  return (
    <div className="mt-3 flex items-center justify-between">
      <p className="text-sm text-gray-600">Payment required to confirm this session.</p>
      <>
        <button onClick={() => setOpen(true)} className="h-9 px-3 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-sm">Pay Now</button>
        <PaymentModal
          open={open}
          onClose={() => setOpen(false)}
          amount={amount}
          currency="USD"
          description="Confirm private session payment"
          onConfirm={handlePayment}
        />
      </>
    </div>
  )
}
