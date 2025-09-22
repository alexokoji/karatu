export default function Community() {
  const threads = [
    { title: 'Share Yoruba tongue-twisters!', replies: 12 },
    { title: 'Best tips for Igbo tones', replies: 7 },
  ]
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <h1 className="text-3xl font-bold mb-6">Community</h1>
      <div className="space-y-3 max-w-2xl">
        {threads.map(t => (
          <div key={t.title} className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
            <p className="font-semibold">{t.title}</p>
            <p className="text-sm text-gray-500">{t.replies} replies</p>
          </div>
        ))}
      </div>
    </div>
  )
}

