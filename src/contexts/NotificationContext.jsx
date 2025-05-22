import React, { createContext, useState, useEffect, useContext } from 'react';
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
  const loadNotifications = async (page = 1, limit = 10, isRead) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchNotifications(page, limit, isRead);
      
      if (response.success) {
        setNotifications(response.data);
        setPagination(response.pagination);
        setUnreadCount(response.data.filter(n => !n.isRead).length);
      }
    } catch (err) {
      setError('Failed to load notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id) => {
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
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
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
  };

  // Delete notification
  const removeNotification = async (id) => {
    try {
      const response = await deleteNotification(id);
      if (response.success) {
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
  };

  // Add a new notification (used with WebSocket)
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  };

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, []);

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
