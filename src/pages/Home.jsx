import { Link } from 'react-router-dom'

export default function Home() {
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
        <h2 className="text-3xl md:text-4xl font-bold text-center pb-8">Why Learn with KARATU</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { n:1, title:'Expert Nigerian Tutors', desc:'Learn from experienced tutors who understand language and culture.'},
            { n:2, title:'Flexible Lessons', desc:'Self‑paced modules and 1‑on‑1 sessions that fit your schedule.'},
            { n:3, title:'Culture‑First Approach', desc:'Immerse yourself in proverbs, songs, food, fashion and customs.'},
            { n:4, title:'Modern Platform', desc:'Interactive exercises, progress tracking and seamless video calls.'},
          ].map((f)=> (
            <div key={f.n} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-black">{f.n}</div>
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 md:py-16 bg-white rounded-2xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center pb-8">Culture Showcase</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {img:'https://images.pexels.com/photos/3109168/pexels-photo-3109168.jpeg?auto=compress&cs=tinysrgb&w=2070', text:'Engaging classroom conversations led by Nigerian teachers.'},
            {img:'https://images.pexels.com/photos/935943/pexels-photo-935943.jpeg?auto=compress&cs=tinysrgb&w=2069', text:'Learning through music, storytelling and proverbs.'},
            {img:'https://images.pexels.com/photos/3184332/pexels-photo-3184332.jpeg?auto=compress&cs=tinysrgb&w=2080', text:'Community, collaboration and joyful learning.'},
          ].map((c,i)=> (
            <div key={i} className="rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="w-full h-64 bg-center bg-cover" style={{backgroundImage:`url(${c.img})`}}/>
              <div className="p-4"><p className="text-gray-800 text-sm">{c.text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center pb-8">What Learners Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {name:'Adaeze O.', role:'Igbo Beginner', img:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop', quote:'KARATU made Igbo feel natural. My tutor blended culture with grammar beautifully.'},
            {name:'Tunde A.', role:'Yorùbá Intermediate', img:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', quote:'I loved the proverbs and songs. The sessions felt like home.'},
            {name:'Safiya S.', role:'Swahili Learner', img:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop', quote:'The platform is smooth and the tutors are patient and inspiring.'},
          ].map((t,i)=> (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-center bg-cover" style={{backgroundImage:`url(${t.img})`}}/>
                <div>
                  <p className="font-bold">{t.name}</p>
                  <p className="text-gray-500 text-sm">{t.role}</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm mt-4">{t.quote}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10 bg-white rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-2 md:p-6 text-center">
          <div><p className="text-4xl font-black text-primary-700">15k+</p><p className="text-gray-600 text-sm">Active learners</p></div>
          <div><p className="text-4xl font-black text-primary-700">300+</p><p className="text-gray-600 text-sm">Certified tutors</p></div>
          <div><p className="text-4xl font-black text-primary-700">25</p><p className="text-gray-600 text-sm">African languages</p></div>
          <div><p className="text-4xl font-black text-primary-700">4.9★</p><p className="text-gray-600 text-sm">Average rating</p></div>
        </div>
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
