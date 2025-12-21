import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ManagerDashboard from './components/manager/Dashboard';
import ManagerRenters from './components/manager/Renters';
import ManagerBills from './components/manager/Bills';
import ManagerMaintenance from './components/manager/Maintenance';
import ManagerPayments from './components/manager/Payments';
import ManagerSettings from './components/manager/Settings';
import ManagerMessages from './components/manager/Messages';
import Layout from './components/common/Layout';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles = ['manager', 'owner', 'renter'] 
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Role-based routing component
const RoleBasedRoutes = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'manager':
      return (
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<ManagerDashboard />} />
            <Route path="/renters" element={<ManagerRenters />} />
            <Route path="/bills" element={<ManagerBills />} />
            <Route path="/maintenance" element={<ManagerMaintenance />} />
            <Route path="/payments" element={<ManagerPayments />} />
            <Route path="/messages" element={<ManagerMessages />} />
            <Route path="/settings" element={<ManagerSettings />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Layout>
      );
    case 'owner':
      return (
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<div>Owner Dashboard - To be implemented</div>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Layout>
      );
    case 'renter':
      return (
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<div>Renter Dashboard - To be implemented</div>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Layout>
      );
    default:
      return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <RoleBasedRoutes />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;