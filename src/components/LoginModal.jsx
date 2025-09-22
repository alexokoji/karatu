export default function LoginModal({ open, onClose, onLoginStudent, onLoginTutor, onLoginAdmin }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl p-6 mx-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">Log in to KARATU</h2>
          <button onClick={onClose} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100">✕</button>
        </div>
        <p className="text-gray-600 text-sm mb-6">Choose how you want to continue.</p>
        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => onLoginStudent({ name: 'Aisha Bello', avatarUrl: '' })} className="h-11 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold">Continue as Student</button>
          <button onClick={() => onLoginTutor({ name: 'Sarah Adebayo', avatarUrl: '' })} className="h-11 px-4 rounded-lg bg-white text-primary-700 border border-primary-700 hover:bg-primary-50 font-semibold">Continue as Tutor</button>
          <button onClick={() => onLoginAdmin({ name: 'Admin User', avatarUrl: '' })} className="h-11 px-4 rounded-lg bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 font-semibold">Continue as Admin</button>
        </div>
        <p className="text-[11px] text-gray-500 mt-4">By continuing, you agree to our Terms and Privacy Policy.</p>
      </div>
    </div>
  );
}


