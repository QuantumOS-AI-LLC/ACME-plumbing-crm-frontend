import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../contexts/SocketContext";
import { getConversationMessages } from "../services/api"; // Adjust path if necessary

export const useAIChat = (
    contactId,
    estimateId = null,
    initialConversationId = null,
    onConversationSaved = () => {}
) => {
    const { socket } = useSocket();
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [totalMessages, setTotalMessages] = useState(0);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        if (!socket) return;

        // Listen for AI messages
        socket.on("ai_message", (messageData) => {
            console.log("AI message received:", messageData);

            // Extract the actual message from the nested structure
            const actualMessage = messageData.message;

            // Only add if it's for the current conversation
            if (
                actualMessage.contactId === contactId &&
                actualMessage.estimateId === estimateId
            ) {
                setMessages((prev) => [...prev, actualMessage]);
            }
        });

        // Listen for message saved confirmation
        socket.on("message_saved", (data) => {
            console.log("Message saved:", data);
            setIsSending(false);

            // Add user message to conversation
            if (
                data.message.contactId === contactId &&
                data.message.estimateId === estimateId
            ) {
                setMessages((prev) => [...prev, data.message]);
                // If this was a new conversation, update its ID in the parent component
                if (
                    initialConversationId &&
                    data.message.conversationId !== initialConversationId
                ) {
                    onConversationSaved(contactId, data.message.conversationId);
                }
            }
        });

        // Listen for typing indicators
        socket.on("user_typing", (data) => {
            if (
                data.contactId === contactId &&
                data.estimateId === estimateId
            ) {
                setIsTyping(data.isTyping);
            }
        });

        // Listen for errors
        socket.on("error", (error) => {
            console.error("Socket error:", error);
            setIsSending(false);
        });

        return () => {
            socket.off("ai_message");
            socket.off("message_saved");
            socket.off("user_typing");
            socket.off("error");
        };
    }, [
        socket,
        contactId,
        estimateId,
        initialConversationId,
        onConversationSaved,
    ]);

    // Reset pagination when contact changes
    const resetPagination = useCallback(() => {
        setCurrentPage(1);
        setHasMoreMessages(true);
        setIsLoadingMore(false);
        setTotalMessages(0);
        setPagination(null);
    }, []);

    // Load more messages (for infinite scroll)
    const loadMoreMessages = useCallback(async () => {
        if (
            !contactId ||
            !socket ||
            isLoadingMore ||
            !hasMoreMessages ||
            isLoadingHistory
        ) {
            return;
        }

        setIsLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            console.log(`Loading page ${nextPage} for contact ${contactId}`);

            const response = await getConversationMessages(
                contactId,
                nextPage,
                15
            );

            if (
                response &&
                response.success &&
                response.data &&
                Array.isArray(response.data)
            ) {
                const newMessages = response.data;
                const paginationInfo = response.pagination;

                console.log(
                    `Loaded ${newMessages.length} messages from page ${nextPage}`
                );
                console.log("Pagination info:", paginationInfo);

                // Only update if we actually got new messages
                if (newMessages.length > 0) {
                    // Prepend older messages to the beginning of the array
                    setMessages((prev) => [...newMessages, ...prev]);

                    // Update pagination state
                    setCurrentPage(nextPage);
                    setPagination(paginationInfo);
                    setTotalMessages(paginationInfo?.totalMessages || 0);
                    setHasMoreMessages(paginationInfo?.hasNextPage || false);
                } else {
                    console.log("No new messages received");
                    setHasMoreMessages(false);
                }
            } else {
                console.log("No more messages to load");
                setHasMoreMessages(false);
            }
        } catch (error) {
            console.error("Error loading more messages:", error);
            setHasMoreMessages(false);
        } finally {
            // Add a small delay to prevent rapid successive calls
            setTimeout(() => {
                setIsLoadingMore(false);
            }, 300);
        }
    }, [
        contactId,
        socket,
        currentPage,
        isLoadingMore,
        hasMoreMessages,
        isLoadingHistory,
    ]);

    // Effect to load initial message history
    useEffect(() => {
        const loadHistory = async () => {
            if (contactId && socket) {
                setIsLoadingHistory(true);
                setMessages([]); // Clear messages from previous conversation
                resetPagination(); // Reset pagination state

                try {
                    console.log(
                        `Loading initial messages for contact ${contactId}`
                    );
                    const historyResponse = await getConversationMessages(
                        contactId,
                        1,
                        15
                    );

                    if (
                        historyResponse &&
                        historyResponse.success &&
                        historyResponse.data &&
                        Array.isArray(historyResponse.data)
                    ) {
                        const initialMessages = historyResponse.data;
                        const paginationInfo = historyResponse.pagination;

                        console.log(
                            `Loaded ${initialMessages.length} initial messages`
                        );
                        console.log("Initial pagination info:", paginationInfo);

                        setMessages(initialMessages);
                        setPagination(paginationInfo);
                        setTotalMessages(paginationInfo?.totalMessages || 0);
                        setHasMoreMessages(
                            paginationInfo?.hasNextPage || false
                        );
                        setCurrentPage(1);
                    } else {
                        console.log(
                            "No message history found or invalid format for contact:",
                            contactId,
                            historyResponse
                        );
                        setMessages([]);
                        setHasMoreMessages(false);
                    }
                } catch (error) {
                    console.error(
                        "Error fetching conversation history for contact:",
                        contactId,
                        error
                    );
                    setMessages([]);
                    setHasMoreMessages(false);
                } finally {
                    setIsLoadingHistory(false);
                    // If it's a new conversation, trigger the onConversationSaved callback
                    if (initialConversationId && messages.length === 0) {
                        onConversationSaved(contactId, initialConversationId);
                    }
                }
            } else {
                setMessages([]); // Clear messages if no contactId
                resetPagination();
            }
        };

        loadHistory();
    }, [
        contactId,
        socket,
        initialConversationId,
        onConversationSaved,
        resetPagination,
    ]); // Rerun when contactId or socket changes

    const sendMessage = useCallback(
        (message, attachments = []) => {
            if (
                !socket ||
                (!message.trim() && attachments.length === 0) ||
                isSending
            )
                return;

            setIsSending(true);
            const messageToSend =
                message.trim() === "" && attachments.length > 0
                    ? null
                    : message.trim();
            socket.emit("user_message", {
                message: messageToSend,
                contactId,
                estimateId,
                attachments, // Include attachments in the payload
            });
        },
        [socket, contactId, estimateId, isSending]
    );

    const startTyping = useCallback(() => {
        if (socket) {
            socket.emit("typing_start", { contactId, estimateId });
        }
    }, [socket, contactId, estimateId]);

    const stopTyping = useCallback(() => {
        if (socket) {
            socket.emit("typing_stop", { contactId, estimateId });
        }
    }, [socket, contactId, estimateId]);

    return {
        messages,
        isTyping,
        isSending,
        isLoadingHistory,
        sendMessage,
        startTyping,
        stopTyping,
        // Pagination-related exports
        loadMoreMessages,
        hasMoreMessages,
        isLoadingMore,
        currentPage,
        totalMessages,
        pagination,
    };
};

export default useAIChat;
