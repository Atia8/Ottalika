import React, { useState } from 'react';
import './profile.css';

const Profile = () => {
  const [userData, setUserData] = useState({
    fullName: 'Ahmed Rahman',
    phoneNumber: '+880 1712-345678',
    email: 'ahmed.rahman@email.com',
    joinDate: 'January 15, 2024',
    apartment: 'A-101',
    monthlyRent: '$15,000'
  });

  const [documents, setDocuments] = useState([
    { name: 'National ID Card', status: 'uploaded', verified: true },
    { name: 'Personal Photo', status: 'uploaded', verified: true },
    { name: 'Family Information', status: 'uploaded', verified: false }
  ]);

  const handleFileUpload = (index) => {
    const newDocuments = [...documents];
    newDocuments[index].status = 'uploaded';
    setDocuments(newDocuments);
    alert(`${documents[index].name} uploaded successfully`);
  };

  return (
    <div className="profile page-transition">
      <div className="profile-header">
        <h2>My Profile</h2>
        <p>Manage your personal information and documents</p>
      </div>

      <div className="profile-content">
        <div className="profile-main">
          <div className="personal-info-section">
            <h3>Personal Information</h3>

            <div className="info-grid">
              <div className="info-item">
                <label>Full Name</label>
                <div className="info-value">{userData.fullName}</div>
              </div>

              <div className="info-item">
                <label>Phone Number</label>
                <div className="info-value">{userData.phoneNumber}</div>
              </div>

              <div className="info-item">
                <label>Email</label>
                <div className="info-value email">{userData.email}</div>
              </div>

              <div className="info-item">
                <label>Join Date</label>
                <div className="info-value">{userData.joinDate}</div>
              </div>

              <div className="info-item">
                <label>Apartment</label>
                <div className="info-value apartment">{userData.apartment}</div>
              </div>

              <div className="info-item">
                <label>Monthly Rent</label>
                <div className="info-value rent">{userData.monthlyRent}</div>
              </div>
            </div>
          </div>

          <div className="documents-section">
            <h3>Documents</h3>
            <div className="documents-list">
              {documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <div className="document-info">
                    <div className="document-name">
                      <span className="document-icon">📄</span>
                      {doc.name}
                    </div>
                    <div className="document-status">
                      <span className={`status-badge ${doc.status}`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                      {doc.verified && (
                        <span className="verified-badge">Verified</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="reupload-btn"
                    onClick={() => handleFileUpload(index)}
                  >
                    Re-upload
                  </button>
                </div>
              ))}
            </div>

            <div className="save-section">
              <button className="save-btn">💾 Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;