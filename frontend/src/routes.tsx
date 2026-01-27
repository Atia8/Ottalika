// frontend/src/routes.tsx - FIXED VERSION
import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./Layout";

// Owner components
import { OwnerDashboard } from "./components/owner/OwnerDashboard";
import { OwnerPayments } from "./components/owner/OwnerPayments";

// Manager components
import ManagerDashboard from "./components/manager/Dashboard";
import ManagerRenters from "./components/manager/Renters";
import ManagerBills from "./components/manager/Bills";
import ManagerMaintenance from "./components/manager/Maintenance";
import ManagerPayments from "./components/manager/Payments";
import ManagerSettings from "./components/manager/Settings";
import ManagerMessages from "./components/manager/Messages";
import AdvancedAnalytics from './components/manager/AdvancedAnalytics';

// Renter components
// Add to your routes configuration
import RenterDashboard from './components/renter/RenterDashboard';
import RenterPayments from './components/renter/RenterPayments';
import RenterComplaints from './components/renter/RenterComplaints';
import RenterProfile from './components/renter/RenterProfile';
import RenterMessages from './components/renter/RenterMessages';

const renterRoutes = [
  { path: '/renter/dashboard', element: <RenterDashboard /> },
  { path: '/renter/payments', element: <RenterPayments /> },
  { path: '/renter/complaints', element: <RenterComplaints /> },
  { path: '/renter/profile', element: <RenterProfile /> },
  { path: '/renter/messages', element: <RenterMessages /> },
];

// Import ProtectedRoute component (create this file)
import ProtectedRoute from "./components/manager/ProtectedRoute";

export const router = createBrowserRouter([
  // Public routes
  {
    path: "/login",
    element: <Login />,
  },
  
  // Home/landing page redirect to login
  {
    path: "/",
    element: <Login />, // Changed: Direct to login instead of separate page
  },
  
  // PROTECTED ROUTES - using Layout
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // Redirect from root to appropriate dashboard based on user role
      {
        index: true,
        element: <div>Loading...</div>, // This will be redirected by ProtectedRoute
      },
      
      // Owner routes
      {
        path: "owner",
        element: <OwnerDashboard />,
      },
      {
        path: "owner/payments",
        element: <OwnerPayments />,
      },
      
      // Manager routes
      {
        path: "manager/dashboard",
        element: <ManagerDashboard />,
      },
      {
        path: "manager/renters",
        element: <ManagerRenters />,
      },
      {
        path: "manager/bills",
        element: <ManagerBills />,
      },
      {
        path: "manager/maintenance",
        element: <ManagerMaintenance />,
      },
      {
        path: "manager/payments",
        element: <ManagerPayments />,
      },
      {
        path: "manager/analytics", 
        element: <AdvancedAnalytics />,
      },
      {
        path: "manager/settings",
        element: <ManagerSettings />,
      },
      {
        path: "manager/messages",
        element: <ManagerMessages />,
      },
      
      // Renter routes
      {
        path: "renter/dashboard",
        element: <RenterDashboard />,
      },
      {
        path: "renter/profile",
        element: <RenterProfile />,
      },
      {
        path: "renter/payments",
        element: <RenterPayments />,
      },
      {
        path: "renter/complaints",
        element: <RenterComplaints />,
      },
      {
        path: "renter/messages",
        element: <RenterMessages />,
      },
      
      // 404 catch-all
      {
        path: "*",
        element: <div className="p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
          <a href="/" className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
            Go Home
          </a>
        </div>,
      },
    ],
  },
]);