import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({ 
  title, 
  subtitle, 
  action, 
  actionText, 
  onAction, 
  showBackButton = false,
  showEditButton = false,
  onEdit 
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Navigate back to the previous page in history
  };

  return (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {showBackButton && (
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom={!!subtitle}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showEditButton && (
           <Button
            variant="outlined"
            color="primary"
            onClick={onEdit}
            startIcon={<EditIcon />}
            sx={{
              textTransform: 'none',
              borderRadius: 1,
              px: 2,
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText'
              }
            }}
          >
            Edit
          </Button>
        )}
        {action && (
          <Button variant="contained" color="primary" onClick={onAction}>
            {actionText || 'Action'}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;