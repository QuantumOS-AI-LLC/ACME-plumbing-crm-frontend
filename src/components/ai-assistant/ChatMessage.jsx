import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';

const ChatMessage = ({ message, isUser }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2
      }}
    >
      {!isUser && (
        <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>AI</Avatar>
      )}
      <Paper sx={{ 
        p: 2, 
        maxWidth: '70%',
        bgcolor: isUser ? 'primary.light' : 'background.paper',
        color: isUser ? 'white' : 'text.primary',
        borderRadius: isUser ? '20px 20px 0 20px' : '20px 20px 20px 0'
      }}>
        <Typography variant="body1">{message.text}</Typography>
      </Paper>
      {isUser && (
        <Avatar sx={{ bgcolor: 'secondary.main', ml: 1 }}>U</Avatar>
      )}
    </Box>
  );
};

export default ChatMessage;
