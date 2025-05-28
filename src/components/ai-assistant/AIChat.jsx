import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAIChat } from '../../hooks/useAIChat';

const AIChat = ({ contactId, estimateId = null }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const {
    messages,
    isTyping,
    isSending,
    isLoading,
    sendMessage,
    startTyping,
    stopTyping
  } = useAIChat(contactId, estimateId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
      stopTyping();
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Messages Container */}
      <Paper 
        sx={{ 
          flexGrow: 1, 
          p: 2, 
          mb: 2, 
          maxHeight: '500px', 
          overflowY: 'auto',
          backgroundColor: '#f8f9fa'
        }}
      >
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading conversation history...
            </Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Start a conversation with the AI assistant
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => (
              <Box 
                key={message.id || index}
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
                      : 'text.primary'
                  }}
                >
                  <Typography variant="body1" sx={{ mb: 1 }}>
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
                <Paper sx={{ p: 2, backgroundColor: 'background.paper' }}>
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
              placeholder="Type your message..."
              disabled={isSending || isLoading}
              variant="outlined"
              size="small"
            />
            <Button 
              type="submit" 
              variant="contained"
              disabled={!inputMessage.trim() || isSending || isLoading}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              {isSending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon />
              )}
            </Button>
          </Box>
        </form>
        
        {/* Connection Status */}
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {contactId && `Contact: ${contactId}`}
            {estimateId && ` | Estimate: ${estimateId}`}
          </Typography>
          <Chip 
            label={
              isLoading ? "Loading..." : 
              isSending ? "Sending..." : 
              "Ready"
            } 
            size="small" 
            color={
              isLoading ? "info" :
              isSending ? "warning" : 
              "success"
            }
            variant="outlined"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default AIChat;
