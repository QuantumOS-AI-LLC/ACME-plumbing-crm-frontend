import React, { useState, useRef } from 'react';
import { Box, Button, Typography, LinearProgress, IconButton, Chip } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Cloudinary } from "@cloudinary/url-gen";

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dvemjyp3n/upload'; // Base URL for upload
const cld = new Cloudinary({ cloud: { cloudName: 'dvemjyp3n' } });

const AttachmentInput = ({ onAttachmentsChange }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedAttachments, setUploadedAttachments] = useState([]);
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
    event.target.value = null; // Clear the input
  };

  const handleRemoveFile = (fileToRemove) => {
    setSelectedFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const newUploadedAttachments = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default'); // Cloudinary upload preset

      try {
        const response = await fetch(CLOUDINARY_URL, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Cloudinary upload failed for ${file.name}: ${response.statusText}`);
        }

        const data = await response.json();
        const attachmentType = file.type.startsWith('image') ? 'photo' : 'video';
        newUploadedAttachments.push({
          type: attachmentType,
          url: data.secure_url,
        });

        setUploadProgress(((i + 1) / selectedFiles.length) * 100);

      } catch (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
        // Continue with other files even if one fails
      }
    }

    setUploadedAttachments(prev => [...prev, ...newUploadedAttachments]);
    onAttachmentsChange([...uploadedAttachments, ...newUploadedAttachments]); // Notify parent
    setSelectedFiles([]); // Clear selected files after upload
    setUploading(false);
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
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleUpload}
            disabled={uploading}
            size="small"
            sx={{ mt: 1 }}
          >
            {uploading ? `Uploading (${uploadProgress.toFixed(0)}%)` : 'Upload Selected'}
          </Button>
          {uploading && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1 }} />}
        </Box>
      )}

      {uploadedAttachments.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Uploaded Attachments:</Typography>
          {uploadedAttachments.map((attachment, index) => (
            <Chip
              key={index}
              label={`${attachment.type}: ${attachment.url.substring(0, 30)}...`}
              color="success"
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