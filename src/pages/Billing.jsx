export default function Billing() {
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <h1 className="text-3xl font-bold mb-6">Billing & Enrollment</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Select a Plan</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
              <span>Monthly</span>
              <input type="radio" name="plan" defaultChecked />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
              <span>Quarterly</span>
              <input type="radio" name="plan" />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
              <span>Yearly</span>
              <input type="radio" name="plan" />
            </label>
          </div>
          <button className="mt-4 h-11 px-5 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold">Continue</button>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
          <div className="space-y-3">
            <input className="w-full rounded-lg border border-gray-200 p-3" placeholder="Cardholder Name" />
            <input className="w-full rounded-lg border border-gray-200 p-3" placeholder="Card Number" />
            <div className="grid grid-cols-2 gap-3">
              <input className="rounded-lg border border-gray-200 p-3" placeholder="MM/YY" />
              <input className="rounded-lg border border-gray-200 p-3" placeholder="CVC" />
            </div>
          </div>
          <button className="mt-4 h-11 px-5 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold">Enroll Now</button>
        </div>
      </div>
    </div>
  )
}

