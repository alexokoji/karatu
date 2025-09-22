import { Link, useParams } from 'react-router-dom'

export default function StudentReceipt() {
  const { id } = useParams()
  const tx = (() => { try { return (JSON.parse(localStorage.getItem('studentTransactions')) || []).find(t=> String(t.id)===String(id)) } catch { return null } })()
  if (!tx) return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <div className="mb-4"><Link to="/student/transactions" className="text-primary-700 hover:underline">← Back to Transactions</Link></div>
      <p className="text-gray-600">Receipt not found.</p>
    </div>
  )
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/student/transactions" className="text-primary-700 hover:underline">← Back to Transactions</Link>
        <button onClick={()=> window.print()} className="h-10 px-4 rounded-md border border-gray-200 hover:bg-gray-50">Print</button>
      </div>
      <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Receipt</h1>
        <div className="space-y-2 text-sm">
          <p><span className="text-gray-500">Receipt ID:</span> {tx.id}</p>
          <p><span className="text-gray-500">Date:</span> {new Date(tx.date).toLocaleString()}</p>
          <p><span className="text-gray-500">Type:</span> {tx.type}</p>
          <p><span className="text-gray-500">Reference:</span> {tx.ref}</p>
          <p><span className="text-gray-500">Amount:</span> {tx.currency} ${tx.amount}</p>
          <p className="text-gray-500">Thank you for your purchase.</p>
        </div>
      </div>
    </div>
  )
}

