import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const EventCard = ({ event, onEdit, onDelete }) => {
  // Format time from date
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle edit button click
  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(event);
  };

  // Handle delete button click
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(event);
  };

  return (
    <Box 
      sx={{ 
        p: 2, 
        mb: 2, 
        borderLeft: '4px solid', 
        borderColor: 'primary.main',
        borderRadius: 1,
        bgcolor: 'background.default',
        position: 'relative'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <Box>
          <Typography variant="h6">{event.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {formatTime(event.start)} - {formatTime(event.end)}
          </Typography>
        </Box>
        <Box>
          {onEdit && (
            <IconButton size="small" onClick={handleEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton size="small" color="error" onClick={handleDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
      
      {event.location && (
        <Typography variant="body2" mt={1}>
          Location: {event.location}
        </Typography>
      )}
      {event.description && (
        <Typography variant="body2" mt={1}>
          {event.description}
        </Typography>
      )}
    </Box>
  );
};

export default EventCard;
