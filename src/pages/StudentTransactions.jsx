import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from "../context/AuthContextSimple"

export default function StudentTransactions() {
  const { token } = useAuth()
  const [tx, setTx] = useState(() => { try { return JSON.parse(localStorage.getItem('studentTransactions')) || [] } catch { return [] } })
  useEffect(() => {
    const load = async () => {
      try { const res = await fetch('http://localhost:4000/transactions', { headers: { Authorization: token?`Bearer ${token}`:undefined } }); if (res.ok) { const data = await res.json(); if (Array.isArray(data)) setTx(data) } } catch {}
    }
    if (token) load()
  }, [token])
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <div className="mb-4"><Link to="/student" className="text-primary-700 hover:underline">← Back to Dashboard</Link></div>
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Reference</th>
              <th className="py-2 pr-4">Amount</th>
            </tr>
          </thead>
          <tbody>
            {tx.length === 0 && (
              <tr><td colSpan="4" className="py-4 text-gray-500">No transactions yet.</td></tr>
            )}
            {tx.map(t => (
              <tr key={t.id} className="border-t border-gray-100">
                <td className="py-2 pr-4">{new Date(t.date).toLocaleString()}</td>
                <td className="py-2 pr-4">{t.type}</td>
                <td className="py-2 pr-4">{t.ref}</td>
                <td className="py-2 pr-4">{t.currency} ${t.amount}
                  <Link to={`/student/transactions/${t.id}`} className="ml-3 inline-flex h-7 px-3 rounded-md border border-gray-200 hover:bg-gray-50 text-xs">View Receipt</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

