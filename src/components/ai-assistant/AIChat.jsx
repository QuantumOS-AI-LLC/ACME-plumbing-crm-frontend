import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import {
    Box,
    TextField,
    Button,
    Paper,
    Typography,
    CircularProgress,
    Chip,
    Modal,
    IconButton,
    ButtonBase, // Import ButtonBase for clickable Typography
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import { useAIChat } from "../../hooks/useAIChat";
import AttachmentInput from "./AttachmentInput";

const AIChat = ({
    contactId,
    contactName, // Accept contactName as a prop
    estimateId = null,
    initialConversationId = null,
    onConversationSaved = () => {},
}) => {
    const navigate = useNavigate(); // Initialize useNavigate
    const [inputMessage, setInputMessage] = useState("");
    const [selectedFilesToUpload, setSelectedFilesToUpload] = useState([]);
    const [uploadedAttachments, setUploadedAttachments] = useState([]);
    const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
    const [attachmentInputKey, setAttachmentInputKey] = useState(0);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [lastMessageCount, setLastMessageCount] = useState(0);
    const [isInitialScrolling, setIsInitialScrolling] = useState(false);
    const [scrollHeightBeforeLoad, setScrollHeightBeforeLoad] = useState(0);
    const [scrollTopBeforeLoad, setScrollTopBeforeLoad] = useState(0);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const hasInitialLoadRef = useRef(false); // Track initial load

    const {
        messages,
        isTyping,
        isSending,
        isLoadingHistory,
        sendMessage,
        startTyping,
        stopTyping,
        loadMoreMessages,
        hasMoreMessages,
        isLoadingMore,
        currentPage,
        totalMessages,
        pagination,
    } = useAIChat(
        contactId,
        estimateId,
        initialConversationId,
        onConversationSaved
    );

    // Scroll event handler for infinite scroll
    const handleScroll = useCallback(
        (e) => {
            const container = e.target;
            const scrollTop = container.scrollTop;
            const scrollThreshold = 100;

            if (
                scrollTop <= scrollThreshold &&
                hasMoreMessages &&
                !isLoadingMore &&
                !isLoadingHistory &&
                !isInitialScrolling
            ) {
                console.log(
                    "Scroll threshold reached, loading more messages..."
                );
                loadMoreMessages();
            }
        },
        [
            hasMoreMessages,
            isLoadingMore,
            isLoadingHistory,
            isInitialScrolling,
            loadMoreMessages,
        ]
    );

    // Auto-scroll to bottom for new messages (not pagination)
    useEffect(() => {
        if (
            !isLoadingMore &&
            !isLoadingHistory &&
            messages.length > lastMessageCount
        ) {
            const container = messagesContainerRef.current;
            if (container) {
                const isNearBottom =
                    container.scrollTop + container.clientHeight >=
                    container.scrollHeight - 100;
                if (isNearBottom) {
                    messagesEndRef.current?.scrollIntoView({
                        behavior: "smooth",
                    });
                    console.log("Scrolled to bottom on new message");
                }
            }
            setLastMessageCount(messages.length);
        }
    }, [messages.length, isLoadingMore, isLoadingHistory, lastMessageCount]);

    // Scroll to last message on initial load (only once)
    useEffect(() => {
        if (
            !isLoadingHistory &&
            messages.length > 0 &&
            !hasInitialLoadRef.current
        ) {
            setLastMessageCount(messages.length);
            setIsInitialScrolling(true);

            setTimeout(() => {
                const container = messagesContainerRef.current;
                if (container && messages.length > 0) {
                    const messageElements =
                        container.querySelectorAll("[data-message-id]");
                    if (messageElements.length > 0) {
                        const lastMessageElement =
                            messageElements[messageElements.length - 1];
                        lastMessageElement.scrollIntoView({
                            behavior: "instant",
                            block: "end",
                        });
                        console.log("Scrolled to last message on initial load");
                    } else {
                        container.scrollTop = container.scrollHeight;
                    }
                }

                setTimeout(() => {
                    setIsInitialScrolling(false);
                    hasInitialLoadRef.current = true;
                }, 500);
            }, 100);
        }
    }, [isLoadingHistory, messages.length]);

    // Store scroll position before loading more messages
    useEffect(() => {
        if (isLoadingMore && messages.length > 0) {
            const container = messagesContainerRef.current;
            if (container) {
                setScrollTopBeforeLoad(container.scrollTop);
                setScrollHeightBeforeLoad(container.scrollHeight);
                console.log(
                    "Stored scroll position before load:",
                    container.scrollTop,
                    "height:",
                    container.scrollHeight
                );
            }
        }
    }, [isLoadingMore, messages.length]);

    // Restore scroll position after loading more messages
    useEffect(() => {
        if (
            !isLoadingMore &&
            scrollHeightBeforeLoad > 0 &&
            messages.length > lastMessageCount
        ) {
            const container = messagesContainerRef.current;
            if (container) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        const newMessagesCount =
                            messages.length - lastMessageCount;
                        const batchSize = pagination?.perPage || 15; // Dynamic batch size
                        const messageElements =
                            container.querySelectorAll("[data-message-id]");

                        console.log("=== SCROLL RESTORATION DEBUG ===");
                        console.log("New messages count:", newMessagesCount);
                        console.log("Batch size:", batchSize);
                        console.log("Total messages:", messages.length);
                        console.log("Last message count:", lastMessageCount);
                        console.log(
                            "Message elements found:",
                            messageElements.length
                        );

                        if (
                            messageElements.length >= newMessagesCount &&
                            newMessagesCount > 0
                        ) {
                            // Calculate total height of the first batchSize messages
                            let totalHeight = 0;
                            for (
                                let i = 0;
                                i < Math.min(batchSize, messageElements.length);
                                i++
                            ) {
                                totalHeight +=
                                    messageElements[i].getBoundingClientRect()
                                        .height;
                            }

                            console.log(
                                "Total height of first",
                                batchSize,
                                "messages:",
                                totalHeight
                            );

                            // Get the last message of the previous batch (now at index batchSize - 1)
                            const lastPreviousMessageElement =
                                messageElements[batchSize - 1];

                            if (lastPreviousMessageElement) {
                                // Scroll so the bottom of the last previous message is at the bottom of the viewport
                                const viewportHeight = container.clientHeight;
                                const messageRect =
                                    lastPreviousMessageElement.getBoundingClientRect();
                                const messageBottomRelativeToContainer =
                                    messageRect.top +
                                    messageRect.height -
                                    container.getBoundingClientRect().top;

                                // Set scrollTop to position the message's bottom at the viewport bottom
                                container.scrollTop =
                                    messageBottomRelativeToContainer -
                                    viewportHeight;

                                console.log(
                                    "Scrolled to bottom of last previous message (index",
                                    batchSize - 1,
                                    ")"
                                );
                            } else {
                                console.log(
                                    "⚠️ Last previous message element not found, using fallback"
                                );
                                const heightDifference =
                                    container.scrollHeight -
                                    scrollHeightBeforeLoad;
                                container.scrollTop =
                                    scrollTopBeforeLoad + heightDifference;
                            }
                        } else {
                            console.log(
                                "⚠️ Insufficient message elements, using fallback"
                            );
                            const heightDifference =
                                container.scrollHeight - scrollHeightBeforeLoad;
                            container.scrollTop =
                                scrollTopBeforeLoad + heightDifference;
                        }

                        setScrollHeightBeforeLoad(0);
                        setScrollTopBeforeLoad(0);
                        setLastMessageCount(messages.length);
                        console.log("=== END DEBUG ===");
                    });
                });
            }
        }
    }, [
        isLoadingMore,
        scrollHeightBeforeLoad,
        scrollTopBeforeLoad,
        messages.length,
        lastMessageCount,
        pagination,
    ]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() && selectedFilesToUpload.length === 0) {
            return;
        }

        setIsUploadingAttachments(true);
        const newUploadedAttachments = [];

        for (const file of selectedFilesToUpload) {
            const formData = new FormData();
            formData.append("file", file);

            const isImage = file.type.startsWith("image");
            const isVideo = file.type.startsWith("video");

            if (file.type === "application/pdf" || (!isImage && !isVideo)) {
                formData.append("upload_preset", "ml_default");
                formData.append("resource_type", "raw");
                console.log(
                    "Using raw resource type for:",
                    file.name,
                    file.type
                );
            } else {
                formData.append("upload_preset", "ml_default");
            }

            try {
                let uploadUrl =
                    "https://api.cloudinary.com/v1_1/dvemjyp3n/upload";
                if (file.type === "application/pdf" || (!isImage && !isVideo)) {
                    uploadUrl =
                        "https://api.cloudinary.com/v1_1/dvemjyp3n/raw/upload";
                }

                const response = await fetch(uploadUrl, {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(
                        `Cloudinary upload failed for ${file.name}: ${response.statusText}`
                    );
                }

                const data = await response.json();
                console.log("Upload successful:", data);

                let attachmentType;
                if (file.type.startsWith("image")) {
                    attachmentType = "photo";
                } else if (file.type.startsWith("video")) {
                    attachmentType = "video";
                } else if (file.type.startsWith("audio")) {
                    attachmentType = "audio";
                } else {
                    attachmentType = "file";
                }

                newUploadedAttachments.push({
                    type: attachmentType,
                    url: data.secure_url,
                    filename: file.name,
                });
            } catch (error) {
                console.error("Upload error:", error);
                alert(`Failed to upload ${file.name}: ${error.message}`);
            }
        }

        const finalAttachments = [
            ...uploadedAttachments,
            ...newUploadedAttachments,
        ];
        sendMessage(inputMessage, finalAttachments);

        setSelectedFilesToUpload([]);
        setUploadedAttachments([]);
        setIsUploadingAttachments(false);
        setAttachmentInputKey((prevKey) => prevKey + 1);
        setInputMessage("");
        stopTyping();
    };

    const handleInputChange = (e) => {
        setInputMessage(e.target.value);
        if (e.target.value.trim()) {
            startTyping();
        } else {
            stopTyping();
        }
    };

    const handleFilesSelected = (newFiles) => {
        setSelectedFilesToUpload((prev) => [...prev, ...newFiles]);
    };

    const handleRemoveSelectedFile = (fileToRemove) => {
        setSelectedFilesToUpload((prev) =>
            prev.filter((file) => file !== fileToRemove)
        );
    };

    const handleRemoveUploadedAttachment = (attachmentToRemove) => {
        setUploadedAttachments((prev) =>
            prev.filter((att) => att !== attachmentToRemove)
        );
    };

    const handleFileDownload = async (url, filename) => {
        console.log("Downloading file:", url, filename);

        try {
            let downloadUrl = url;

            if (url.includes("cloudinary.com")) {
                const cloudName = "dvemjyp3n";
                const urlParts = url.split("/");
                const fileWithExtension = urlParts[urlParts.length - 1];
                const versionPart = urlParts.find((part) =>
                    part.startsWith("v")
                );

                console.log(
                    "File:",
                    fileWithExtension,
                    "Version:",
                    versionPart
                );

                const testUrls = [
                    `https://res.cloudinary.com/${cloudName}/raw/upload/${fileWithExtension}`,
                    url.replace("/upload/", "/upload/fl_attachment/"),
                    url.replace("/upload/", "/upload/fl_attachment:inline/"),
                    url,
                ];

                for (let testUrl of testUrls) {
                    try {
                        console.log("Trying URL:", testUrl);
                        const response = await fetch(testUrl, {
                            method: "HEAD",
                        });
                        if (response.ok) {
                            console.log("Success with URL:", testUrl);
                            const downloadResponse = await fetch(testUrl);
                            if (downloadResponse.ok) {
                                const blob = await downloadResponse.blob();
                                const objectUrl = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = objectUrl;
                                link.download = filename || fileWithExtension;
                                link.style.display = "none";
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(objectUrl);
                                return;
                            }
                        }
                    } catch (testError) {
                        console.log(
                            "Failed with URL:",
                            testUrl,
                            testError.message
                        );
                        continue;
                    }
                }

                throw new Error("All download URLs failed");
            }

            window.open(url, "_blank");
        } catch (error) {
            console.error("All download methods failed:", error);
            try {
                window.open(url, "_blank");
                console.log("Opened in new tab as fallback");
            } catch (finalError) {
                console.error("Even fallback failed:", finalError);
                alert(
                    `Failed to download ${filename}. Please try uploading the file again with the updated system.`
                );
            }
        }
    };

    const formatMessageTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        setImageModalOpen(true);
    };

    const handleCloseImageModal = () => {
        setImageModalOpen(false);
        setSelectedImage(null);
    };

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Messages Container */}
            <Paper
                ref={messagesContainerRef}
                onScroll={handleScroll}
                sx={{
                    flexGrow: 1,
                    p: { xs: 1, sm: 2 },
                    mb: 2,
                    maxHeight: {
                        xs: "400px",
                        sm: "500px",
                    },
                    overflowY: "auto",
                    backgroundColor: "#f8f9fa",
                    position: "relative",
                }}
            >
                {isLoadingHistory ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                        }}
                    >
                        <CircularProgress />
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                        >
                            Loading history...
                        </Typography>
                    </Box>
                ) : messages.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                            No messages yet. Start a conversation!
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {isLoadingMore && hasMoreMessages && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    py: 1,
                                    mb: 1,
                                    position: "sticky",
                                    top: 0,
                                    backgroundColor: "rgba(248, 249, 250, 0.9)",
                                    backdropFilter: "blur(4px)",
                                    borderRadius: "4px",
                                    mx: 1,
                                    zIndex: 1,
                                }}
                            >
                                <CircularProgress size={16} />
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ ml: 1 }}
                                >
                                    Loading...
                                </Typography>
                            </Box>
                        )}

                        {messages.map((message, index) => {
                            const hasText =
                                message.message &&
                                message.message.trim().length > 0;
                            const hasMedia =
                                message.attachments &&
                                message.attachments.length > 0;

                            return (
                                <Box
                                    key={message.id || index}
                                    data-message-id={
                                        message.id || `msg-${index}`
                                    }
                                    sx={{
                                        mb: 2,
                                        display: "flex",
                                        justifyContent:
                                            message.senderType === "USER"
                                                ? "flex-end"
                                                : "flex-start",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            maxWidth: {
                                                xs: "90%",
                                                sm: "80%",
                                                md: "70%",
                                            },
                                            minWidth: 0,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems:
                                                message.senderType === "USER"
                                                    ? "flex-end"
                                                    : "flex-start",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {hasText && (
                                            <Paper
                                                sx={{
                                                    p: 2,
                                                    mb: hasMedia ? 1 : 0,
                                                    backgroundColor:
                                                        message.senderType ===
                                                        "USER"
                                                            ? "primary.main"
                                                            : "background.paper",
                                                    color:
                                                        message.senderType ===
                                                        "USER"
                                                            ? "primary.contrastText"
                                                            : "text.primary",
                                                    maxWidth: "100%",
                                                    minWidth: 0,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        wordBreak: "break-word",
                                                        overflowWrap:
                                                            "anywhere",
                                                        whiteSpace: "pre-wrap",
                                                        maxWidth: "100%",
                                                        hyphens: "auto",
                                                    }}
                                                >
                                                    {message.message}
                                                </Typography>
                                            </Paper>
                                        )}

                                        {hasMedia && (
                                            <Box
                                                sx={{
                                                    mb: 1,
                                                    maxWidth: "100%",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {message.attachments.map(
                                                    (attachment, attIndex) => {
                                                        if (
                                                            attachment.type ===
                                                            "photo"
                                                        ) {
                                                            return (
                                                                <Box
                                                                    key={
                                                                        attIndex
                                                                    }
                                                                    sx={{
                                                                        mb: 0.5,
                                                                        width: {
                                                                            xs: "100%",
                                                                            sm: "200px",
                                                                        },
                                                                        height: {
                                                                            xs: "150px",
                                                                            sm: "200px",
                                                                        },
                                                                        maxWidth:
                                                                            "100%",
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        justifyContent:
                                                                            "center",
                                                                        overflow:
                                                                            "hidden",
                                                                        borderRadius:
                                                                            "4px",
                                                                    }}
                                                                >
                                                                    <img
                                                                        src={
                                                                            attachment.url
                                                                        }
                                                                        alt="Attachment"
                                                                        onClick={() =>
                                                                            handleImageClick(
                                                                                attachment.url
                                                                            )
                                                                        }
                                                                        style={{
                                                                            width: "100%",
                                                                            height: "100%",
                                                                            objectFit:
                                                                                "cover",
                                                                            borderRadius:
                                                                                "4px",
                                                                            cursor: "pointer",
                                                                        }}
                                                                    />
                                                                </Box>
                                                            );
                                                        } else if (
                                                            attachment.type ===
                                                            "video"
                                                        ) {
                                                            return (
                                                                <Box
                                                                    key={
                                                                        attIndex
                                                                    }
                                                                    sx={{
                                                                        mb: 0.5,
                                                                        width: {
                                                                            xs: "100%",
                                                                            sm: "200px",
                                                                        },
                                                                        height: {
                                                                            xs: "150px",
                                                                            sm: "200px",
                                                                        },
                                                                        maxWidth:
                                                                            "100%",
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        justifyContent:
                                                                            "center",
                                                                        overflow:
                                                                            "hidden",
                                                                        borderRadius:
                                                                            "4px",
                                                                    }}
                                                                >
                                                                    <video
                                                                        controls
                                                                        preload="auto"
                                                                        src={
                                                                            attachment.url
                                                                        }
                                                                        style={{
                                                                            width: "100%",
                                                                            height: "100%",
                                                                            objectFit:
                                                                                "cover",
                                                                            borderRadius:
                                                                                "4px",
                                                                        }}
                                                                    />
                                                                </Box>
                                                            );
                                                        } else if (
                                                            attachment.type ===
                                                            "audio"
                                                        ) {
                                                            return (
                                                                <Box
                                                                    key={
                                                                        attIndex
                                                                    }
                                                                    sx={{
                                                                        mb: 0.5,
                                                                        width: {
                                                                            xs: "100%",
                                                                            sm: "300px",
                                                                        },
                                                                        maxWidth:
                                                                            "100%",
                                                                        minWidth:
                                                                            {
                                                                                xs: "250px",
                                                                                sm: "300px",
                                                                            },
                                                                        height: {
                                                                            xs: "50px",
                                                                            sm: "60px",
                                                                        },
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        justifyContent:
                                                                            "center",
                                                                        backgroundColor:
                                                                            "#f5f5f5",
                                                                        borderRadius:
                                                                            "8px",
                                                                        border: "1px solid #e0e0e0",
                                                                        p: 1,
                                                                        overflow:
                                                                            "hidden",
                                                                    }}
                                                                >
                                                                    <audio
                                                                        controls
                                                                        preload="metadata"
                                                                        src={
                                                                            attachment.url
                                                                        }
                                                                        style={{
                                                                            width: "100%",
                                                                            height: "35px",
                                                                            maxWidth:
                                                                                "100%",
                                                                        }}
                                                                    >
                                                                        Your
                                                                        browser
                                                                        does not
                                                                        support
                                                                        the
                                                                        audio
                                                                        element.
                                                                    </audio>
                                                                </Box>
                                                            );
                                                        } else if (
                                                            attachment.type ===
                                                            "file"
                                                        ) {
                                                            return (
                                                                <Box
                                                                    key={
                                                                        attIndex
                                                                    }
                                                                    sx={{
                                                                        mb: 0.5,
                                                                        p: 2,
                                                                        border: "1px solid #e0e0e0",
                                                                        borderRadius:
                                                                            "8px",
                                                                        backgroundColor:
                                                                            "#f9f9f9",
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        gap: 1,
                                                                        cursor: "pointer",
                                                                        maxWidth:
                                                                            "100%",
                                                                        overflow:
                                                                            "hidden",
                                                                        "&:hover":
                                                                            {
                                                                                backgroundColor:
                                                                                    "#f0f0f0",
                                                                            },
                                                                    }}
                                                                    onClick={() =>
                                                                        handleFileDownload(
                                                                            attachment.url,
                                                                            attachment.filename
                                                                        )
                                                                    }
                                                                >
                                                                    <DownloadIcon
                                                                        sx={{
                                                                            color: "primary.main",
                                                                            flexShrink: 0,
                                                                        }}
                                                                    />
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: "primary.main",
                                                                            textDecoration:
                                                                                "underline",
                                                                            wordBreak:
                                                                                "break-word",
                                                                            overflow:
                                                                                "hidden",
                                                                            textOverflow:
                                                                                "ellipsis",
                                                                            maxWidth:
                                                                                "100%",
                                                                        }}
                                                                    >
                                                                        {attachment.filename ||
                                                                            "Download File"}
                                                                    </Typography>
                                                                </Box>
                                                            );
                                                        } else {
                                                            return (
                                                                <Chip
                                                                    key={
                                                                        attIndex
                                                                    }
                                                                    label={`${
                                                                        attachment.type
                                                                    }: ${attachment.url.substring(
                                                                        0,
                                                                        20
                                                                    )}...`}
                                                                    size="small"
                                                                    color="primary"
                                                                    component="a"
                                                                    href={
                                                                        attachment.url
                                                                    }
                                                                    target="_blank"
                                                                    clickable
                                                                    sx={{
                                                                        mr: 0.5,
                                                                        mb: 0.5,
                                                                        maxWidth:
                                                                            "100%",
                                                                        "& .MuiChip-label":
                                                                            {
                                                                                overflow:
                                                                                    "hidden",
                                                                                textOverflow:
                                                                                    "ellipsis",
                                                                                whiteSpace:
                                                                                    "nowrap",
                                                                            },
                                                                    }}
                                                                />
                                                            );
                                                        }
                                                    }
                                                )}
                                            </Box>
                                        )}

                                        <Typography
                                            variant="caption"
                                            sx={{
                                                opacity: 0.7,
                                                textAlign: "right",
                                                alignSelf: "flex-end",
                                            }}
                                        >
                                            {formatMessageTime(
                                                message.createdAt
                                            )}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}

                        {isTyping && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    mb: 2,
                                }}
                            >
                                <Paper
                                    sx={{
                                        p: 2,
                                        backgroundColor: "background.paper",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <CircularProgress size={16} />
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            AI is typing...
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Box>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </Paper>

            {/* Message Input Form */}
            <Paper sx={{ p: 2 }}>
                <form onSubmit={handleSubmit}>
                    <Box
                        sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}
                    >
                        <TextField
                            ref={inputRef}
                            fullWidth
                            multiline
                            maxRows={4}
                            value={inputMessage}
                            onChange={handleInputChange}
                            placeholder="Type your message..."
                            disabled={isSending}
                            variant="outlined"
                            size="small"
                            sx={{
                                "& .MuiInputBase-input": {
                                    wordBreak: "break-word",
                                    overflowWrap: "anywhere",
                                },
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={
                                (!inputMessage.trim() &&
                                    selectedFilesToUpload.length === 0 &&
                                    uploadedAttachments.length === 0) ||
                                isSending ||
                                isUploadingAttachments
                            }
                            sx={{ minWidth: "auto", px: 2 }}
                        >
                            {isSending || isUploadingAttachments ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                <SendIcon />
                            )}
                        </Button>
                    </Box>
                </form>

                <AttachmentInput
                    key={attachmentInputKey}
                    onFilesSelected={handleFilesSelected}
                    onFileRemoved={handleRemoveSelectedFile}
                />

                {selectedFilesToUpload.length > 0 && (
                    <Box
                        sx={{
                            mt: 1,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            maxWidth: "100%",
                            overflow: "hidden",
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{ width: "100%", mb: 0.5 }}
                        >
                            Files to Upload:
                        </Typography>
                        {selectedFilesToUpload.map((file, index) => (
                            <Chip
                                key={index}
                                label={`${file.name} (${(
                                    file.size /
                                    1024 /
                                    1024
                                ).toFixed(2)} MB)`}
                                size="small"
                                color="info"
                                onDelete={() => handleRemoveSelectedFile(file)}
                                sx={{
                                    maxWidth: "100%",
                                    "& .MuiChip-label": {
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: "200px",
                                    },
                                }}
                            />
                        ))}
                    </Box>
                )}

                {uploadedAttachments.length > 0 && (
                    <Box
                        sx={{
                            mt: 1,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            maxWidth: "100%",
                            overflow: "hidden",
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{ width: "100%", mb: 0.5 }}
                        >
                            Uploaded Attachments:
                        </Typography>
                        {uploadedAttachments.map((attachment, index) => (
                            <Chip
                                key={index}
                                label={`${
                                    attachment.type
                                }: ${attachment.url.substring(0, 20)}...`}
                                size="small"
                                color="success"
                                onDelete={() =>
                                    handleRemoveUploadedAttachment(attachment)
                                }
                                sx={{
                                    maxWidth: "100%",
                                    "& .MuiChip-label": {
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: "200px",
                                    },
                                }}
                            />
                        ))}
                    </Box>
                )}

                <Box
                    sx={{
                        mt: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1,
                    }}
                >
                    <Chip
                        label={
                            isSending || isUploadingAttachments
                                ? "Sending..."
                                : "Ready"
                        }
                        size="small"
                        color={
                            isSending || isUploadingAttachments
                                ? "warning"
                                : "success"
                        }
                        variant="outlined"
                    />

                    {messages.length > 0 && pagination && (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {messages.length} of {totalMessages} messages
                            </Typography>
                            {hasMoreMessages && !isLoadingHistory && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={loadMoreMessages}
                                    disabled={isLoadingMore}
                                    sx={{ minWidth: "auto", px: 1, py: 0.5 }}
                                >
                                    {isLoadingMore ? (
                                        <CircularProgress size={12} />
                                    ) : (
                                        "Load More"
                                    )}
                                </Button>
                            )}
                        </Box>
                    )}
                </Box>
            </Paper>

            <Modal
                open={imageModalOpen}
                onClose={handleCloseImageModal}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(5px)",
                }}
            >
                <Box
                    sx={{
                        position: "relative",
                        maxWidth: "90vw",
                        maxHeight: "90vh",
                        bgcolor: "background.paper",
                        borderRadius: "8px",
                        boxShadow: 24,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <IconButton
                        onClick={handleCloseImageModal}
                        sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            bgcolor: "rgba(0, 0, 0, 0.5)",
                            color: "white",
                            zIndex: 1,
                            "&:hover": { bgcolor: "rgba(0, 0, 0, 0.7)" },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    {selectedImage && (
                        <img
                            src={selectedImage}
                            alt="Large view"
                            style={{
                                maxWidth: "100%",
                                maxHeight: "90vh",
                                width: "auto",
                                height: "auto",
                                objectFit: "contain",
                                display: "block",
                            }}
                        />
                    )}
                </Box>
            </Modal>
        </Box>
    );
};

export default AIChat;
