import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { getConversationMessages } from '../services/api'; // Adjust path if necessary

export const useAIChat = (contactId, estimateId = null, initialConversationId = null, onConversationSaved = () => {}) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Listen for AI messages
    socket.on('ai_message', (messageData) => {
      /* console.log('AI message received:', messageData); */
      
      // Only add if it's for the current conversation
      if (messageData.contactId === contactId && 
          messageData.estimateId === estimateId) {
        setMessages(prev => [...prev, messageData]);
      }
    });

    // Listen for message saved confirmation
    socket.on('message_saved', (data) => {
      /* console.log('Message saved:', data); */
      setIsSending(false);
      
      // Add user message to conversation
      if (data.message.contactId === contactId &&
          data.message.estimateId === estimateId) {
        setMessages(prev => [...prev, data.message]);
        // If this was a new conversation, update its ID in the parent component
        if (initialConversationId && data.message.conversationId !== initialConversationId) {
          onConversationSaved(contactId, data.message.conversationId);
        }
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
  }, [socket, contactId, estimateId, initialConversationId, onConversationSaved]);

  // Effect to load message history
  useEffect(() => {
    const loadHistory = async () => {
      if (contactId && socket) {
        setIsLoadingHistory(true);
        setMessages([]); // Clear messages from previous conversation
        try {
          const historyResponse = await getConversationMessages(contactId);
          // The API response has the array of messages directly in historyResponse.data
          if (historyResponse && historyResponse.data && Array.isArray(historyResponse.data)) {
            // Assuming API returns messages sorted, or sort here:
            // historyResponse.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            setMessages(historyResponse.data);
          } else {
            /* console.log('No message history found or invalid format for contact:', contactId, historyResponse); */
            setMessages([]);
          }
       } catch (error) {
         console.error('Error fetching conversation history for contact:', contactId, error);
         setMessages([]);
       } finally {
         setIsLoadingHistory(false);
         // If it's a new conversation, trigger the onConversationSaved callback
         if (initialConversationId && messages.length === 0) {
           onConversationSaved(contactId, initialConversationId);
         }
       }
     } else {
       setMessages([]); // Clear messages if no contactId
     }
   };

   loadHistory();
 }, [contactId, socket, initialConversationId, onConversationSaved]); // Rerun when contactId or socket changes

  const sendMessage = useCallback((message, attachments = []) => {
    if (!socket || (!message.trim() && attachments.length === 0) || isSending) return;
 
     setIsSending(true);
     const messageToSend = message.trim() === '' && attachments.length > 0 ? null : message.trim();
     socket.emit('user_message', {
       message: messageToSend,
       contactId,
       estimateId,
       attachments // Include attachments in the payload
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
    isLoadingHistory,
    sendMessage,
    startTyping,
    stopTyping
  };
};

export default useAIChat;
