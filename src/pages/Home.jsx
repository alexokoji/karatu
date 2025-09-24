import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { API_URL } from '../config'

export default function Home() {
  const [courses, setCourses] = useState([])
  const [tutors, setTutors] = useState([])
  useEffect(() => {
    const load = async () => {
      try { const r = await fetch(`${API_URL}/courses`); if (r.ok) { const d = await r.json(); if (Array.isArray(d)) setCourses(d) } } catch {}
      try { const r = await fetch(`${API_URL}/tutors`); if (r.ok) { const d = await r.json(); if (Array.isArray(d)) setTutors(d) } } catch {}
    }
    load()
  }, [])
  return (
    <div className="px-4 md:px-10 lg:px-20">
      <section className="min-h-[60vh] flex items-center justify-center text-center rounded-2xl bg-cover bg-center bg-no-repeat p-6 my-6 relative overflow-hidden" style={{backgroundImage: `linear-gradient(rgba(240,253,244,0.95), rgba(240,253,244,0.92)), url(https://images.pexels.com/photos/3184630/pexels-photo-3184630.jpeg?auto=compress&cs=tinysrgb&w=2070)`}}>
        {/* subtle green pattern accents */}
        <div className="pointer-events-none absolute -top-10 -left-10 size-[240px] rounded-full bg-primary-100 blur-3xl opacity-70" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-[260px] rounded-full bg-primary-200 blur-3xl opacity-60" />
        <div className="max-w-4xl space-y-6">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">Learning African Languages</h1>
          <p className="text-lg md:text-xl text-gray-600">Discover the beauty of African languages with tailor-made online lessons. Learn at your pace with dedicated tutors who adapt to your goals and immerse you in the unique cultures of Africa.</p>
          <div className="flex justify-center gap-4">
            <Link to="/courses" className="h-12 px-6 inline-flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold">Get Started</Link>
            <Link to="/courses" className="h-12 px-6 inline-flex items-center justify-center rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 font-bold">Explore Courses</Link>
          </div>
        </div>
      </section>
      <section className="py-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center pb-8">Top Courses</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-gray-500 text-center">No courses available.</p>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.slice(0,6).map(c => (
            <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-lg transition-all">
              <div className="w-full h-40 bg-center bg-cover rounded-lg mb-3" style={{backgroundImage:`url(${c.thumb || 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=800'})`}} />
              <h3 className="font-bold">{c.title}</h3>
              <p className="text-sm text-gray-600">{c.language}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-primary-700">${c.price?.toFixed ? c.price.toFixed(2) : Number(c.price||0).toFixed(2)}</span>
                <Link to={`/courses/${(c.slug || c.title?.toLowerCase().split(' ').join('-'))}`} className="text-sm text-primary-700 hover:underline">View</Link>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>

      <section className="py-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center pb-8">Featured Tutors</h2>
        {tutors.length === 0 ? (
          <p className="text-sm text-gray-500 text-center">No tutors available.</p>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutors.slice(0,6).map(t => (
            <div key={t.id} className="flex flex-col items-center gap-4 text-center rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all">
              <div className="w-24 h-24 rounded-full bg-center bg-cover" style={{backgroundImage:`url(${t.img || 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'})`}} />
              <div>
                <p className="text-lg font-bold">{t.name}</p>
                <p className="text-sm text-primary-700">{t.role || 'Tutor'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/courses" className="h-9 px-3 inline-flex items-center rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold">View Courses</Link>
                <Link to={`/tutors/${t.slug}`} className="h-9 px-3 inline-flex items-center rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 text-xs font-bold">View Profile</Link>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>

      <section className="bg-primary-50 rounded-2xl my-10">
        <div className="flex flex-col items-center justify-center gap-6 px-4 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold max-w-2xl">Ready to Start Your Language Journey?</h2>
          <p className="text-gray-600 max-w-2xl">Join thousands of learners and start speaking a new language today. Sign up for a free trial and explore everything we have to offer.</p>
          <button className="h-12 px-6 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold">Sign Up Now For Free</button>
        </div>
      </section>
    </div>
  );
}
