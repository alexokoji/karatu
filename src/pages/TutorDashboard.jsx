import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaFileAlt } from 'react-icons/fa'
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
import TutorLayout from '../components/TutorLayout'

export default function TutorDashboard() {
  const { token } = useAuth()
  const [period, setPeriod] = useState(() => localStorage.getItem('tutorEarningsPeriod') || 'Monthly')
  const [quizImgError, setQuizImgError] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({ totalEarnings: 0, totalStudents: 0, totalCourses: 0 })

  useEffect(() => {
    localStorage.setItem('tutorEarningsPeriod', period)
  }, [period])

  // Load backend data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (token) {
          // Load transactions for earnings data
          const txnRes = await fetch(`${API_URL}/transactions`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (txnRes.ok) {
            const txnData = await txnRes.json()
            setTransactions(txnData)
            
            // Calculate stats
            const totalEarnings = txnData.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
            const totalStudents = new Set(txnData.map(t => t.userId)).size
            const totalCourses = new Set(txnData.filter(t => t.type === 'Course').map(t => t.courseId)).size
            setStats({ totalEarnings, totalStudents, totalCourses })
          }
        }
      } catch (error) {
        console.error('Failed to load tutor dashboard data:', error)
      }
    }
    loadData()
  }, [token])

  const earningsData = useMemo(() => {
    // Generate data from transactions
    const now = new Date()
    let labels, data
    
    if (period === 'Weekly') {
      labels = ['W1','W2','W3','W4']
      data = new Array(4).fill(0)
      transactions.forEach(t => {
        const week = Math.min(3, Math.floor((new Date(t.date).getDate() - 1) / 7))
        data[week] += Number(t.amount) || 0
      })
    } else {
      labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      data = new Array(12).fill(0)
      transactions.forEach(t => {
        const month = new Date(t.date).getMonth()
        data[month] += Number(t.amount) || 0
      })
    }
    
    // Fallback to static data if no transactions
    if (transactions.length === 0) {
      const monthly = { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul'], data: [600, 720, 800, 950, 1100, 980, 1250] }
      const weekly = { labels: ['W1','W2','W3','W4'], data: [180, 240, 220, 260] }
      const src = period === 'Weekly' ? weekly : monthly
      labels = src.labels
      data = src.data
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Earnings ($)',
          data,
          borderColor: '#15803d',
          backgroundColor: 'rgba(34,197,94,0.15)',
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    }
  }, [period, transactions])

  const earningsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: false },
      tooltip: { intersect: false, mode: 'index' },
    },
    interaction: { intersect: false, mode: 'nearest' },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' } },
    },
  }

  return (
    <TutorLayout title="Dashboard">
          <header className="mb-8">
            <h1 className="sr-only">Dashboard</h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-gray-900 text-2xl font-bold mb-4">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-gray-200 flex flex-col gap-4 transition-all hover:shadow-xl hover:-translate-y-1 hover:border-primary-100">
                    <div className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-br from-primary-50/60 via-transparent to-primary-100/60" />
                    <div className="flex-1">
                      <h3 className="text-gray-900 text-lg font-bold">Introduction Video</h3>
                      <p className="text-gray-500 text-sm mt-1">Record a short video to introduce yourself to potential students.</p>
                    </div>
                    <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg mb-4" style={{backgroundImage:'url(https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=1000)'}} />
                    <button className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">Record Video</button>
                  </div>
                  <div className="relative bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-gray-200 flex flex-col gap-4 transition-all hover:shadow-xl hover:-translate-y-1 hover:border-primary-100">
                    <div className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-br from-primary-50/60 via-transparent to-primary-100/60" />
                    <div className="flex-1">
                      <h3 className="text-gray-900 text-lg font-bold">Schedule</h3>
                      <p className="text-gray-500 text-sm mt-1">Manage your availability and upcoming sessions.</p>
                    </div>
                    <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg mb-4" style={{backgroundImage:'url(https://images.pexels.com/photos/3184643/pexels-photo-3184643.jpeg?auto=compress&cs=tinysrgb&w=1000)'}} />
                    <Link to="/tutor/schedule" className="w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">View Schedule</Link>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-gray-900 text-2xl font-bold mb-4">Create Quiz</h2>
                <div className="relative bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-gray-200 flex flex-col md:flex-row items-center gap-6 transition-all hover:shadow-xl hover:-translate-y-1 hover:border-primary-100">
                  <div className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-br from-primary-50/60 via-transparent to-primary-100/60" />
                  <div className="w-full md:w-1/3 rounded-lg overflow-hidden">
                    {!quizImgError ? (
                      <img
                        src="https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=1000"
                        alt="Quiz builder"
                        className="w-full h-full object-cover aspect-video md:aspect-square"
                        onError={() => setQuizImgError(true)}
                      />
                    ) : (
                      <div className="aspect-video md:aspect-square w-full h-full bg-primary-50 text-primary-700 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <FaFileAlt className="text-3xl" />
                          <span className="text-sm font-semibold">Quiz Builder</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 text-lg font-bold">Quiz Builder</h3>
                    <p className="text-gray-500 text-sm mt-1 mb-4">Create interactive quizzes to test your students' knowledge.</p>
                    <Link to="/quiz-builder" className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg py-2.5 px-6 bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">Create Quiz</Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="relative bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-gray-200 transition-all hover:shadow-xl hover:-translate-y-1 hover:border-primary-100">
                <div className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-br from-primary-50/60 via-transparent to-primary-100/60" />
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-gray-900 text-2xl font-bold">Earnings</h2>
                  <div className="flex gap-2">
                    {['Weekly','Monthly'].map(p => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${
                          period === p ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >{p}</button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 p-3 transition-all hover:shadow-md hover:border-primary-100 focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2">
                  <div className="relative w-full h-48 sm:h-56 md:h-64">
                    <Line data={earningsData} options={earningsOptions} />
                  </div>
                </div>
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-500 text-sm">This Month</p>
                    <p className="text-gray-900 font-bold text-lg">
                      ${stats.totalEarnings > 0 ? stats.totalEarnings.toFixed(2) : '1,250.00'}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary-400 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, (stats.totalEarnings / 2000) * 100)}%` }} 
                    />
                  </div>
                  <p className="text-gray-500 text-xs text-center">
                    {Math.min(100, Math.round((stats.totalEarnings / 2000) * 100))}% to your monthly goal
                  </p>
                </div>
                <Link to="/tutor/earnings" className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 bg-primary-600 text-white text-sm font-semibold transition-all hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-px active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2">View Earnings</Link>
              </div>
            </div>
          </div>
    </TutorLayout>
  )
}

