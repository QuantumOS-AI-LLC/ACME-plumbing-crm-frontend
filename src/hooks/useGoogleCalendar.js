import { useState, useEffect } from 'react';
import { getGoogleCalendarStatus, disconnectGoogleCalendar, initiateGoogleCalendarAuth } from '../services/api';

export const useGoogleCalendar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getGoogleCalendarStatus();
      
      if (response && response.success && response.data) {
        setIsConnected(response.data.isConnected || false);
        setUserEmail(response.data.userEmail || null);
      } else {
        setIsConnected(false);
        setUserEmail(null);
      }
    } catch (err) {
      console.error('Error checking Google Calendar status:', err);
      setError('Failed to check Google Calendar connection status');
      setIsConnected(false);
      setUserEmail(null);
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      setError(null);
      const response = await initiateGoogleCalendarAuth();
      
      if (response && response.success && response.data && response.data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = response.data.authUrl;
      } else {
        throw new Error('Invalid auth response from server');
      }
    } catch (err) {
      console.error('Error initiating Google Calendar connection:', err);
      setError('Failed to initiate Google Calendar connection');
    }
  };

  const disconnect = async () => {
    try {
      setError(null);
      const response = await disconnectGoogleCalendar();
      
      if (response && response.success) {
        setIsConnected(false);
        setUserEmail(null);
        return true;
      } else {
        throw new Error('Failed to disconnect from server');
      }
    } catch (err) {
      console.error('Error disconnecting Google Calendar:', err);
      setError('Failed to disconnect Google Calendar');
      return false;
    }
  };

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  return {
    isConnected,
    loading,
    error,
    userEmail,
    connectGoogleCalendar,
    disconnect,
    refreshStatus: checkConnectionStatus
  };
};

export default useGoogleCalendar;
