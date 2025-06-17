import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useVideoSocket } from './VideoSocketContext';
import WebRTCPeerManager from '../utils/webrtcPeerManager';

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
    const peerManagerRef = useRef(null);
    const { user } = useAuth();
    const { 
        videoSocket, 
        isConnected: isVideoSocketConnected, 
        participants: videoParticipants,
        joinVideoRoom: joinVideoRoomSocket,
        leaveVideoRoom: leaveVideoRoomSocket,
        updateParticipantState
    } = useVideoSocket();

    const initializeClient = useCallback(async (clientToken, telnyxRoomId) => {
        try {
            console.log('🔄 Initializing video room client...');
            setConnectionState('connecting');
            setRoomId(telnyxRoomId);
            setRoomToken(clientToken);

            // For video rooms, we don't need the TelnyxRTC SIP client
            // We use pure WebRTC with our custom peer manager
            console.log('✅ Video room client ready (using WebRTC)');
            setIsConnected(true);
            setConnectionState('connected');
            
            return true;
        } catch (error) {
            console.error('❌ Error initializing video room client:', error);
            setConnectionState('error');
            throw error;
        }
    }, []);

    // Initialize WebRTC peer manager when video socket and local stream are ready
    useEffect(() => {
        if (videoSocket && localStream && !peerManagerRef.current) {
            console.log('🔧 Initializing WebRTC Peer Manager...');
            
            const peerManager = new WebRTCPeerManager(videoSocket, localStream);
            
            // Set up peer manager callbacks
            peerManager.setOnRemoteStreamAdded((participantId, stream) => {
                console.log(`📺 Remote stream added for ${participantId}`);
                setRemoteStreams(prev => new Map(prev.set(participantId, stream)));
            });

            peerManager.setOnRemoteStreamRemoved((participantId) => {
                console.log(`📺 Remote stream removed for ${participantId}`);
                setRemoteStreams(prev => {
                    const updated = new Map(prev);
                    updated.delete(participantId);
                    return updated;
                });
            });

            peerManager.setOnConnectionStateChange((participantId, state) => {
                console.log(`🔄 Connection state changed for ${participantId}: ${state}`);
                // Update participant connection state if needed
            });

            peerManagerRef.current = peerManager;
        }

        // Update peer manager when local stream changes
        if (peerManagerRef.current && localStream) {
            peerManagerRef.current.updateLocalStream(localStream);
        }

        return () => {
            // Cleanup will be handled in the main cleanup function
        };
    }, [videoSocket, localStream]);

    // Sync video socket participants with local state
    useEffect(() => {
        if (videoParticipants) {
            setParticipants(videoParticipants);
        }
    }, [videoParticipants]);

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

    const joinVideoRoom = useCallback(async (telnyxRoomId, participantName, participantId, externalParticipant = false) => {
        if (!isVideoSocketConnected) {
            throw new Error('Video socket not connected');
        }

        try {
            console.log('🎥 Joining video room:', telnyxRoomId);
            
            // Use video socket to join room
            const joinSuccess = joinVideoRoomSocket({
                roomId: telnyxRoomId,
                participantName: participantName,
                participantId: participantId,
                externalParticipant: externalParticipant
            });

            if (!joinSuccess) {
                throw new Error('Failed to join video room via socket');
            }

            // Start local media
            await startLocalMedia();

        } catch (error) {
            console.error('❌ Error joining video room:', error);
            throw error;
        }
    }, [isVideoSocketConnected, joinVideoRoomSocket, startLocalMedia]);

    const leaveVideoRoom = useCallback((participantId) => {
        if (roomId) {
            console.log('👋 Leaving video room:', roomId);
            
            // Use video socket to leave room
            leaveVideoRoomSocket(participantId);
        }

        // Clean up local state
        setParticipants(new Map());
        setRoomId(null);
        stopLocalMedia();
    }, [roomId, leaveVideoRoomSocket, stopLocalMedia]);

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
        
        // Broadcast state change to other participants via video socket
        updateParticipantState({
            isMuted: newMutedState,
            isVideoOff: isVideoOff
        });
    }, [currentCall, localStream, isMuted, isVideoOff, updateParticipantState]);

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
        
        // Broadcast state change to other participants via video socket
        updateParticipantState({
            isMuted: isMuted,
            isVideoOff: newVideoOffState
        });
    }, [currentCall, localStream, isMuted, isVideoOff, updateParticipantState]);

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
        peerManager: peerManagerRef.current,
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
