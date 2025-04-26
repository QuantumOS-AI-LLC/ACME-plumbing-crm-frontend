import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Button,
  Avatar,
  Divider,
  IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../components/common/PageHeader';

const AIAssistantPage = () => {
  const [conversations, setConversations] = useState([
    { id: 1, name: 'Alli', messages: [], selected: true },
    { id: 2, name: 'Roeich', messages: [], selected: false },
    { id: 3, name: 'Developer', messages: [], selected: false }
  ]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Sample initial conversation with Alli
  const alliMessages = [
    { id: 1, sender: 'ai', text: "Hello! I'm Alli, your digital worker manager. How can I help you today?" },
    { id: 2, sender: 'user', text: "I need to check the status of Project X." },
    { id: 3, sender: 'ai', text: "Project X is currently in progress. The team completed the initial assessment phase yesterday and is now working on the implementation. The current completion is at 45% and it's on track to be completed by the scheduled date of June 15th." },
    { id: 4, sender: 'user', text: "Great! Any pending tasks I should know about?" },
    { id: 5, sender: 'ai', text: "Yes, there are 3 pending tasks: 1. Material approval for phase 2 (due in 2 days) 2. Client meeting for mid-project review (scheduled for tomorrow at 2 PM) 3. Budget review for the next milestone (due by end of week) Would you like me to help you with any of these tasks?" }
  ];

  useEffect(() => {
    // Set initial messages for the first conversation
    const updatedConversations = [...conversations];
    updatedConversations[0].messages = alliMessages;
    setConversations(updatedConversations);
    setActiveConversation(updatedConversations[0]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectConversation = (id) => {
    const updatedConversations = conversations.map(convo => ({
      ...convo,
      selected: convo.id === id
    }));
    
    setConversations(updatedConversations);
    setActiveConversation(updatedConversations.find(convo => convo.id === id));
  };

  const createNewConversation = () => {
    const newId = Math.max(...conversations.map(c => c.id)) + 1;
    
    const newConversation = {
      id: newId,
      name: `Conversation ${newId}`,
      messages: [],
      selected: true
    };
    
    const updatedConversations = conversations.map(convo => ({
      ...convo,
      selected: false
    }));
    
    setConversations([...updatedConversations, newConversation]);
    setActiveConversation(newConversation);
  };

  const handleSendMessage = () => {
    if (!message.trim() || !activeConversation) return;
    
    const newUserMessage = {
      id: Date.now(),
      sender: 'user',
      text: message
    };
    
    // Update messages in the active conversation
    const updatedConversations = conversations.map(convo => {
      if (convo.id === activeConversation.id) {
        return {
          ...convo,
          messages: [...convo.messages, newUserMessage]
        };
      }
      return convo;
    });
    
    setConversations(updatedConversations);
    setActiveConversation(prev => ({
      ...prev,
      messages: [...prev.messages, newUserMessage]
    }));
    
    setMessage('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now(),
        sender: 'ai',
        text: `I'm analyzing your message: "${message}". I'll provide a response shortly.`
      };
      
      const updatedWithAiResponse = updatedConversations.map(convo => {
        if (convo.id === activeConversation.id) {
          return {
            ...convo,
            messages: [...convo.messages, aiResponse]
          };
        }
        return convo;
      });
      
      setConversations(updatedWithAiResponse);
      setActiveConversation(prev => ({
        ...prev,
        messages: [...prev.messages, aiResponse]
      }));
    }, 1000);
  };

  return (
    <Box>
      <PageHeader title="AI Assistant" />
      
      <Box sx={{ 
        display: 'flex', 
        height: 'calc(100vh - 180px)',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: 1
      }}>
        {/* Conversations sidebar */}
        <Box sx={{ 
          width: 250, 
          bgcolor: 'background.paper', 
          borderRight: 1, 
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Conversations</Typography>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<AddIcon />}
              onClick={createNewConversation}
            >
              New Conversation
            </Button>
          </Box>
          
          <Divider />
          
          <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {conversations.map(conversation => (
              <ListItem 
                key={conversation.id} 
                disablePadding
              >
                <ListItemButton 
                  selected={conversation.selected}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <ListItemText primary={conversation.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
        
        {/* Chat area */}
        <Box sx={{ 
          flexGrow: 1, 
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {activeConversation ? (
            <>
              {/* Chat header */}
              <Box sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                borderBottom: 1, 
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="h6">{activeConversation.name}</Typography>
              </Box>
              
              {/* Messages area */}
              <Box sx={{ 
                flexGrow: 1, 
                p: 2, 
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {activeConversation.messages.map(msg => (
                  <Box 
                    key={msg.id} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}
                  >
                    {msg.sender === 'ai' && (
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>AI</Avatar>
                    )}
                    <Paper sx={{ 
                      p: 2, 
                      maxWidth: '70%',
                      bgcolor: msg.sender === 'user' ? 'primary.light' : 'background.paper',
                      color: msg.sender === 'user' ? 'white' : 'text.primary',
                      borderRadius: msg.sender === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0'
                    }}>
                      <Typography variant="body1">{msg.text}</Typography>
                    </Paper>
                    {msg.sender === 'user' && (
                      <Avatar sx={{ bgcolor: 'secondary.main', ml: 1 }}>U</Avatar>
                    )}
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>
              
              {/* Message input */}
              <Box sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                borderTop: 1, 
                borderColor: 'divider',
                display: 'flex'
              }}>
                <TextField
                  fullWidth
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                />
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%'
            }}>
              <Typography variant="body1" color="text.secondary">
                Select a conversation to start chatting
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AIAssistantPage;
