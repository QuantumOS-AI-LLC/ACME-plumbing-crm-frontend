import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip
} from '@mui/material';

const ContactCard = ({ contact, onClick }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main', 
              width: 50, 
              height: 50,
              mr: 2
            }}
          >
            {getInitials(contact.name)}
          </Avatar>
          <Box>
            <Typography variant="h6">{contact.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {contact.type || 'Contact'}
            </Typography>
          </Box>
        </Box>
        
        {contact.tags && contact.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {contact.tags.map((tag, index) => (
              <Chip 
                key={index}
                label={tag}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactCard;
