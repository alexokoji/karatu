export default function FAQ() {
  const faqs = [
    { q: 'How do I enroll in a course?', a: 'Browse Courses, open a course, then click Enroll.' },
    { q: 'Do you offer live sessions?', a: 'Yes. Use the Video page to join scheduled sessions.' },
    { q: 'Which languages are available?', a: 'Yoruba, Igbo, Hausa and more are being added.' },
  ]
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
      <div className="max-w-3xl divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
        {faqs.map((f, i) => (
          <details key={i} className="p-5 group">
            <summary className="cursor-pointer list-none font-semibold text-gray-900 flex items-center justify-between">
              {f.q}
              <span className="ml-4 text-gray-400 group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <p className="mt-2 text-gray-600">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}

