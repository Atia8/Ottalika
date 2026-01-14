import React from 'react';
import './ComplaintCard.css';

const ComplaintCard = ({ complaint, onUpdate }) => {
  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#f59e0b';
      case 'in-progress':
        return '#3b82f6';
      case 'resolved':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="complaint-card">
      <div className="complaint-card-header">
        <div className="complaint-title-section">
          <h4 className="complaint-title">{complaint.title}</h4>
          <div className="complaint-badges">
            <span
              className="priority-badge"
              style={{ backgroundColor: getPriorityColor(complaint.priority) }}
            >
              {complaint.priority}
            </span>
            <span
              className="status-badge"
              style={{ backgroundColor: getStatusColor(complaint.status) }}
            >
              {complaint.status}
            </span>
          </div>
        </div>
        <span className="complaint-date">{complaint.date}</span>
      </div>

      <div className="complaint-card-body">
        <p className="complaint-description">{complaint.description}</p>

        <div className="complaint-meta">
          <div className="meta-item">
            <span className="meta-label">Category:</span>
            <span className="meta-value">{complaint.category}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Submitted:</span>
            <span className="meta-value">{complaint.submittedDate}</span>
          </div>
          {complaint.assignedTo && (
            <div className="meta-item">
              <span className="meta-label">Assigned to:</span>
              <span className="meta-value">{complaint.assignedTo}</span>
            </div>
          )}
        </div>
      </div>

      <div className="complaint-card-footer">
        <div className="complaint-actions">
          {complaint.status === 'pending' && (
            <button
              className="action-btn update-btn"
              onClick={() => onUpdate(complaint.id, 'in-progress')}
            >
              Start Progress
            </button>
          )}
          {complaint.status === 'in-progress' && (
            <button
              className="action-btn resolve-btn"
              onClick={() => onUpdate(complaint.id, 'resolved')}
            >
              Mark as Resolved
            </button>
          )}
          <button className="action-btn details-btn">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplaintCard;