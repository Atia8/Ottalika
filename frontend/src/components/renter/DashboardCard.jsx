import React from 'react';
import './DashboardCard.css';

const DashboardCard = ({ title, value, subtitle, icon, color, onClick }) => {
  return (
    <div className={`dashboard-card ${color}`} onClick={onClick}>
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-value">{value}</p>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

export default DashboardCard;