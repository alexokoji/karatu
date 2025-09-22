export default function PaymentModal({ open, onClose, amount = 0, currency = 'USD', description = '', onConfirm }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-xl font-bold">Checkout</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-baseline gap-2 mb-4"><span className="text-gray-500 text-sm">Total</span><span className="text-2xl font-black text-primary-700">{currency} ${amount}</span></div>
          <div className="space-y-3">
            <input className="w-full rounded-lg border border-gray-200 p-3" placeholder="Cardholder Name" />
            <input className="w-full rounded-lg border border-gray-200 p-3" placeholder="Card Number" />
            <div className="grid grid-cols-2 gap-3">
              <input className="rounded-lg border border-gray-200 p-3" placeholder="MM/YY" />
              <input className="rounded-lg border border-gray-200 p-3" placeholder="CVC" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={onClose} className="h-10 px-4 rounded-md border border-gray-200 hover:bg-gray-50">Cancel</button>
            <button onClick={onConfirm} className="h-10 px-4 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-semibold">Pay {currency} ${amount}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

