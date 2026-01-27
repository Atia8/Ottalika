// src/components/renter/RenterMessages.tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  FaEnvelope,
  FaPaperPlane,
  FaSearch,
  FaFilter,
  FaUser,
  FaBuilding,
  FaCalendar,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaPaperclip,
  FaImage,
  FaFile,
  FaSmile,
  FaEllipsisV,
  FaTrash,
  FaArchive,
  FaStar,
  FaReply,
  FaForward,
  FaPrint,
  FaDownload
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Message {
  id: number;
  sender: string;
  sender_type: 'manager' | 'system' | 'owner';
  subject: string;
  content: string;
  is_read: boolean;
  is_important: boolean;
  created_at: string;
  attachments?: Array<{
    id: number;
    name: string;
    type: string;
    size: string;
    url: string;
  }>;
}

interface Contact {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const RenterMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [composeMode, setComposeMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState({
    to: '',
    subject: '',
    content: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    fetchContacts();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/renter/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Error loading messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/renter/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setContacts(response.data.data.contacts || []);
        if (response.data.data.contacts.length > 0) {
          setSelectedContact(response.data.data.contacts[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.to || !newMessage.content.trim()) {
      toast.error('Please select a recipient and enter message content');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/renter/messages/send`, newMessage, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Message sent successfully!');
        setComposeMode(false);
        setNewMessage({ to: '', subject: '', content: '' });
        fetchMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`${API_URL}/renter/messages/${messageId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleToggleImportant = async (messageId: number) => {
    try {
      const token = localStorage.getItem('token');
      
      const message = messages.find(m => m.id === messageId);
      if (!message) return;
      
      await axios.put(`${API_URL}/renter/messages/${messageId}/important`, {
        important: !message.is_important
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_important: !msg.is_important } : msg
        )
      );
    } catch (error) {
      console.error('Failed to toggle important:', error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_URL}/renter/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Message deleted successfully!');
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'manager': return <FaBuilding className="text-blue-600" />;
      case 'owner': return <FaUser className="text-violet-600" />;
      default: return <FaEnvelope className="text-slate-600" />;
    }
  };

  const getPriorityColor = (important: boolean, read: boolean) => {
    if (important && !read) return 'bg-amber-50 border-amber-200';
    if (!read) return 'bg-blue-50 border-blue-200';
    return '';
  };

  const filteredMessages = messages.filter(message => {
    if (filterType === 'unread' && message.is_read) return false;
    if (filterType === 'important' && !message.is_important) return false;
    if (searchTerm && !message.subject.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-600">Communicate with building management</p>
        </div>
        <button
          onClick={() => setComposeMode(true)}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
        >
          <FaEnvelope />
          Compose Message
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Contacts */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-4 border-b">
              <h3 className="font-bold text-slate-900">Contacts</h3>
            </div>
            <div className="p-2">
              <div className="space-y-2">
                {contacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                      selectedContact?.id === contact.id 
                        ? 'bg-violet-50 border border-violet-200' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      {contact.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-xs rounded-full flex items-center justify-center">
                          {contact.unread_count}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{contact.name}</p>
                      <p className="text-xs text-slate-500 truncate">{contact.role}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(contact.last_message_time).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-white rounded-xl border shadow-sm p-4">
            <h4 className="font-medium text-slate-900 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full text-left p-2 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                <FaEnvelope className="text-slate-400" />
                <span>All Messages</span>
                <span className="ml-auto text-sm text-slate-500">{messages.length}</span>
              </button>
              <button 
                onClick={() => setFilterType('unread')}
                className="w-full text-left p-2 hover:bg-slate-50 rounded-lg flex items-center gap-2"
              >
                <FaClock className="text-blue-400" />
                <span>Unread</span>
                <span className="ml-auto text-sm text-blue-600">
                  {messages.filter(m => !m.is_read).length}
                </span>
              </button>
              <button 
                onClick={() => setFilterType('important')}
                className="w-full text-left p-2 hover:bg-slate-50 rounded-lg flex items-center gap-2"
              >
                <FaStar className="text-amber-400" />
                <span>Important</span>
                <span className="ml-auto text-sm text-amber-600">
                  {messages.filter(m => m.is_important).length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Messages */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border shadow-sm">
            {/* Header */}
            <div className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {selectedContact && (
                  <>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {selectedContact.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{selectedContact.name}</p>
                      <p className="text-sm text-slate-500">{selectedContact.role}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="all">All Messages</option>
                  <option value="unread">Unread</option>
                  <option value="important">Important</option>
                </select>
              </div>
            </div>

            {/* Messages List */}
            <div className="h-[500px] overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <FaEnvelope className="text-4xl text-slate-300 mb-4" />
                  <p className="text-slate-500 text-lg font-medium">No messages</p>
                  <p className="text-slate-400 text-sm mt-1">Your messages will appear here</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {filteredMessages.map(message => (
                    <div
                      key={message.id}
                      className={`p-4 border rounded-xl ${getPriorityColor(message.is_important, message.is_read)}`}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.is_read) {
                          handleMarkAsRead(message.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg border">
                            {getSenderIcon(message.sender_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">{message.sender}</p>
                              {!message.is_read && (
                                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                                  New
                                </span>
                              )}
                              {message.is_important && (
                                <FaStar className="text-amber-500" />
                              )}
                            </div>
                            <p className="font-medium text-slate-900 mt-1">{message.subject}</p>
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                              {message.content}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <FaCalendar className="text-xs" />
                                {new Date(message.created_at).toLocaleDateString()}
                              </span>
                              {message.attachments && message.attachments.length > 0 && (
                                <span className="text-xs text-blue-600 flex items-center gap-1">
                                  <FaPaperclip className="text-xs" />
                                  {message.attachments.length} attachment{message.attachments.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleImportant(message.id);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                            title={message.is_important ? 'Remove from important' : 'Mark as important'}
                          >
                            <FaStar className={message.is_important ? 'text-amber-500' : 'text-slate-400'} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(message.id);
                            }}
                            className="p-2 hover:bg-rose-50 rounded-lg text-rose-600"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Compose Area */}
            {composeMode && (
              <div className="border-t p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        To
                      </label>
                      <select
                        value={newMessage.to}
                        onChange={(e) => setNewMessage({...newMessage, to: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="">Select recipient</option>
                        {contacts.map(contact => (
                          <option key={contact.id} value={contact.id}>
                            {contact.name} ({contact.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={newMessage.subject}
                        onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                        placeholder="Message subject"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={newMessage.content}
                      onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                      placeholder="Type your message here..."
                      rows={4}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <button className="p-2 hover:bg-slate-100 rounded-lg" title="Attach file">
                        <FaPaperclip />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg" title="Insert image">
                        <FaImage />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg" title="Emoji">
                        <FaSmile />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setComposeMode(false)}
                        className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendMessage}
                        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
                      >
                        <FaPaperPlane />
                        Send Message
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Message Details</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleImportant(selectedMessage.id)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                    title={selectedMessage.is_important ? 'Remove from important' : 'Mark as important'}
                  >
                    <FaStar className={selectedMessage.is_important ? 'text-amber-500' : 'text-slate-400'} />
                  </button>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Message Header */}
                <div className="border-b pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-slate-100 rounded-lg">
                        {getSenderIcon(selectedMessage.sender_type)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{selectedMessage.sender}</p>
                        <p className="text-sm text-slate-500">{selectedMessage.sender_type.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">
                        {new Date(selectedMessage.created_at).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mt-4">{selectedMessage.subject}</h4>
                </div>

                {/* Message Body */}
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>

                {/* Attachments */}
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div>
                    <h5 className="font-medium text-slate-900 mb-3">Attachments</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {selectedMessage.attachments.map(attachment => (
                        <div key={attachment.id} className="p-3 border rounded-lg hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                              <FaFile className="text-slate-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 truncate">{attachment.name}</p>
                              <p className="text-xs text-slate-500">{attachment.size}</p>
                            </div>
                            <button
                              onClick={() => window.open(attachment.url, '_blank')}
                              className="p-2 hover:bg-slate-100 rounded-lg"
                              title="Download"
                            >
                              <FaDownload />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-6 border-t">
                  <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2">
                    <FaReply />
                    Reply
                  </button>
                  <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                    <FaForward />
                    Forward
                  </button>
                  <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                    <FaPrint />
                    Print
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-2"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenterMessages;