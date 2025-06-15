import React from "react";
import { Box, Paper, Typography, Avatar, IconButton } from "@mui/material";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";
import DownloadIcon from "@mui/icons-material/Download";

const cld = new Cloudinary({ cloud: { cloudName: "dvemjyp3n" } });

const ChatMessage = ({ message, isUser }) => {
    const handleFileDownload = (url, filename) => {
        // Add your download logic here, similar to the one in your AIChat component
        window.open(url, "_blank");
    };

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                mb: { xs: 1.5, sm: 2 }, // Smaller margin on mobile
                px: { xs: 1, sm: 0 }, // Add horizontal padding on mobile
                maxWidth: "100%",
                overflow: "hidden", // Prevent container overflow
            }}
        >
            {/* Avatar for non-user messages */}
            {!isUser && (
                <Avatar
                    sx={{
                        bgcolor: "primary.main",
                        mr: { xs: 0.5, sm: 1 }, // Smaller margin on mobile
                        width: { xs: 32, sm: 40 }, // Smaller avatar on mobile
                        height: { xs: 32, sm: 40 },
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                        flexShrink: 0, // Prevent avatar from shrinking
                    }}
                >
                    AI
                </Avatar>
            )}

            {/* Message Container */}
            <Box
                sx={{
                    maxWidth: {
                        xs: isUser ? "85%" : "80%", // More space on mobile
                        sm: "70%",
                        md: "60%",
                    },
                    minWidth: 0, // Allow shrinking below content size
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden", // Prevent overflow
                }}
            >
                {/* Text Message */}
                {message.text && (
                    <Paper
                        sx={{
                            p: { xs: 1.5, sm: 2 }, // Less padding on mobile
                            bgcolor: isUser
                                ? "primary.light"
                                : "background.paper",
                            color: isUser ? "white" : "text.primary",
                            borderRadius: isUser
                                ? {
                                      xs: "16px 16px 4px 16px",
                                      sm: "20px 20px 0 20px",
                                  }
                                : {
                                      xs: "16px 16px 16px 4px",
                                      sm: "20px 20px 20px 0",
                                  },
                            mb: message.attachments?.length > 0 ? 1 : 0,
                            maxWidth: "100%", // Ensure container doesn't overflow
                            minWidth: 0, // Allow shrinking below content size
                            overflow: "hidden", // Prevent overflow
                        }}
                    >
                        <Typography
                            variant="body1"
                            sx={{
                                fontSize: { xs: "0.875rem", sm: "1rem" }, // Smaller text on mobile
                                lineHeight: { xs: 1.4, sm: 1.5 },
                                wordBreak: "break-word", // Break long words properly
                                overflowWrap: "anywhere", // Break anywhere if needed
                                whiteSpace: "pre-wrap", // Preserve whitespace and wrap
                                hyphens: "auto", // Add hyphens where appropriate
                                maxWidth: "100%",
                            }}
                        >
                            {message.text}
                        </Typography>
                    </Paper>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                    <Box
                        sx={{
                            mt: message.text ? 0 : 0,
                            maxWidth: "100%",
                            overflow: "hidden",
                        }}
                    >
                        {message.attachments.map((attachment, index) => (
                            <Box
                                key={index}
                                sx={{
                                    mb: 1,
                                    maxWidth: "100%",
                                    overflow: "hidden",
                                }}
                            >
                                {/* Photo */}
                                {attachment.type === "photo" && (
                                    <Box
                                        sx={{
                                            borderRadius: "8px",
                                            overflow: "hidden",
                                            maxWidth: "100%",
                                        }}
                                    >
                                        <AdvancedImage
                                            cldImg={cld
                                                .image(
                                                    attachment.url
                                                        .split("/")
                                                        .pop()
                                                        .split(".")[0]
                                                )
                                                .format("auto")
                                                .quality("auto")
                                                .resize(
                                                    auto()
                                                        .gravity(autoGravity())
                                                        .width(500)
                                                        .height(500)
                                                )}
                                            style={{
                                                width: "100%",
                                                height: "auto",
                                                maxHeight: "300px",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </Box>
                                )}

                                {/* Video */}
                                {attachment.type === "video" && (
                                    <Box
                                        sx={{
                                            borderRadius: "8px",
                                            overflow: "hidden",
                                            maxWidth: "100%",
                                        }}
                                    >
                                        <video
                                            controls
                                            preload="metadata"
                                            style={{
                                                width: "100%",
                                                height: "auto",
                                                maxHeight: "300px",
                                            }}
                                        >
                                            <source
                                                src={attachment.url}
                                                type="video/mp4"
                                            />
                                            Your browser does not support the
                                            video tag.
                                        </video>
                                    </Box>
                                )}

                                {/* Audio */}
                                {attachment.type === "audio" && (
                                    <Box
                                        sx={{
                                            width: "100%",
                                            maxWidth: {
                                                xs: "280px",
                                                sm: "350px",
                                            }, // Responsive max width
                                            minWidth: {
                                                xs: "200px",
                                                sm: "250px",
                                            }, // Responsive min width
                                            backgroundColor: "#f5f5f5",
                                            borderRadius: "12px",
                                            border: "1px solid #e0e0e0",
                                            p: { xs: 1, sm: 1.5 }, // Responsive padding
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <audio
                                            controls
                                            preload="metadata"
                                            style={{
                                                width: "100%",
                                                height: "35px",
                                                maxWidth: "100%",
                                            }}
                                        >
                                            <source src={attachment.url} />
                                            Your browser does not support the
                                            audio element.
                                        </audio>
                                    </Box>
                                )}

                                {/* File Downloads */}
                                {attachment.type === "file" && (
                                    <Paper
                                        sx={{
                                            p: { xs: 1.5, sm: 2 }, // Responsive padding
                                            border: "1px solid #e0e0e0",
                                            borderRadius: "8px",
                                            backgroundColor: "#f9f9f9",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            cursor: "pointer",
                                            maxWidth: "100%",
                                            overflow: "hidden",
                                            "&:hover": {
                                                backgroundColor: "#f0f0f0",
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
                                                fontSize: {
                                                    xs: "1.2rem",
                                                    sm: "1.5rem",
                                                },
                                                flexShrink: 0,
                                            }}
                                        />
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "primary.main",
                                                textDecoration: "underline",
                                                fontSize: {
                                                    xs: "0.8rem",
                                                    sm: "0.875rem",
                                                },
                                                wordBreak: "break-word",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                flex: 1,
                                                minWidth: 0,
                                            }}
                                        >
                                            {attachment.filename ||
                                                "Download File"}
                                        </Typography>
                                    </Paper>
                                )}

                                {/* Other attachment types */}
                                {!["photo", "video", "audio", "file"].includes(
                                    attachment.type
                                ) && (
                                    <Paper
                                        sx={{
                                            p: { xs: 1, sm: 1.5 },
                                            backgroundColor: "info.light",
                                            color: "info.contrastText",
                                            borderRadius: "8px",
                                            maxWidth: "100%",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontSize: {
                                                    xs: "0.75rem",
                                                    sm: "0.875rem",
                                                },
                                                wordBreak: "break-word",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {attachment.type}:{" "}
                                            {attachment.url.substring(0, 30)}...
                                        </Typography>
                                    </Paper>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            {/* Avatar for user messages */}
            {isUser && (
                <Avatar
                    sx={{
                        bgcolor: "secondary.main",
                        ml: { xs: 0.5, sm: 1 }, // Smaller margin on mobile
                        width: { xs: 32, sm: 40 }, // Smaller avatar on mobile
                        height: { xs: 32, sm: 40 },
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                        flexShrink: 0, // Prevent avatar from shrinking
                    }}
                >
                    U
                </Avatar>
            )}
        </Box>
    );
};

export default ChatMessage;
