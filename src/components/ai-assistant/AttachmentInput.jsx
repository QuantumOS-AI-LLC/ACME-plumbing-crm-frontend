import React, { useState, useRef } from "react";
import {
    Box,
    Button,
    Typography,
    LinearProgress,
    IconButton,
    Chip,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Cloudinary } from "@cloudinary/url-gen";

const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL; // Base URL for upload
const cld = new Cloudinary({ cloud: { cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME } });

const AttachmentInput = ({ onFilesSelected }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        // Accept all file types now
        const validFiles = files;

        setSelectedFiles((prev) => [...prev, ...validFiles]);
        onFilesSelected(validFiles); // Pass selected files to parent
        event.target.value = null; // Clear the input
    };

    const handleRemoveFile = (fileToRemove) => {
        setSelectedFiles((prev) =>
            prev.filter((file) => file !== fileToRemove)
        );
        // TODO: Notify parent about removal if necessary for its state management
    };

    return (
        <Box
            sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                p: { xs: 1.5, sm: 2 }, // Smaller padding on mobile
                mt: 2,
            }}
        >
            <input
                type="file"
                multiple
                hidden
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="*/*"
            />
            <Button
                variant="outlined"
                startIcon={<AttachFileIcon />}
                onClick={() => fileInputRef.current.click()}
                sx={{
                    mb: 1,
                    fontSize: { xs: "0.875rem", sm: "1rem" }, // Smaller font on mobile
                    px: { xs: 1.5, sm: 2 }, // Smaller padding on mobile
                }}
                size="small"
            >
                Add Attachments
            </Button>

            {/* {selectedFiles.length > 0 && (
                <Box sx={{ mb: 1 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            mb: 0.5,
                            fontSize: { xs: "0.8rem", sm: "0.875rem" }, // Smaller font on mobile
                        }}
                    >
                        Selected Files:
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                        }}
                    >
                        {selectedFiles.map((file, index) => (
                            <Chip
                                key={index}
                                label={`${file.name} (${(
                                    file.size /
                                    1024 /
                                    1024
                                ).toFixed(2)} MB)`}
                                onDelete={() => handleRemoveFile(file)}
                                color="info"
                                variant="outlined"
                                size="small"
                                // sx={{
                                //     maxWidth: { xs: "100%", sm: "200px" }, // Full width on mobile, limited on desktop
                                //     "& .MuiChip-label": {
                                //         fontSize: {
                                //             xs: "0.75rem",
                                //             sm: "0.8125rem",
                                //         }, // Smaller font on mobile
                                //         overflow: "hidden",
                                //         textOverflow: "ellipsis",
                                //         whiteSpace: "nowrap",
                                //         maxWidth: { xs: "150px", sm: "160px" }, // Truncate long filenames
                                //     },
                                // }}
                            />
                        ))}
                    </Box>
                </Box>
            )} */}
        </Box>
    );
};

export default AttachmentInput;
