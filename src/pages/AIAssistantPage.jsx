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
    CircularProgress,
    Skeleton,
    Backdrop,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PageHeader from "../components/common/PageHeader";
import AIChat from "../components/ai-assistant/AIChat";
import {
    getConversations,
    // createConversation, // Commented out - create conversation functionality disabled
} from "../services/api";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../hooks/useAuth"; // Corrected import path for useAuth

// BOT_CONTACT_ID will now come from AuthContext

const AIAssistantPage = () => {
    const { user, loading: authLoading } = useAuth(); // Get user and auth loading state
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [isConversationListVisible, setConversationListVisible] =
        useState(false);
    const { isConnected } = useSocket();
    const [conversationsLoading, setConversationsLoading] = useState(false);
    // const [newConversationLoading, setNewConversationLoading] = useState(false); // Commented out - not needed when create functionality is disabled

    const showConversationList = () => setConversationListVisible(true);
    const hideConversationList = () => setConversationListVisible(false);

    useEffect(() => {
        hideConversationList();
    }, [activeConversation]);

    useEffect(() => {
        const getBotContactIdFromUser = () => {
            if (user) {
                if (user.botContactId) { // Path if user object is directly the user details
                    return user.botContactId;
                } else if (user.data && user.data.user && user.data.user.botContactId) { // Path if user object is the full API response from localStorage
                    return user.data.user.botContactId;
                }
            }
            return null; // Return null if not found
        };

        const fetchAllConversations = async (currentBotContactId) => {
            if (!currentBotContactId) {
                console.warn("Bot Contact ID not available yet. Skipping conversation load.");
                // Optionally, set conversations to empty or show a specific state
                setConversations([]);
                setActiveConversation(null);
                return;
            }

            setConversationsLoading(true);
            let finalConvos = [];
            try {
                const res = await getConversations();
                const apiConvos = res?.data || [];

                const alliFromApi = apiConvos.find(convo => convo.contactId === currentBotContactId);

                if (alliFromApi) {
                    alliFromApi.contactName = "Alli";
                    finalConvos = [alliFromApi, ...apiConvos.filter(convo => convo.contactId !== currentBotContactId)];
                } else {
                    const localAlliConversation = {
                        contactId: currentBotContactId,
                        contactName: "Alli",
                        lastMessage: null,
                        estimateId: null
                    };
                    finalConvos = [localAlliConversation, ...apiConvos];
                }
                
                setConversations(finalConvos);
                if (finalConvos.length > 0) {
                    setActiveConversation(finalConvos[0]);
                }

            } catch (error) {
                console.error("Error loading conversations:", error);
                const localAlliConversation = {
                    contactId: currentBotContactId, // Use currentBotContactId even in error
                    contactName: "Alli",
                    lastMessage: null,
                    estimateId: null
                };
                finalConvos = [localAlliConversation];
                setConversations(finalConvos);
                setActiveConversation(localAlliConversation);
            } finally {
                setConversationsLoading(false);
            }
        };

        if (!authLoading) {
            const botId = getBotContactIdFromUser();
            if (botId) {
                fetchAllConversations(botId);
            } else {
                 // Handle case where botId is still not available after auth loading
                console.warn("Bot Contact ID could not be determined from user profile.");
                // Fallback or show error, for now, we'll load an empty state or a default Alli.
                // This part depends on desired behavior if botContactId is missing from user profile.
                // For now, let's ensure Alli is still created with a placeholder if needed,
                // or rely on the error handling within fetchAllConversations if it's passed null.
                // To be safe, we can call fetchAllConversations with a null/undefined botId
                // and let its internal logic handle the fallback if currentBotContactId is null.
                 fetchAllConversations(null); // Or handle this state more explicitly
            }
        }
    }, [authLoading, user]); // Rerun when authLoading or user changes

    const selectConversation = (contactId) => {
        const selected = conversations.find((c) => c.contactId === contactId);
        setActiveConversation(selected);

        setUnreadCounts((prevCounts) => ({
            ...prevCounts,
            [contactId]: 0,
        }));
    };

    // COMMENTED OUT - Create conversation functionality disabled
    // const createNewConversationHandler = async () => {
    //     setNewConversationLoading(true);
    //     try {
    //         const payload = {
    //             message: activeConversation?.lastMessage?.message,
    //             contactId: activeConversation?.contactId,
    //             estimateId: activeConversation?.estimateId,
    //             userId: activeConversation?.lastMessage?.userId,
    //         };

    //         const response = await createConversation(
    //             payload.message,
    //             payload.contactId,
    //             payload.estimateId
    //         );

    //         if (response?.data) {
    //             const newConversation = response.data;
    //             setConversations((prev) => [...prev, newConversation]);
    //             setActiveConversation(newConversation);
    //             return newConversation;
    //         } else {
    //             throw new Error("Invalid response format from API");
    //         }
    //     } catch (error) {
    //         console.error("Error creating new conversation:", error);
    //         throw error;
    //     } finally {
    //         setNewConversationLoading(false);
    //     }
    // };

    // Show main loading backdrop while auth is loading
    if (authLoading) {
        return (
            <Box>
                <PageHeader title="AI Assistant" />
                <Backdrop
                    sx={{ 
                        color: '#fff', 
                        zIndex: (theme) => theme.zIndex.drawer + 1,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)'
                    }}
                    open={true}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <CircularProgress color="primary" />
                        <Typography variant="body1" color="primary">
                            Loading AI Assistant...
                        </Typography>
                    </Box>
                </Backdrop>
            </Box>
        );
    }

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
                        {/* COMMENTED OUT - Create conversation functionality disabled */}
                        {/* <Button
                            variant="outlined"
                            fullWidth
                            startIcon={newConversationLoading ? <CircularProgress size={16} /> : <AddIcon />}
                            onClick={createNewConversationHandler}
                            disabled={newConversationLoading}
                        >
                            {newConversationLoading ? "Creating..." : "New Conversation"}
                        </Button> */}
                    </Box>
                    <Divider />

                    <List sx={{ flexGrow: 1, overflow: "auto" }}>
                        {conversationsLoading ? (
                            // Loading skeleton for conversations
                            Array.from({ length: 3 }).map((_, index) => (
                                <ListItem key={`skeleton-${index}`} disablePadding>
                                    <ListItemButton>
                                        <Skeleton variant="text" width="100%" height={40} />
                                    </ListItemButton>
                                </ListItem>
                            ))
                        ) : (
                            conversations.map((conversation) => (
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
                            ))
                        )}
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
                            {conversationsLoading ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                    <CircularProgress />
                                    <Typography variant="body1" color="text.secondary">
                                        Loading conversations...
                                    </Typography>
                                </Box>
                            ) : (
                                <>
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
                                </>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default AIAssistantPage;
