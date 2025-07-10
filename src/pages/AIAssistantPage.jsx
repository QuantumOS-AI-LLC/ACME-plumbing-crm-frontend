import React, { useState, useEffect, useCallback } from "react";
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
    ButtonBase, // Import ButtonBase
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
import { useSearchParams, useNavigate } from "react-router-dom"; // Import useNavigate
import InfiniteScroll from "react-infinite-scroll-component"; // Import InfiniteScroll

// BOT_CONTACT_ID will now come from AuthContext

const AIAssistantPage = () => {
    const navigate = useNavigate(); // Initialize useNavigate
    const [searchParams] = useSearchParams();
    const contactId = searchParams.get("contactId");
    const contactName = searchParams.get("contactName");
    const conversationId = searchParams.get("conversationId"); // This is the initial, temporary ID
    const { user, loading: authLoading } = useAuth(); // Get user and auth loading state
    const [conversations, setConversations] = useState([]);
    const [botContactConversation, setBotContactConversation] = useState(null); // New state for bot contact
    const [activeConversation, setActiveConversation] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [isConversationListVisible, setConversationListVisible] =
        useState(false);
    const { isConnected } = useSocket();
    const [conversationsLoading, setConversationsLoading] = useState(false); // Used for the InfiniteScroll loader
    const [isInitialLoading, setIsInitialLoading] = useState(true); // New state for initial full-list loading
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreConversations, setHasMoreConversations] = useState(true);
    const [totalConversations, setTotalConversations] = useState(0);
    const CONVERSATIONS_PER_PAGE = 20; // Define a constant for items per page

    // const [newConversationLoading, setNewConversationLoading] = useState(false); // Commented out - not needed when create functionality is disabled

    useEffect(() => {
        if (contactId && contactName && conversationId) {
            setConversations((prevConversations) => {
                const newConversation = {
                    contactId: contactId,
                    contactName: contactName,
                    id: conversationId, // This is the temporary UUID
                    lastMessage: null, // Initialize as empty
                    estimateId: null,
                };

                // Check if a conversation with this temporary ID already exists
                const exists = prevConversations.some(
                    (convo) => convo.id === newConversation.id
                );

                if (!exists) {
                    // If it doesn't exist, add it to the beginning of the list
                    // This ensures it appears prominently when created from Contact Details
                    return [newConversation, ...prevConversations];
                }
                return prevConversations; // If it exists, return previous state unchanged
            });
            // Do NOT set activeConversation here. It will be handled by the fetchAllConversations useEffect.
        }
    }, [contactId, contactName, conversationId]); // Dependencies for this effect

    const showConversationList = () => setConversationListVisible(true);
    const hideConversationList = () => setConversationListVisible(false);

    useEffect(() => {
        hideConversationList();
    }, [activeConversation]);

    const fetchAllConversations = useCallback(
        async (currentBotContactId, pageToFetch = 1, limitToFetch = CONVERSATIONS_PER_PAGE) => {
            if (!currentBotContactId) {
                console.warn(
                    "Bot Contact ID not available yet. Skipping conversation load."
                );
                if (pageToFetch === 1) {
                    setConversations([]);
                    setActiveConversation(null);
                    setHasMoreConversations(false);
                    setTotalConversations(0);
                }
                return;
            }

            if (pageToFetch === 1) {
                setIsInitialLoading(true);
            }
            setConversationsLoading(true); // This will be for the bottom loader
            try {
                const res = await getConversations(pageToFetch, limitToFetch);
                const apiConvos = res?.data?.conversations || [];
                const pagination = res?.data?.pagination;

                let fetchedConvos = apiConvos;

                // Separate bot contact from other conversations
                let botConvo = null;
                let otherConvos = apiConvos;

                if (pageToFetch === 1) {
                    botConvo = apiConvos.find(
                        (convo) => convo.contactId === currentBotContactId
                    );
                    // Use the contactName from the fetched botConvo if available, otherwise default to "Alli"
                    const botContactName = botConvo?.contactName || "Alli";

                    if (botConvo) {
                        botConvo.contactName = botContactName;
                        otherConvos = apiConvos.filter(
                            (convo) => convo.contactId !== currentBotContactId
                        );
                    } else {
                        // If bot contact not found in API response, create a local placeholder
                        botConvo = {
                            contactId: currentBotContactId,
                            contactName: botContactName,
                            lastMessage: null,
                            estimateId: null,
                        };
                    }
                    setBotContactConversation(botConvo);
                } else {
                    // For subsequent pages, just append to other conversations
                    setBotContactConversation((prev) => prev); // Keep existing bot contact
                }

                setConversations((prev) => {
                    // If it's the first page, replace existing conversations with otherConvos
                    // Otherwise, append new otherConvos
                    const newConvos = pageToFetch === 1 ? otherConvos : [...prev, ...otherConvos];

                    // Handle URL-driven new conversation, ensuring it's at the top if it exists
                    const newConvoFromURL =
                        contactId && conversationId
                            ? {
                                  contactId: contactId,
                                  contactName: contactName,
                                  id: conversationId,
                                  lastMessage: null,
                                  estimateId: null,
                              }
                            : null;

                    if (newConvoFromURL) {
                        const existsInFetched = newConvos.some(
                            (convo) => convo.id === newConvoFromURL.id
                        );
                        if (!existsInFetched) {
                            // Add the new conversation from URL to the top if it's not already in the fetched list
                            return [newConvoFromURL, ...newConvos];
                        }
                    }
                    return newConvos;
                });

                setHasMoreConversations(pagination?.hasNextPage || false);
                setTotalConversations(pagination?.totalItems || 0);
                setCurrentPage(pageToFetch);

                // Determine active conversation after all conversations are set
                if (pageToFetch === 1) {
                    if (contactId && conversationId) {
                        const newConvoFromURL = {
                            contactId: contactId,
                            contactName: contactName,
                            id: conversationId,
                            lastMessage: null,
                            estimateId: null,
                        };

                        const targetConversation = otherConvos.find(
                            (convo) =>
                                convo.contactId === contactId &&
                                convo.id === conversationId
                        );

                        if (!targetConversation && newConvoFromURL.contactId !== currentBotContactId) {
                            otherConvos.unshift(newConvoFromURL);
                        }

                        const targetConversationFinal = otherConvos.find(
                            (convo) =>
                                convo.contactId === contactId &&
                                convo.id === conversationId
                        );

                        if (targetConversationFinal) {
                            setActiveConversation(targetConversationFinal);
                        } else if (botConvo && contactId === currentBotContactId) {
                            setActiveConversation(botConvo);
                        } else if (otherConvos.length > 0) {
                            setActiveConversation(otherConvos[0]);
                        } else if (botConvo) {
                            setActiveConversation(botConvo);
                        }
                    } else if (botConvo) {
                        setActiveConversation(botConvo);
                    } else if (otherConvos.length > 0) {
                        setActiveConversation(otherConvos[0]);
                    }
                }
            } catch (error) {
                console.error("Error loading conversations:", error);
                if (pageToFetch === 1) {
                    const localAlliConversation = {
                        contactId: currentBotContactId,
                        contactName: "Alli", // Default to "Alli" if not found in API response
                        lastMessage: null,
                        estimateId: null,
                    };
                    setBotContactConversation(localAlliConversation);
                    setConversations([]); // No other conversations on error
                    setActiveConversation(localAlliConversation);
                    setHasMoreConversations(false);
                    setTotalConversations(1);
                }
            } finally {
                setConversationsLoading(false);
                if (pageToFetch === 1) {
                    setIsInitialLoading(false);
                }
            }
        },
        [contactId, contactName, conversationId] // Removed user from dependencies as it's not directly used for botContactName
    );

    useEffect(() => {
        if (!authLoading) {
            const getBotContactIdFromUser = () => {
                if (user) {
                    if (user.botContactId) {
                        return user.botContactId;
                    } else if (
                        user.data &&
                        user.data.user &&
                        user.data.user.botContactId
                    ) {
                        return user.data.user.botContactId;
                    }
                }
                return null;
            };
            const botId = getBotContactIdFromUser();
            if (botId) {
                fetchAllConversations(botId, 1, CONVERSATIONS_PER_PAGE);
            } else {
                console.warn(
                    "Bot Contact ID could not be determined from user profile."
                );
                fetchAllConversations(null, 1, CONVERSATIONS_PER_PAGE);
            }
        }
    }, [authLoading, user, fetchAllConversations]);

    const fetchMoreConversations = () => {
        if (hasMoreConversations && !conversationsLoading) {
            const getBotContactIdFromUser = () => {
                if (user) {
                    if (user.botContactId) {
                        return user.botContactId;
                    } else if (
                        user.data &&
                        user.data.user &&
                        user.data.user.botContactId
                    ) {
                        return user.data.user.botContactId;
                    }
                }
                return null;
            };
            const botId = getBotContactIdFromUser();
            if (botId) {
                fetchAllConversations(botId, currentPage + 1, CONVERSATIONS_PER_PAGE);
            }
        }
    };

    const handleConversationSaved = useCallback(
        (savedContactId, newConversationId) => {
            setConversations((prevConversations) =>
                prevConversations.map((convo) =>
                    convo.contactId === savedContactId &&
                    convo.id === conversationId // Match by contactId and the initial temporary ID
                        ? { ...convo, id: newConversationId } // Update with the new backend ID
                        : convo
                )
            );
            // Also update the active conversation if it's the one that was just saved
            setActiveConversation((prevActive) =>
                prevActive?.contactId === savedContactId &&
                prevActive?.id === conversationId
                    ? { ...prevActive, id: newConversationId }
                    : prevActive
            );
        },
        [conversationId]
    ); // Depend on conversationId from URL to correctly identify the temporary one

    const selectConversation = (contactId) => {
        let selected = null;
        if (botContactConversation && contactId === botContactConversation.contactId) {
            selected = botContactConversation;
        } else {
            selected = conversations.find((c) => c.contactId === contactId);
        }
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
                        color: "#fff",
                        zIndex: (theme) => theme.zIndex.drawer + 1,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                    }}
                    open={true}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
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
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <PageHeader title="AI Assistant" />
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    flexGrow: 1, // This will make it take all remaining vertical space
                    borderRadius: 2,
                    boxShadow: 1,
                    overflow: "hidden", // To contain children's scrollbars if any
                }}
            >
                {/* Sidebar */}
                <Box
                    sx={{
                        width: { sm: 240 },
                        minWidth: { sm: 240 },
                        maxWidth: { sm: 240 },
                        height: "100%", // This will be 100% of the flex-grown parent
                        bgcolor: "background.paper",
                        borderRight: 1,
                        borderColor: "divider",
                        display: {
                            xs: isConversationListVisible ? "flex" : "none",
                            sm: "flex",
                        },
                        flexDirection: "column",
                        overflowY: "auto", // Ensure this box is scrollable vertically
                        overflowX: "hidden", // Hide horizontal scrollbar
                    }}
                    id="conversation-list-scrollable-div" // ID for InfiniteScroll
                >
                    <Box sx={{ p: 2, flexShrink: 0 }}> {/* Fixed header */}
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
                    {botContactConversation && (
                        <List sx={{ pb: 0 }}> {/* Removed top and bottom padding */}
                            <ListItem disablePadding>
                                <ListItemButton
                                    selected={
                                        activeConversation?.contactId ===
                                        botContactConversation.contactId
                                    }
                                    onClick={() =>
                                        selectConversation(botContactConversation.contactId)
                                    }
                                >
                                    <ListItemText
                                        primary={botContactConversation.contactName || "Alli"}
                                    />
                                    <Badge
                                        badgeContent={
                                            unreadCounts[botContactConversation.contactId] || 0
                                        }
                                        color="primary"
                                        sx={{ ml: 1 }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        </List>
                    )}

                    <Box id="conversation-list-scrollable-div-inner" sx={{ flexGrow: 1, overflowY: "auto" }}> {/* Inner scrollable container */}
                        <InfiniteScroll
                            dataLength={conversations.length}
                            next={fetchMoreConversations}
                            hasMore={hasMoreConversations}
                            loader={
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            }
                            endMessage={
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    {totalConversations > 0 ? "You have seen all conversations" : "No conversations found."}
                                </Typography>
                            }
                            scrollableTarget="conversation-list-scrollable-div-inner" // Target the inner scrollable div
                        >
                            <List sx={{ flexGrow: 1 }}>
                                {isInitialLoading ? (
                                    Array.from({ length: 3 }).map((_, index) => (
                                        <ListItem
                                            key={`skeleton-${index}`}
                                            disablePadding
                                        >
                                            <ListItemButton>
                                                <Skeleton
                                                    variant="text"
                                                    width="100%"
                                                    height={40}
                                                />
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
                        </InfiniteScroll>
                    </Box>
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
                        height: "100%", // Ensure chat area takes full height of its parent
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
                                <ButtonBase
                                    onClick={() => {
                                        const botContactId = user?.botContactId || user?.data?.user?.botContactId;
                                        if (activeConversation?.contactId !== botContactId && activeConversation?.contactId) {
                                            navigate(`/contacts/${activeConversation.contactId}`);
                                        }
                                    }}
                                    sx={{
                                        textAlign: "left",
                                        justifyContent: "flex-start",
                                        p: 0,
                                        cursor: "pointer", // Default cursor
                                        "&:hover": {
                                            bgcolor: "action.hover", // Default hover background
                                        },
                                        borderRadius: 1,
                                        p: 0.5,
                                    }}
                                >
                                    <Typography variant="h6" color="primary.main">
                                        {activeConversation.contactName ||
                                            "AI Conversation"}
                                    </Typography>
                                </ButtonBase>
                            </Box>

                            {/* Socket.IO Chat Component */}
                            <Box sx={{ flexGrow: 1, p: 2, overflowY: "auto" }}> {/* Added overflowY to chat messages */}
                                <AIChat
                                    contactId={activeConversation.contactId}
                                    contactName={activeConversation.contactName}
                                    estimateId={activeConversation.estimateId}
                                    initialConversationId={conversationId} // Pass the initial temporary ID
                                    onConversationSaved={
                                        handleConversationSaved
                                    } // Pass the callback
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
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 2,
                                    }}
                                >
                                    <CircularProgress />
                                    <Typography
                                        variant="body1"
                                        color="text.secondary"
                                    >
                                        Loading conversations...
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <Typography
                                        variant="body1"
                                        color="text.secondary"
                                    >
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
