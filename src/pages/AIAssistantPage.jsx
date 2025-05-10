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
  Badge,
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
  sendAlliBotMessage,
  getAlliBotHistory,
} from "../services/api";

const AIAssistantPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [userId, setUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const activeConversationRef = useRef(activeConversation);
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
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Fetch userId and set AlliBot as default
  useEffect(() => {
    const profileString = localStorage.getItem("userProfile");
    if (profileString) {
      try {
        const profile = JSON.parse(profileString);
        const id =
          profile?.user?.id ||
          profile?.data?.user?.id ||
          profile?.data?.id ||
          profile?.id;

        if (id) {
          const userIdString = id.toString();
          setUserId(userIdString);

          // Set AlliBot as default
          setActiveConversation({
            contactId: userIdString,
            contactName: "Alli",
            isAlliBot: true,
          });
        } else {
          console.error("User ID not found in profile data. Profile:", profile);
        }
      } catch (e) {
        console.error("Failed to parse userProfile from localStorage", e);
      }
    }
  }, []);

  // Load conversations from backend
  useEffect(() => {
    const fetchAllConversations = async () => {
      try {
        const res = await getConversations();
        const convos = res?.data || [];
        setConversations(convos);
      } catch (error) {
        console.error("Error loading conversations:", error);
      }
    };

    if (userId) {
      fetchAllConversations();
    }
  }, [userId]);

  // Load messages for active conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (activeConversation?.isAlliBot && activeConversation.contactId) {
        try {
          const data = await getAlliBotHistory(activeConversation.contactId);
          setMessages(data?.data || []);
        } catch (error) {
          console.error("Failed to fetch AlliBot history:", error);
          setMessages([]);
        }
      } else if (activeConversation?.contactId) {
        try {
          const data = await getConversationMessages(
            activeConversation.contactId
          );
          setMessages(data?.data || []);
        } catch (error) {
          console.error("Failed to fetch messages:", error);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    };

    if (activeConversation) {
      fetchMessages();
    }
  }, [activeConversation]);

  // WebSocket
  useEffect(() => {
    const wsUrl = "wss://get-connected-backend.dev.quantumos.ai";
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
    };

    wsRef.current.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);

        if (
          parsedData.type === "newMessage" &&
          parsedData.data?.senderType === "AI" &&
          parsedData.data.contactId !== 0
        ) {
          const newAiMessage = {
            id: parsedData.data.id,
            senderType: parsedData.data.senderType,
            message: parsedData.data.message,
            createdAt: parsedData.data.createdAt,
            contactId: parsedData.data.contactId,
          };

          if (
            newAiMessage.contactId === activeConversationRef.current?.contactId
          ) {
            setMessages((prev) =>
              prev.some((msg) => msg.id === newAiMessage.id)
                ? prev
                : [...prev, newAiMessage]
            );
          } else {
            setUnreadCounts((prev) => ({
              ...prev,
              [newAiMessage.contactId]: (prev[newAiMessage.contactId] || 0) + 1,
            }));
          }
        } else if (
          parsedData.type === "newAlliBotMessage" &&
          parsedData.data?.senderType === "ALLI_BOT"
        ) {
          const newAlliBotMessage = {
            id: parsedData.data.id,
            senderType: "ALLI_BOT",
            message: parsedData.data.message,
            createdAt: parsedData.data.createdAt,
          };

          if (
            activeConversationRef.current?.isAlliBot &&
            parsedData.data.userId === activeConversationRef.current.contactId
          ) {
            setMessages((prev) =>
              prev.some((msg) => msg.id === newAlliBotMessage.id)
                ? prev
                : [...prev, newAlliBotMessage]
            );
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    wsRef.current.onerror = (e) => console.error("WebSocket error:", e);
    wsRef.current.onclose = () => console.log("WebSocket closed");

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectConversation = (idOrMarker) => {
    if (idOrMarker === "ALLI_BOT_MARKER") {
      if (userId) {
        setActiveConversation({
          contactId: userId,
          contactName: "Alli",
          isAlliBot: true,
        });
        setMessages([]);
      } else {
        console.warn("User ID not yet available to set AlliBot");
      }
      return;
    }

    const selected = conversations.find((c) => c.contactId === idOrMarker);
    if (selected) {
      setActiveConversation({ ...selected, isAlliBot: false });
      setUnreadCounts((prev) => ({ ...prev, [idOrMarker]: 0 }));
    }
  };

  const createNewConversationHandler = async () => {
    try {
      const payload = {
        message: activeConversation?.lastMessage?.message,
        contactId: activeConversation?.contactId,
        estimateId: activeConversation?.estimateId,
        userId: activeConversation?.lastMessage?.userId,
      };

      const res = await createConversation(
        payload.message,
        payload.contactId,
        payload.estimateId
      );

      if (res?.data) {
        const newConvo = res.data;
        setConversations((prev) => [...prev, newConvo]);
        setActiveConversation(newConvo);
        return newConvo;
      }
    } catch (err) {
      console.error("Create conversation failed:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeConversation) return;

    const localMessage = message;
    setMessage("");

    const newUserMessage = {
      id: crypto.randomUUID(),
      senderType: "USER",
      message: localMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMessage]);

    try {
      if (activeConversation.isAlliBot && activeConversation.contactId) {
        const res = await sendAlliBotMessage(
          localMessage,
          activeConversation.contactId
        );
        if (res?.data?.id) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === newUserMessage.id
                ? {
                    ...msg,
                    id: res.data.id,
                    userId: activeConversation.contactId,
                  }
                : msg
            )
          );
        }
      } else if (activeConversation.contactId) {
        await sendMessageToAI(
          localMessage,
          activeConversation.contactId,
          activeConversation.estimateId,
          activeConversation.lastMessage?.userId || userId
        );
      }
    } catch (err) {
      console.error("Message send failed:", err);
      setMessages((prev) => prev.filter((msg) => msg.id !== newUserMessage.id));
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
              disabled={activeConversation?.isAlliBot === true}
            >
              New Conversation
            </Button>
          </Box>
          <Divider />
          <List sx={{ flexGrow: 1, overflow: "auto" }}>
            <ListItem>
              <ListItemButton
                selected={activeConversation?.isAlliBot === true}
                onClick={() => selectConversation("ALLI_BOT_MARKER")}
                disabled={!userId}
              >
                <ListItemText primary="Alli" />
                <Badge badgeContent={0} color="primary" sx={{ ml: 1 }} />
              </ListItemButton>
            </ListItem>

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
                    sx={{ ml: 1 }}
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
                {messages.map((msg) => (
                  <Box
                    key={msg.id}
                    sx={{
                      display: "flex",
                      justifyContent:
                        msg.senderType === "USER" ? "flex-end" : "flex-start",
                      mb: 2,
                    }}
                  >
                    {(msg.senderType === "AI" ||
                      msg.senderType === "ALLI_BOT") && (
                      <Avatar sx={{ bgcolor: "primary.main", mr: 1 }}>
                        {msg.senderType === "ALLI_BOT" ? "AB" : "AI"}
                      </Avatar>
                    )}
                    <Paper
                      sx={{
                        px: 2,
                        py: 1.5,
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
                  disabled={!activeConversation}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || !activeConversation}
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
                sx={{ display: { md: "none" } }}
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
