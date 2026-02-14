// src/components/renter/RenterMessages.tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  FaEnvelope,
  FaPaperPlane,
  FaSearch,
  FaUser,
  FaBuilding,
  FaCalendar,
  FaClock,
  FaPaperclip,
  FaFile,
  FaTrash,
  FaStar,
  FaReply,
  FaArrowLeft
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

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
  status?: 'sent' | 'delivered' | 'read';
}

const RenterMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [composeMode, setComposeMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id, selectedConversation.role);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/renter/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setConversations(response.data.data.conversations || []);
        if (response.data.data.conversations.length > 0) {
          setSelectedConversation(response.data.data.conversations[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      
      // Mock data for testing
      const mockConversations: Conversation[] = [
        {
          id: 1,
          name: 'Building Manager',
          role: 'manager',
          designation: 'Property Manager',
          last_message: 'How can I help you today?',
          last_message_time: new Date().toISOString(),
          unread_count: 2
        },
        {
          id: 2,
          name: 'Property Owner',
          role: 'owner',
          designation: 'Building Owner',
          last_message: 'Thank you for being a tenant',
          last_message_time: new Date(Date.now() - 86400000).toISOString(),
          unread_count: 0
        }
      ];
      
      setConversations(mockConversations);
      setSelectedConversation(mockConversations[0]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (contactId: number, role: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/renter/messages/${contactId}`, {
        params: { role },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      
      // Mock messages
      const mockMessages: Message[] = [
        {
          id: 1,
          message: 'Hello, I have a question about my lease.',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          is_own: true,
          sender_name: 'You',
          status: 'read'
        },
        {
          id: 2,
          message: 'Sure, how can I help you?',
          timestamp: new Date(Date.now() - 43200000).toISOString(),
          is_own: false,
          sender_name: role === 'manager' ? 'Building Manager' : 'Property Owner',
          status: 'read'
        },
        {
          id: 3,
          message: 'When is the maintenance scheduled?',
          timestamp: new Date().toISOString(),
          is_own: true,
          sender_name: 'You',
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

    setMessages(prev => [...prev, messageToSend]);
    setNewMessage('');

    try {
      const token = localStorage.getItem('token');
      
      await axios.post(`${API_URL}/renter/messages`, {
        receiverId: selectedConversation.id,
        message: newMessage,
        role: selectedConversation.role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
    } catch (error) {
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

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Messages</h2>
              <button
                onClick={() => setComposeMode(true)}
                className="md:hidden p-2 bg-violet-600 text-white rounded-lg"
              >
                <FaEnvelope />
              </button>
            </div>
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
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        conversation.role === 'manager' ? 'bg-blue-100' : 'bg-violet-100'
                      }`}>
                        {conversation.role === 'manager' ? (
                          <FaBuilding className={`text-blue-600`} />
                        ) : (
                          <FaUser className={`text-violet-600`} />
                        )}
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
                          {conversation.name}
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
                          {conversation.role}
                        </span>
                        <span className="text-xs text-slate-500">
                          {conversation.designation}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedConversation.role === 'manager' ? 'bg-blue-100' : 'bg-violet-100'
                  }`}>
                    {selectedConversation.role === 'manager' ? (
                      <FaBuilding className="text-blue-600" />
                    ) : (
                      <FaUser className="text-violet-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {selectedConversation.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {selectedConversation.designation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FaEnvelope className="text-4xl mx-auto mb-3 text-slate-300" />
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
                        <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                          message.is_own ? 'text-violet-200' : 'text-slate-500'
                        }`}>
                          <span>{formatTime(message.timestamp)}</span>
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
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your message here..."
                      className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className={`p-3 rounded-lg ${
                      newMessage.trim()
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
                <p className="text-slate-600">Select a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RenterMessages;