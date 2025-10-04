import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from "./context/AuthContextSimple"
import { API_URL, WS_URL } from '../config'
import { io } from 'socket.io-client'

export default function VideoCallSimple() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, role } = useAuth()
  
  // Core states
  const [sessionData, setSessionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isAudioOff, setIsAudioOff] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState([])
  
  // Refs
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const socketRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const isConnectingRef = useRef(false)

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch(`${API_URL}/private-sessions/${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          setSessionData(data)
        } else {
          setError('Session not found')
        }
      } catch (err) {
        setError('Failed to load session')
      } finally {
        setLoading(false)
      }
    }
    loadSession()
  }, [sessionId])

  // Initialize video call like Zoom
  const initializeVideoCall = async () => {
    if (isConnectingRef.current) return
    isConnectingRef.current = true

    try {
      console.log('🎥 Initializing video call...')
      
      // 1. Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      })
      
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      // 2. Connect to signaling server
      await connectToSignalingServer()
      
      // 3. Set up peer connection
      setupPeerConnection()
      
      console.log('✅ Video call initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize video call:', error)
      setError('Failed to start video call. Please check your camera and microphone permissions.')
    } finally {
      isConnectingRef.current = false
    }
  }

  // Connect to signaling server with automatic reconnection
  const connectToSignalingServer = () => {
    return new Promise((resolve, reject) => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }

      const socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        maxReconnectionAttempts: 10
      })

      socket.on('connect', () => {
        console.log('🔗 Connected to signaling server')
        setIsConnected(true)
        setError('')
        
        // Join the session room
        socket.emit('join-session', sessionId)
        console.log('🚪 Joined session:', sessionId)
        
        resolve()
      })

      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from signaling server')
        setIsConnected(false)
      })

      socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error)
        setError('Connection failed. Retrying...')
        reject(error)
      })

      socket.on('user-joined', (socketId) => {
        console.log('👥 User joined:', socketId)
        setParticipants(prev => [...prev, socketId])
        
        // Start the connection process
        setTimeout(() => {
          createOffer()
        }, 1000)
      })

      socket.on('user-left', (socketId) => {
        console.log('👋 User left:', socketId)
        setParticipants(prev => prev.filter(id => id !== socketId))
        setRemoteStream(null)
      })

      socket.on('offer', handleOffer)
      socket.on('answer', handleAnswer)
      socket.on('ice-candidate', handleIceCandidate)

      socketRef.current = socket
    })
  }

  // Set up peer connection with robust error handling
  const setupPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })

    // Add local stream to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream)
      })
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('📹 Received remote stream')
      const stream = event.streams[0]
      setRemoteStream(stream)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
      }
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          sessionId: sessionId
        })
      }
    }

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState)
      if (pc.connectionState === 'connected') {
        console.log('✅ Video call connected!')
        setError('')
      } else if (pc.connectionState === 'failed') {
        console.log('❌ Connection failed, retrying...')
        setTimeout(() => {
          if (socketRef.current && socketRef.current.connected) {
            createOffer()
          }
        }, 2000)
      }
    }

    peerConnectionRef.current = pc
  }

  // Create and send offer
  const createOffer = async () => {
    if (!peerConnectionRef.current || !socketRef.current) return

    try {
      console.log('📤 Creating offer...')
      const offer = await peerConnectionRef.current.createOffer()
      await peerConnectionRef.current.setLocalDescription(offer)
      
      socketRef.current.emit('offer', {
        offer: offer,
        sessionId: sessionId
      })
      console.log('✅ Offer sent')
    } catch (error) {
      console.error('❌ Error creating offer:', error)
    }
  }

  // Handle incoming offer
  const handleOffer = async (data) => {
    if (!peerConnectionRef.current) return

    try {
      console.log('📥 Received offer, creating answer...')
      await peerConnectionRef.current.setRemoteDescription(data.offer)
      
      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)
      
      socketRef.current.emit('answer', {
        answer: answer,
        sessionId: sessionId
      })
      console.log('✅ Answer sent')
    } catch (error) {
      console.error('❌ Error handling offer:', error)
    }
  }

  // Handle incoming answer
  const handleAnswer = async (data) => {
    if (!peerConnectionRef.current) return

    try {
      console.log('📥 Received answer')
      await peerConnectionRef.current.setRemoteDescription(data.answer)
      console.log('✅ Answer processed')
    } catch (error) {
      console.error('❌ Error handling answer:', error)
    }
  }

  // Handle ICE candidates
  const handleIceCandidate = async (data) => {
    if (!peerConnectionRef.current) return

    try {
      await peerConnectionRef.current.addIceCandidate(data.candidate)
      console.log('🧊 ICE candidate added')
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error)
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

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioOff(!audioTrack.enabled)
      }
    }
  }

  // End call
  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    navigate('/student')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    )
  }

  if (error && !sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/student')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Video Call</h1>
          <p className="text-sm text-gray-400">
            {sessionData?.plan?.name || 'Private Session'} • {participants.length + 1} participants
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          {error && (
            <div className="text-yellow-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {!localStream ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Start Video Call</h2>
              <p className="text-gray-400 mb-6">Click to start your video call</p>
              <button
                onClick={initializeVideoCall}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold"
              >
                Start Call
              </button>
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            {/* Main video (remote participant) */}
            <div className="absolute inset-0 bg-gray-800">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-gray-400">Waiting for other participant...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Local video (picture-in-picture) */}
            <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {localStream && (
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${isAudioOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isAudioOff ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isVideoOff ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18L19.73 21 21 19.73 3.27 2zM5 16V8h1.73l8 8H5z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            )}
          </button>

          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.12 2.12c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
