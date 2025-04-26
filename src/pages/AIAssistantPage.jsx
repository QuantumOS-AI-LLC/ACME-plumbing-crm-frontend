import React, { useState, useEffect, useRef } from "react";
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
  IconButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import PageHeader from "../components/common/PageHeader";

const AIAssistantPage = () => {
  const [conversations, setConversations] = useState([
    { id: 1, name: "Alli", messages: [], selected: true },
    { id: 2, name: "Roeich", messages: [], selected: false },
    { id: 3, name: "Developer", messages: [], selected: false },
  ]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Sample initial conversation with Alli
  const alliMessages = [
    {
      id: 1,
      sender: "ai",
      text: "Hello! I'm Alli, your digital worker manager. How can I help you today?",
    },
    { id: 2, sender: "user", text: "I need to check the status of Project X." },
    {
      id: 3,
      sender: "ai",
      text: "Project X is currently in progress. The team completed the initial assessment phase yesterday and is now working on the implementation. The current completion is at 45% and it's on track to be completed by the scheduled date of June 15th.",
    },
    {
      id: 4,
      sender: "user",
      text: "Great! Any pending tasks I should know about?",
    },
    {
      id: 5,
      sender: "ai",
      text: "Yes, there are 3 pending tasks: 1. Material approval for phase 2 (due in 2 days) 2. Client meeting for mid-project review (scheduled for tomorrow at 2 PM) 3. Budget review for the next milestone (due by end of week) Would you like me to help you with any of these tasks?",
    },
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

  useEffect(() => {
    const fetchAllConversations = async () => {
      try {
        const res = await getConversations();
        const convos = res?.data || [];
        setConversations(convos);

        if (convos.length > 0) {
          setActiveConversation(convos[0]);
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
      }
    };

    fetchAllConversations();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (activeConversation?.contactId) {
        try {
          const data = await getConversationMessages(
            activeConversation.contactId
          );
          setMessages(data?.data || []);
        } catch (error) {
          console.error("Failed to fetch messages:", error);
        }
      }
    };

    fetchMessages();
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectConversation = (contactId) => {
    const selected = conversations.find((c) => c.contactId === contactId);
    setActiveConversation(selected);
  };

  const createNewConversationHandler = async () => {
    try {
      const newName = `Conversation ${conversations.length + 1}`;
      const newConv = await createConversation(newName);
      const newData = newConv?.data;

      if (newData) {
        const updatedList = [...conversations, newData];
        setConversations(updatedList);
        setActiveConversation(newData);
      }
    } catch (error) {
      console.error("Error creating new conversation:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeConversation) return;

    const newUserMessage = {
      id: `${Date.now()}-${Math.random()}`,
      senderType: "USER",
      message: message,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setMessage("");

    try {
      const response = await sendMessageToAI(
        message,
        activeConversation.contactId
      );

      if (response?.data?.message) {
        const aiResponse = {
          id: Date.now(),
          senderType: "AI",
          message: response.data.message || "No message received from AI.",
        };

        setMessages((prev) => [...prev, aiResponse]);
      } else {
        console.error("AI response is empty or malformed");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <Box>
      <PageHeader title="AI Assistant" />

      <Box
        sx={{
          display: "flex",
          height: "calc(100vh - 180px)",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 1,
        }}
      >
        {/* Conversations sidebar */}
        <Box
          sx={{
            width: 250,
            bgcolor: "background.paper",
            borderRight: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Conversations
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AddIcon />}
              onClick={createNewConversationHandler}
            >
              New Conversation
            </Button>
          </Box>
          <Divider />

          <List sx={{ flexGrow: 1, overflow: "auto" }}>
            {conversations.map((conversation) => (
              <ListItem key={conversation.id} disablePadding>
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
        <Box
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {activeConversation ? (
            <>
              {/* Chat header */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: "background.paper",
                  borderBottom: 1,
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6">{activeConversation.name}</Typography>
              </Box>

              {/* Messages area */}
              <Box
                sx={{
                  flexGrow: 1,
                  p: 2,
                  overflow: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {activeConversation.messages.map((msg) => (
                  <Box
                    key={msg.id}
                    sx={{
                      display: "flex",
                      justifyContent:
                        msg.sender === "user" ? "flex-end" : "flex-start",
                      mb: 2,
                    }}
                  >
                    {msg.senderType === "AI" && (
                      <Avatar sx={{ bgcolor: "primary.main", mr: 1 }}>
                        AI
                      </Avatar>
                    )}
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: "70%",
                        bgcolor:
                          msg.senderType === "USER"
                            ? "primary.main"
                            : "background.paper",
                        color:
                          msg.senderType === "USER" ? "white" : "text.primary",
                        borderRadius:
                          msg.senderType === "USER"
                            ? "20px 20px 0 20px"
                            : "20px 20px 20px 0",
                      }}
                    >
                      <Typography variant="body1">{msg.message}</Typography>
                    </Paper>
                    {msg.senderType === "USER" && (
                      <Avatar sx={{ bgcolor: "secondary.main", ml: 1 }}>
                        U
                      </Avatar>
                    )}
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>

              {/* Message Input */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: "background.paper",
                  borderTop: 1,
                  borderColor: "divider",
                  display: "flex",
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
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
