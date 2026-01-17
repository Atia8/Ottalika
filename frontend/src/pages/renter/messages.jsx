import React, { useState } from 'react';
import './messages.css';

const Messages = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'manager', text: 'Please submit your December rent payment by the 5th.', time: '2025-12-01 10:30 AM', online: true },
    { id: 2, sender: 'user', text: 'I have made the payment. Please confirm.', time: '2025-12-01 02:15 PM' },
    { id: 3, sender: 'manager', text: 'Payment confirmed. Thank you!', time: '2025-12-01 03:00 PM', online: true },
    { id: 4, sender: 'user', text: 'I need to speak with the owner about extending my lease.', time: '2025-12-10 09:00 AM' }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [showOwnerRequest, setShowOwnerRequest] = useState(false);
  const [ownerRequest, setOwnerRequest] = useState({
    subject: '',
    message: ''
  });

  const [ownerRequests, setOwnerRequests] = useState([
    { id: 1, subject: 'Lease Extension Request', date: '2025-12-10', status: 'pending' }
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = {
      id: messages.length + 1,
      sender: 'user',
      text: newMessage,
      time: new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const handleSubmitOwnerRequest = (e) => {
    e.preventDefault();
    if (!ownerRequest.subject || !ownerRequest.message) {
      alert('Please fill in all fields');
      return;
    }

    const newRequest = {
      id: ownerRequests.length + 1,
      subject: ownerRequest.subject,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    setOwnerRequests([newRequest, ...ownerRequests]);
    setOwnerRequest({ subject: '', message: '' });
    setShowOwnerRequest(false);
    alert('Request submitted to manager');
  };

  return (
    <div className="messages page-transition">
      <div className="messages-header">
        <h2>Messages</h2>
        <p>Chat with your manager and request owner contact</p>
      </div>

      <div className="messages-content">
        <div className="chat-section">
          <div className="chat-header">
            <div className="chat-partner">
              <div className="partner-info">
                <div className="partner-name">
                  Building Manager
                  <span className="online-status">Online</span>
                </div>
                <div className="partner-role">Building Manager</div>
              </div>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.sender === 'user' ? 'sent' : 'received'}`}
              >
                <div className="message-content">
                  {msg.text}
                  <div className="message-time">{msg.time}</div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="message-input-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="message-input"
            />
            <button type="submit" className="send-btn">
              Send
            </button>
          </form>
        </div>

        <div className="owner-request-section">
          <div className="request-header">
            <h3>Request Owner Contact</h3>
            <p>Need to communicate directly with the owner? Submit a request and the manager will forward it.</p>
          </div>

          <button
            className="request-btn"
            onClick={() => setShowOwnerRequest(true)}
          >
            📨 Submit Request
          </button>

          <div className="recent-requests">
            <h4>Recent Requests</h4>
            {ownerRequests.map((request) => (
              <div key={request.id} className="request-item">
                <div className="request-info">
                  <div className="request-subject">{request.subject}</div>
                  <div className="request-date">Submitted: {request.date}</div>
                </div>
                <span className={`request-status ${request.status}`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showOwnerRequest && (
        <div className="owner-request-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Request Owner Contact</h3>
              <button
                className="close-btn"
                onClick={() => setShowOwnerRequest(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOwnerRequest} className="request-form">
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={ownerRequest.subject}
                  onChange={(e) => setOwnerRequest({...ownerRequest, subject: e.target.value})}
                  placeholder="e.g., Lease Extension"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={ownerRequest.message}
                  onChange={(e) => setOwnerRequest({...ownerRequest, message: e.target.value})}
                  placeholder="Explain why you need to contact the owner..."
                  className="form-textarea"
                  rows="5"
                  required
                />
              </div>

              <div className="form-note">
                <p>📋 <strong>Note:</strong> Your request will be forwarded to the manager first.</p>
              </div>

              <div className="form-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowOwnerRequest(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;