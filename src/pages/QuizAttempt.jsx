import { Link, useParams } from 'react-router-dom'

export default function QuizAttempt() {
  const { id } = useParams()
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <div className="mb-4"><Link to="/quiz" className="text-primary-700 hover:underline">← Back to Quizzes</Link></div>
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Quiz: {id || 'Sample'}</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-gray-600">This is a placeholder for the quiz attempt UI.</p>
      </div>
    </div>
  )
}

