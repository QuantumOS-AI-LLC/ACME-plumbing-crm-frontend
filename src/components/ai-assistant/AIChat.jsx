import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAIChat } from '../../hooks/useAIChat';
import AttachmentInput from './AttachmentInput'; // Import the new component

const AIChat = ({ contactId, estimateId = null, initialConversationId = null, onConversationSaved = () => {} }) => {
  const [inputMessage, setInputMessage] = useState('');
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
    stopTyping
  } = useAIChat(contactId, estimateId, initialConversationId, onConversationSaved);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default'); // Cloudinary upload preset

      try {
        const response = await fetch('https://api.cloudinary.com/v1_1/dvemjyp3n/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Cloudinary upload failed for ${file.name}: ${response.statusText}`);
        }

        const data = await response.json();
        let attachmentType;
        if (file.type.startsWith('image')) {
          attachmentType = 'photo';
        } else if (file.type.startsWith('video')) {
          attachmentType = 'video';
        } else {
          attachmentType = 'file';
        }
        newUploadedAttachments.push({
          type: attachmentType,
          url: data.secure_url,
        });
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
        // Continue with other files even if one fails
      }
    }

    const finalAttachments = [...uploadedAttachments, ...newUploadedAttachments];
    
    sendMessage(inputMessage, finalAttachments); // Send message with all attachments
    
    // Clear all attachment-related states after sending
    setSelectedFilesToUpload([]);
    setUploadedAttachments([]);
    setIsUploadingAttachments(false);
    setAttachmentInputKey(prevKey => prevKey + 1); // Increment key to force remount of AttachmentInput

    setInputMessage('');
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
    setSelectedFilesToUpload(prev => [...prev, ...newFiles]);
  };

  const handleRemoveSelectedFile = (fileToRemove) => {
    setSelectedFilesToUpload(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleRemoveUploadedAttachment = (attachmentToRemove) => {
    setUploadedAttachments(prev => prev.filter(att => att !== attachmentToRemove));
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Messages Container */}
      <Paper
        sx={{
          flexGrow: 1,
          p: 2,
          mb: 2,
          maxHeight: '500px',
          overflowY: 'auto',
          backgroundColor: '#f8f9fa',
          position: 'relative' // Added for loader positioning
        }}
      >
        {isLoadingHistory ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              Loading history...
            </Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start a conversation!
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => (
              <Box
                key={message.id || index}
                sx={{
                  mb: 2,
                  display: 'flex',
                  justifyContent: message.senderType === 'USER' ? 'flex-end' : 'flex-start'
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    backgroundColor: message.senderType === 'USER'
                      ? 'primary.main'
                      : 'background.paper',
                    color: message.senderType === 'USER'
                      ? 'primary.contrastText'
                      : 'text.primary'
                  }}
                >
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {message.message}
                  </Typography>
                  {message.attachments && message.attachments.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {message.attachments.map((attachment, attIndex) => (
                        <Chip
                          key={attIndex}
                          label={`${attachment.type}: ${attachment.url.substring(0, 20)}...`}
                          size="small"
                          color="primary"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      opacity: 0.7,
                      display: 'block',
                      textAlign: 'right'
                    }}
                  >
                    {formatMessageTime(message.createdAt)}
                  </Typography>
                </Paper>
              </Box>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Paper sx={{ p: 2, backgroundColor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
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
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
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
              disabled={(!inputMessage.trim() && selectedFilesToUpload.length === 0 && uploadedAttachments.length === 0) || isSending || isUploadingAttachments}
              sx={{ minWidth: 'auto', px: 2 }}
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
        <AttachmentInput onFilesSelected={handleFilesSelected} />
        
        {/* Display selected files to upload as chips */}
        {selectedFilesToUpload.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Typography variant="subtitle2" sx={{ width: '100%', mb: 0.5 }}>Files to Upload:</Typography>
            {selectedFilesToUpload.map((file, index) => (
              <Chip
                key={index}
                label={`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`}
                size="small"
                color="info"
                onDelete={() => handleRemoveSelectedFile(file)}
              />
            ))}
          </Box>
        )}

        {/* Display already uploaded attachments as chips */}
        {uploadedAttachments.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Typography variant="subtitle2" sx={{ width: '100%', mb: 0.5 }}>Uploaded Attachments:</Typography>
            {uploadedAttachments.map((attachment, index) => (
              <Chip
                key={index}
                label={`${attachment.type}: ${attachment.url.substring(0, 20)}...`}
                size="small"
                color="success"
                onDelete={() => handleRemoveUploadedAttachment(attachment)}
              />
            ))}
          </Box>
        )}

        {/* Connection Status */}
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {contactId && `Contact: ${contactId}`}
            {estimateId && ` | Estimate: ${estimateId}`}
          </Typography>
          <Chip
            label={isSending || isUploadingAttachments ? "Sending..." : "Ready"}
            size="small"
            color={isSending || isUploadingAttachments ? "warning" : "success"}
            variant="outlined"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default AIChat;
