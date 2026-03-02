// frontend/src/hooks/useSocket.ts
import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSocket = (userId: string | number, role: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newMessage, setNewMessage] = useState<any>(null);
  const [readReceipt, setReadReceipt] = useState<any>(null);
  const [unreadUpdate, setUnreadUpdate] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set()); // 👈 ADD THIS

  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('🟢 Socket connected');
      setIsConnected(true);
      
      socketInstance.emit('join', { 
        userId: userId.toString(), 
        role 
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('🔴 Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    socketInstance.on('new_message', (message: any) => {
      console.log('📨 New message received:', message);
      setNewMessage(message);
    });

    socketInstance.on('message_sent', (message: any) => {
      console.log('✅ Message sent confirmation:', message);
    });

    socketInstance.on('messages_read_receipt', (data: any) => {
      console.log('👁️ Messages read receipt:', data);
      setReadReceipt(data);
    });

    socketInstance.on('unread_count_update', (data: any) => {
      console.log('🔴 Unread count update:', data);
      setUnreadUpdate(data);
    });

    socketInstance.on('unread_cleared', (data: any) => {
      console.log('✅ Unread cleared:', data);
      setUnreadUpdate({ conversationId: data.conversationId, unreadCount: 0 });
    });

    // 👇 ADD THIS: Listen for user status changes
    socketInstance.on('user_status_change', (data: { userId: string; online: boolean }) => {
      console.log('👤 User status change:', data);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.online) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    });

    return () => {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, [userId, role]);

  // 👇 ADD THIS: Function to check if a user is online
  const isUserOnline = useCallback((userRoom: string): boolean => {
    return onlineUsers.has(userRoom);
  }, [onlineUsers]);

  const sendMessage = useCallback((receiverId: string | number, receiverRole: string, messageData: any) => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        receiverId: receiverId.toString(),
        receiverRole,
        message: messageData
      });
    } else {
      console.warn('Socket not connected, cannot send message');
    }
  }, [socket, isConnected]);

  const markAsRead = useCallback((conversationWith: { id: string | number, role: string }) => {
    if (socket && isConnected && userId) {
      socket.emit('messages_read', {
        userId: userId.toString(),
        role,
        conversationWith: {
          id: conversationWith.id.toString(),
          role: conversationWith.role
        }
      });
    }
  }, [socket, isConnected, userId, role]);

  const clearNewMessage = useCallback(() => setNewMessage(null), []);
  const clearReadReceipt = useCallback(() => setReadReceipt(null), []);
  const clearUnreadUpdate = useCallback(() => setUnreadUpdate(null), []);

  // 👇 MAKE SURE isUserOnline IS IN THE RETURN OBJECT
  return {
    socket,
    isConnected,
    newMessage,
    readReceipt,
    unreadUpdate,
    isUserOnline, // 👈 THIS MUST BE HERE
    sendMessage,
    markAsRead,
    clearNewMessage,
    clearReadReceipt,
    clearUnreadUpdate
  };
};