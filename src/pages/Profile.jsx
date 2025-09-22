import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user } = useAuth()
  const name = user?.name || 'Student User'
  const initials = name.split(' ').map(p=>p[0]).slice(0,2).join('')
  return (
    <div className="px-4 md:px-10 lg:px-20 py-10">
      <h1 className="text-3xl font-bold mb-6">Profile & Settings</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-2xl">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold">{initials}</div>
          <div>
            <p className="text-lg font-bold">{name}</p>
            <p className="text-gray-500 text-sm">Learner</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button className="rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50">
            <p className="font-semibold">Update Profile</p>
            <p className="text-sm text-gray-500">Name, photo and details</p>
          </button>
          <button className="rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50">
            <p className="font-semibold">Change Password</p>
            <p className="text-sm text-gray-500">Secure your account</p>
          </button>
        </div>
      </div>
    </div>
  )
}

