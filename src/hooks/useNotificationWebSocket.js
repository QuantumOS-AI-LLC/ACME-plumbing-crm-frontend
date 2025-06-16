import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

export const useNotificationWebSocket = () => {
  const ws = useRef(null);
  const { addNotification } = useNotifications();
  
  useEffect(() => {
    const connectWebSocket = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//get-connected-backend.dev.quantumos.ai/ws?token=${token}`;
      
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        // console.log('WebSocket connection established');
      };
      
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            // Add the new notification to state
            addNotification(data.data);
            
            // Show toast notification (could be implemented with a library like react-toastify)
            // console.log(`New notification: ${data.data.title} - ${data.data.message}`);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.current.onclose = () => {
        // console.log('WebSocket connection closed');
        // Attempt to reconnect after a delay
        setTimeout(connectWebSocket, 5000);
      };
    };
    
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [addNotification]);
  
  return ws.current;
};

export default useNotificationWebSocket;
