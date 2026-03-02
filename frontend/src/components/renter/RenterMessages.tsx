import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  FaEnvelope,
  FaPaperPlane,
  FaSearch,
  FaUser,
  FaBuilding,
  FaArrowLeft,
  FaCheck,
  FaCheckDouble
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../hooks/useSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Conversation {
  id: number;
  name: string;
  role: 'manager' | 'owner';
  designation: string;
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

const RenterMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [renterDbId, setRenterDbId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdsRef = useRef<Set<number>>(new Set());

  // Get the ACTUAL renter ID
  useEffect(() => {
    const fetchRenterId = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/renter/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const actualRenterId = response.data.data.id.toString();
        setRenterDbId(actualRenterId);
        console.log('✅ Actual renter DB ID:', actualRenterId);
      } catch (error) {
        console.error('Failed to fetch renter ID:', error);
        setRenterDbId('6');
      }
    };
    
    fetchRenterId();
  }, []);

  // Initialize socket
  const {
    newMessage: socketNewMessage,
    readReceipt,
    unreadUpdate,
    isUserOnline,
    sendMessage: sendSocketMessage,
    markAsRead: markMessagesAsRead
  } = useSocket(renterDbId, 'renter');

  // Save to sessionStorage
  useEffect(() => {
    return () => {
      if (selectedConversation && messages.length > 0) {
        sessionStorage.setItem(
          `renter_messages_${selectedConversation.id}_${selectedConversation.role}`,
          JSON.stringify({
            messages: messages,
            timestamp: Date.now()
          })
        );
      }
    };
  }, [selectedConversation, messages]);

  // Restore from sessionStorage
  useEffect(() => {
    if (selectedConversation) {
      const saved = sessionStorage.getItem(
        `renter_messages_${selectedConversation.id}_${selectedConversation.role}`
      );
      if (saved) {
        try {
          const { messages: savedMessages } = JSON.parse(saved);
          setMessages(savedMessages);
          savedMessages.forEach((m: Message) => messageIdsRef.current.add(m.id));
          sessionStorage.removeItem(
            `renter_messages_${selectedConversation.id}_${selectedConversation.role}`
          );
        } catch (e) {
          console.error('Failed to restore messages:', e);
        }
      } else {
        // Always fetch fresh messages when no saved state
        fetchMessages(selectedConversation.id, selectedConversation.role);
      }
    }
  }, [selectedConversation]);

  // Handle incoming socket messages - ONLY for messages from OTHERS
  useEffect(() => {
    if (socketNewMessage && selectedConversation) {
      // Skip if this is our own message (already added via HTTP)
      if (socketNewMessage.sender_id === `renter_${renterDbId}`) {
        console.log('⏭️ Skipping own message from socket');
        return;
      }
      
      // Check for duplicates
      if (messageIdsRef.current.has(socketNewMessage.id)) {
        console.log('🔄 Duplicate prevented:', socketNewMessage.id);
        return;
      }
      
      const senderId = socketNewMessage.sender_id;
      const currentConversationId = `${selectedConversation.role}_${selectedConversation.id}`;
      
      if (senderId === currentConversationId) {
        messageIdsRef.current.add(socketNewMessage.id);
        
        const newMsg: Message = {
          id: socketNewMessage.id,
          message: socketNewMessage.message,
          timestamp: socketNewMessage.timestamp,
          is_own: false,
          sender_name: selectedConversation.name,
          status: 'delivered'
        };
        
        setMessages(prev => [...prev, newMsg]);
        setTimeout(scrollToBottom, 100);
        
        markMessagesAsRead({
          id: selectedConversation.id,
          role: selectedConversation.role
        });
      } else {
        // Update conversation list
        const parts = senderId.split('_');
        const role = parts[0] as 'manager' | 'owner';
        const id = parseInt(parts[1]);
        
        setConversations(prev => {
          const existingIndex = prev.findIndex(c => 
            c.role === role && c.id === id
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
      }
    }
  }, [socketNewMessage, selectedConversation, renterDbId, markMessagesAsRead]);

  // Handle read receipts
  useEffect(() => {
    if (readReceipt && selectedConversation) {
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
        const convId = `${conv.role}_${conv.id}`;
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

  // Mark as read when opening conversation
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const hasUnread = messages.some(m => !m.is_own && m.status !== 'read');
      if (hasUnread) {
        markMessagesAsRead({
          id: selectedConversation.id,
          role: selectedConversation.role
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

  useEffect(() => {
    if (renterDbId) {
      fetchConversations();
    }
  }, [renterDbId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id, selectedConversation.role);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/renter/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const conversationsData = response.data.data.conversations || [];
        setConversations(conversationsData);
        
        if (conversationsData.length > 0 && !selectedConversation) {
          setSelectedConversation(conversationsData[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (contactId: number, role: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/renter/messages/${contactId}`, {
        params: { role },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const fetchedMessages = response.data.data.messages || [];
        
        // Sort messages by timestamp
        const sortedMessages = fetchedMessages.sort((a: Message, b: Message) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        setMessages(sortedMessages);
        messageIdsRef.current.clear();
        sortedMessages.forEach((m: Message) => messageIdsRef.current.add(m.id));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, []);

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

    messageIdsRef.current.add(tempId);
    setMessages(prev => [...prev, messageToSend]);
    setNewMessage('');
    scrollToBottom();

    try {
      const token = localStorage.getItem('token');
      
      // Save to database via HTTP only
      const response = await axios.post(`${API_URL}/renter/messages`, {
        receiverId: selectedConversation.id,
        message: messageText,
        role: selectedConversation.role
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
          if (conv.id === selectedConversation.id && conv.role === selectedConversation.role) {
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
        // This prevents duplicates
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
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
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

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

  const handleSelectConversation = (conversation: Conversation) => {
    if (selectedConversation && messages.length > 0) {
      sessionStorage.setItem(
        `renter_messages_${selectedConversation.id}_${selectedConversation.role}`,
        JSON.stringify({ messages, timestamp: Date.now() })
      );
    }
    setSelectedConversation(conversation);
  };

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    return conversations.filter(conv => 
      conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] bg-white rounded-2xl border overflow-hidden">
      <div className="flex h-full">
        {/* Conversations Sidebar */}
        <div className={`w-full md:w-1/3 border-r flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
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
                <FaEnvelope className="text-4xl mx-auto mb-3 text-slate-300" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const isOnline = isUserOnline(`${conversation.role}_${conversation.id}`);
                
                return (
                  <div
                    key={`${conversation.role}_${conversation.id}`}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`p-4 border-b hover:bg-slate-50 cursor-pointer ${
                      selectedConversation?.id === conversation.id && 
                      selectedConversation?.role === conversation.role ? 'bg-violet-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          conversation.role === 'manager' ? 'bg-blue-100' : 'bg-violet-100'
                        }`}>
                          {conversation.role === 'manager' ? (
                            <FaBuilding className="text-blue-600" />
                          ) : (
                            <FaUser className="text-violet-600" />
                          )}
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
                            {conversation.name || 'Unknown User'}
                          </h3>
                          <span className="text-xs text-slate-500">
                            {formatTime(conversation.last_message_time)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 truncate mt-1">
                          {conversation.last_message || 'No messages'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded capitalize">
                            {conversation.role || 'user'}
                          </span>
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
        <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden text-slate-600"
                  >
                    <FaArrowLeft />
                  </button>
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedConversation.role === 'manager' ? 'bg-blue-100' : 'bg-violet-100'
                    }`}>
                      {selectedConversation.role === 'manager' ? (
                        <FaBuilding className="text-blue-600" />
                      ) : (
                        <FaUser className="text-violet-600" />
                      )}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      isUserOnline(`${selectedConversation.role}_${selectedConversation.id}`)
                        ? 'bg-green-500'
                        : 'bg-slate-300'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {selectedConversation.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <p className="text-slate-600">
                        {selectedConversation.designation || ''}
                      </p>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs">
                        {isUserOnline(`${selectedConversation.role}_${selectedConversation.id}`)
                          ? '🟢 Online'
                          : '⚪ Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FaEnvelope className="text-4xl mx-auto mb-3 text-slate-300" />
                    <p>No messages yet</p>
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
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isSending}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    rows={2}
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
            <div className="hidden md:flex flex-1 items-center justify-center">
              <div className="text-center">
                <FaEnvelope className="text-4xl mx-auto mb-3 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Conversation Selected</h3>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RenterMessages;