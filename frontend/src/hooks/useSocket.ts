// frontend/src/hooks/useSocket.ts
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSocket = (userId: string | number, role: string) => {
  const [socket, setSocket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState<any>(null);
  const [readReceipt, setReadReceipt] = useState<any>(null);
  const [unreadUpdate, setUnreadUpdate] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;

    const socketInstance = io(SOCKET_URL);
    setSocket(socketInstance);

    // Join user's room
    socketInstance.emit('join', { userId: userId.toString(), role });

    // Listen for new messages
    socketInstance.on('new_message', (message: any) => {
      console.log('📨 New message received:', message);
      setNewMessage(message);
    });

    // Listen for read receipts
    socketInstance.on('messages_read_receipt', (data: any) => {
      console.log('👁️ Messages read receipt:', data);
      setReadReceipt(data);
    });

    // Listen for unread count updates
    socketInstance.on('unread_count_update', (data: any) => {
      console.log('🔴 Unread count update:', data);
      setUnreadUpdate(data);
    });

    // Listen for unread cleared
    socketInstance.on('unread_cleared', (data: any) => {
      console.log('✅ Unread cleared:', data);
      setUnreadUpdate({ conversationId: data.conversationId, unreadCount: 0 });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [userId, role]);

  const sendMessage = (receiverId: string | number, receiverRole: string, messageData: any) => {
    if (socket) {
      socket.emit('send_message', {
        receiverId: receiverId.toString(),
        receiverRole,
        message: messageData
      });
    }
  };

  const markAsRead = (conversationWith: { id: string | number, role: string }) => {
    if (socket) {
      socket.emit('messages_read', {
        userId: userId.toString(),
        role,
        conversationWith: {
          id: conversationWith.id.toString(),
          role: conversationWith.role
        }
      });
    }
  };

  const clearNewMessage = () => setNewMessage(null);
  const clearReadReceipt = () => setReadReceipt(null);
  const clearUnreadUpdate = () => setUnreadUpdate(null);

  return {
    socket,
    newMessage,
    readReceipt,
    unreadUpdate,
    sendMessage,
    markAsRead,
    clearNewMessage,
    clearReadReceipt,
    clearUnreadUpdate
  };
};