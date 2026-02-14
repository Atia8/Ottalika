import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  FaComments,
  FaSearch,
  FaPaperPlane,
  FaUser,
  FaHome,
  FaClock,
  FaCheckDouble,
  FaCheck,
  FaPaperclip,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

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
  message: string;  // Changed from 'message' to match backend
  timestamp: string;
  is_own: boolean;  // Changed from 'isOwn' to match backend
  sender_name: string;  // Changed from 'senderName' to match backend
  status?: 'sent' | 'delivered' | 'read';
}

type MessageStatus = 'sent' | 'delivered' | 'read' | undefined;

const ManagerMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/manager/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const conversationsData = response.data.data.conversations || [];
        setConversations(conversationsData);
        
        // Select first conversation if none selected
        if (conversationsData.length > 0 && !selectedConversation) {
          setSelectedConversation(conversationsData[0]);
        }
      } else {
        toast.error('Failed to fetch conversations');
      }
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Error loading conversations');
      
      // Mock data for testing
      const mockConversations: Conversation[] = [
        {
          id: 1,
          with_user: {
            id: 1,
            name: 'John Doe',
            role: 'renter',
            apartment: '101',
            building: 'Green Valley Apartments'
          },
          last_message: 'The water leakage is getting worse, please help!',
          last_message_time: new Date().toISOString(),
          unread_count: 2
        },
        {
          id: 2,
          with_user: {
            id: 2,
            name: 'Sarah Owner',
            role: 'owner',
            apartment: undefined,
            building: 'Building A'
          },
          last_message: 'Can you send me the monthly report?',
          last_message_time: new Date(Date.now() - 86400000).toISOString(),
          unread_count: 0
        },
        {
          id: 3,
          with_user: {
            id: 4,
            name: 'Alice Brown',
            role: 'renter',
            apartment: '201',
            building: 'Green Valley Apartments'
          },
          last_message: 'Thank you for fixing the elevator!',
          last_message_time: new Date(Date.now() - 172800000).toISOString(),
          unread_count: 0
        }
      ];
      
      setConversations(mockConversations);
      if (mockConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(mockConversations[0]);
      }
    } finally {
      setLoading(false);
    }
  };

const fetchMessages = async (conversationId: number) => {
  try {
    const token = localStorage.getItem('token');
    const selectedConv = conversations.find(c => c.id === conversationId);
    const role = selectedConv?.with_user.role || 'renter';
    
    const response = await axios.get(`${API_URL}/manager/messages/${conversationId}`, {
      params: { role },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      // Map the backend data to match what the component expects
      const mappedMessages = response.data.data.messages.map((msg: any) => ({
        id: msg.id,
        message: msg.message,
        timestamp: msg.timestamp,
        is_own: msg.is_own,  // Keep as is_own
        sender_name: msg.sender_name,  // Keep as sender_name
        status: msg.status
      }));
      setMessages(mappedMessages);
    } else {
      toast.error('Failed to fetch messages');
    }
  } catch (error: any) {
    console.error('Failed to fetch messages:', error);
    
    // Mock data with correct field names
    const mockMessages: Message[] = [
      {
        id: 1,
        message: 'Hi, there is a water leakage in my bathroom.',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        is_own: false,
        sender_name: 'John Doe',
        status: 'read'
      },
      {
        id: 2,
        message: 'I will send a plumber tomorrow morning.',
        timestamp: new Date(Date.now() - 43200000).toISOString(),
        is_own: true,
        sender_name: 'You',
        status: 'read'
      },
      {
        id: 3,
        message: 'The water leakage is getting worse, please help!',
        timestamp: new Date().toISOString(),
        is_own: false,
        sender_name: 'John Doe',
        status: 'sent'
      }
    ];
    setMessages(mockMessages);
  }
};

const handleSendMessage = async () => {
  if (!newMessage.trim() || !selectedConversation) return;

  const messageToSend: Message = {
    id: Date.now(),
    message: newMessage,
    timestamp: new Date().toISOString(),
    is_own: true,
    sender_name: 'You',
    status: 'sent'
  };

  // Optimistically update UI
  setMessages(prev => [...prev, messageToSend]);
  setNewMessage('');

  try {
    const token = localStorage.getItem('token');
    await axios.post(`${API_URL}/manager/messages`, {
      receiverId: selectedConversation.with_user.id,
      message: newMessage,
      role: selectedConversation.with_user.role
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Update message status
    setMessages(prev => prev.map(msg => 
      msg.id === messageToSend.id ? { ...msg, status: 'delivered' as MessageStatus } : msg
    ));
  } catch (error: any) {
    console.error('Failed to send message:', error);
    toast.error('Failed to send message');
    setMessages(prev => prev.filter(msg => msg.id !== messageToSend.id));
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

  // Safe filtered conversations with null checks
  const filteredConversations = React.useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];
    
    return conversations.filter(conv => {
      // Add null checks for safety
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

  // Safe selected conversation check
  const hasSelectedConversation = selectedConversation && selectedConversation.with_user;

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
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b hover:bg-slate-50 cursor-pointer ${
                    selectedConversation?.id === conversation.id ? 'bg-violet-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                        <FaUser className="text-violet-600" />
                      </div>
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
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="hidden md:flex flex-col flex-1">
          {hasSelectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                    <FaUser className="text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {selectedConversation.with_user.name || 'Unknown User'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="capitalize">{selectedConversation.with_user.role || 'User'}</span>
                      {selectedConversation.with_user.apartment && (
                        <>
                          <span>•</span>
                          <span>Apartment {selectedConversation.with_user.apartment}</span>
                        </>
                      )}
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
                </>
              )}
            </div>
          </div>
        </div>
      ))
    )}
    <div ref={messagesEndRef} />
  </div>


              {/* Mobile Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border border-slate-300 rounded-lg"
                    onKeyDown={handleKeyPress}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className={`p-3 rounded-lg ${
                      newMessage.trim()
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className="p-4 border-b hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                      <FaUser className="text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {conversation.with_user.name}
                      </h3>
                      <p className="text-sm text-slate-600 truncate">
                        {conversation.last_message}
                      </p>
                    </div>
                    {conversation.unread_count > 0 && (
                      <span className="w-6 h-6 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerMessages;