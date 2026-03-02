import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  FaComments,
  FaSearch,
  FaPaperPlane,
  FaUser,
  FaCheckDouble,
  FaCheck,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../hooks/useSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Conversation {
  id: number;
  with_user: {
    id: number;
    name: string;
    role: string;
    apartment?: string;
    building?: string;
  };
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: number;
  message: string;
  timestamp: string;
  is_own: boolean;
  sender_name: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}

const ManagerMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdsRef = useRef<Set<number>>(new Set());

  // Get user ID from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        setUserId(payload.userId || payload.id || '1');
        console.log('📋 User ID from token:', payload.userId || payload.id);
      } catch (e) {
        console.error('Failed to decode token', e);
        setUserId('1');
      }
    }
  }, []);

  // Initialize socket
  const {
    newMessage: socketNewMessage,
    readReceipt,
    unreadUpdate,
    isUserOnline,
    sendMessage: sendSocketMessage,
    markAsRead: markMessagesAsRead
  } = useSocket(userId, 'manager');

  // Save messages to sessionStorage when component unmounts
  useEffect(() => {
    return () => {
      if (selectedConversation && messages.length > 0) {
        sessionStorage.setItem(
          `manager_messages_${selectedConversation.id}`,
          JSON.stringify({
            conversationId: selectedConversation.id,
            messages: messages,
            timestamp: Date.now()
          })
        );
      }
    };
  }, [selectedConversation, messages]);

  // Restore messages from sessionStorage on mount
  useEffect(() => {
    if (selectedConversation) {
      const saved = sessionStorage.getItem(`manager_messages_${selectedConversation.id}`);
      if (saved) {
        try {
          const { messages: savedMessages } = JSON.parse(saved);
          setMessages(savedMessages);
          savedMessages.forEach((m: Message) => messageIdsRef.current.add(m.id));
          sessionStorage.removeItem(`manager_messages_${selectedConversation.id}`);
        } catch (e) {
          console.error('Failed to restore messages:', e);
        }
      } else {
        // Always fetch fresh messages when no saved state
        fetchMessages(selectedConversation.id);
      }
    }
  }, [selectedConversation]);

  // Handle incoming new messages - ONLY for messages from others
  useEffect(() => {
    if (socketNewMessage) {
      // Skip if this is our own message (already added via HTTP)
      if (socketNewMessage.sender_id === `manager_${userId}`) {
        console.log('⏭️ Skipping own message from socket');
        return;
      }
      
      // Check if we already have this message
      if (messageIdsRef.current.has(socketNewMessage.id)) {
        console.log('🔄 Duplicate message prevented:', socketNewMessage.id);
        return;
      }
      
      // Add to ref to prevent duplicates
      messageIdsRef.current.add(socketNewMessage.id);
      console.log('📨 New message received:', socketNewMessage);
      
      if (selectedConversation) {
        const senderId = socketNewMessage.sender_id;
        const currentConversationId = `${selectedConversation.with_user.role}_${selectedConversation.with_user.id}`;
        
        if (senderId === currentConversationId) {
          // Add message to current conversation
          const newMsg: Message = {
            id: socketNewMessage.id,
            message: socketNewMessage.message,
            timestamp: socketNewMessage.timestamp,
            is_own: false,
            sender_name: selectedConversation.with_user.name,
            status: 'delivered'
          };
          
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          
          setTimeout(scrollToBottom, 100);
          
          // Mark as read immediately
          markMessagesAsRead({
            id: selectedConversation.with_user.id,
            role: selectedConversation.with_user.role
          });
        } else {
          // Update conversation list
          const parts = senderId.split('_');
          const role = parts[0];
          const id = parseInt(parts[1]);
          
          setConversations(prev => {
            const existingIndex = prev.findIndex(c => 
              c.with_user.role === role && c.with_user.id === id
            );
            
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                last_message: socketNewMessage.message,
                last_message_time: socketNewMessage.timestamp,
                unread_count: updated[existingIndex].unread_count + 1
              };
              return updated;
            }
            return prev;
          });
          
          toast.success(`New message`);
        }
      }
    }
  }, [socketNewMessage, selectedConversation, markMessagesAsRead, userId]);

  // Handle read receipts
  useEffect(() => {
    if (readReceipt && selectedConversation) {
      console.log('👁️ Read receipt received:', readReceipt);
      setMessages(prev => prev.map(msg => ({
        ...msg,
        status: msg.is_own ? 'read' : msg.status
      })));
    }
  }, [readReceipt, selectedConversation]);

  // Handle unread count updates
  useEffect(() => {
    if (unreadUpdate) {
      setConversations(prev => prev.map(conv => {
        const convId = `${conv.with_user.role}_${conv.with_user.id}`;
        if (convId === unreadUpdate.conversationId) {
          return {
            ...conv,
            unread_count: unreadUpdate.unreadCount
          };
        }
        return conv;
      }));
    }
  }, [unreadUpdate]);

  // Mark messages as read when conversation opens
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const hasUnread = messages.some(m => !m.is_own && m.status !== 'read');
      if (hasUnread) {
        markMessagesAsRead({
          id: selectedConversation.with_user.id,
          role: selectedConversation.with_user.role
        });
      }
    }
  }, [selectedConversation, markMessagesAsRead]);

  // Clear message IDs ref when changing conversations
  useEffect(() => {
    messageIdsRef.current.clear();
    if (messages.length > 0) {
      messages.forEach(m => messageIdsRef.current.add(m.id));
    }
  }, [selectedConversation]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      // Always fetch fresh messages when conversation changes
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/manager/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const conversationsData = response.data.data.conversations || [];
        console.log('📋 Conversations loaded:', conversationsData.length);
        setConversations(conversationsData);
        
        // Try to restore selected conversation
        if (conversationsData.length > 0) {
          const lastSelectedId = sessionStorage.getItem('last_selected_conversation');
          if (lastSelectedId) {
            const lastConv = conversationsData.find(c => c.id === parseInt(lastSelectedId));
            if (lastConv) {
              setSelectedConversation(lastConv);
              sessionStorage.removeItem('last_selected_conversation');
            } else {
              setSelectedConversation(conversationsData[0]);
            }
          } else {
            setSelectedConversation(conversationsData[0]);
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Error loading conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const selectedConv = conversations.find(c => c.id === conversationId);
      if (!selectedConv) return;
      
      const role = selectedConv.with_user.role;
      
      const response = await axios.get(`${API_URL}/manager/messages/${conversationId}`, {
        params: { role },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const fetchedMessages = response.data.data.messages || [];
        console.log(`📋 Messages loaded for conversation ${conversationId}:`, fetchedMessages.length);
        
        // Sort messages by timestamp to ensure correct order
        const sortedMessages = fetchedMessages.sort((a: Message, b: Message) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        setMessages(sortedMessages);
        messageIdsRef.current.clear();
        sortedMessages.forEach((m: Message) => messageIdsRef.current.add(m.id));
      }
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
    }
  }, [conversations]);

  // FIXED: Send message - HTTP ONLY, no socket send
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    const tempId = Date.now();
    const messageText = newMessage;
    
    const messageToSend: Message = {
      id: tempId,
      message: messageText,
      timestamp: new Date().toISOString(),
      is_own: true,
      sender_name: 'You',
      status: 'sent'
    };

    // Add to message IDs ref
    messageIdsRef.current.add(tempId);

    // Optimistically update UI
    setMessages(prev => [...prev, messageToSend]);
    setNewMessage('');
    scrollToBottom();

    try {
      // Save to database via HTTP only
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/manager/messages`, {
        receiverId: selectedConversation.with_user.id,
        message: messageText,
        role: selectedConversation.with_user.role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Message saved to DB:', response.data);

      // Replace temp message with real one from server
      if (response.data.data?.message) {
        const realMessage = response.data.data.message;
        
        // Remove temp and add real message
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== tempId);
          return [...filtered, {
            ...realMessage,
            status: 'delivered'
          }];
        });

        // Update message IDs ref
        messageIdsRef.current.delete(tempId);
        messageIdsRef.current.add(realMessage.id);

        // Update conversation list with new last message
        setConversations(prev => prev.map(conv => {
          if (conv.id === selectedConversation.id) {
            return {
              ...conv,
              last_message: realMessage.message,
              last_message_time: realMessage.timestamp
            };
          }
          return conv;
        }));

        // DO NOT send via socket - let the receiver fetch via HTTP
        // The receiver will get the message when they next fetch
      }
    } catch (error: any) {
      console.error('Failed to save message to DB:', error);
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'failed' } : msg
      ));
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString();
    }
  };

  // Save selected conversation when changing
  const handleSelectConversation = (conversation: Conversation) => {
    // Save current messages before switching
    if (selectedConversation && messages.length > 0) {
      sessionStorage.setItem(
        `manager_messages_${selectedConversation.id}`,
        JSON.stringify({
          conversationId: selectedConversation.id,
          messages: messages,
          timestamp: Date.now()
        })
      );
    }
    
    // Save last selected
    sessionStorage.setItem('last_selected_conversation', conversation.id.toString());
    setSelectedConversation(conversation);
  };

  // Filter conversations
  const filteredConversations = React.useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];
    
    return conversations.filter(conv => {
      if (!conv || !conv.with_user) return false;
      
      const searchLower = searchTerm.toLowerCase();
      const userName = conv.with_user.name || '';
      const userRole = conv.with_user.role || '';
      const userApartment = conv.with_user.apartment || '';
      
      return (
        userName.toLowerCase().includes(searchLower) ||
        userRole.toLowerCase().includes(searchLower) ||
        userApartment.toLowerCase().includes(searchLower)
      );
    });
  }, [conversations, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] bg-white rounded-2xl border overflow-hidden">
      <div className="flex h-full">
        {/* Conversations Sidebar */}
        <div className="w-full md:w-1/3 border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-slate-900">Messages</h2>
            <div className="relative mt-3">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FaComments className="text-4xl mx-auto mb-3 text-slate-300" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const isOnline = isUserOnline(`${conversation.with_user.role}_${conversation.with_user.id}`);
                
                return (
                  <div
                    key={`${conversation.with_user.role}_${conversation.id}`}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`p-4 border-b hover:bg-slate-50 cursor-pointer ${
                      selectedConversation?.id === conversation.id ? 'bg-violet-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                          <FaUser className="text-violet-600" />
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          isOnline ? 'bg-green-500' : 'bg-slate-300'
                        }`} />
                        {conversation.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {conversation.with_user?.name || 'Unknown User'}
                          </h3>
                          <span className="text-xs text-slate-500">
                            {formatTime(conversation.last_message_time)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 truncate mt-1">
                          {conversation.last_message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded capitalize">
                            {conversation.with_user?.role || 'user'}
                          </span>
                          {conversation.with_user?.apartment && (
                            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                              Apt {conversation.with_user.apartment}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="hidden md:flex flex-col flex-1">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                      <FaUser className="text-violet-600" />
                    </div>
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      isUserOnline(`${selectedConversation.with_user.role}_${selectedConversation.with_user.id}`)
                        ? 'bg-green-500'
                        : 'bg-slate-300'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {selectedConversation.with_user.name || 'Unknown User'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="capitalize text-slate-600">
                        {selectedConversation.with_user.role || 'User'}
                      </span>
                      {selectedConversation.with_user.apartment && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600">
                            Apt {selectedConversation.with_user.apartment}
                          </span>
                        </>
                      )}
                      <span className="text-xs ml-2">
                        {isUserOnline(`${selectedConversation.with_user.role}_${selectedConversation.with_user.id}`)
                          ? '🟢 Online'
                          : '⚪ Offline'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="p-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg">
                      <FaPhone />
                    </button>
                    <button className="p-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg">
                      <FaEnvelope />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FaComments className="text-4xl mx-auto mb-3 text-slate-300" />
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">Start a conversation by sending a message</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_own ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2 ${
                          message.is_own
                            ? 'bg-violet-600 text-white rounded-br-none'
                            : 'bg-slate-100 text-slate-900 rounded-bl-none'
                        }`}
                      >
                        {!message.is_own && (
                          <p className="text-xs font-medium text-slate-600 mb-1">
                            {message.sender_name}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{message.message}</p>
                        <div className={`flex items-center justify-end gap-2 mt-1 text-xs ${
                          message.is_own ? 'text-violet-200' : 'text-slate-500'
                        }`}>
                          <span>{formatTime(message.timestamp)}</span>
                          {message.is_own && (
                            <>
                              {message.status === 'sent' && <FaCheck />}
                              {message.status === 'delivered' && <FaCheckDouble />}
                              {message.status === 'read' && <FaCheckDouble className="text-emerald-300" />}
                              {message.status === 'failed' && (
                                <span className="text-rose-300">Failed</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={isSending}
                    className="flex-1 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-slate-100"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className={`p-3 rounded-lg ${
                      newMessage.trim() && !isSending
                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FaComments className="text-4xl mx-auto mb-3 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Conversation Selected</h3>
                <p className="text-slate-600">Select a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerMessages;