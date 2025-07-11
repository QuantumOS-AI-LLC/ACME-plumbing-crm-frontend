import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { StreamVideoClient } from '@stream-io/video-react-sdk';

const VideoContext = createContext();

export const useVideoClient = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideoClient must be used within VideoProvider');
  }
  return context;
};

export const VideoProvider = ({ children, skipAutoInit = false }) => {
  const [client, setClient] = useState(null);
  const [user, setUser] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState(null); // 'staff', 'guest', 'customer'

  // Initialize for authenticated CRM users
  const initializeForCRMUser = useCallback(async (crmUser) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Get JWT token from storage (same pattern as other API calls)
      const jwtToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      if (!jwtToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/video/auth-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}` // Use stored JWT token
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get video token for CRM user');
      }

      const { token, apiKey, userId, userName, userType: type } = await response.json();

      const userData = {
        id: userId,
        name: userName,
      };

      const videoClient = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: userData,
        token,
      });

      setClient(videoClient);
      setUser(userData);
      setUserType(type);

      return videoClient;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Initialize for guests (manual entry)
  const initializeForGuest = useCallback(async (userName, callId) => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/video/guest-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName, callId }),
      });

      if (!response.ok) {
        throw new Error('Failed to get guest token');
      }

      const { token, apiKey, userId, userType: type } = await response.json();

      const userData = {
        id: userId,
        name: userName,
      };

      const videoClient = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: userData,
        token,
      });

      setClient(videoClient);
      setUser(userData);
      setUserType(type);

      return videoClient;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Initialize from secure call link
  const initializeFromLink = useCallback(async (linkToken) => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/video/verify-link/${linkToken}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid call link');
      }

      const { token, apiKey, userId, userName, callId, userType: type, email } = await response.json();

      const userData = {
        id: userId,
        name: userName,
      };

      const videoClient = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: userData,
        token,
      });

      setClient(videoClient);
      setUser(userData);
      setUserType(type);

      return { videoClient, callId };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Legacy manual initialization (for testing)
  const initializeClient = useCallback(async (userId, userName) => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/video/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, userName }),
      });

      if (!response.ok) {
        throw new Error('Failed to get token');
      }

      const { token, apiKey } = await response.json();

      const userData = {
        id: userId,
        name: userName,
      };

      const videoClient = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: userData,
        token,
      });

      setClient(videoClient);
      setUser(userData);
      setUserType('manual');

      return videoClient;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectClient = useCallback(async () => {
    if (client) {
      await client.disconnectUser();
      setClient(null);
      setUser(null);
      setUserType(null);
    }
  }, [client]);

  // Auto-initialize video client for authenticated CRM users (only on protected routes)
  useEffect(() => {
    // Skip auto-initialization if explicitly disabled or on guest routes
    if (skipAutoInit) {
      return;
    }

    // Check if we're on a guest route
    const isGuestRoute = window.location.pathname === '/join-call';
    if (isGuestRoute) {
      return;
    }

    const initializeForAuthenticatedUser = async () => {
      // Get user from localStorage/sessionStorage (same pattern as other parts of app)
      const userProfile = JSON.parse(
        localStorage.getItem('userProfile') || 
        sessionStorage.getItem('userProfile') || 
        '{}'
      );
      
      // Only initialize if we have a valid user profile and valid auth token
      const jwtToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      if (userProfile.id && jwtToken && !client && !isConnecting) {
        try {
          await initializeForCRMUser(userProfile);
        } catch (error) {
          // Silent fail - don't break the app for video initialization issues
          console.warn('Video initialization failed for authenticated user:', error.message);
        }
      }
    };

    initializeForAuthenticatedUser();
  }, [client, isConnecting, initializeForCRMUser, skipAutoInit]); // Dependencies to prevent infinite loops

  return (
    <VideoContext.Provider
      value={{
        client,
        user,
        userType,
        isConnecting,
        error,
        initializeClient,
        initializeForCRMUser,
        initializeForGuest,
        initializeFromLink,
        disconnectClient,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};
