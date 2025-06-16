import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button, Typography, Paper } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import VideoRoomComponent from '../components/VideoRoom/VideoRoomComponent';
import { TelnyxProvider } from '../contexts/TelnyxContext';
import { SocketProvider } from '../contexts/SocketContext';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import theme from '../theme';

// Inner component that uses the auth context
const VideoRoomPageInner = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { isLoggedIn, loading: authLoading } = useAuth();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading) {
            if (!isLoggedIn) {
                // Redirect to login if not authenticated
                window.location.href = '/login';
                return;
            }
            
            if (roomId) {
                loadRoom();
            }
        }
    }, [roomId, isLoggedIn, authLoading]);

    const loadRoom = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('📚 Loading room details for ID:', roomId);
            
            // Get room details from the system database
            const roomResponse = await api.get(`/rooms/${roomId}`);
            
            console.log('🔍 Raw room response:', roomResponse.data);
            
            // Handle both normalized and raw response formats
            const isSuccess = roomResponse.data?.success === true || roomResponse.data?.status === 'success';
            const roomData = roomResponse.data?.data?.room || roomResponse.data?.data;
            
            if (!isSuccess || !roomData) {
                throw new Error('Room not found or you don\'t have permission to access it');
            }
            console.log('✅ Room loaded:', roomData);
            
            setRoom(roomData);
            
        } catch (err) {
            console.error('❌ Error loading room:', err);
            
            let errorMessage = 'Failed to load room';
            if (err.response?.status === 404) {
                errorMessage = 'Room not found. It may have been deleted or you don\'t have permission to access it.';
            } else if (err.response?.status === 403) {
                errorMessage = 'You don\'t have permission to access this room.';
            } else if (err.response?.status === 401) {
                errorMessage = 'Please log in to access this room.';
                // Redirect to login
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                errorMessage = err.message || 'An unexpected error occurred';
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
        // redirect to the main app
        setTimeout(() => {
            window.location.href = '/contacts';
        }, 100);
    };

    // Show loading while checking authentication
    if (authLoading) {
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
                        Checking authentication...
                    </Typography>
                </Box>
            </ThemeProvider>
        );
    }

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
                        Loading room...
                    </Typography>
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
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button 
                                variant="outlined" 
                                onClick={() => window.close()}
                            >
                                Close Window
                            </Button>
                            <Button 
                                variant="contained" 
                                onClick={() => window.location.href = '/contacts'}
                            >
                                Go to Contacts
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
                            Room not found or you don't have permission to access it.
                        </Alert>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button 
                                variant="outlined" 
                                onClick={() => window.close()}
                            >
                                Close Window
                            </Button>
                            <Button 
                                variant="contained" 
                                onClick={() => window.location.href = '/contacts'}
                            >
                                Go to Contacts
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
            <AuthProvider>
                <SocketProvider>
                    <TelnyxProvider>
                        <VideoRoomPageInner />
                    </TelnyxProvider>
                </SocketProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default VideoRoomPage;
