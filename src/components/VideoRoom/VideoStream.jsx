import React, { useRef, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Mic, MicOff, Videocam, VideocamOff } from '@mui/icons-material';

const VideoStream = ({ 
    stream, 
    participantName, 
    isLocal = false, 
    isMuted = false, 
    isVideoOff = false 
}) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <Paper 
            sx={{ 
                height: '100%', 
                position: 'relative', 
                overflow: 'hidden',
                backgroundColor: isVideoOff ? '#1a1a1a' : 'transparent',
                borderRadius: 2,
                minHeight: '200px'
            }}
        >
            {stream && !isVideoOff ? (
                <video
                    ref={videoRef}
                    autoPlay
                    muted={isLocal} // Always mute local video to prevent feedback
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                    }}
                />
            ) : (
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#2a2a2a',
                        color: 'white',
                        minHeight: '200px'
                    }}
                >
                    <Box sx={{ textAlign: 'center' }}>
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                backgroundColor: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2
                            }}
                        >
                            <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                                {participantName?.charAt(0)?.toUpperCase() || '?'}
                            </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ color: 'white' }}>
                            {participantName || 'Unknown User'}
                        </Typography>
                        {isVideoOff && (
                            <Typography variant="body2" sx={{ color: 'grey.400', mt: 1 }}>
                                Camera is off
                            </Typography>
                        )}
                    </Box>
                </Box>
            )}

            {/* Participant Info Overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    right: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <Typography
                    sx={{
                        color: 'white',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    {participantName || 'Unknown'} {isLocal && '(You)'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {isMuted && (
                        <Box
                            sx={{
                                backgroundColor: 'rgba(244, 67, 54, 0.9)',
                                borderRadius: '50%',
                                p: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(4px)'
                            }}
                        >
                            <MicOff sx={{ fontSize: 16, color: 'white' }} />
                        </Box>
                    )}
                    {isVideoOff && (
                        <Box
                            sx={{
                                backgroundColor: 'rgba(244, 67, 54, 0.9)',
                                borderRadius: '50%',
                                p: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(4px)'
                            }}
                        >
                            <VideocamOff sx={{ fontSize: 16, color: 'white' }} />
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Connection Quality Indicator (optional) */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                }}
            >
                {/* Connection quality dots */}
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: stream ? 'success.main' : 'error.main',
                        opacity: 0.8
                    }}
                />
            </Box>
        </Paper>
    );
};

export default VideoStream;
