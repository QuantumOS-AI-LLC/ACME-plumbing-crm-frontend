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
  Badge, // Import Badge component
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
  const [unreadCounts, setUnreadCounts] = useState({}); // State for unread counts { contactId: count }
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null); // Ref to hold the WebSocket instance
  const activeConversationRef = useRef(activeConversation); // Ref to track active conversation for WS handler

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
    activeConversationRef.current = activeConversation; // Keep the ref updated
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

  // Effect for WebSocket connection (runs once on mount)
  useEffect(() => {
    console.log("Attempting to establish WebSocket connection.");
    const wsUrl = "wss://get-connected-backend.dev.quantumos.ai";
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected to", wsUrl);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        console.log("WebSocket message received:", parsedData);

        if (
          parsedData.type === "newMessage" &&
          parsedData.data &&
          parsedData.data.senderType === "AI"
        ) {
          const incomingContactId = parsedData.data.contactId;
          const newAiMessage = {
            id: parsedData.data.id,
            senderType: parsedData.data.senderType,
            message: parsedData.data.message,
            createdAt: parsedData.data.createdAt,
          };

          // Use the ref to get the current active conversation
          if (incomingContactId === activeConversationRef.current?.contactId) {
            // Add to messages list if active (and prevent duplicates)
            setMessages((prev) => {
              if (!prev.some(msg => msg.id === newAiMessage.id)) {
                return [...prev, newAiMessage];
              }
              return prev;
            });
          } else {
            // Increment unread count for inactive conversation
            setUnreadCounts((prevCounts) => ({
              ...prevCounts,
              [incomingContactId]: (prevCounts[incomingContactId] || 0) + 1,
            }));
          }
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message or update state:", error);
      }
    };

    wsRef.current.onerror = (event) => {
      console.error("WebSocket error:", event);
    };

    wsRef.current.onclose = (event) => {
      console.log("WebSocket disconnected:", event.reason, event.code);
      wsRef.current = null; // Clear the ref on close
    };

    // Cleanup function to close WebSocket on component unmount
    return () => {
      if (wsRef.current) {
        console.log("Closing WebSocket connection on component unmount.");
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // Empty dependency array: run only once on mount

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectConversation = (contactId) => {
    const selected = conversations.find((c) => c.contactId === contactId);
    setActiveConversation(selected);
    // Reset unread count for the selected conversation
    setUnreadCounts((prevCounts) => ({
      ...prevCounts,
      [contactId]: 0,
    }));
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
      id: crypto.randomUUID(), // Use a unique temporary ID
      senderType: "USER",
      message: message,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setMessage("");
    try {
      // Send the message but don't handle the response here
      await sendMessageToAI(
        message,
        activeConversation?.contactId,
        activeConversation?.estimateId,
        activeConversation?.lastMessage?.userId
      );

      // AI response will be handled by fetching or WebSocket later
      
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
                  <Badge 
                    badgeContent={unreadCounts[conversation.contactId] || 0} 
                    color="primary"
                    sx={{ ml: 1 }} // Add some margin
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
                {messages.map((msg) => ( // Removed idx from map parameters
                  <Box
                    key={msg.id} // Use message ID as key
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
