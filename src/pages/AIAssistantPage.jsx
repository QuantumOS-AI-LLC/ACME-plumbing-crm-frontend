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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageHeader from '../components/common/PageHeader';
import { getConversations} from '../services/api';

const AIAssistantPage = () => {
  // converstaion list
  const [conversations, setConversations] = useState([
    // { id: 1, name: 'Alli', messages: [], selected: true }
    {
      contactId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      estimateId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      contactName: "Alli",
      estimateLeadName: "string",
      lastMessage: "string"
    }
  
  ]);
  useEffect(()=>{
    getConversations()
    .then((data)=>{
      setConversations([...conversations,...data.data])
    })
    .catch((err)=>{
      console.log(err)
    });
  },[]);

  // only for small devices
  const [isConversationListVisible,updateConversationListVisible]=useState(false);
  const showConversationList = ()=>{
    updateConversationListVisible(true);
  }
  const hideConversationList = ()=>{
    updateConversationListVisible(false);
  }


  // active converstaion item
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
    hideConversationList();
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
        display:'flex',
        flexDirection:{xs:'column',sm:'row'} ,
        height: 'calc(100vh - 180px)',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: 1
      }}>
        {/* Conversations sidebar */}
        <Box sx={{ 
          width: {sm: 240 },
          minWidth: {sm: 240 },
          maxWidth: {sm:240},
          height:'100%',
          bgcolor: 'background.paper', 
          borderRight: 1, 
          borderColor: 'divider',
          flexGrow: 1, 
          display: {xs:isConversationListVisible?'flex':'none', sm:'flex'},
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
            {conversations.map((conversation,idx) => (
              <ListItem 
                key={idx} 
                disablePadding
              >
                <ListItemButton 
                  selected={conversation.selected}
                  onClick={() => selectConversation(conversation.contactId)}
                >
                  <ListItemText primary={conversation.contactName} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
        
        {/* Chat area */}
        <Box sx={{ 
          flexGrow: 1, 
          bgcolor: 'background.paper',
          display:  {xs:isConversationListVisible?'none':'flex', sm:'flex'},
          flexDirection: 'column',
          height:'100%',
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
                  <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={showConversationList}
                    sx={{ mr: 1, display:{sm:"none"} }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                <Typography variant="h6">{activeConversation.contactName}</Typography>
              </Box>
              
              {/* Messages area */}
              <Box sx={{ 
                flexGrow: 1, 
                p: 2, 
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default'
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
              flexDirection:'column',
              gap:'16px',
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%'
            }}>
              <Typography variant="body1" color="text.secondary">
                Select a conversation to start chatting
              </Typography>
              <Button 
                variant="outlined" 
                onClick={showConversationList}
                sx={{
                  display:{md:"none"}
                }}
              >
                See Conversations
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AIAssistantPage;
