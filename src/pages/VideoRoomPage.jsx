import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button, Typography, Paper } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import VideoRoomComponent from '../components/VideoRoom/VideoRoomComponent';
import api from '../services/api';
import theme from '../theme';

// Inner component for public video room access
const VideoRoomPageInner = () => {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    // Extract user information from URL parameters for anonymous video rooms
    useEffect(() => {
        const userId = searchParams.get('userId');
        const contactId = searchParams.get('contactId');
        const name = searchParams.get('name');
        const contactName = searchParams.get('contactName');
        
        // New anonymous video room logic:
        // - For users: URL has userId (and possibly contactId), use userId as participantId
        // - For contacts: URL has only contactId (no userId), use contactId as participantId
        const participantId = userId || contactId;
        const participantName = name || contactName || 'Guest User';
        const externalParticipant = !userId; // true if only contactId exists (external contact)
        
        setUserInfo({
            participantId,
            participantName,
            externalParticipant,
            userId: userId || null,
            contactId: contactId || null,
            name: participantName,
            userType: externalParticipant ? 'contact' : 'user'
        });
        
        console.log('📋 Anonymous video room participant info:', { 
            participantId,
            participantName,
            externalParticipant,
            userId, 
            contactId,
            userType: externalParticipant ? 'contact' : 'user'
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
        console.log('👋 Leaving video room...');
        
        // Try to close the window/tab (works if opened by JavaScript)
        const closed = window.close();
        
        // Fallback: if window.close() doesn't work, redirect to a thank you page
        setTimeout(() => {
            // Check if window is still open
            if (!window.closed) {
                // Show a thank you message and provide options
                const shouldRedirect = confirm(
                    'Thank you for using the video room!\n\n' +
                    'Click OK to go to the main page, or Cancel to close this tab manually.'
                );
                
                if (shouldRedirect) {
                    // Redirect to the main CRM page or a thank you page
                    window.location.href = '/';
                } else {
                    // Show instructions to close manually
                    document.body.innerHTML = `
                        <div style="
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            background: #1a1a1a;
                            color: white;
                            font-family: Arial, sans-serif;
                            text-align: center;
                            padding: 20px;
                        ">
                            <h2>Video Call Ended</h2>
                            <p>Thank you for using the video room!</p>
                            <p style="margin-top: 20px; opacity: 0.8;">
                                You can now safely close this window or tab.
                            </p>
                            <button 
                                onclick="window.location.href='/'" 
                                style="
                                    margin-top: 20px;
                                    padding: 10px 20px;
                                    background: #007bff;
                                    color: white;
                                    border: none;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    font-size: 16px;
                                "
                            >
                                Go to Main Page
                            </button>
                        </div>
                    `;
                }
            }
        }, 500);
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

// Main component - providers are now handled in App.jsx
const VideoRoomPage = () => {
    return <VideoRoomPageInner />;
};

export default VideoRoomPage;
