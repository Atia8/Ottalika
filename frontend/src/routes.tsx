import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./Layout";

// Owner components
import { OwnerDashboard } from "./components/owner/OwnerDashboard";
import { OwnerPayments } from "./components/owner/OwnerPayments";
import { OwnerManagerStatus } from "./components/owner/OwnerManagerStatus";
import { OwnerComplaints } from "./components/owner/OwnerComplaints";


// Manager components
import ManagerDashboard from "./components/manager/Dashboard";
import ManagerRenters from "./components/manager/Renters";
import ManagerBills from "./components/manager/Bills";
import ManagerMaintenance from "./components/manager/Maintenance";
import ManagerPayments from "./components/manager/Payments";
import ManagerSettings from "./components/manager/Settings";
import ManagerMessages from "./components/manager/Messages";


// Renter components
import RenterDashboard from './components/renter/RenterDashboard';
import RenterPayments from './components/renter/RenterPayments';
import RenterComplaints from './components/renter/RenterComplaints';
import RenterProfile from './components/renter/RenterProfile';
import RenterMessages from './components/renter/RenterMessages';

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
    element: <Login />,
  },
  
  // OWNER ROUTES - No required role check
  {
    path: "/owner",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <OwnerDashboard />,
      },
      {
        path: "payments",
        element: <OwnerPayments />,
      },
      {
        path: "manager-status",
        element: <OwnerManagerStatus />,
      },
      {
        path: "complaints",
        element: <OwnerComplaints />,
      },
     
    ],
  },
  
  // MANAGER ROUTES
  {
    path: "/manager",
    element: (
      <ProtectedRoute requiredRole="manager">
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ManagerDashboard />,
      },
      {
        path: "dashboard",
        element: <ManagerDashboard />,
      },
      {
        path: "renters",
        element: <ManagerRenters />,
      },
      {
        path: "bills",
        element: <ManagerBills />,
      },
      {
        path: "maintenance",
        element: <ManagerMaintenance />,
      },
      {
        path: "payments",
        element: <ManagerPayments />,
      },
      {
        path: "settings",
        element: <ManagerSettings />,
      },
      {
        path: "messages",
        element: <ManagerMessages />,
      },
    ],
  },
  
  // RENTER ROUTES
  {
    path: "/renter",
    element: (
      <ProtectedRoute requiredRole="renter">
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <RenterDashboard />,
      },
      {
        path: "dashboard",
        element: <RenterDashboard />,
      },
      {
        path: "profile",
        element: <RenterProfile />,
      },
      {
        path: "payments",
        element: <RenterPayments />,
      },
      {
        path: "complaints",
        element: <RenterComplaints />,
      },
      {
        path: "messages",
        element: <RenterMessages />,
      },
    ],
  },
  
  // 404 catch-all
  {
    path: "*",
    element: (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
        <a 
          href="/" 
          className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    ),
  },
]);