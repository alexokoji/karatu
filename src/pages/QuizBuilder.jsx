import { useEffect, useState } from 'react'
import TutorLayout from '../components/TutorLayout'

export default function QuizBuilder() {
  const [meta, setMeta] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tutorQuizDraftMeta')) || { title: '', language: 'Yoruba', difficulty: 'Beginner' } } catch { return { title: '', language: 'Yoruba', difficulty: 'Beginner' } }
  })
  const [questions, setQuestions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tutorQuizDraftQuestions')) || [] } catch { return [] }
  })
  const addQuestion = () => setQuestions(prev => [...prev, { id: Date.now(), prompt: '', options: ['', '', '', ''], answer: 0 }])
  const updateQuestion = (idx, updater) => setQuestions(prev => prev.map((q,i)=> i===idx ? updater(q) : q))
  useEffect(() => { try { localStorage.setItem('tutorQuizDraftMeta', JSON.stringify(meta)) } catch {} }, [meta])
  useEffect(() => { try { localStorage.setItem('tutorQuizDraftQuestions', JSON.stringify(questions)) } catch {} }, [questions])

  return (
    <TutorLayout title="Quiz Builder">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Questions</h2>
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="rounded-lg border border-gray-200 p-4">
                <input value={q.prompt} onChange={e=>updateQuestion(idx, old=>({ ...old, prompt: e.target.value }))} className="w-full rounded-lg border border-gray-200 p-3 mb-3" placeholder={`Question ${idx+1}`} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="radio" name={`ans-${q.id}`} checked={q.answer===i} onChange={()=>updateQuestion(idx, old=>({ ...old, answer: i }))} />
                      <input value={opt} onChange={e=>updateQuestion(idx, old=>({ ...old, options: old.options.map((o,oi)=> oi===i ? e.target.value : o) }))} className="flex-1 rounded-lg border border-gray-200 p-2" placeholder={`Option ${i+1}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={addQuestion} className="h-11 px-5 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold">Add Question</button>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Quiz Settings</h2>
          <div className="space-y-3">
            <input value={meta.title} onChange={e=>setMeta(m=>({...m, title:e.target.value}))} className="w-full rounded-lg border border-gray-200 p-3" placeholder="Quiz title" />
            <select value={meta.language} onChange={e=>setMeta(m=>({...m, language:e.target.value}))} className="w-full rounded-lg border border-gray-200 p-3">
              {['Yoruba','Igbo','Hausa','Swahili'].map(l=> <option key={l}>{l}</option>)}
            </select>
            <select value={meta.difficulty} onChange={e=>setMeta(m=>({...m, difficulty:e.target.value}))} className="w-full rounded-lg border border-gray-200 p-3">
              {['Beginner','Intermediate','Advanced'].map(d=> <option key={d}>{d}</option>)}
            </select>
            <button onClick={()=> { localStorage.setItem('tutorQuizDraftMeta', JSON.stringify(meta)); localStorage.setItem('tutorQuizDraftQuestions', JSON.stringify(questions)); }} className="h-11 px-5 rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 text-sm font-bold">Save Draft</button>
            <button onClick={()=> { localStorage.removeItem('tutorQuizDraftMeta'); localStorage.removeItem('tutorQuizDraftQuestions'); setMeta({ title: '', language: 'Yoruba', difficulty: 'Beginner' }); setQuestions([]) }} className="h-11 px-5 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold w-full">Publish</button>
          </div>
        </div>
      </div>
    </TutorLayout>
  )
}

