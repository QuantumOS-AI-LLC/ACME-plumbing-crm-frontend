import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { 
    Mic, 
    MicOff, 
    Videocam, 
    VideocamOff, 
    CallEnd, 
    ScreenShare,
    Settings,
    Chat,
    PresentToAll
} from '@mui/icons-material';

const VideoControls = ({
    isMuted,
    isVideoOff,
    onToggleMute,
    onToggleVideo,
    onEndCall,
    onScreenShare,
    onSettings,
    onChat,
    disabled = false,
    participantCount = 1
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                p: 3,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
        >
            {/* Participant Count */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                px: 2,
                py: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                mr: 1
            }}>
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'success.main',
                        animation: 'pulse 2s infinite'
                    }}
                />
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                    {participantCount} participant{participantCount !== 1 ? 's' : ''}
                </Typography>
            </Box>

            {/* Audio Control */}
            <Tooltip title={isMuted ? "Unmute microphone" : "Mute microphone"}>
                <IconButton
                    onClick={onToggleMute}
                    disabled={disabled}
                    sx={{
                        bgcolor: isMuted ? 'error.main' : 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        '&:hover': {
                            bgcolor: isMuted ? 'error.dark' : 'rgba(255, 255, 255, 0.3)',
                            transform: 'scale(1.05)'
                        },
                        '&:disabled': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.5)'
                        },
                        width: 56,
                        height: 56,
                        transition: 'all 0.2s ease-in-out',
                        border: isMuted ? '2px solid #f44336' : '2px solid transparent'
                    }}
                >
                    {isMuted ? <MicOff /> : <Mic />}
                </IconButton>
            </Tooltip>

            {/* Video Control */}
            <Tooltip title={isVideoOff ? "Turn on camera" : "Turn off camera"}>
                <IconButton
                    onClick={onToggleVideo}
                    disabled={disabled}
                    sx={{
                        bgcolor: isVideoOff ? 'error.main' : 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        '&:hover': {
                            bgcolor: isVideoOff ? 'error.dark' : 'rgba(255, 255, 255, 0.3)',
                            transform: 'scale(1.05)'
                        },
                        '&:disabled': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.5)'
                        },
                        width: 56,
                        height: 56,
                        transition: 'all 0.2s ease-in-out',
                        border: isVideoOff ? '2px solid #f44336' : '2px solid transparent'
                    }}
                >
                    {isVideoOff ? <VideocamOff /> : <Videocam />}
                </IconButton>
            </Tooltip>

            {/* Screen Share Control */}
            <Tooltip title="Share screen">
                <IconButton
                    onClick={onScreenShare}
                    disabled={disabled}
                    sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.3)',
                            transform: 'scale(1.05)'
                        },
                        '&:disabled': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.5)'
                        },
                        width: 56,
                        height: 56,
                        transition: 'all 0.2s ease-in-out'
                    }}
                >
                    <ScreenShare />
                </IconButton>
            </Tooltip>

            {/* Chat Control (Future Enhancement) */}
            {onChat && (
                <Tooltip title="Open chat">
                    <IconButton
                        onClick={onChat}
                        disabled={disabled}
                        sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.3)',
                                transform: 'scale(1.05)'
                            },
                            '&:disabled': {
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.5)'
                            },
                            width: 56,
                            height: 56,
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        <Chat />
                    </IconButton>
                </Tooltip>
            )}

            {/* Settings Control (Future Enhancement) */}
            {onSettings && (
                <Tooltip title="Settings">
                    <IconButton
                        onClick={onSettings}
                        disabled={disabled}
                        sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.3)',
                                transform: 'scale(1.05)'
                            },
                            '&:disabled': {
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.5)'
                            },
                            width: 56,
                            height: 56,
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        <Settings />
                    </IconButton>
                </Tooltip>
            )}

            {/* End Call Control */}
            <Tooltip title="End call">
                <IconButton
                    onClick={onEndCall}
                    disabled={disabled}
                    sx={{
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': {
                            bgcolor: 'error.dark',
                            transform: 'scale(1.05)'
                        },
                        '&:disabled': {
                            bgcolor: 'rgba(244, 67, 54, 0.5)',
                            color: 'rgba(255, 255, 255, 0.5)'
                        },
                        width: 56,
                        height: 56,
                        transition: 'all 0.2s ease-in-out',
                        ml: 1,
                        boxShadow: '0 4px 16px rgba(244, 67, 54, 0.4)'
                    }}
                >
                    <CallEnd />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default VideoControls;
