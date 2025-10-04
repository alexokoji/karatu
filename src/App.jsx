import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContextSimple';
import { useState } from 'react';

export default function App() {
  const { role, isAuthenticated, isLoading, loginStudent, loginTutor, loginAdmin, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          <p className="text-xs text-gray-400 mt-2">Checking authentication...</p>
          <div className="mt-4 p-4 bg-gray-100 rounded text-xs text-gray-600 max-w-md mx-auto">
            <div className="font-semibold mb-2">Debug Info:</div>
            <div>Role: {role}</div>
            <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>User: {user ? user.name : 'None'}</div>
            <div className="mt-2 text-red-600">
              If this screen persists for more than 5 seconds, there's a bug.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const linkClass = (path) => {
    const base = "text-sm px-3 py-1 rounded-md transition-colors";
    const inactive = "text-gray-600 hover:text-primary-700 hover:bg-primary-50";
    const active = "text-primary-700 font-semibold bg-primary-50";
    return `${base} ${location.pathname === path ? active : inactive}`;
  };

  // Debug logging
  console.log('App render - role:', role, 'isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
  
  // Show debug info in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Auth Debug:', {
      role,
      isAuthenticated,
      isLoading,
      user: user ? { id: user.id, name: user.name } : null
    });
  }
  return (
    <div className={`min-h-screen flex flex-col ${role === 'tutor' ? '' : ''}`}>
      {role !== 'tutor' && (
      <header className="flex items-center justify-between border-b border-gray-200 px-10 py-3 sticky top-0 bg-white/80 backdrop-blur-lg z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span aria-hidden className="inline-flex h-5 w-7 overflow-hidden rounded-sm ring-1 ring-primary-700/20">
              {/* Nigeria flag: green-white-green */}
              <span className="h-full w-1/3 bg-primary-700" />
              <span className="h-full w-1/3 bg-white" />
              <span className="h-full w-1/3 bg-primary-700" />
            </span>
            <div className="text-primary-700 font-black text-xl tracking-tight">KARATU</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link to="/" className={linkClass('/')}>Home</Link>
          {role === 'guest' && (
            <>
              <Link to="/courses" className={linkClass('/courses')}>Courses</Link>
              <Link to="/tutors" className={linkClass('/tutors')}>Tutors</Link>
            </>
          )}
          {role === 'student' && (
            <>
              <Link to="/courses" className={linkClass('/courses')}>Courses</Link>
              <Link to="/tutors" className={linkClass('/tutors')}>Tutors</Link>
              <Link to="/quiz" className={linkClass('/quiz')}>Quiz</Link>
              <Link to="/video" className={linkClass('/video')}>Video</Link>
            </>
          )}
          {role === 'tutor' && (
            <Link to="/tutor" className={linkClass('/tutor')}>Tutor</Link>
          )}
        </nav>
        <div className="flex gap-2">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="h-10 px-4 inline-flex items-center rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold">Log In</Link>
              <Link to="/register" className="h-10 px-4 inline-flex items-center rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 text-sm font-bold">Register</Link>
            </>
          ) : role === 'student' ? (
            location.pathname === '/student' ? (
              <button onClick={() => { logout(); navigate('/'); }} className="h-10 px-4 rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 text-sm font-bold">Log Out</button>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/student" className="h-10 px-4 inline-flex items-center rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold">Dashboard</Link>
                <button onClick={() => { logout(); navigate('/'); }} className="h-10 px-4 rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 text-sm font-bold">Log Out</button>
              </div>
            )
          ) : (
            <button onClick={() => { logout(); navigate('/'); }} className="h-10 px-4 rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 text-sm font-bold">Log Out</button>
          )}
        </div>
      </header>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      {role !== 'tutor' && (
        <footer className="bg-gray-50 border-t border-gray-200 py-8 text-center text-gray-500">
          <div className="flex items-center justify-center gap-6 mb-2 text-sm">
            <Link to="/faq" className="hover:text-primary-700">FAQ</Link>
            <Link to="/terms" className="hover:text-primary-700">Terms & Privacy</Link>
            <Link to="/billing" className="hover:text-primary-700">Billing & Enrollment</Link>
          </div>
          © 2024 KARATU. All rights reserved.
        </footer>
      )}
      {/* Modal login removed in favor of dedicated pages */}
    </div>
  );
}
