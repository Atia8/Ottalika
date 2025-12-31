import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Payments from './pages/Payment';
import Complaints from './pages/Complaint';
import Messages from './pages/Messages';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Login setIsAuthenticated={setIsAuthenticated} />;
  }

  return (
    <Router>
      <div className="app-container">
        {/* Clean minimalist background */}
        <div className="minimal-bg"></div>

        {/* Sidebar - Hidden by default */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
        )}

        {/* Main content area */}
        <main className="main-content">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          <div className="page-wrapper">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/complaints" element={<Complaints />} />
              <Route path="/messages" element={<Messages />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;