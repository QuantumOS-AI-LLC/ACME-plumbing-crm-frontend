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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PageHeader from "../components/common/PageHeader";
import {
  getConversationMessages,
  getConversations,
  sendMessageToAI,
  createConversation,
} from "../services/api";

const AIAssistantPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const [isConversationListVisible, setConversationListVisible] =
    useState(false);

  const showConversationList = () => setConversationListVisible(true);
  const hideConversationList = () => setConversationListVisible(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    hideConversationList();
  }, [activeConversation]);

  useEffect(() => {
    const fetchAllConversations = async () => {
      try {
        const res = await getConversations();

        console.log("get conversation", res.data);

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
      // console.log("activeConversation:", activeConversation);

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
      const payload = {
        message: activeConversation?.lastMessage?.message,
        contactId: activeConversation?.contactId,
        estimateId: activeConversation?.estimateId,
        userId: activeConversation?.lastMessage?.userId,
      };

      console.log("payload", payload);

      const response = await createConversation(
        payload.message,
        payload.contactId,
        payload.estimateId
      );

      console.log("response data", response?.data);

      if (response?.data) {
        const newConversation = response.data;
        setConversations((prev) => [...prev, newConversation]);
        setActiveConversation(newConversation);
        return newConversation;
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (error) {
      console.error("Error creating new conversation:", error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeConversation) return;

    const newUserMessage = {
      // id: `${Date.now()}-${Math.random()}`,
      id: activeConversation?.lastMessage?.id,
      senderType: "USER",
      message: message,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setMessage("");
    try {
      const response = await sendMessageToAI(
        message,
        activeConversation?.contactId,
        activeConversation?.estimateId,
        activeConversation?.lastMessage?.userId
      );

      // console.log("hello", response.data);

      if (response?.data?.message) {
        const aiResponse = {
          id: `${Date.now()}-${Math.random()}`,
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
          flexDirection: { xs: "column", sm: "row" },
          height: "calc(100vh - 180px)",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 1,
        }}
      >
        {/* Sidebar */}
        <Box
          sx={{
            width: { sm: 240 },
            minWidth: { sm: 240 },
            maxWidth: { sm: 240 },
            height: "100%",
            bgcolor: "background.paper",
            borderRight: 1,
            borderColor: "divider",
            flexGrow: 1,
            display: {
              xs: isConversationListVisible ? "flex" : "none",
              sm: "flex",
            },
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
              <ListItem key={conversation.contactId} disablePadding>
                <ListItemButton
                  selected={
                    activeConversation?.contactId === conversation.contactId
                  }
                  onClick={() => selectConversation(conversation.contactId)}
                >
                  <ListItemText
                    primary={conversation.contactName || "Unnamed Contact"}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Chat Area */}
        <Box
          sx={{
            flexGrow: 1,
            bgcolor: "background.paper",
            display: {
              xs: isConversationListVisible ? "none" : "flex",
              sm: "flex",
            },
            flexDirection: "column",
            height: "100%",
          }}
        >
          {activeConversation ? (
            <>
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
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={showConversationList}
                  sx={{ mr: 1, display: { sm: "none" } }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6">
                  {activeConversation.contactName || "AI Conversation"}
                </Typography>
              </Box>

              <Box
                sx={{
                  flexGrow: 1,
                  p: 2,
                  overflow: "auto",
                  display: "flex",
                  flexDirection: "column",
                  bgcolor: "background.default",
                }}
              >
                {messages.map((msg, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      justifyContent:
                        msg.senderType === "USER" ? "flex-end" : "flex-start",
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
                        px:2,
                        py:1.5,
                        maxWidth: "70%",
                        bgcolor:
                          msg.senderType === "USER"
                            ? "primary.main"
                            : "background.paper",
                        color:
                          msg.senderType === "USER" ? "white" : "text.primary",
                        borderRadius:
                          msg.senderType === "USER"
                            ? "20px 0 20px 20px"
                            : "0px 20px 20px 20px",
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
                flexDirection: "column",
                gap: "16px",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Typography variant="body1" color="text.secondary">
                Select a conversation to start chatting
              </Typography>
              <Button
                variant="outlined"
                onClick={showConversationList}
                sx={{
                  display: { md: "none" },
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
