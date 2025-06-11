import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

const cld = new Cloudinary({ cloud: { cloudName: 'dvemjyp3n' } });

const ChatMessage = ({ message, isUser }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2
      }}
    >
      {!isUser && (
        <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>AI</Avatar>
      )}
      <Paper sx={{
        p: 2,
        maxWidth: '70%',
        bgcolor: isUser ? 'primary.light' : 'background.paper',
        color: isUser ? 'white' : 'text.primary',
        borderRadius: isUser ? '20px 20px 0 20px' : '20px 20px 20px 0'
      }}>
        <Typography variant="body1">{message.text}</Typography>
        {message.attachments && message.attachments.map((attachment, index) => (
          <Box key={index} sx={{ mt: 1 }}>
            {attachment.type === 'photo' && (
              <AdvancedImage
                cldImg={cld.image(attachment.url.split('/').pop().split('.')[0])
                  .format('auto')
                  .quality('auto')
                  .resize(auto().gravity(autoGravity()).width(500).height(500))}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            )}
            {attachment.type === 'video' && (
              <video controls style={{ maxWidth: '100%', height: 'auto' }}>
                <source src={attachment.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </Box>
        ))}
      </Paper>
      {isUser && (
        <Avatar sx={{ bgcolor: 'secondary.main', ml: 1 }}>U</Avatar>
      )}
    </Box>
  );
};

export default ChatMessage;
