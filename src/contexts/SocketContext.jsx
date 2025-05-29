import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

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
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const reconnectTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const isConnectingRef = useRef(false);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 second

  // Get authentication token
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }, []);

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback((attempt) => {
    return Math.min(baseReconnectDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
  }, [baseReconnectDelay]);

  // Handle token refresh (placeholder for future implementation)
  const refreshToken = useCallback(async () => {
    // TODO: Implement token refresh logic if needed
    // For now, just return the current token
    return getAuthToken();
  }, [getAuthToken]);

  // Initialize socket connection
  const initializeSocket = useCallback((token) => {
    // Prevent multiple simultaneous connections
    if (isConnectingRef.current) {
      console.log('Connection already in progress, skipping...');
      return null;
    }

    isConnectingRef.current = true;
    
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:5000';
    
    const newSocket = io(socketUrl, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true // Force new connection to prevent reuse issues
    });

    return newSocket;
  }, []);

  // Handle reconnection with exponential backoff
  const handleReconnection = useCallback((currentAttempts) => {
    // Prevent multiple reconnection attempts
    if (isConnectingRef.current || reconnectTimeoutRef.current) {
      console.log('Reconnection already in progress, skipping...');
      return;
    }

    if (currentAttempts >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      setConnectionError('Unable to establish connection after multiple attempts');
      setIsReconnecting(false);
      isConnectingRef.current = false;
      return;
    }

    const delay = getReconnectDelay(currentAttempts);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${currentAttempts + 1}/${maxReconnectAttempts})`);
    
    setIsReconnecting(true);
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        const token = await refreshToken();
        if (!token) {
          setConnectionError('No authentication token available');
          setIsReconnecting(false);
          isConnectingRef.current = false;
          return;
        }

        // Clean up existing socket
        if (socketRef.current) {
          socketRef.current.removeAllListeners();
          socketRef.current.close();
        }

        // Create new socket connection
        const newSocket = initializeSocket(token);
        if (newSocket) {
          socketRef.current = newSocket;
          setSocket(newSocket);
          setupSocketListeners(newSocket);
        }
        
        setReconnectAttempts(prev => prev + 1);
        reconnectTimeoutRef.current = null;
      } catch (error) {
        console.error('Error during reconnection:', error);
        setConnectionError('Authentication failed during reconnection');
        setIsReconnecting(false);
        isConnectingRef.current = false;
        reconnectTimeoutRef.current = null;
      }
    }, delay);
  }, [getReconnectDelay, refreshToken, initializeSocket, maxReconnectAttempts]);

  // Setup socket event listeners
  const setupSocketListeners = useCallback((socketInstance) => {
    // Connection success
    socketInstance.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
      setConnectionError(null);
      setIsReconnecting(false);
      setReconnectAttempts(0);
      isConnectingRef.current = false;
      
      // Clear any pending reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    // Server confirmation
    socketInstance.on('connected', (data) => {
      console.log('Server confirmation:', data);
    });

    // Connection error handling
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
      isConnectingRef.current = false;
      
      // Handle different types of errors
      if (error.message.includes('Authentication')) {
        setConnectionError('Authentication failed. Please log in again.');
        setIsReconnecting(false);
        // Don't auto-reconnect for auth errors
      } else {
        setConnectionError(error.message);
        // Attempt reconnection for non-auth errors with current attempt count
        setReconnectAttempts(currentAttempts => {
          if (currentAttempts < maxReconnectAttempts) {
            handleReconnection(currentAttempts);
          }
          return currentAttempts;
        });
      }
    });

    // Disconnection handling
    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      isConnectingRef.current = false;
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'transport error') {
        setReconnectAttempts(currentAttempts => {
          handleReconnection(currentAttempts);
          return currentAttempts;
        });
      }
      // For 'io client disconnect', don't auto-reconnect (manual disconnect)
    });

    // Global error handling
    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionError(error.message || 'Socket error occurred');
      isConnectingRef.current = false;
    });
  }, [handleReconnection, maxReconnectAttempts]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (!isConnectingRef.current && !isReconnecting) {
      setReconnectAttempts(0);
      setConnectionError(null);
      
      // Clean up existing socket
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.close();
      }
      
      // Create new connection
      const token = getAuthToken();
      if (token) {
        const newSocket = initializeSocket(token);
        if (newSocket) {
          socketRef.current = newSocket;
          setSocket(newSocket);
          setupSocketListeners(newSocket);
        }
      }
    }
  }, [isReconnecting, getAuthToken, initializeSocket, setupSocketListeners]);

  // Main initialization effect - ONLY runs once on mount
  useEffect(() => {
    const token = getAuthToken();
    
    if (!token) {
      setConnectionError('No authentication token found');
      return;
    }

    // Prevent multiple initializations
    if (socketRef.current || isConnectingRef.current) {
      return;
    }

    const newSocket = initializeSocket(token);
    if (!newSocket) {
      return;
    }

    socketRef.current = newSocket;
    setSocket(newSocket);
    setupSocketListeners(newSocket);

    // Cleanup function
    return () => {
      isConnectingRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.close();
        socketRef.current = null;
      }
      
      setSocket(null);
      setIsConnected(false);
    };
  }, []); // Empty dependency array - only run once!

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network back online, attempting to reconnect...');
      if (!isConnected && !isConnectingRef.current) {
        reconnect();
      }
    };

    const handleOffline = () => {
      console.log('Network went offline');
      setConnectionError('Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected, reconnect]);

  const value = {
    socket,
    isConnected,
    connectionError,
    isReconnecting,
    reconnectAttempts,
    maxReconnectAttempts,
    reconnect
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
