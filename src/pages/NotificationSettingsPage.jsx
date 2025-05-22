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

// Define the mapping between frontend identifiers and backend eventType strings
const eventTypeMap = {
  newEstimate: 'new_estimate',
  estimateAccepted: 'estimate_accepted',
  jobComplete: 'job_complete',
  paymentReceived: 'payment_received',
  dailySummary: 'daily_summary'
};

// For converting backend eventType back to frontend id if needed (though not strictly necessary for this refactor)
// const reverseEventTypeMap = Object.fromEntries(Object.entries(eventTypeMap).map(([key, value]) => [value, key]));

const NotificationSettingsPage = () => {
  const [settings, setSettings] = useState([]); // Settings will be an array from the backend
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        setLoading(true);
        const apiResponse = await fetchNotificationSettings(); // api.js returns the full response.data
        // The backend returns { success: true, data: settingsArray }
        // So, apiResponse itself should be the object { success, data }
        if (apiResponse && apiResponse.success && Array.isArray(apiResponse.data)) {
          setSettings(apiResponse.data);
        } else if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data.data)) { 
          // Fallback if api.js was changed to return the full axios response object
          setSettings(apiResponse.data.data);
        } else {
          // Handle cases where data might not be in expected format or empty
          // If backend creates defaults, this path might not be hit often for empty.
          // For now, if data is not an array, set to empty or handle error.
          console.warn('Received notification settings in unexpected format:', apiResponse);
          setSettings([]); // Default to empty array if format is wrong
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
  
  // channelKey: 'emailEnabled', 'smsEnabled', or 'appEnabled'
  // frontendEventTypeId: 'newEstimate', 'estimateAccepted', etc.
  const handleToggle = (channelKey, frontendEventTypeId) => {
    const backendEventType = eventTypeMap[frontendEventTypeId];
    if (!backendEventType) {
      console.error(`Unknown frontendEventTypeId: ${frontendEventTypeId}`);
      return;
    }

    setSettings(prevSettings =>
      prevSettings.map(setting => {
        if (setting.eventType === backendEventType) {
          return {
            ...setting,
            [channelKey]: !setting[channelKey]
          };
        }
        return setting;
      })
    );
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // The 'settings' state is already an array of objects.
      // Each object should have eventType, emailEnabled, smsEnabled, appEnabled.
      // The api.js service function now correctly wraps this array into { settings: settingsArray }.
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
                  {notificationTypes.map((type) => {
                    const backendEventType = eventTypeMap[type.id];
                    const currentSetting = settings.find(s => s.eventType === backendEventType);
                    const emailEnabled = currentSetting ? currentSetting.emailEnabled : false;
                    const smsEnabled = currentSetting ? currentSetting.smsEnabled : false;
                    const appEnabled = currentSetting ? currentSetting.appEnabled : false;

                    return (
                      <TableRow key={type.id}>
                        <TableCell component="th" scope="row">
                          {type.label}
                        </TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={emailEnabled}
                            onChange={() => handleToggle('emailEnabled', type.id)}
                            color="primary"
                            disabled={currentSetting === undefined}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={smsEnabled}
                            onChange={() => handleToggle('smsEnabled', type.id)}
                            color="primary"
                            disabled={currentSetting === undefined}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={appEnabled}
                            onChange={() => handleToggle('appEnabled', type.id)}
                            color="primary"
                            disabled={currentSetting === undefined}
                          />
                        </TableCell>
                    </TableRow>
                  );
                  })}
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

export default NotificationSettingsPage;
