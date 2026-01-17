import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/common/Layout';

// Manager Imports (Your TSX files)
import ManagerDashboard from './components/manager/Dashboard';
import ManagerRenters from './components/manager/Renters';
import ManagerBills from './components/manager/Bills';
import ManagerMaintenance from './components/manager/Maintenance';
import ManagerPayments from './components/manager/Payments';
import ManagerSettings from './components/manager/Settings';
import ManagerMessages from './components/manager/Messages';

// Renter Imports (Her JSX files - moved to your pages/renter folder)
// @ts-ignore
import RenterDashboard from './pages/renter/dashboard';
// @ts-ignore
import RenterProfile from './pages/renter/profile';
// @ts-ignore
import RenterPayments from './pages/renter/payment';
// @ts-ignore
import RenterComplaints from './pages/renter/complaint';
// @ts-ignore
import RenterMessages from './pages/renter/messages';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles = ['manager', 'owner', 'renter'] 
}) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="animate-spin h-12 w-12 border-t-2 border-violet-600"></div>;
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/login" />;
  return <>{children}</>;
};

const RoleBasedRoutes = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <Layout>
      <Routes>
        {/* MANAGER ROUTES */}
        {user.role === 'manager' && (
          <>
            <Route path="/dashboard" element={<ManagerDashboard />} />
            <Route path="/renters" element={<ManagerRenters />} />
            <Route path="/bills" element={<ManagerBills />} />
            <Route path="/maintenance" element={<ManagerMaintenance />} />
            <Route path="/payments" element={<ManagerPayments />} />
            <Route path="/messages" element={<ManagerMessages />} />
            <Route path="/settings" element={<ManagerSettings />} />
          </>
        )}

        {/* RENTER ROUTES (Integrated from her JSX) */}
        {user.role === 'renter' && (
          <>
            <Route path="/dashboard" element={<RenterDashboard />} />
            <Route path="/profile" element={<RenterProfile />} />
            <Route path="/payments" element={<RenterPayments />} />
            <Route path="/complaints" element={<RenterComplaints />} />
            <Route path="/messages" element={<RenterMessages />} />
          </>
        )}

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedRoute><RoleBasedRoutes /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;