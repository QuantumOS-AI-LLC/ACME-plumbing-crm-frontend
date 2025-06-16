import { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { toast } from 'sonner';

export const useSocketNotifications = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    // Listen for new notifications
    socket.on('notification', (notificationData) => {
      // console.log('New notification received:', notificationData);
      
      setNotifications(prev => [notificationData, ...prev]);
      
      if (!notificationData.isRead) {
        setUnreadCount(prev => prev + 1);
      }

      // Show toast notification using Sonner
      showToastNotification(notificationData);
    });

    // Listen for notification updates
    socket.on('notification_updated', (updateData) => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === updateData.notificationId 
            ? { ...notif, isRead: updateData.isRead }
            : notif
        )
      );

      if (updateData.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    });

    return () => {
      socket.off('notification');
      socket.off('notification_updated');
    };
  }, [socket]);

  const markAsRead = (notificationId) => {
    if (socket) {
      socket.emit('notification_read', { notificationId });
    }
  };

  const showToastNotification = (notification) => {
    // Use Sonner for toast notifications
    toast.success(notification.title, {
      description: notification.message,
      duration: 5000,
    });
  };

  return {
    notifications,
    unreadCount,
    markAsRead
  };
};

export default useSocketNotifications;
