import { Link } from 'react-router-dom'

export default function Resources() {
  const items = [
    { name: 'Yoruba Lesson Notes', size: '2.3 MB' },
    { name: 'Igbo Practice Workbook', size: '1.1 MB' },
  ]
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <div className="mb-4"><Link to="/" className="text-primary-700 hover:underline">← Back Home</Link></div>
      <h1 className="text-3xl font-bold mb-6">Resources</h1>
      <div className="space-y-3">
        {items.map(i => (
          <div key={i.name} className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
            <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">📄</div>
            <div className="flex-1">
              <p className="font-semibold">{i.name}</p>
              <p className="text-sm text-gray-500">{i.size}</p>
            </div>
            <button className="h-9 px-3 rounded-md bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold">Download</button>
          </div>
        ))}
      </div>
    </div>
  )
}

