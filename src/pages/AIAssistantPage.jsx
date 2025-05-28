import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Button,
    Divider,
    IconButton,
    Badge,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PageHeader from "../components/common/PageHeader";
import AIChat from "../components/ai-assistant/AIChat";
import {
    getConversations,
    createConversation,
} from "../services/api";
import { useSocket } from "../contexts/SocketContext";

// Get the bot contact ID from environment variables
const BOT_CONTACT_ID = import.meta.env.VITE_BOT_CONTACT_ID;

const AIAssistantPage = () => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [isConversationListVisible, setConversationListVisible] =
        useState(false);
    const { isConnected } = useSocket();

    const showConversationList = () => setConversationListVisible(true);
    const hideConversationList = () => setConversationListVisible(false);

    useEffect(() => {
        hideConversationList();
    }, [activeConversation]);

    useEffect(() => {
        const fetchAllConversations = async () => {
            let finalConvos = [];
            try {
                const res = await getConversations();
                const apiConvos = res?.data || [];

                // Check if Alli (with BOT_CONTACT_ID) is already in the API response
                const alliFromApi = apiConvos.find(convo => convo.contactId === BOT_CONTACT_ID);

                if (alliFromApi) {
                    // If Alli is from API, ensure it's at the top and named correctly
                    alliFromApi.contactName = "Alli"; // Ensure consistent naming
                    finalConvos = [alliFromApi, ...apiConvos.filter(convo => convo.contactId !== BOT_CONTACT_ID)];
                } else {
                    // If Alli is not from API, create it locally and prepend
                    const localAlliConversation = {
                        contactId: BOT_CONTACT_ID,
                        contactName: "Alli",
                        lastMessage: null, // Or fetch its last message if needed
                        estimateId: null
                    };
                    finalConvos = [localAlliConversation, ...apiConvos];
                }
                
                setConversations(finalConvos);
                if (finalConvos.length > 0) {
                    setActiveConversation(finalConvos[0]); // This should be Alli
                }

            } catch (error) {
                console.error("Error loading conversations:", error);
                // API failed, create a local Alli as a fallback
                const localAlliConversation = {
                    contactId: BOT_CONTACT_ID,
                    contactName: "Alli",
                    lastMessage: null,
                    estimateId: null
                };
                finalConvos = [localAlliConversation];
                setConversations(finalConvos);
                setActiveConversation(localAlliConversation);
            }
        };

        fetchAllConversations();
    }, []);

    const selectConversation = (contactId) => {
        const selected = conversations.find((c) => c.contactId === contactId);
        setActiveConversation(selected);

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

            const response = await createConversation(
                payload.message,
                payload.contactId,
                payload.estimateId
            );

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
                            <ListItem
                                key={conversation.contactId}
                                disablePadding
                            >
                                <ListItemButton
                                    selected={
                                        activeConversation?.contactId ===
                                        conversation.contactId
                                    }
                                    onClick={() =>
                                        selectConversation(
                                            conversation.contactId
                                        )
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            conversation.contactName ||
                                            "Unnamed Contact"
                                        }
                                    />
                                    <Badge
                                        badgeContent={
                                            unreadCounts[
                                                conversation.contactId
                                            ] || 0
                                        }
                                        color="primary"
                                        sx={{ ml: 1 }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>

                {/* Chat Area - Using Socket.IO AIChat Component */}
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
                            {/* Header */}
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
                                    {activeConversation.contactName ||
                                        "AI Conversation"}
                                </Typography>
                            </Box>

                            {/* Socket.IO Chat Component */}
                            <Box sx={{ flexGrow: 1, p: 2 }}>
                                <AIChat 
                                    contactId={activeConversation.contactId}
                                    estimateId={activeConversation.estimateId}
                                />
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
