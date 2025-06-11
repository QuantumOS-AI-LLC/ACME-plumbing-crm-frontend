import React, { useState, useRef } from 'react';
import { Box, Button, Typography, LinearProgress, IconButton, Chip } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Cloudinary } from "@cloudinary/url-gen";

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dvemjyp3n/upload'; // Base URL for upload
const cld = new Cloudinary({ cloud: { cloudName: 'dvemjyp3n' } });

const AttachmentInput = ({ onFilesSelected }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const fileType = file.type.split('/')[0];
      return fileType === 'image' || fileType === 'video';
    });

    if (files.length !== validFiles.length) {
      alert('Only photo and video files are supported.');
    }
    setSelectedFiles(prev => [...prev, ...validFiles]);
    onFilesSelected(validFiles); // Pass selected files to parent
    event.target.value = null; // Clear the input
  };

  const handleRemoveFile = (fileToRemove) => {
    setSelectedFiles(prev => prev.filter(file => file !== fileToRemove));
    // TODO: Notify parent about removal if necessary for its state management
  };

  return (
    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mt: 2 }}>
      <input
        type="file"
        multiple
        hidden
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*"
      />
      <Button
        variant="outlined"
        startIcon={<AttachFileIcon />}
        onClick={() => fileInputRef.current.click()}
        sx={{ mb: 1 }}
      >
        Add Attachments
      </Button>

      {selectedFiles.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Selected Files:</Typography>
          {selectedFiles.map((file, index) => (
            <Chip
              key={index}
              label={`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`}
              onDelete={() => handleRemoveFile(file)}
              color="info"
              variant="outlined"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AttachmentInput;