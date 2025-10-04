import { useEffect, useMemo, useState } from 'react'
import TutorLayout from '../components/TutorLayout'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { useAuth } from "../context/AuthContextSimple"
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function TutorEarnings() {
  const { token } = useAuth()
  const [period, setPeriod] = useState('Monthly')
  const [requestOpen, setRequestOpen] = useState(false)
  const [requestAmount, setRequestAmount] = useState('')
  const [txn, setTxn] = useState([])
  useEffect(() => {
    const load = async () => {
      try { const res = await fetch('http://localhost:4000/transactions', { headers: { Authorization: token?`Bearer ${token}`:undefined } }); if (res.ok) { const data = await res.json(); if (Array.isArray(data)) setTxn(data.filter(t=> t.source==='Course' || t.type==='Course')) } } catch {}
    }
    if (token) load()
  }, [token])
  const chart = useMemo(() => {
    // derive simple sums per bucket
    const now = new Date()
    if (period === 'Weekly') {
      const labels = ['W1','W2','W3','W4']
      const data = [0,0,0,0]
      txn.forEach(t => { const d = new Date(t.date); const week = Math.min(3, Math.floor((d.getDate()-1)/7)); data[week] += Number(t.amount)||0 })
      return { data: { labels, datasets: [{ label: 'Earnings ($)', data, borderColor: '#15803d', backgroundColor: 'rgba(34,197,94,0.15)', tension: 0.35 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } } }
    }
    const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const data = new Array(12).fill(0)
    txn.forEach(t => { const d = new Date(t.date); data[d.getMonth()] += Number(t.amount)||0 })
    return { data: { labels, datasets: [{ label: 'Earnings ($)', data, borderColor: '#15803d', backgroundColor: 'rgba(34,197,94,0.15)', tension: 0.35 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } } }
  }, [period])

  const [payouts, setPayouts] = useState(() => {
    try {
      const raw = localStorage.getItem('tutorPayouts')
      return raw ? JSON.parse(raw) : [
        { id: 'P-2312', date: '2024-06-30', amount: 420, status: 'Pending' },
        { id: 'P-2305', date: '2024-05-31', amount: 980, status: 'Paid' },
        { id: 'P-2304', date: '2024-04-30', amount: 950, status: 'Paid' },
      ]
    } catch { return [] }
  })
  useEffect(() => { try { localStorage.setItem('tutorPayouts', JSON.stringify(payouts)) } catch {} }, [payouts])

  const earningsLog = (() => { try { return JSON.parse(localStorage.getItem('tutorEarningsLog')) || [] } catch { return [] } })()

  return (
    <TutorLayout title="Earnings">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Earnings Overview</h2>
            <div className="flex gap-2">
              {['Weekly','Monthly'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${period === p ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="relative h-64">
            <Line data={chart.data} options={chart.options} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500">This Month</p>
              <p className="text-lg font-bold">${txn.filter(t=> new Date(t.date).getMonth()===new Date().getMonth()).reduce((a,b)=> a + (Number(b.amount)||0), 0)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-bold">$420</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-bold">${txn.reduce((a,b)=> a + (Number(b.amount)||0), 0)}</p>
            </div>
          </div>
          <button onClick={()=> setRequestOpen(true)} className="mt-4 w-full h-10 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold">Request Payout</button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Payouts</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {payouts.map((p, idx) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="py-2 pr-4 font-medium">{p.id}</td>
                  <td className="py-2 pr-4">{p.date}</td>
                  <td className="py-2 pr-4">${p.amount}</td>
                  <td className="py-2 pr-4">
                    <select
                      value={p.status}
                      onChange={(e)=> setPayouts(prev => prev.map((row,i)=> i===idx ? { ...row, status: e.target.value } : row))}
                      className="rounded-md border border-gray-200 p-1 text-xs"
                    >
                      <option>Pending</option>
                      <option>Paid</option>
                      <option>Failed</option>
                    </select>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      <button className="h-8 px-3 rounded-md border border-gray-200 hover:bg-gray-50">View</button>
                      <button onClick={()=> setPayouts(prev=> prev.filter((_,i)=> i!==idx))} className="h-8 px-3 rounded-md border border-gray-200 hover:bg-gray-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Earnings Log</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Course</th>
                <th className="py-2 pr-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {earningsLog.map((e, i) => (
                <tr key={e.id || i} className="border-t border-gray-100">
                  <td className="py-2 pr-4">{new Date(e.date).toLocaleString()}</td>
                  <td className="py-2 pr-4">{e.source}</td>
                  <td className="py-2 pr-4">{e.course || '-'}</td>
                  <td className="py-2 pr-4">${e.amount}</td>
                </tr>
              ))}
              {earningsLog.length === 0 && (
                <tr><td className="py-2 pr-4 text-sm text-gray-500" colSpan={4}>No earnings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {requestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold mb-3">Request Payout</h3>
            <input value={requestAmount} onChange={e=>setRequestAmount(e.target.value)} className="w-full rounded-lg border border-gray-200 p-3 mb-3" placeholder="Amount (e.g. 200)" />
            <div className="flex items-center justify-end gap-2">
              <button onClick={()=> setRequestOpen(false)} className="h-10 px-4 rounded-md border border-gray-200 hover:bg-gray-50">Cancel</button>
              <button
                onClick={()=> {
                  const amount = Number(requestAmount)
                  if (!amount || amount <= 0) return
                  const next = { id: `P-${Math.floor(1000+Math.random()*9000)}`, date: new Date().toISOString().slice(0,10), amount, status: 'Pending' }
                  setPayouts(prev => [next, ...prev])
                  setRequestAmount('')
                  setRequestOpen(false)
                }}
                className="h-10 px-4 rounded-md bg-primary-600 hover:bg-primary-700 text-white"
              >Submit</button>
            </div>
          </div>
        </div>
      )}
    </TutorLayout>
  )
}

