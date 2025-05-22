import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  // Load notifications
  const loadNotifications = useCallback(async (page = 1, limit = 10, isRead) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchNotifications(page, limit, isRead);
      
      if (response.success) {
        setNotifications(response.data);
        setPagination(response.pagination);
        // Global unreadCount is no longer set here to avoid inaccuracies.
        // It's set on initial load and updated by specific actions.
      }
    } catch (err) {
      setError('Failed to load notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []); // Assuming fetchNotifications and setters are stable

  // Mark notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      const response = await markNotificationAsRead(id);
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return response;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []); // Assuming markNotificationAsRead and setters are stable

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await markAllNotificationsAsRead();
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
      return response;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []); // Assuming markAllNotificationsAsRead and setters are stable

  // Delete notification
  const removeNotification = useCallback(async (id) => {
    try {
      const response = await deleteNotification(id);
      if (response.success) {
        // 'notifications' state is used here, so it must be a dependency
        const notificationToRemove = notifications.find(n => n.id === id); 
        setNotifications(prev => prev.filter(n => n.id !== id));
        
        if (notificationToRemove && !notificationToRemove.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
      return response;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, [notifications]); // Added 'notifications' to dependency array

  // Add a new notification (used with WebSocket)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  }, []); // Setters are stable

  // Initial load for total unread count
  useEffect(() => {
    const fetchInitialUnreadCount = async () => {
      try {
        // Fetching with isRead: false and limit: 1 to get the total unread count
        // from pagination.total, which reflects the count for the 'where' clause.
        const response = await fetchNotifications(1, 1, false);
        if (response.success && response.pagination) {
          setUnreadCount(response.pagination.total);
        } else {
          // Fallback or error handling if initial count fetch fails
          console.error('Failed to fetch initial unread count:', response);
          setUnreadCount(0); // Default to 0 on failure
        }
      } catch (err) {
        console.error('Error fetching initial unread count:', err);
        setUnreadCount(0); // Default to 0 on error
        // Optionally set a specific error state for this
      }
    };

    fetchInitialUnreadCount();
    // Note: The NotificationsPage.jsx will call loadNotifications() itself for its initial display.
    // This useEffect is only for the global unread count.
  }, []); // Empty dependency array to run once on mount

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
