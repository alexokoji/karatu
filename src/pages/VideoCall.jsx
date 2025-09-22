import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import io from 'socket.io-client'

export default function VideoCall() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [chatOpen, setChatOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('videoChatOpen')
    return saved ? saved === 'true' : true
  })

  const persistChat = (next) => {
    setChatOpen(next)
    if (typeof window !== 'undefined') localStorage.setItem('videoChatOpen', String(next))
  }

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionData, setSessionData] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [peerConnection, setPeerConnection] = useState(null)
  const [mediaPermission, setMediaPermission] = useState('prompt') // 'prompt', 'granted', 'denied'
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  // Use sessionId from URL params or fallback to default
  const currentSessionId = sessionId || 'session-123'

  // Load session data and messages from backend
  useEffect(() => {
    const loadSessionData = async () => {
      setSessionLoading(true)
      try {
        // Load specific private session data
        if (currentSessionId !== 'session-123') {
          const sessionRes = await fetch(`http://localhost:4000/private-sessions/${currentSessionId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (sessionRes.ok) {
            const session = await sessionRes.json()
            setSessionData(session)
          } else if (sessionRes.status === 404) {
            // Session not found, redirect to dashboard
            navigate('/student')
            return
          }
        } else {
          // For default session, try to find an active session
          const sessionsRes = await fetch('http://localhost:4000/private-sessions', {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (sessionsRes.ok) {
            const sessions = await sessionsRes.json()
            const activeSession = sessions.find(s => s.status === 'accepted' && s.paid)
            if (activeSession) {
              setSessionData(activeSession)
              // Redirect to the correct session URL
              navigate(`/video/${activeSession.id}`, { replace: true })
              return
            }
          }
        }

        // Load messages
        const messagesRes = await fetch(`http://localhost:4000/chats/${currentSessionId}`)
        if (messagesRes.ok) {
          const data = await messagesRes.json()
          setMessages(data)
        } else {
          // Fallback to static messages
          setMessages([
            { id: 1, from: 'tutor', name: sessionData?.tutorName || 'Tutor', text: "Hello, I'm ready for our lesson!" },
            { id: 2, from: 'student', name: user?.name || 'You', text: "Hi, I'm ready too. Let's start!" },
          ])
        }
      } catch (error) {
        console.error('Failed to load session data:', error)
        // Fallback to static data
        setMessages([
          { id: 1, from: 'tutor', name: 'Tutor', text: "Hello, I'm ready for our lesson!" },
          { id: 2, from: 'student', name: user?.name || 'You', text: "Hi, I'm ready too. Let's start!" },
        ])
      } finally {
        setSessionLoading(false)
      }
    }
    
    if (token) {
      loadSessionData()
    }
  }, [currentSessionId, token, user, navigate, sessionData?.tutorName])

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io('http://localhost:4000')
    setSocket(newSocket)
    
    newSocket.on('connect', () => {
      console.log('Connected to signaling server')
      setIsConnected(true)
    })
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from signaling server')
      setIsConnected(false)
    })
    
    return () => {
      newSocket.close()
    }
  }, [])

  // Initialize video conferencing
  useEffect(() => {
    const initializeVideo = async () => {
      try {
        // Get user media (camera and microphone)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        setLocalStream(stream)
        setMediaPermission('granted')
        
        // Set up peer connection
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        })
        
        // Add local stream to peer connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream)
        })
        
        // Handle remote stream
        pc.ontrack = (event) => {
          console.log('Received remote stream')
          setRemoteStream(event.streams[0])
        }
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit('ice-candidate', {
              candidate: event.candidate,
              sessionId: currentSessionId
            })
          }
        }
        
        setPeerConnection(pc)
        
        // Join the session room
        if (socket) {
          socket.emit('join-session', currentSessionId)
        }
        
      } catch (error) {
        console.error('Error accessing media devices:', error)
        setMediaPermission('denied')
      }
    }
    
    if (sessionData && sessionData.status === 'accepted' && sessionData.paid && socket && isConnected) {
      initializeVideo()
    }
    
    // Cleanup on unmount
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      if (peerConnection) {
        peerConnection.close()
      }
    }
  }, [sessionData, socket, isConnected, currentSessionId])

  // Handle WebRTC signaling
  useEffect(() => {
    if (!socket || !peerConnection) return

    const handleOffer = async (data) => {
      try {
        await peerConnection.setRemoteDescription(data.offer)
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        
        socket.emit('answer', {
          answer: answer,
          sessionId: currentSessionId
        })
      } catch (error) {
        console.error('Error handling offer:', error)
      }
    }

    const handleAnswer = async (data) => {
      try {
        await peerConnection.setRemoteDescription(data.answer)
      } catch (error) {
        console.error('Error handling answer:', error)
      }
    }

    const handleIceCandidate = async (data) => {
      try {
        await peerConnection.addIceCandidate(data.candidate)
      } catch (error) {
        console.error('Error handling ICE candidate:', error)
      }
    }

    socket.on('offer', handleOffer)
    socket.on('answer', handleAnswer)
    socket.on('ice-candidate', handleIceCandidate)

    return () => {
      socket.off('offer', handleOffer)
      socket.off('answer', handleAnswer)
      socket.off('ice-candidate', handleIceCandidate)
    }
  }, [socket, peerConnection, currentSessionId])

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  const containsContactInfo = (t) => {
    const text = String(t || '')
    const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    const url = /(https?:\/\/|www\.)\S+/i
    const phone = /(?:\+?\d[\s-]?){7,}\d/ // simple phone detection
    return email.test(text) || url.test(text) || phone.test(text)
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    if (containsContactInfo(trimmed)) {
      setError('Message not sent: sharing contact info (links, emails, phone numbers) is restricted.')
      return
    }
    
    setLoading(true)
    const newMessage = { 
      id: Date.now(), 
      from: 'student', 
      name: user?.name || 'You', 
      text: trimmed,
      date: new Date().toISOString()
    }
    
    // Optimistically add message
    setMessages(prev => [...prev, newMessage])
    setInput('')
    if (error) setError('')
    
    try {
      // Save to backend
      const res = await fetch(`http://localhost:4000/chats/${currentSessionId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newMessage)
      })
      
      if (!res.ok) {
        throw new Error('Failed to save message')
      }
    } catch (error) {
      console.error('Failed to save message:', error)
      // Remove the optimistically added message on error
      setMessages(prev => prev.filter(m => m.id !== newMessage.id))
      setError('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Toggle microphone
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  // End call
  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (peerConnection) {
      peerConnection.close()
    }
    navigate('/student')
  }

  // Show loading state
  if (sessionLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center" style={{fontFamily:'"Plus Jakarta Sans","Noto Sans",sans-serif'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    )
  }

  // Show error if no valid session
  if (!sessionData && sessionId) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center" style={{fontFamily:'"Plus Jakarta Sans","Noto Sans",sans-serif'}}>
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h2>
          <p className="text-gray-600 mb-4">This video session is not available or you don't have access to it.</p>
          <button 
            onClick={() => navigate('/student')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Show permission request
  if (mediaPermission === 'denied') {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center" style={{fontFamily:'"Plus Jakarta Sans","Noto Sans",sans-serif'}}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📹</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Camera & Microphone Access Required</h2>
          <p className="text-gray-600 mb-6">To join the video session, please allow camera and microphone access in your browser.</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/student')}
              className="w-full px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col" style={{fontFamily:'"Plus Jakarta Sans","Noto Sans",sans-serif'}}>
      {/* Session Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {sessionData ? `${sessionData.tutorName || 'Tutor'} - Private Session` : 'Video Session'}
            </h1>
            <p className="text-sm text-gray-600">
              {sessionData?.plan?.name || 'Monthly Plan'} • Session ID: {currentSessionId}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Live</span>
            </div>
            <button 
              onClick={() => navigate('/student')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              End Session
            </button>
          </div>
        </div>
      </div>

      <main className="flex flex-1 overflow-hidden">
        <div className={`flex flex-1 flex-col p-6 ${chatOpen ? 'md:pr-6 md:mr-96' : ''}`}>
          <div className="flex-1 overflow-y-auto pr-0 md:pr-6">
            <div className="mb-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg bg-gray-900">
                {/* Remote video (tutor) */}
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    playsInline
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-4">👨‍🏫</div>
                      <p className="text-lg">Waiting for tutor to join...</p>
                    </div>
                  </div>
                )}
                
                {/* Local video (student) */}
                <div className="absolute bottom-4 right-4 h-24 w-40 overflow-hidden rounded-lg border-2 border-white shadow-md">
                  {localStream && !isVideoOff ? (
                    <video
                      ref={localVideoRef}
                      className="h-full w-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-600 flex items-center justify-center">
                      <span className="text-white text-2xl">
                        {isVideoOff ? '📹' : '👤'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Video controls overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                  <div className="flex gap-4">
                    <button 
                      onClick={toggleMute}
                      className={`rounded-full p-3 text-white backdrop-blur-sm ${
                        isMuted ? 'bg-red-500' : 'bg-white/20'
                      }`}
                    >
                      <span className="material-symbols-outlined text-3xl">
                        {isMuted ? 'mic_off' : 'mic'}
                      </span>
                    </button>
                    <button 
                      onClick={endCall}
                      className="rounded-full bg-red-600 p-4 text-white hover:bg-red-700"
                    >
                      <span className="material-symbols-outlined text-4xl">call_end</span>
                    </button>
                    <button 
                      onClick={toggleVideo}
                      className={`rounded-full p-3 text-white backdrop-blur-sm ${
                        isVideoOff ? 'bg-red-500' : 'bg-white/20'
                      }`}
                    >
                      <span className="material-symbols-outlined text-3xl">
                        {isVideoOff ? 'videocam_off' : 'videocam'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Lesson Progress</h3>
                <span className="text-sm font-bold text-primary-600">75%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-200">
                <div className="h-2.5 rounded-full bg-primary-600" style={{width:'75%'}} />
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-gray-800">Lesson: Conversational Igbo Greetings</h3>
              <p className="mb-6 text-gray-600">Today's lesson focuses on conversational Igbo, specifically greetings and basic introductions. We'll cover common phrases, pronunciation tips, and cultural nuances to help you start speaking confidently.</p>
              <h4 className="mb-4 text-md font-bold text-gray-800">Resources</h4>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-primary-700"><span className="material-symbols-outlined">description</span></div>
                  <div>
                    <p className="font-semibold text-gray-800">Lesson Notes</p>
                    <p className="text-sm text-gray-500">PDF - 2.3 MB</p>
                  </div>
                  <span className="ml-auto text-gray-400 material-symbols-outlined">download</span>
                </a>
                <a href="#" className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600"><span className="material-symbols-outlined">quiz</span></div>
                  <div>
                    <p className="font-semibold text-gray-800">Interactive Quiz</p>
                    <p className="text-sm text-gray-500">Sharable via chat</p>
                  </div>
                  <span className="ml-auto text-gray-400 material-symbols-outlined">share</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {chatOpen && (
        <aside className="hidden md:flex md:fixed md:top-16 md:right-0 md:bottom-0 w-96 shrink-0 flex-col border-l border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Session Chat</h2>
            <button className="rounded-md p-1 text-gray-500 hover:bg-gray-100" onClick={()=>persistChat(false)} aria-label="Collapse chat">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            {messages.map(m => (
              <div key={m.id} className={`flex items-start ${m.from==='student' ? 'justify-end' : ''} gap-3`}>
                {m.from==='tutor' && (
                  <div className="h-10 w-10 shrink-0 rounded-full bg-cover bg-center" style={{backgroundImage:'url(https://images.pexels.com/photos/1181395/pexels-photo-1181395.jpeg?auto=compress&cs=tinysrgb&w=200)'}} />
                )}
                <div className={`flex flex-col ${m.from==='student' ? 'items-end' : 'items-start'}`}>
                  <p className="text-sm font-semibold text-gray-700">
                    {m.from === 'tutor' ? (sessionData?.tutorName || 'Tutor') : (user?.name || 'You')}
                  </p>
                  <div className={`mt-1 max-w-xs rounded-xl p-3 ${m.from==='student' ? 'rounded-tr-none bg-gray-100 text-gray-800' : 'rounded-tl-none bg-primary-700 text-white'}`}>
                    <p className="text-sm">{m.text}</p>
                  </div>
                </div>
                {m.from==='student' && (
                  <div className="h-10 w-10 shrink-0 rounded-full bg-cover bg-center" style={{backgroundImage:'url(https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80)'}} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-auto border-t border-gray-200 bg-white p-4">
            <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50 focus-within:border-primary-600 transition-colors">
              <textarea
                rows={2}
                placeholder="Type a message..."
                value={input}
                onChange={(e)=> setInput(e.target.value)}
                onKeyDown={(e)=> { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                className="flex-1 resize-none bg-transparent border-0 outline-none px-3 py-2 text-sm focus:ring-0"
              />
              <div className="flex items-center gap-1 pr-2 py-1">
                <button className="rounded-md p-2 text-gray-500 hover:bg-gray-200 transition-colors" aria-label="Emoji"><span className="material-symbols-outlined text-lg">sentiment_satisfied</span></button>
                <button 
                  onClick={sendMessage} 
                  disabled={loading || !input.trim()}
                  className="rounded-md bg-primary-700 p-2 text-white hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  aria-label="Send message"
                >
                  <span className="material-symbols-outlined text-lg">{loading ? 'hourglass_empty' : 'send'}</span>
                </button>
              </div>
            </div>
            <div className="mt-2 h-5">
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
          </div>
        </aside>
        )}
        {!chatOpen && (
          <button
            onClick={()=>persistChat(true)}
            className="hidden md:flex fixed right-4 bottom-6 items-center gap-2 rounded-full bg-primary-700 text-white px-4 py-2 shadow-lg hover:bg-primary-800"
            aria-label="Open session chat"
          >
            <span className="material-symbols-outlined">chat</span>
            <span className="text-sm font-semibold">Session Chat</span>
          </button>
        )}
      </main>
    </div>
  )
}
