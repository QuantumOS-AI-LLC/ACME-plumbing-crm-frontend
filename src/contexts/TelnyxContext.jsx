import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from './SocketContext';

const TelnyxContext = createContext();

export const TelnyxProvider = ({ children }) => {
    const [client, setClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentCall, setCurrentCall] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    const [connectionState, setConnectionState] = useState('disconnected');
    const [participants, setParticipants] = useState(new Map());
    const [roomId, setRoomId] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [roomToken, setRoomToken] = useState(null);
    const { user } = useAuth();
    const { socket } = useSocket();

    const initializeClient = useCallback(async (clientToken, telnyxRoomId) => {
        try {
            console.log('🔄 Initializing video room client...');
            setConnectionState('connecting');
            setRoomId(telnyxRoomId);
            setRoomToken(clientToken);

            // For video rooms, we don't need the TelnyxRTC client
            // Instead, we'll use native WebRTC with the room token
            console.log('✅ Room token received, ready to join');
            setIsConnected(true);
            setConnectionState('connected');
            
            return true;
        } catch (error) {
            console.error('❌ Error initializing room client:', error);
            setConnectionState('error');
            throw error;
        }
    }, []);

    const handleNotification = useCallback((notification) => {
        switch (notification.type) {
            case 'callUpdate':
                const call = notification.call;
                setCurrentCall(call);
                
                if (call.state === 'ringing' && call.direction === 'inbound') {
                    // Auto-answer incoming calls in video rooms
                    call.answer();
                } else if (call.state === 'active') {
                    // Handle active call streams
                    if (call.remoteStream) {
                        setRemoteStreams(prev => new Map(prev.set(call.id, call.remoteStream)));
                    }
                    if (call.localStream) {
                        setLocalStream(call.localStream);
                    }
                } else if (call.state === 'destroy') {
                    // Clean up ended call
                    setRemoteStreams(prev => {
                        const updated = new Map(prev);
                        updated.delete(call.id);
                        return updated;
                    });
                    if (call.id === currentCall?.id) {
                        setCurrentCall(null);
                    }
                }
                break;

            case 'userMediaError':
                console.error('User media error:', notification.error);
                break;

            default:
                console.log('Unhandled notification type:', notification.type);
        }
    }, [currentCall]);

    // Socket.IO event handlers for video room management
    useEffect(() => {
        if (!socket || !roomId) return;

        const handleParticipantJoined = (data) => {
            console.log('👋 Participant joined:', data);
            setParticipants(prev => new Map(prev.set(data.participantId, {
                id: data.participantId,
                name: data.participantName,
                socketId: data.socketId,
                userId: data.userId
            })));
        };

        const handleParticipantLeft = (data) => {
            console.log('👋 Participant left:', data);
            setParticipants(prev => {
                const updated = new Map(prev);
                updated.delete(data.participantId);
                return updated;
            });
        };

        const handleParticipantStateChange = (data) => {
            console.log('🔄 Participant state change:', data);
            setParticipants(prev => {
                const updated = new Map(prev);
                const participant = updated.get(data.participantId);
                if (participant) {
                    updated.set(data.participantId, {
                        ...participant,
                        isMuted: data.isMuted,
                        isVideoOff: data.isVideoOff
                    });
                }
                return updated;
            });
        };

        const handleWebRTCOffer = (data) => {
            console.log('📞 Received WebRTC offer:', data);
            // Handle WebRTC offer from another participant
            if (client && currentCall) {
                // Process the offer through Telnyx client
                // This would typically involve setting remote description
            }
        };

        const handleWebRTCAnswer = (data) => {
            console.log('📞 Received WebRTC answer:', data);
            // Handle WebRTC answer from another participant
        };

        const handleWebRTCICECandidate = (data) => {
            console.log('🧊 Received ICE candidate:', data);
            // Handle ICE candidate from another participant
        };

        const handleRoomError = (error) => {
            console.error('🚨 Room error:', error);
            setConnectionState('error');
        };

        // Register event listeners
        socket.on('participant-joined', handleParticipantJoined);
        socket.on('participant-left', handleParticipantLeft);
        socket.on('participant-state-change', handleParticipantStateChange);
        socket.on('webrtc-offer', handleWebRTCOffer);
        socket.on('webrtc-answer', handleWebRTCAnswer);
        socket.on('webrtc-ice-candidate', handleWebRTCICECandidate);
        socket.on('room-error', handleRoomError);

        return () => {
            socket.off('participant-joined', handleParticipantJoined);
            socket.off('participant-left', handleParticipantLeft);
            socket.off('participant-state-change', handleParticipantStateChange);
            socket.off('webrtc-offer', handleWebRTCOffer);
            socket.off('webrtc-answer', handleWebRTCAnswer);
            socket.off('webrtc-ice-candidate', handleWebRTCICECandidate);
            socket.off('room-error', handleRoomError);
        };
    }, [socket, roomId, client, currentCall]);

    const joinVideoRoom = useCallback(async (telnyxRoomId, participantName) => {
        if (!socket || !user) {
            throw new Error('Socket or user not available');
        }

        try {
            console.log('🎥 Joining video room:', telnyxRoomId);
            
            // Join socket room for signaling
            socket.emit('join-video-room', {
                roomId: telnyxRoomId,
                participantName: participantName || user.name,
                userId: user.id
            });

            // Start local media
            await startLocalMedia();

        } catch (error) {
            console.error('❌ Error joining video room:', error);
            throw error;
        }
    }, [socket, user]);

    const leaveVideoRoom = useCallback(() => {
        if (socket && roomId && user) {
            console.log('👋 Leaving video room:', roomId);
            
            socket.emit('leave-video-room', {
                roomId: roomId,
                userId: user.id
            });
        }

        // Clean up local state
        setParticipants(new Map());
        setRoomId(null);
        stopLocalMedia();
    }, [socket, roomId, user]);

    const startLocalMedia = useCallback(async () => {
        try {
            console.log('📹 Requesting camera and microphone access...');
            
            // Check if mediaDevices is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Your browser does not support camera and microphone access. Please use a modern browser like Chrome, Firefox, or Safari.');
            }

            // First try with both video and audio
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user'
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                console.log('✅ Camera and microphone access granted');
            } catch (videoError) {
                console.warn('⚠️ Camera access failed, trying audio only:', videoError.message);
                
                // If video fails, try audio only
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: false,
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                    });
                    console.log('✅ Microphone access granted (audio only)');
                } catch (audioError) {
                    console.error('❌ Both camera and microphone access failed:', audioError.message);
                    
                    // Provide user-friendly error messages
                    let userMessage = 'Unable to access camera and microphone. ';
                    
                    if (audioError.name === 'NotAllowedError') {
                        userMessage += 'Please allow camera and microphone permissions in your browser and try again.';
                    } else if (audioError.name === 'NotFoundError') {
                        userMessage += 'No camera or microphone found. Please connect a camera/microphone and try again.';
                    } else if (audioError.name === 'NotReadableError') {
                        userMessage += 'Camera or microphone is being used by another application. Please close other apps and try again.';
                    } else if (audioError.name === 'OverconstrainedError') {
                        userMessage += 'Camera or microphone settings are not supported. Please try again.';
                    } else if (audioError.name === 'SecurityError') {
                        userMessage += 'Camera and microphone access is blocked. Please enable permissions and use HTTPS.';
                    } else {
                        userMessage += `Error: ${audioError.message}`;
                    }
                    
                    throw new Error(userMessage);
                }
            }
            
            setLocalStream(stream);
            console.log('📹 Local media started successfully');
            
            return stream;
        } catch (error) {
            console.error('❌ Error starting local media:', error);
            throw error;
        }
    }, []);

    const stopLocalMedia = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
            });
            setLocalStream(null);
            console.log('📹 Local media stopped');
        }
    }, [localStream]);

    const makeCall = useCallback(async (destination, options = {}) => {
        if (!client || !isConnected) {
            throw new Error('Telnyx client not ready');
        }

        try {
            const call = client.newCall({
                destinationNumber: destination,
                audio: true,
                video: true,
                ...options
            });

            setCurrentCall(call);
            return call;
        } catch (error) {
            console.error('Error making call:', error);
            throw error;
        }
    }, [client, isConnected]);

    const endCall = useCallback(() => {
        if (currentCall) {
            currentCall.hangup();
            setCurrentCall(null);
        }
        
        // Leave the video room
        leaveVideoRoom();
    }, [currentCall, leaveVideoRoom]);

    const toggleMute = useCallback(() => {
        if (currentCall) {
            currentCall.toggleAudioMute();
        } else if (localStream) {
            // Toggle local stream audio if no active call
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
            }
        }
        
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        
        // Broadcast state change to other participants
        if (socket && roomId && user) {
            socket.emit('participant-state-change', {
                roomId: roomId,
                participantId: user.id,
                isMuted: newMutedState,
                isVideoOff: isVideoOff
            });
        }
    }, [currentCall, localStream, isMuted, isVideoOff, socket, roomId, user]);

    const toggleVideo = useCallback(() => {
        if (currentCall) {
            currentCall.toggleVideoMute();
        } else if (localStream) {
            // Toggle local stream video if no active call
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
            }
        }
        
        const newVideoOffState = !isVideoOff;
        setIsVideoOff(newVideoOffState);
        
        // Broadcast state change to other participants
        if (socket && roomId && user) {
            socket.emit('participant-state-change', {
                roomId: roomId,
                participantId: user.id,
                isMuted: isMuted,
                isVideoOff: newVideoOffState
            });
        }
    }, [currentCall, localStream, isMuted, isVideoOff, socket, roomId, user]);

    const disconnect = useCallback(() => {
        if (client) {
            client.disconnect();
            setClient(null);
            setIsConnected(false);
            setCurrentCall(null);
            setConnectionState('disconnected');
        }
        
        stopLocalMedia();
        leaveVideoRoom();
        setRemoteStreams(new Map());
    }, [client, stopLocalMedia, leaveVideoRoom]);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            disconnect();
        };
    }, [disconnect]);

    const value = {
        client,
        isConnected,
        currentCall,
        localStream,
        remoteStreams,
        connectionState,
        participants,
        roomId,
        isMuted,
        isVideoOff,
        initializeClient,
        joinVideoRoom,
        leaveVideoRoom,
        makeCall,
        endCall,
        toggleMute,
        toggleVideo,
        disconnect,
        startLocalMedia,
        stopLocalMedia
    };

    return (
        <TelnyxContext.Provider value={value}>
            {children}
        </TelnyxContext.Provider>
    );
};

export const useTelnyx = () => {
    const context = useContext(TelnyxContext);
    if (!context) {
        throw new Error('useTelnyx must be used within TelnyxProvider');
    }
    return context;
};
