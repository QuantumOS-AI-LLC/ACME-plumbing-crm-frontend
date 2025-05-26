import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

export const useAIChat = (contactId, estimateId = null) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Listen for AI messages
    socket.on('ai_message', (messageData) => {
      console.log('AI message received:', messageData);
      
      // Only add if it's for the current conversation
      if (messageData.contactId === contactId && 
          messageData.estimateId === estimateId) {
        setMessages(prev => [...prev, messageData]);
      }
    });

    // Listen for message saved confirmation
    socket.on('message_saved', (data) => {
      console.log('Message saved:', data);
      setIsSending(false);
      
      // Add user message to conversation
      if (data.message.contactId === contactId && 
          data.message.estimateId === estimateId) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    // Listen for typing indicators
    socket.on('user_typing', (data) => {
      if (data.contactId === contactId && data.estimateId === estimateId) {
        setIsTyping(data.isTyping);
      }
    });

    // Listen for errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setIsSending(false);
    });

    return () => {
      socket.off('ai_message');
      socket.off('message_saved');
      socket.off('user_typing');
      socket.off('error');
    };
  }, [socket, contactId, estimateId]);

  const sendMessage = useCallback((message) => {
    if (!socket || !message.trim() || isSending) return;

    setIsSending(true);
    
    socket.emit('user_message', {
      message: message.trim(),
      contactId,
      estimateId
    });
  }, [socket, contactId, estimateId, isSending]);

  const startTyping = useCallback(() => {
    if (socket) {
      socket.emit('typing_start', { contactId, estimateId });
    }
  }, [socket, contactId, estimateId]);

  const stopTyping = useCallback(() => {
    if (socket) {
      socket.emit('typing_stop', { contactId, estimateId });
    }
  }, [socket, contactId, estimateId]);

  return {
    messages,
    isTyping,
    isSending,
    sendMessage,
    startTyping,
    stopTyping
  };
};

export default useAIChat;
