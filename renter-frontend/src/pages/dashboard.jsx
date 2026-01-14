import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const stats = [
    { title: 'Monthly Rent', value: '৳15,000', icon: '💰', color: '#667eea' },
    { title: 'Payment Status', value: 'Paid', icon: '✅', color: '#10b981' },
    { title: 'Complaints', value: '1 Active', icon: '🛠️', color: '#f59e0b' },
    { title: 'Messages', value: '3 Unread', icon: '💬', color: '#8b5cf6' },
  ];

  return (
    <div className="dashboard">
      <div className="welcome-section">
        <h1>Welcome back, Ahmed</h1>
        <p className="subtitle">Here's your apartment overview</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
            <div className="stat-icon" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="content-grid">
        <div className="main-content">
          <div className="section">
            <h2 className="section-title">Quick Actions</h2>
            <div className="actions-grid">
              <button className="action-btn">
                <span className="action-icon">💳</span>
                <span>Pay Rent</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">📝</span>
                <span>Submit Complaint</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">📨</span>
                <span>Message Manager</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">📄</span>
                <span>Request Document</span>
              </button>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Recent Complaints</h2>
              <button className="text-btn">View All →</button>
            </div>
            <div className="complaints-list">
              <div className="complaint-item">
                <div className="complaint-icon">💧</div>
                <div className="complaint-details">
                  <h4>Water Leakage</h4>
                  <p>Bathroom ceiling • High Priority</p>
                </div>
                <div className="complaint-status pending">Pending</div>
              </div>
              <div className="complaint-item">
                <div className="complaint-icon">❄️</div>
                <div className="complaint-details">
                  <h4>AC Not Working</h4>
                  <p>Bedroom • Resolved</p>
                </div>
                <div className="complaint-status resolved">Resolved</div>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-content">
          <div className="card">
            <h3 className="card-title">Next Payment</h3>
            <div className="payment-details">
              <div className="payment-date">Jan 5, 2026</div>
              <div className="payment-amount">৳15,000</div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Pay Now
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Building Updates</h3>
            <ul className="updates-list">
              <li>Water maintenance tomorrow 10AM-2PM</li>
              <li>Elevator inspection completed</li>
              <li>Security cameras upgraded</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;