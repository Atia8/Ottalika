import React, { useState } from 'react';
import './login.css';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('renter');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const roles = [
    { id: 'renter', label: 'Renter', icon: '👤' },
    { id: 'manager', label: 'Manager', icon: '👔' },
    { id: 'owner', label: 'Owner', icon: '👑' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Demo login - accept any credentials
    alert(`Signed in as ${selectedRole} with email: ${email}`);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">🏠 Ottalika</h1>
          <p className="login-subtitle">Smart Building Management</p>
          <p className="login-demo">Demo: Select any role and sign in with any credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="role-selection">
            <h3>Select Role</h3>
            <div className="role-buttons">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className={`role-btn ${selectedRole === role.id ? 'active' : ''}`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <span className="role-icon">{role.icon}</span>
                  <span>{role.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="signin-btn">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;