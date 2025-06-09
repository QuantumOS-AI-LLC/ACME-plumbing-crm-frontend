import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';

const GoogleCalendarCallback = () => {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing Google Calendar connection...');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      if (error) {
        setStatus('error');
        if (error === 'access_denied') {
          setMessage('Google Calendar connection was cancelled. You can try connecting again from your profile settings.');
        } else {
          setMessage(`Google Calendar connection failed: ${errorDescription || error}`);
        }
        return;
      }

      if (code) {
        setStatus('success');
        setMessage('Google Calendar connected successfully! You will be redirected to your profile page shortly.');
        // Redirect after a short delay to show success message
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        setStatus('error');
        setMessage('Invalid callback parameters. Please try connecting again from your profile settings.');
      }
    };

    // Small delay to show processing state
    const timer = setTimeout(handleCallback, 500);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleReturnToProfile = () => {
    navigate('/profile');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 3,
        p: 3
      }}
    >
      {status === 'processing' && (
        <>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            {message}
          </Typography>
        </>
      )}
      
      {status === 'success' && (
        <>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />
          <Alert severity="success" sx={{ mb: 2, maxWidth: 500 }}>
            <Typography variant="h6" gutterBottom>
              Connection Successful!
            </Typography>
            <Typography variant="body2">
              {message}
            </Typography>
          </Alert>
          <Button 
            variant="contained" 
            onClick={handleReturnToProfile}
            sx={{ mt: 2 }}
          >
            Go to Profile
          </Button>
        </>
      )}
      
      {status === 'error' && (
        <>
          <ErrorIcon sx={{ fontSize: 80, color: 'error.main' }} />
          <Alert severity="error" sx={{ mb: 2, maxWidth: 500 }}>
            <Typography variant="h6" gutterBottom>
              Connection Failed
            </Typography>
            <Typography variant="body2">
              {message}
            </Typography>
          </Alert>
          <Button 
            variant="contained" 
            onClick={handleReturnToProfile}
            sx={{ mt: 2 }}
          >
            Return to Profile
          </Button>
        </>
      )}
    </Box>
  );
};

export default GoogleCalendarCallback;
