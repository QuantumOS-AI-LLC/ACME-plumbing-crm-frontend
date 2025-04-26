import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { fetchNotificationSettings, updateNotificationSettings } from '../services/api';
import PageHeader from '../components/common/PageHeader';

const NotificationsPage = () => {
  const [settings, setSettings] = useState({
    email: {
      newEstimate: true,
      estimateAccepted: true,
      jobComplete: true,
      paymentReceived: true,
      dailySummary: false
    },
    sms: {
      newEstimate: false,
      estimateAccepted: true,
      jobComplete: false,
      paymentReceived: true,
      dailySummary: false
    },
    app: {
      newEstimate: true,
      estimateAccepted: true,
      jobComplete: true,
      paymentReceived: true,
      dailySummary: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        setLoading(true);
        const response = await fetchNotificationSettings();
        if (response && response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
        setError('Failed to load notification settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadNotificationSettings();
  }, []);
  
  const handleToggle = (channel, notification) => {
    setSettings(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [notification]: !prev[channel][notification]
      }
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      await updateNotificationSettings(settings);
      setSuccess(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setError('Failed to update notification settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const notificationTypes = [
    { id: 'newEstimate', label: 'New Estimate Request' },
    { id: 'estimateAccepted', label: 'Estimate Accepted' },
    { id: 'jobComplete', label: 'Job Complete' },
    { id: 'paymentReceived', label: 'Payment Received' },
    { id: 'dailySummary', label: 'Daily Summary' }
  ];

  return (
    <Box>
      <PageHeader title="Notification Settings" />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Notification settings updated successfully!
            </Alert>
          )}
          
          <Typography variant="body1" paragraph>
            Choose how you want to be notified about different events:
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Notification</TableCell>
                    <TableCell align="center">Email</TableCell>
                    <TableCell align="center">SMS</TableCell>
                    <TableCell align="center">App</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notificationTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell component="th" scope="row">
                        {type.label}
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={settings.email[type.id]}
                          onChange={() => handleToggle('email', type.id)}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={settings.sms[type.id]}
                          onChange={() => handleToggle('sms', type.id)}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={settings.app[type.id]}
                          onChange={() => handleToggle('app', type.id)}
                          color="primary"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </form>
        </Paper>
      )}
    </Box>
  );
};

export default NotificationsPage;
