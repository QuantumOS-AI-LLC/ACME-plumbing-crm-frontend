import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button, Typography, Paper } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import VideoRoomComponent from '../components/VideoRoom/VideoRoomComponent';
import { TelnyxProvider } from '../contexts/TelnyxContext';
import { SocketProvider } from '../contexts/SocketContext';
import api from '../services/api';
import theme from '../theme';

// Inner component for public video room access
const VideoRoomPageInner = () => {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    // Extract user information from URL parameters
    useEffect(() => {
        const userId = searchParams.get('userId');
        const contactId = searchParams.get('contactId');
        const name = searchParams.get('name');
        const contactName = searchParams.get('contactName');
        
        // Determine if this is an internal user or external contact
        const isInternalUser = !!userId;
        const isExternalContact = !!contactId && !userId;
        
        setUserInfo({
            userId: userId || null,
            contactId: contactId || null,
            name: name || 'Guest User',
            contactName: contactName || null,
            isInternalUser,
            isExternalContact,
            userType: isInternalUser ? 'user' : isExternalContact ? 'contact' : 'guest'
        });
        
        console.log('📋 User info from URL:', { 
            userId, 
            contactId, 
            name, 
            contactName, 
            userType: isInternalUser ? 'user' : isExternalContact ? 'contact' : 'guest'
        });
    }, [searchParams]);

    useEffect(() => {
        if (roomId) {
            loadRoom();
        }
    }, [roomId]);

    const loadRoom = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('📚 Loading room details for ID:', roomId);
            
            // Get room details from the system database using room ID (no JWT required)
            const roomResponse = await api.get(`/rooms/${roomId}`);
            
            console.log('🔍 Raw room response:', roomResponse.data);
            
            // Handle both normalized and raw response formats
            const isSuccess = roomResponse.data?.success === true || roomResponse.data?.status === 'success';
            const roomData = roomResponse.data?.data?.room || roomResponse.data?.data;
            
            if (!isSuccess || !roomData) {
                throw new Error('Room not found or is no longer available');
            }
            console.log('✅ Room loaded:', roomData);
            
            setRoom(roomData);
            
        } catch (err) {
            console.error('❌ Error loading room:', err);
            
            let errorMessage = 'Failed to load room';
            if (err.response?.status === 404) {
                errorMessage = 'Room not found. It may have been deleted or the link is invalid.';
            } else if (err.response?.status === 403) {
                errorMessage = 'This room is no longer accessible.';
            } else {
                errorMessage = err.message || 'An unexpected error occurred while loading the room';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveRoom = () => {
        // Close the tab/window
        window.close();
        
        // Fallback: if window.close() doesn't work (some browsers block it),
        // show a message or redirect to a thank you page
        setTimeout(() => {
            alert('You can now close this window or tab.');
        }, 100);
    };

    // Show loading while fetching room data
    if (loading) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    height="100vh"
                    flexDirection="column"
                    gap={2}
                    sx={{ backgroundColor: '#1a1a1a' }}
                >
                    <CircularProgress size={60} sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ color: 'white' }}>
                        Loading video room...
                    </Typography>
                    {userInfo?.name && (
                        <Typography variant="body2" sx={{ color: 'grey.400' }}>
                            Welcome, {userInfo.name}
                        </Typography>
                    )}
                </Box>
            </ThemeProvider>
        );
    }

    // Show error state
    if (error) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
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
                    <Paper sx={{ p: 4, maxWidth: 600, textAlign: 'center' }}>
                        <Alert 
                            severity="error" 
                            sx={{ mb: 3 }}
                        >
                            {error}
                        </Alert>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Please check the link or contact the person who shared it with you.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button 
                                variant="outlined" 
                                onClick={() => window.close()}
                            >
                                Close Window
                            </Button>
                            <Button 
                                variant="contained" 
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </ThemeProvider>
        );
    }

    // Show room not found
    if (!room) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
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
                    <Paper sx={{ p: 4, maxWidth: 600, textAlign: 'center' }}>
                        <Alert 
                            severity="warning"
                            sx={{ mb: 3 }}
                        >
                            Video room not found or is no longer available.
                        </Alert>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            The room may have been deleted or the link may be invalid.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button 
                                variant="outlined" 
                                onClick={() => window.close()}
                            >
                                Close Window
                            </Button>
                            <Button 
                                variant="contained" 
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </ThemeProvider>
        );
    }

    // Render the video room
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <VideoRoomComponent 
                room={room} 
                userInfo={userInfo}
                onLeave={handleLeaveRoom}
            />
        </ThemeProvider>
    );
};

// Main component with all providers
const VideoRoomPage = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <SocketProvider>
                <TelnyxProvider>
                    <VideoRoomPageInner />
                </TelnyxProvider>
            </SocketProvider>
        </ThemeProvider>
    );
};

export default VideoRoomPage;
