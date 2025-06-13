import React, { useState, useRef, useEffect } from "react";
import {
    Box,
    TextField,
    Button,
    Paper,
    Typography,
    CircularProgress,
    Chip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DownloadIcon from "@mui/icons-material/Download";
import { useAIChat } from "../../hooks/useAIChat";
import AttachmentInput from "./AttachmentInput"; // Import the new component

const AIChat = ({
    contactId,
    estimateId = null,
    initialConversationId = null,
    onConversationSaved = () => {},
}) => {
    const [inputMessage, setInputMessage] = useState("");
    const [selectedFilesToUpload, setSelectedFilesToUpload] = useState([]); // New state for files selected but not yet uploaded
    const [uploadedAttachments, setUploadedAttachments] = useState([]); // State for attachments that have been uploaded
    const [isUploadingAttachments, setIsUploadingAttachments] = useState(false); // New state for upload progress
    const [attachmentInputKey, setAttachmentInputKey] = useState(0); // Key to force remount of AttachmentInput
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const {
        messages,
        isTyping,
        isSending,
        isLoadingHistory, // Added this
        sendMessage,
        startTyping,
        stopTyping,
    } = useAIChat(
        contactId,
        estimateId,
        initialConversationId,
        onConversationSaved
    );

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() && selectedFilesToUpload.length === 0) {
            return; // Don't send if no message and no files
        }

        setIsUploadingAttachments(true);
        const newUploadedAttachments = [];

        for (const file of selectedFilesToUpload) {
            const formData = new FormData();
            formData.append("file", file);

            // Determine if this is a non-media file (PDF, documents, etc.)
            const isImage = file.type.startsWith("image");
            const isVideo = file.type.startsWith("video");

            // For PDF and other document files, use different upload approach
            if (file.type === "application/pdf" || (!isImage && !isVideo)) {
                // Use unsigned upload without preset for raw files
                formData.append("upload_preset", "ml_default");
                formData.append("resource_type", "raw");
                console.log(
                    "Using raw resource type for:",
                    file.name,
                    file.type
                );

                // Alternative: Try without preset if the above fails
                // Just keep the file and resource_type
            } else {
                // For images and videos, use the regular preset
                formData.append("upload_preset", "ml_default");
            }

            try {
                let uploadUrl =
                    "https://api.cloudinary.com/v1_1/dvemjyp3n/upload";

                // For raw files, use the raw upload endpoint
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
                // Continue with other files even if one fails
            }
        }

        const finalAttachments = [
            ...uploadedAttachments,
            ...newUploadedAttachments,
        ];

        sendMessage(inputMessage, finalAttachments); // Send message with all attachments

        // Clear all attachment-related states after sending
        setSelectedFilesToUpload([]);
        setUploadedAttachments([]);
        setIsUploadingAttachments(false);
        setAttachmentInputKey((prevKey) => prevKey + 1); // Increment key to force remount of AttachmentInput

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

                // Extract the file details from URL
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

                // For PDFs uploaded to /image/upload/, try different approaches
                const testUrls = [
                    // Try as raw upload (preferred)
                    `https://res.cloudinary.com/${cloudName}/raw/upload/${fileWithExtension}`,
                    // Try with fl_attachment in image upload
                    url.replace("/upload/", "/upload/fl_attachment/"),
                    // Try direct browser download header
                    url.replace("/upload/", "/upload/fl_attachment:inline/"),
                    // Original URL as last resort
                    url,
                ];

                for (let testUrl of testUrls) {
                    try {
                        console.log("Trying URL:", testUrl);
                        const response = await fetch(testUrl, {
                            method: "HEAD", // Just check if it exists
                        });

                        if (response.ok) {
                            console.log("Success with URL:", testUrl);

                            // Now download with this working URL
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
                                return; // Success, exit function
                            }
                        }
                    } catch (testError) {
                        console.log(
                            "Failed with URL:",
                            testUrl,
                            testError.message
                        );
                        continue; // Try next URL
                    }
                }

                throw new Error("All download URLs failed");
            }

            // If not a Cloudinary URL, just open it
            window.open(url, "_blank");
        } catch (error) {
            console.error("All download methods failed:", error);

            // Last resort: try to open in new tab
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

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Messages Container */}
            <Paper
                sx={{
                    flexGrow: 1,
                    p: { xs: 1, sm: 2 }, // Less padding on mobile
                    mb: 2,
                    maxHeight: {
                        xs: "400px", // Smaller height on mobile
                        sm: "500px", // Default height on larger screens
                    },
                    overflowY: "auto",
                    backgroundColor: "#f8f9fa",
                    position: "relative", // Added for loader positioning
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
                                                xs: "90%", // Wider on mobile for better readability
                                                sm: "80%", // Medium screens
                                                md: "70%", // Desktop
                                            },
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems:
                                                message.senderType === "USER"
                                                    ? "flex-end"
                                                    : "flex-start",
                                        }}
                                    >
                                        {/* Render text in Paper wrapper if exists */}
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
                                                }}
                                            >
                                                <Typography variant="body1">
                                                    {message.message}
                                                </Typography>
                                            </Paper>
                                        )}

                                        {/* Render media without background */}
                                        {hasMedia && (
                                            <Box sx={{ mb: 1 }}>
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
                                                                            xs: "100%", // Full width on mobile
                                                                            sm: "200px", // Fixed width on larger screens
                                                                        },
                                                                        height: {
                                                                            xs: "150px", // Smaller height on mobile
                                                                            sm: "200px", // Fixed height on larger screens
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
                                                                            xs: "100%", // Full width on mobile
                                                                            sm: "200px", // Fixed width on larger screens
                                                                        },
                                                                        height: {
                                                                            xs: "150px", // Smaller height on mobile
                                                                            sm: "200px", // Fixed height on larger screens
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
                                                                            xs: "100%", // Full width on mobile
                                                                            sm: "300px", // Fixed width on larger screens
                                                                        },
                                                                        maxWidth:
                                                                            "100%",
                                                                        minWidth:
                                                                            {
                                                                                xs: "250px", // Minimum width on mobile
                                                                                sm: "300px",
                                                                            },
                                                                        height: {
                                                                            xs: "50px", // Smaller height on mobile
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
                                                                        }}
                                                                    />
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: "primary.main",
                                                                            textDecoration:
                                                                                "underline",
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
                                                                    }}
                                                                />
                                                            );
                                                        }
                                                    }
                                                )}
                                            </Box>
                                        )}

                                        {/* Timestamp */}
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

                        {/* Typing Indicator */}
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

                {/* Attachment Input */}
                <AttachmentInput
                    key={attachmentInputKey}
                    onFilesSelected={handleFilesSelected}
                    onFileRemoved={handleRemoveSelectedFile}
                />

                {/* Display selected files to upload as chips */}
                {/* {selectedFilesToUpload.length > 0 && (
                    <Box
                        sx={{
                            mt: 1,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
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
                            />
                        ))}
                    </Box>
                )} */}

                {/* Display already uploaded attachments as chips */}
                {uploadedAttachments.length > 0 && (
                    <Box
                        sx={{
                            mt: 1,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
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
                            />
                        ))}
                    </Box>
                )}

                {/* Connection Status */}
                <Box
                    sx={{
                        mt: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    {/* <Typography variant="caption" color="text.secondary">
                        {contactId && `Contact: ${contactId}`}
                        {estimateId && ` | Estimate: ${estimateId}`}
                    </Typography> */}
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
                </Box>
            </Paper>
        </Box>
    );
};

export default AIChat;
