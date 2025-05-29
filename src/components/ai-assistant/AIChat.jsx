import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAIChat } from '../../hooks/useAIChat';
import { useSocket } from '../../contexts/SocketContext';

const AIChat = ({ contactId, estimateId = null }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const {
    messages,
    isTyping,
    isSending,
    isLoadingHistory,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping
  } = useAIChat(contactId, estimateId);

  const { 
    connectionError, 
    isReconnecting, 
    reconnectAttempts, 
    maxReconnectAttempts, 
    reconnect 
  } = useSocket();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when component mounts or connection is restored
  useEffect(() => {
    if (isConnected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isConnected]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && isConnected) {
      const success = sendMessage(inputMessage);
      if (success) {
        setInputMessage('');
        stopTyping();
        inputRef.current?.focus();
      }
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    if (e.target.value.trim() && isConnected) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleInputBlur = () => {
    stopTyping();
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConnectionStatusColor = () => {
    if (isConnected) return 'success';
    if (isReconnecting) return 'warning';
    return 'error';
  };

  const getConnectionStatusText = () => {
    if (isConnected) return 'Real-time';
    if (isReconnecting) return `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`;
    return 'Offline';
  };

  const getConnectionStatusIcon = () => {
    if (isConnected) return <WifiIcon />;
    if (isReconnecting) return <CircularProgress size={16} />;
    return <WifiOffIcon />;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Connection Status Alert */}
      {connectionError && !isConnected && (
        <Alert 
          severity="warning" 
          sx={{ mb: 1 }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={reconnect}
              disabled={isReconnecting}
            >
              <RefreshIcon />
            </IconButton>
          }
        >
          {connectionError} - Messages will be sent when connection is restored.
        </Alert>
      )}

      {/* Messages Container */}
      <Paper 
        sx={{ 
          flexGrow: 1, 
          p: 2, 
          mb: 2, 
          maxHeight: '500px', 
          overflowY: 'auto',
          backgroundColor: '#f8f9fa',
          position: 'relative'
        }}
      >
        {isLoadingHistory ? (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              minHeight: '200px'
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              Loading conversation history...
            </Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start a conversation with the AI assistant!
            </Typography>
            {!isConnected && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                Waiting for connection to be established...
              </Typography>
            )}
          </Box>
        ) : (
          <>
            {messages.map((message, index) => (
              <Box 
                key={message.id || `${message.senderType}-${index}-${message.createdAt}`}
                sx={{ 
                  mb: 2,
                  display: 'flex',
                  justifyContent: message.senderType === 'USER' ? 'flex-end' : 'flex-start'
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    backgroundColor: message.senderType === 'USER' 
                      ? 'primary.main' 
                      : 'background.paper',
                    color: message.senderType === 'USER' 
                      ? 'primary.contrastText' 
                      : 'text.primary',
                    boxShadow: message.senderType === 'USER' ? 2 : 1
                  }}
                >
                  <Typography variant="body1" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                    {message.message}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      opacity: 0.7,
                      display: 'block',
                      textAlign: 'right'
                    }}
                  >
                    {formatMessageTime(message.createdAt)}
                  </Typography>
                </Paper>
              </Box>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Paper sx={{ p: 2, backgroundColor: 'background.paper', boxShadow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      AI is typing...
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </Paper>

      {/* Message Input Form */}
      <Paper sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              ref={inputRef}
              fullWidth
              multiline
              maxRows={4}
              value={inputMessage}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder={isConnected ? "Type your message..." : "Waiting for connection..."}
              disabled={isSending || !isConnected}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isConnected ? 'background.paper' : 'action.disabledBackground'
                }
              }}
            />
            <Button 
              type="submit" 
              variant="contained"
              disabled={!inputMessage.trim() || isSending || !isConnected}
              sx={{ minWidth: 'auto', px: 2, py: 1 }}
            >
              {isSending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon />
              )}
            </Button>
          </Box>
        </form>
        
        {/* Status Bar */}
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {contactId && `Contact: ${contactId}`}
            {estimateId && ` | Estimate: ${estimateId}`}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Connection Status */}
            <Tooltip title={`Connection Status: ${getConnectionStatusText()}`}>
              <Chip 
                icon={getConnectionStatusIcon()}
                label={getConnectionStatusText()}
                size="small" 
                color={getConnectionStatusColor()}
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            </Tooltip>
            
            {/* Message Status */}
            {isSending && (
              <Chip 
                icon={<CircularProgress size={12} />}
                label="Sending..."
                size="small" 
                color="info"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
            
            {/* Manual Reconnect Button */}
            {!isConnected && !isReconnecting && (
              <Tooltip title="Reconnect">
                <IconButton 
                  size="small" 
                  onClick={reconnect}
                  color="primary"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default AIChat;
