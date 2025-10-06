import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContextSimple'
import { io } from 'socket.io-client'
import { WS_URL } from '../config'

export default function CallNotification() {
  const [incomingCall, setIncomingCall] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [socket, setSocket] = useState(null)
  const { user, role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Only show notifications for students
    if (role !== 'student') return

    // Connect to socket for call notifications
    const newSocket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    newSocket.on('connect', () => {
      console.log('📞 Call notification socket connected')
      // Join user's personal room for call notifications
      newSocket.emit('join-user-room', user?.id)
    })

    newSocket.on('incoming-call', (callData) => {
      console.log('📞 Incoming call:', callData)
      setIncomingCall(callData)
      setIsVisible(true)
      
      // Auto-hide after 30 seconds if not answered
      setTimeout(() => {
        if (isVisible) {
          handleDecline()
        }
      }, 30000)
    })

    newSocket.on('call-ended', () => {
      console.log('📞 Call ended by caller')
      setIsVisible(false)
      setIncomingCall(null)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [user?.id, role])

  const handleAccept = () => {
    if (incomingCall) {
      console.log('📞 Accepting call:', incomingCall.sessionId)
      setIsVisible(false)
      navigate(`/video/${incomingCall.sessionId}`)
    }
  }

  const handleDecline = () => {
    if (socket && incomingCall) {
      console.log('📞 Declining call:', incomingCall.sessionId)
      socket.emit('call-declined', {
        sessionId: incomingCall.sessionId,
        studentId: user?.id
      })
    }
    setIsVisible(false)
    setIncomingCall(null)
  }

  if (!isVisible || !incomingCall) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          {/* Caller Avatar */}
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {incomingCall.tutorName?.charAt(0) || 'T'}
              </span>
            </div>
          </div>

          {/* Caller Info */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {incomingCall.tutorName || 'Tutor'}
          </h2>
          <p className="text-gray-600 mb-6">
            {incomingCall.topic || 'Private Session Call'}
          </p>

          {/* Call Status */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Incoming call...</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {/* Decline Button */}
            <button
              onClick={handleDecline}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
              </svg>
            </button>

            {/* Accept Button */}
            <button
              onClick={handleAccept}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
            </button>
          </div>

          {/* Session Info */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Session: {incomingCall.sessionId?.slice(0, 8)}...
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Duration: {incomingCall.duration || '60 minutes'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
