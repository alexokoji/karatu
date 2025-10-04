import { useEffect, useState } from 'react'
import { useAuth } from "../context/AuthContextSimple"
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaBars, FaAngleDoubleLeft, FaAngleDoubleRight, FaTachometerAlt, FaChalkboardTeacher, FaUsers, FaComments, FaSignOutAlt } from 'react-icons/fa'

export default function TutorLayout({ title = 'Dashboard', children }) {
  const { logout, user, role, isAuthenticated } = useAuth()
  
  // Debug logging
  console.log('🔍 TutorLayout auth state:', { user: user?.name, role, isAuthenticated })
  
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const profileName = user?.name || 'Tutor User'
  const initials = profileName.split(' ').map(p=>p[0]).slice(0,2).join('')
  const location = useLocation()

  const nav = [
    { key: 'Dashboard', icon: <FaTachometerAlt />, to: '/tutor' },
    { key: 'Courses', icon: <FaChalkboardTeacher />, to: '/tutor/courses' },
    { key: 'Private', icon: <FaUsers />, to: '/tutor/private' },
    { key: 'Schedule', icon: <FaUsers />, to: '/tutor/schedule' },
    { key: 'Earnings', icon: <FaComments />, to: '/tutor/earnings' },
    { key: 'Quiz Builder', icon: <FaComments />, to: '/quiz-builder' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-40 md:hidden" />}
      <div className="flex overflow-x-hidden">
        <aside className={`fixed z-50 top-0 left-0 h-screen bg-white overflow-hidden border-r border-gray-200 transform transition-all duration-200 ${sidebarOpen ? 'translate-x-0 w-64 p-4' : '-translate-x-full w-0 p-0'} md:translate-x-0 ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'} md:p-6 md:fixed flex flex-col`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} mb-6`}>
            <div className="flex items-center gap-3">
              {sidebarCollapsed ? (
                <div className="size-10 md:size-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">{initials}</div>
              ) : (
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 md:size-12" style={{backgroundImage:'url(https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop)'}} />
              )}
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-gray-900 text-base font-bold">{profileName}</h1>
                  <p className="text-gray-500 text-sm">Tutor</p>
                </div>
              )}
            </div>
            <button onClick={() => setSidebarCollapsed(v=>!v)} className="hidden md:inline-flex items-center justify-center rounded-md h-8 w-8 border border-gray-200 text-gray-700 hover:bg-gray-50" aria-label="Collapse sidebar">
              {sidebarCollapsed ? <FaAngleDoubleRight /> : <FaAngleDoubleLeft />}
            </button>
          </div>
          <nav className="flex flex-col gap-2">
            {nav.map(item => {
              const active = location.pathname === item.to
              return (
                <Link key={item.key} to={item.to} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${active ? 'bg-primary-50 text-primary-800 border-primary-100 shadow-sm' : 'text-gray-700 border-transparent hover:bg-gray-100 hover:-translate-y-0.5'}`}>
                  <span className={active ? 'text-primary-700' : ''}>{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.key}</span>}
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto">
            <button onClick={()=> { logout(); navigate('/') }} className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg"><FaSignOutAlt className="text-gray-500" /><span className="text-sm font-medium">Logout</span></button>
          </div>
        </aside>

        <main className={`flex-1 transition-all transform ${sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'} ${sidebarOpen ? 'translate-x-64' : 'translate-x-0'} md:translate-x-0`}>
          <div className="sticky top-0 z-20 md:hidden bg-gray-50/80 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <button onClick={() => setSidebarOpen(v => !v)} className="inline-flex items-center gap-2 rounded-md px-3 py-2 border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"><FaBars /><span className="text-sm font-semibold">Menu</span></button>
            <span className="text-sm font-bold text-primary-700">{title}</span>
          </div>
          <div className="p-8">
            <header className="mb-6">
              <h1 className="text-gray-900 text-3xl font-bold leading-tight">{title}</h1>
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

