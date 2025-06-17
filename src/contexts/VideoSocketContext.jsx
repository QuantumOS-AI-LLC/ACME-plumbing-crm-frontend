import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const VideoSocketContext = createContext();

export const useVideoSocket = () => {
  const context = useContext(VideoSocketContext);
  if (!context) {
    throw new Error('useVideoSocket must be used within a VideoSocketProvider');
  }
  return context;
};

export const VideoSocketProvider = ({ children }) => {
  const [videoSocket, setVideoSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [participants, setParticipants] = useState(new Map());
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 5000; // 5 seconds

  useEffect(() => {
    // Get socket URL from environment (same base URL as main socket)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:5000';
    
    console.log(`🎥 Attempting video socket connection (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
    
    // Create video socket connection to /video namespace (no authentication required)
    const newVideoSocket = io(`${socketUrl}/video`, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      timeout: 10000, // 10 second timeout
      reconnection: false // Disable automatic reconnection to control it manually
    });

    // Connection event handlers
    newVideoSocket.on('connect', () => {
      console.log('✅ Connected to video socket namespace');
      setIsConnected(true);
      setConnectionError(null);
      setRetryCount(0); // Reset retry count on successful connection
    });

    newVideoSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from video socket:', reason);
      setIsConnected(false);
      setIsJoined(false);
      setCurrentRoomId(null);
      setParticipants(new Map());
    });

    newVideoSocket.on('connect_error', (error) => {
      console.error('❌ Video socket connection error:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
      
      // Increment retry count and schedule retry if under limit
      setRetryCount(prev => {
        const newCount = prev + 1;
        if (newCount < MAX_RETRY_ATTEMPTS) {
          console.log(`🔄 Scheduling video socket retry in ${RETRY_DELAY}ms (attempt ${newCount + 1}/${MAX_RETRY_ATTEMPTS})`);
          setTimeout(() => {
            // Trigger a re-render to retry connection
            setRetryCount(newCount);
          }, RETRY_DELAY);
        } else {
          console.log('❌ Max video socket retry attempts reached');
          setConnectionError('Video server unavailable. Please check if the server is running.');
        }
        return newCount;
      });
    });

    // Video room event handlers
    newVideoSocket.on('room-joined', (data) => {
      console.log('✅ Room joined successfully:', data);
      setCurrentRoomId(data.roomId);
      setIsJoined(true);
      setConnectionError(null);
      
      // Initialize participants map with existing participants
      if (data.participants && Array.isArray(data.participants)) {
        const participantsMap = new Map();
        data.participants.forEach(participant => {
          participantsMap.set(participant.participantId, participant);
        });
        setParticipants(participantsMap);
      }
    });

    newVideoSocket.on('participant-joined', (data) => {
      console.log('👤 Participant joined:', data);
      setParticipants(prev => new Map(prev.set(data.participantId, {
        id: data.participantId,
        socketId: data.socketId,
        name: data.participantName,
        externalParticipant: data.externalParticipant || false,
        participantType: data.participantType || (data.externalParticipant ? 'contact' : 'user'),
        joinedAt: data.joinedAt || new Date().toISOString()
      })));
    });

    newVideoSocket.on('participant-left', (data) => {
      console.log('👋 Participant left:', data);
      setParticipants(prev => {
        const updated = new Map(prev);
        updated.delete(data.participantId);
        return updated;
      });
    });

    newVideoSocket.on('participant-state-updated', (data) => {
      console.log('🔄 Participant state updated:', data);
      setParticipants(prev => {
        const updated = new Map(prev);
        const participant = updated.get(data.participantId);
        if (participant) {
          updated.set(data.participantId, {
            ...participant,
            ...data.state
          });
        }
        return updated;
      });
    });

    // WebRTC signaling event handlers
    newVideoSocket.on('webrtc-offer', (data) => {
      console.log('📞 Received WebRTC offer:', data);
      // This will be handled by the component using this context
    });

    newVideoSocket.on('webrtc-answer', (data) => {
      console.log('📞 Received WebRTC answer:', data);
      // This will be handled by the component using this context
    });

    newVideoSocket.on('webrtc-ice-candidate', (data) => {
      console.log('🧊 Received ICE candidate:', data);
      // This will be handled by the component using this context
    });

    // Error event handlers
    newVideoSocket.on('room-error', (error) => {
      console.error('🚨 Room error:', error);
      setConnectionError(error.message || 'Room operation failed');
    });

    newVideoSocket.on('webrtc-error', (error) => {
      console.error('🚨 WebRTC error:', error);
      setConnectionError(error.message || 'WebRTC operation failed');
    });

    setVideoSocket(newVideoSocket);

    return () => {
      newVideoSocket.close();
    };
  }, [retryCount]);

  // Join video room function
  const joinVideoRoom = useCallback((roomData) => {
    if (!videoSocket || !isConnected) {
      setConnectionError('Video socket not connected');
      return false;
    }

    const { roomId, participantName, participantId, externalParticipant = false } = roomData;

    if (!roomId || !participantName || !participantId) {
      setConnectionError('Missing required fields: roomId, participantName, participantId');
      return false;
    }

    console.log('🚀 Joining video room:', roomData);
    
    videoSocket.emit('join-video-room', {
      roomId,
      participantName,
      participantId,
      externalParticipant
    });

    return true;
  }, [videoSocket, isConnected]);

  // Leave video room function
  const leaveVideoRoom = useCallback((participantId) => {
    if (!videoSocket || !currentRoomId) {
      return false;
    }

    console.log('🚪 Leaving video room:', currentRoomId);
    
    videoSocket.emit('leave-video-room', {
      roomId: currentRoomId,
      participantId
    });

    // Reset local state
    setIsJoined(false);
    setCurrentRoomId(null);
    setParticipants(new Map());

    return true;
  }, [videoSocket, currentRoomId]);

  // Update participant state function
  const updateParticipantState = useCallback((state) => {
    if (!videoSocket || !currentRoomId) {
      return false;
    }

    videoSocket.emit('participant-state-change', {
      roomId: currentRoomId,
      state
    });

    return true;
  }, [videoSocket, currentRoomId]);

  // WebRTC signaling functions
  const sendWebRTCOffer = useCallback((targetSocketId, offer, participantId) => {
    if (!videoSocket) return false;

    videoSocket.emit('webrtc-offer', {
      targetSocketId,
      offer,
      participantId
    });

    return true;
  }, [videoSocket]);

  const sendWebRTCAnswer = useCallback((targetSocketId, answer, participantId) => {
    if (!videoSocket) return false;

    videoSocket.emit('webrtc-answer', {
      targetSocketId,
      answer,
      participantId
    });

    return true;
  }, [videoSocket]);

  const sendWebRTCIceCandidate = useCallback((targetSocketId, candidate, participantId) => {
    if (!videoSocket) return false;

    videoSocket.emit('webrtc-ice-candidate', {
      targetSocketId,
      candidate,
      participantId
    });

    return true;
  }, [videoSocket]);

  const value = {
    videoSocket,
    isConnected,
    connectionError,
    participants,
    currentRoomId,
    isJoined,
    joinVideoRoom,
    leaveVideoRoom,
    updateParticipantState,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendWebRTCIceCandidate
  };

  return (
    <VideoSocketContext.Provider value={value}>
      {children}
    </VideoSocketContext.Provider>
  );
};

export default VideoSocketContext;
