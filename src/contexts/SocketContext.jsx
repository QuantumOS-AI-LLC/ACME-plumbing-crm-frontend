import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const { isAuthenticated, isInitialized } = useAuth();

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 5000; // 5 seconds

  useEffect(() => {
    // Only connect when authenticated and initialized
    if (!isInitialized) {
      return; // Wait for auth initialization
    }

    if (!isAuthenticated()) {
      // Clear socket state when not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
      }
      setIsConnected(false);
      setConnectionError(null);
      setIsLocationSharing(false);
      setLocationError(null);
      return;
    }

    // Get token from localStorage or sessionStorage (matching current WebSocket implementation)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      setConnectionError('No authentication token found');
      return;
    }

    // Check if we've exceeded retry attempts
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      // console.log('Max retry attempts reached, not attempting to connect');
      setConnectionError('WebSocket server unavailable. Please check if the server is running.');
      return;
    }

    // Use VITE_SOCKET_URL for Socket.IO connection
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:5000';
    
    // console.log(`Attempting WebSocket connection (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
    
    const newSocket = io(socketUrl, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
      timeout: 10000, // 10 second timeout
      reconnection: false // Disable automatic reconnection to control it manually
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      // console.log('Connected to Socket.IO server');
      setIsConnected(true);
      setConnectionError(null);
      setRetryCount(0); // Reset retry count on successful connection
    });

    newSocket.on('connected', (data) => {
      // console.log('Server confirmation:', data);
    });

    newSocket.on('disconnect', (reason) => {
      // console.log('Disconnected from server:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
      
      // Increment retry count and schedule retry if under limit
      setRetryCount(prev => {
        const newCount = prev + 1;
        if (newCount < MAX_RETRY_ATTEMPTS) {
          // console.log(`Scheduling retry in ${RETRY_DELAY}ms (attempt ${newCount + 1}/${MAX_RETRY_ATTEMPTS})`);
          setTimeout(() => {
            // Trigger a re-render to retry connection
            setRetryCount(newCount);
          }, RETRY_DELAY);
        } else {
          // console.log('Max retry attempts reached');
          setConnectionError('WebSocket server unavailable. Please check if the server is running.');
        }
        return newCount;
      });
    });

    // Location event handlers
    newSocket.on('location_sharing_started', (data) => {
      // console.log('Location sharing started:', data);
      setIsLocationSharing(true);
      setLocationError(null);
    });

    newSocket.on('location_sharing_stopped', (data) => {
      // console.log('Location sharing stopped:', data);
      setIsLocationSharing(false);
      setLocationError(null);
    });

    newSocket.on('location_updated', (data) => {
      // console.log('Location updated successfully:', data);
      setLocationError(null);
    });

    newSocket.on('location_error', (error) => {
      console.error('Location error:', error);
      setLocationError(error.message || 'Location operation failed');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isInitialized, isAuthenticated, retryCount]);

  // Location sharing functions
  const startLocationSharing = () => {
    if (socket && isConnected) {
      // console.log('Starting location sharing...');
      socket.emit('location_start_sharing', {});
    } else {
      setLocationError('Socket not connected');
    }
  };

  const stopLocationSharing = () => {
    if (socket && isConnected) {
      // console.log('Stopping location sharing...');
      socket.emit('location_stop_sharing', {});
    } else {
      setLocationError('Socket not connected');
    }
  };

  const updateLocation = (latitude, longitude, accuracy) => {
    if (socket && isConnected && isLocationSharing) {
      socket.emit('location_update', {
        latitude,
        longitude,
        accuracy
      });
    }
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    isLocationSharing,
    locationError,
    startLocationSharing,
    stopLocationSharing,
    updateLocation
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
