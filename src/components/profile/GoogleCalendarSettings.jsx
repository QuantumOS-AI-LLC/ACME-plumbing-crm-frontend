import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';

const GoogleCalendarSettings = () => {
  const {
    isConnected,
    loading,
    error,
    userEmail,
    connectGoogleCalendar,
    disconnect
  } = useGoogleCalendar();

  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    const success = await disconnect();
    setDisconnecting(false);
    setDisconnectDialogOpen(false);
    
    if (!success) {
      // Error is already handled in the hook
      // console.log('Disconnect failed');
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} />
          <Typography>Checking Google Calendar connection...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <GoogleIcon color="primary" />
          <Typography variant="h6">Google Calendar Integration</Typography>
          {isConnected && (
            <Chip 
              label="Connected" 
              color="success" 
              size="small" 
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isConnected ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your Google Calendar is connected. Events created in this CRM will automatically sync to your Google Calendar.
            </Typography>
            {userEmail && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                Connected account: <strong>{userEmail}</strong>
              </Typography>
            )}
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDisconnectDialogOpen(true)}
              disabled={disconnecting}
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect Google Calendar'}
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Connect your Google Calendar to automatically sync events created in this CRM to your personal calendar.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              <strong>Benefits:</strong>
              <br />
              • Automatic event synchronization
              • Never miss an appointment
              • Access your schedule from any device
              • Seamless integration with your existing calendar
            </Typography>
            <Button
              variant="contained"
              startIcon={<GoogleIcon />}
              onClick={connectGoogleCalendar}
              sx={{ 
                backgroundColor: '#4285f4',
                '&:hover': {
                  backgroundColor: '#3367d6'
                }
              }}
            >
              Connect Google Calendar
            </Button>
          </Box>
        )}
      </Paper>

      {/* Disconnect Confirmation Dialog */}
      <Dialog
        open={disconnectDialogOpen}
        onClose={() => setDisconnectDialogOpen(false)}
        aria-labelledby="disconnect-dialog-title"
        aria-describedby="disconnect-dialog-description"
      >
        <DialogTitle id="disconnect-dialog-title">
          Disconnect Google Calendar?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="disconnect-dialog-description">
            Are you sure you want to disconnect your Google Calendar? 
            Future events created in this CRM will no longer be automatically synced to your Google Calendar.
            <br /><br />
            Existing events that have already been synced will remain in your Google Calendar.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDisconnectDialogOpen(false)}
            disabled={disconnecting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDisconnect} 
            color="error" 
            variant="contained"
            disabled={disconnecting}
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GoogleCalendarSettings;
