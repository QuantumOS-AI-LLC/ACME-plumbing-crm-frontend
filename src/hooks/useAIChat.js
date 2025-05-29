import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { getConversationMessages } from '../services/api';

export const useAIChat = (contactId, estimateId = null) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Refs for managing state and preventing race conditions
  const messagesRef = useRef([]);
  const typingTimeoutRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  // Update messages ref when messages state changes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Message deduplication helper
  const isDuplicateMessage = useCallback((newMessage, existingMessages) => {
    return existingMessages.some(msg => {
      // Check by ID first (most reliable)
      if (msg.id && newMessage.id && msg.id === newMessage.id) {
        return true;
      }
      
      // Check by content, sender, and timestamp (for messages without IDs)
      if (msg.message === newMessage.message && 
          msg.senderType === newMessage.senderType &&
          msg.contactId === newMessage.contactId &&
          msg.estimateId === newMessage.estimateId) {
        
        // Check if timestamps are very close (within 1 second)
        const timeDiff = Math.abs(
          new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()
        );
        
        if (timeDiff < 1000) {
          return true;
        }
      }
      
      return false;
    });
  }, []);

  // Add message with deduplication
  const addMessageSafely = useCallback((newMessage) => {
    setMessages(prevMessages => {
      // Only add if it belongs to current conversation
      if (newMessage.contactId !== contactId || newMessage.estimateId !== estimateId) {
        return prevMessages;
      }

      // Check for duplicates
      if (isDuplicateMessage(newMessage, prevMessages)) {
        console.log('Duplicate message detected, skipping:', newMessage);
        return prevMessages;
      }

      // Add the new message
      const updatedMessages = [...prevMessages, newMessage];
      
      // Keep only the most recent 1000 messages for performance
      if (updatedMessages.length > 1000) {
        return updatedMessages.slice(-1000);
      }
      
      return updatedMessages;
    });
  }, [contactId, estimateId, isDuplicateMessage]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for AI messages
    const handleAIMessage = (messageData) => {
      console.log('AI message received:', messageData);
      
      // Clear typing indicator when AI responds
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      addMessageSafely(messageData);
    };

    // Listen for message saved confirmation
    const handleMessageSaved = (data) => {
      console.log('Message saved:', data);
      setIsSending(false);
      
      if (data.message) {
        addMessageSafely(data.message);
      }
    };

    // Listen for typing indicators
    const handleTypingIndicator = (data) => {
      // Only show typing for current conversation
      if (data.contactId === contactId && data.estimateId === estimateId) {
        setIsTyping(data.isTyping);
        
        // Auto-clear typing indicator after 10 seconds
        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 10000);
        } else {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
        }
      }
    };

    // Listen for errors
    const handleSocketError = (error) => {
      console.error('Socket error:', error);
      setIsSending(false);
      setIsTyping(false);
    };

    // Register event listeners
    socket.on('ai_message', handleAIMessage);
    socket.on('message_saved', handleMessageSaved);
    socket.on('user_typing', handleTypingIndicator);
    socket.on('error', handleSocketError);

    // Cleanup listeners
    return () => {
      socket.off('ai_message', handleAIMessage);
      socket.off('message_saved', handleMessageSaved);
      socket.off('user_typing', handleTypingIndicator);
      socket.off('error', handleSocketError);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, isConnected, contactId, estimateId, addMessageSafely]);

  // Load conversation history
  useEffect(() => {
    const loadHistory = async () => {
      if (!contactId) {
        setMessages([]);
        return;
      }

      setIsLoadingHistory(true);
      setMessages([]); // Clear messages from previous conversation
      setIsTyping(false); // Clear typing indicator
      setIsSending(false); // Clear sending state
      
      try {
        const historyResponse = await getConversationMessages(contactId);
        
        if (historyResponse && historyResponse.data && Array.isArray(historyResponse.data)) {
          // Sort messages by creation date to ensure proper order
          const sortedMessages = historyResponse.data.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          setMessages(sortedMessages);
          
          // Store the last message ID for potential future use
          if (sortedMessages.length > 0) {
            lastMessageIdRef.current = sortedMessages[sortedMessages.length - 1].id;
          }
          
          console.log(`Loaded ${sortedMessages.length} messages for contact:`, contactId);
        } else {
          console.log('No message history found for contact:', contactId);
          setMessages([]);
        }
      } catch (error) {
        console.error('Error fetching conversation history for contact:', contactId, error);
        setMessages([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [contactId]); // Only depend on contactId, not socket

  // Send message function
  const sendMessage = useCallback((message) => {
    if (!socket || !isConnected || !message.trim() || isSending) {
      console.warn('Cannot send message:', {
        hasSocket: !!socket,
        isConnected,
        hasMessage: !!message.trim(),
        isSending
      });
      return false;
    }

    setIsSending(true);
    
    const messageData = {
      message: message.trim(),
      contactId,
      estimateId
    };

    console.log('Sending message via Socket.IO:', messageData);
    socket.emit('user_message', messageData);
    
    return true;
  }, [socket, isConnected, contactId, estimateId, isSending]);

  // Typing indicator functions
  const startTyping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('typing_start', { contactId, estimateId });
    }
  }, [socket, isConnected, contactId, estimateId]);

  const stopTyping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { contactId, estimateId });
    }
  }, [socket, isConnected, contactId, estimateId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    isTyping,
    isSending,
    isLoadingHistory,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping
  };
};

export default useAIChat;
