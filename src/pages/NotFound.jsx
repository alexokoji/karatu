import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="px-4 md:px-10 lg:px-20 py-20 text-center">
      <h1 className="text-5xl font-black mb-4">404</h1>
      <p className="text-gray-600 mb-6">The page you’re looking for could not be found.</p>
      <Link to="/" className="inline-flex h-11 px-6 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold">Go Home</Link>
    </div>
  )
}

