import React, { useState, useEffect, useCallback } from 'react';
import { 
    Box, 
    Grid, 
    Alert, 
    CircularProgress, 
    Typography,
    Paper,
    Fade,
    Backdrop
} from '@mui/material';
import { useTelnyx } from '../../contexts/TelnyxContext';
import VideoStream from './VideoStream';
import VideoControls from './VideoControls';
import api from '../../services/api';

const VideoRoomComponent = ({ room, userInfo, onLeave }) => {
    const { 
        initializeClient, 
        joinVideoRoom,
        currentCall, 
        localStream, 
        remoteStreams, 
        connectionState,
        participants,
        isMuted,
        isVideoOff,
        toggleMute,
        toggleVideo,
        endCall,
        disconnect
    } = useTelnyx();
    
    
    const [error, setError] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [roomToken, setRoomToken] = useState(null);
    const [isJoiningRoom, setIsJoiningRoom] = useState(false);

    useEffect(() => {
        if (room?.id) {
            initializeRoom();
        }
        
        return () => {
            cleanup();
        };
    }, [room]);

    const initializeRoom = async () => {
        try {
            setIsInitializing(true);
            setError(null);

            console.log('🎥 Initializing video room...', room);
            
            // Generate fresh token for this room (no auth required)
            const tokenResponse = await api.get(`/rooms/${room.id}/token`);
            
            console.log('🔍 Token response:', tokenResponse.data);
            
            // Handle both normalized and raw response formats
            const isSuccess = tokenResponse.data?.success === true || tokenResponse.data?.status === 'success';
            const tokenData = tokenResponse.data?.data?.token || tokenResponse.data?.data;
            
            if (!isSuccess || !tokenData) {
                throw new Error('Failed to generate room token');
            }

            const token = tokenData;
            setRoomToken(token);
            
            console.log('🔑 Token generated successfully');
            
            // Initialize Telnyx client with token
            await initializeClient(token, room.telnyxRoomId);
            
            console.log('✅ Telnyx client initialized');
            
            setIsInitializing(false);
            
            // Join the video room
            await joinRoom();

        } catch (error) {
            console.error('❌ Error initializing room:', error);
            setError(`Failed to join room: ${error.message}`);
            setIsInitializing(false);
        }
    };

    const joinRoom = async () => {
        try {
            setIsJoiningRoom(true);
            
            console.log('🚪 Joining video room...');
            
            // Join video room through Telnyx context
            await joinVideoRoom(room.telnyxRoomId, userInfo?.name || 'User');
            
            console.log('✅ Successfully joined video room');
            
        } catch (error) {
            console.error('❌ Error joining room:', error);
            setError(`Failed to join video room: ${error.message}`);
        } finally {
            setIsJoiningRoom(false);
        }
    };

    const handleToggleMute = useCallback(() => {
        toggleMute();
    }, [toggleMute]);

    const handleToggleVideo = useCallback(() => {
        toggleVideo();
    }, [toggleVideo]);

    const handleEndCall = useCallback(() => {
        endCall();
        cleanup();
        onLeave();
    }, [endCall, onLeave]);

    const handleScreenShare = useCallback(async () => {
        try {
            console.log('🖥️ Screen sharing requested');
            // TODO: Implement screen sharing logic
            // This would involve getting screen capture stream and replacing video track
            alert('Screen sharing feature coming soon!');
        } catch (error) {
            console.error('Screen sharing error:', error);
            setError('Failed to start screen sharing');
        }
    }, []);

    const cleanup = useCallback(() => {
        console.log('🧹 Cleaning up video room...');
        disconnect();
    }, [disconnect]);

    // Calculate total participants (local + remote + socket participants)
    const totalParticipants = 1 + remoteStreams.size + participants.size;

    // Show loading state
    if (isInitializing) {
        return (
            <Backdrop open={true} sx={{ color: '#fff', zIndex: 9999 }}>
                <Box 
                    sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 3,
                        textAlign: 'center'
                    }}
                >
                    <CircularProgress size={60} sx={{ color: 'primary.main' }} />
                    <Typography variant="h5" sx={{ fontWeight: 500 }}>
                        Joining video room...
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.8 }}>
                        Setting up your camera and microphone
                    </Typography>
                </Box>
            </Backdrop>
        );
    }

    // Show error state
    if (error) {
        return (
            <Box 
                sx={{ 
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1a1a1a',
                    p: 3
                }}
            >
                <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                    <Typography variant="body1" color="text.secondary">
                        Please check your internet connection and try again.
                    </Typography>
                </Paper>
            </Box>
        );
    }

    // Show connection state
    if (connectionState !== 'connected') {
        return (
            <Backdrop open={true} sx={{ color: '#fff', zIndex: 9999 }}>
                <Box 
                    sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 3,
                        textAlign: 'center'
                    }}
                >
                    <CircularProgress size={60} />
                    <Typography variant="h6">
                        {connectionState === 'connecting' ? 'Connecting...' : 'Connection failed'}
                    </Typography>
                    {connectionState === 'connecting' && (
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Establishing secure connection
                        </Typography>
                    )}
                </Box>
            </Backdrop>
        );
    }

    // Prepare video streams for display
    const allStreams = new Map();
    
    // Add local stream
    if (localStream) {
        allStreams.set('local', {
            stream: localStream,
            participantName: userInfo?.name || 'You',
            isLocal: true,
            isMuted,
            isVideoOff
        });
    }

    // Add remote streams from WebRTC calls
    remoteStreams.forEach((stream, callId) => {
        allStreams.set(callId, {
            stream,
            participantName: 'Remote User',
            isLocal: false,
            isMuted: false,
            isVideoOff: false
        });
    });

    // Add participants from Socket.IO (for users who joined but may not have active calls yet)
    participants.forEach((participant, participantId) => {
        if (!allStreams.has(participantId)) {
            allStreams.set(participantId, {
                stream: null, // No stream yet
                participantName: participant.name,
                isLocal: false,
                isMuted: participant.isMuted || false,
                isVideoOff: participant.isVideoOff || true // Assume video off if no stream
            });
        }
    });

    return (
        <Fade in={true} timeout={500}>
            <Box 
                sx={{ 
                    height: '100vh', 
                    display: 'flex', 
                    flexDirection: 'column',
                    backgroundColor: '#1a1a1a',
                    overflow: 'hidden'
                }}
            >
                {/* Room Header */}
                <Box
                    sx={{
                        p: 2,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 500 }}>
                        {room?.uniqueName || 'Video Room'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ color: 'grey.400' }}>
                            Room ID: {room?.telnyxRoomId?.slice(-8) || 'Unknown'}
                        </Typography>
                        <Box
                            sx={{
                                px: 2,
                                py: 0.5,
                                backgroundColor: 'success.main',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <Box
                                sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: 'white',
                                    animation: 'pulse 2s infinite'
                                }}
                            />
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                                Live
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Video Grid */}
                <Box sx={{ flex: 1, p: 2, overflow: 'hidden' }}>
                    {allStreams.size > 0 ? (
                        <Grid container spacing={2} sx={{ height: '100%' }}>
                            {Array.from(allStreams.entries()).map(([streamId, streamData]) => {
                                // Determine grid size based on number of participants
                                let gridSize = 12;
                                if (allStreams.size === 2) gridSize = 6;
                                else if (allStreams.size === 3 || allStreams.size === 4) gridSize = 6;
                                else if (allStreams.size > 4) gridSize = 4;

                                return (
                                    <Grid 
                                        item 
                                        xs={12}
                                        sm={gridSize}
                                        md={gridSize}
                                        key={streamId}
                                        sx={{ height: allStreams.size === 1 ? '100%' : '50%' }}
                                    >
                                        <VideoStream
                                            stream={streamData.stream}
                                            participantName={streamData.participantName}
                                            isLocal={streamData.isLocal}
                                            isMuted={streamData.isMuted}
                                            isVideoOff={streamData.isVideoOff}
                                        />
                                    </Grid>
                                );
                            })}
                        </Grid>
                    ) : (
                        <Box
                            sx={{
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Paper 
                                sx={{ 
                                    p: 4,
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    textAlign: 'center',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                                    {isJoiningRoom ? 'Joining room...' : 'Waiting for video streams...'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                    {isJoiningRoom ? 'Setting up your camera and microphone' : 'Make sure your camera and microphone are enabled'}
                                </Typography>
                                {isJoiningRoom && (
                                    <CircularProgress size={24} sx={{ mt: 2, color: 'primary.main' }} />
                                )}
                            </Paper>
                        </Box>
                    )}
                </Box>

                {/* Controls */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        pb: 3,
                        px: 2
                    }}
                >
                    <VideoControls
                        isMuted={isMuted}
                        isVideoOff={isVideoOff}
                        onToggleMute={handleToggleMute}
                        onToggleVideo={handleToggleVideo}
                        onEndCall={handleEndCall}
                        onScreenShare={handleScreenShare}
                        disabled={connectionState !== 'connected' || isJoiningRoom}
                        participantCount={totalParticipants}
                    />
                </Box>
            </Box>
        </Fade>
    );
};

export default VideoRoomComponent;
