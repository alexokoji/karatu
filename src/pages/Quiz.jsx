import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { API_URL } from '../config'

export default function Quiz() {
  const [quizzes, setQuizzes] = useState([])
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/quizzes`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) setQuizzes(data)
        }
      } catch {}
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Quizzes</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {quizzes.length === 0 ? (
          <p className="text-sm text-gray-500 col-span-full text-center">No quizzes available.</p>
        ) : quizzes.map(q => (
          <div key={q.id || q.title} className="flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 hover:border-primary-100 hover:bg-primary-50/20">
            <div className="w-full h-40 bg-center bg-cover" style={{backgroundImage:`url(${q.img || 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1000'})`}} />
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-lg font-bold">{q.title}</h3>
              <p className="text-sm text-gray-600 mt-1 flex-grow">{q.desc || q.description || 'Practice and test your knowledge.'}</p>
              <div className="flex items-center gap-2 mt-4">
                <Link to={`/quiz/${(q.id || q.title).toString().toLowerCase().split(' ')[0]}`} className="h-10 px-4 inline-flex items-center rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold hover-pulse">Start Quiz</Link>
                <Link to="/resources" className="h-10 px-4 inline-flex items-center rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 text-sm font-bold hover-lift">Review Notes</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
