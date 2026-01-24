import React, { useState } from 'react';
import './complaint.css';

const Complaints = () => {
  const [showNewComplaint, setShowNewComplaint] = useState(false);
  const [complaints, setComplaints] = useState([
    {
      id: 1,
      title: 'Water Leakage in Bathroom',
      description: 'There is continuous water leakage from the ceiling in the bathroom.',
      category: 'Plumbing',
      priority: 'High',
      date: '2025-12-10',
      status: 'pending'
    }
  ]);

  const [newComplaint, setNewComplaint] = useState({
    title: '',
    category: '',
    priority: 'low',
    description: ''
  });

  const stats = {
    pending: 1,
    inProgress: 0,
    resolved: 0
  };

  const categories = ['Plumbing', 'Electrical', 'HVAC', 'Structural', 'General'];
  const priorities = [
    { value: 'low', label: 'Low', color: 'var(--secondary-color)' },
    { value: 'medium', label: 'Medium', color: 'var(--warning-color)' },
    { value: 'high', label: 'High', color: 'var(--danger-color)' }
  ];

  const handleSubmitComplaint = (e) => {
    e.preventDefault();
    if (!newComplaint.title || !newComplaint.category || !newComplaint.description) {
      alert('Please fill in all required fields');
      return;
    }

    const newComplaintObj = {
      id: complaints.length + 1,
      title: newComplaint.title,
      description: newComplaint.description,
      category: newComplaint.category,
      priority: newComplaint.priority,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    setComplaints([newComplaintObj, ...complaints]);
    setNewComplaint({ title: '', category: '', priority: 'low', description: '' });
    setShowNewComplaint(false);
    alert('Complaint submitted successfully');
  };

  return (
    <div className="complaints page-transition">
      <div className="complaints-header">
        <h2>Complaints & Maintenance</h2>
        <p>Submit and track your complaints</p>
      </div>

      <div className="stats-overview">
        <div className="stat-card pending">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card in-progress">
          <div className="stat-number">{stats.inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card resolved">
          <div className="stat-number">{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      <div className="complaints-content">
        <div className="section-header">
          <h3>My Complaints</h3>
          <button
            className="new-complaint-btn"
            onClick={() => setShowNewComplaint(true)}
          >
            + New Complaint
          </button>
        </div>

        <div className="complaints-list">
          {complaints.length > 0 ? (
            complaints.map((complaint) => (
              <div key={complaint.id} className="complaint-card">
                <div className="complaint-header">
                  <div className="complaint-title-section">
                    <h4>{complaint.title}</h4>
                    <span className={`priority-badge ${complaint.priority}`}>
                      {complaint.priority}
                    </span>
                  </div>
                  <span className={`status-badge ${complaint.status}`}>
                    {complaint.status}
                  </span>
                </div>

                <p className="complaint-description">{complaint.description}</p>

                <div className="complaint-footer">
                  <div className="complaint-meta">
                    <span className="category">Category: {complaint.category}</span>
                    <span className="date">Submitted: {complaint.date}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-complaints">
              <p>No complaints submitted yet.</p>
            </div>
          )}
        </div>
      </div>

      {showNewComplaint && (
        <div className="new-complaint-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Submit New Complaint</h3>
              <button
                className="close-btn"
                onClick={() => setShowNewComplaint(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitComplaint} className="complaint-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newComplaint.title}
                  onChange={(e) => setNewComplaint({...newComplaint, title: e.target.value})}
                  placeholder="Brief description of the issue"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newComplaint.category}
                    onChange={(e) => setNewComplaint({...newComplaint, category: e.target.value})}
                    className="form-select"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <div className="priority-buttons">
                    {priorities.map((priority) => (
                      <label
                        key={priority.value}
                        className="priority-option"
                        style={{ borderColor: newComplaint.priority === priority.value ? priority.color : '#e5e7eb' }}
                      >
                        <input
                          type="radio"
                          value={priority.value}
                          checked={newComplaint.priority === priority.value}
                          onChange={(e) => setNewComplaint({...newComplaint, priority: e.target.value})}
                        />
                        <span>{priority.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                  placeholder="Detailed description of the issue"
                  className="form-textarea"
                  rows="4"
                  required
                />
              </div>

              <div className="form-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowNewComplaint(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;