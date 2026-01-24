// frontend/src/routes.tsx - FIXED VERSION
import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import  Layout from "./Layout"; // Use your Layout component

// Her owner components
import { OwnerDashboard } from "./components/owner/OwnerDashboard";
import { OwnerPayments } from "./components/owner/OwnerPayments";

// Your manager components
import ManagerDashboard from "./components/manager/Dashboard";
import ManagerRenters from "./components/manager/Renters";
import ManagerBills from "./components/manager/Bills";
import ManagerMaintenance from "./components/manager/Maintenance";
import ManagerPayments from "./components/manager/Payments";
import ManagerSettings from "./components/manager/Settings";
import ManagerMessages from "./components/manager/Messages";

// Your renter components
import RenterDashboard from "./pages/renter/dashboard.js";
import RenterProfile from "./pages/renter/profile.js";
import RenterPayments from "./pages/renter/payment.js";
import RenterComplaints from "./pages/renter/complaint.js";
import RenterMessages from "./pages/renter/messages.js";

// Protected route wrapper
const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  return <>{children}</>;
};

export const router = createBrowserRouter([
  // Public routes
  {
    path: "/login",
    element: <Login />,
  },
  
  // Main layout route
  {
    path: "/",
    element: <Layout />, // Default role, will be dynamic based on auth
    children: [
      // Home/landing
      {
        index: true,
        element: <div>Welcome to Ottalika</div>,
      },
      
      // Owner routes (from her)
      {
        path: "owner",
        element: <ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>,
      },
      {
        path: "owner/payments",
        element: <ProtectedRoute role="owner"><OwnerPayments /></ProtectedRoute>,
      },
      
      // Manager routes (yours)
      {
        path: "manager/dashboard",
        element: <ProtectedRoute role="manager"><ManagerDashboard /></ProtectedRoute>,
      },
      {
        path: "manager/renters",
        element: <ProtectedRoute role="manager"><ManagerRenters /></ProtectedRoute>,
      },
      {
        path: "manager/bills",
        element: <ProtectedRoute role="manager"><ManagerBills /></ProtectedRoute>,
      },
      {
        path: "manager/maintenance",
        element: <ProtectedRoute role="manager"><ManagerMaintenance /></ProtectedRoute>,
      },
      {
        path: "manager/payments",
        element: <ProtectedRoute role="manager"><ManagerPayments /></ProtectedRoute>,
      },
      {
        path: "manager/settings",
        element: <ProtectedRoute role="manager"><ManagerSettings /></ProtectedRoute>,
      },
      {
        path: "manager/messages",
        element: <ProtectedRoute role="manager"><ManagerMessages /></ProtectedRoute>,
      },
      
      // Renter routes (yours)
      {
        path: "renter/dashboard",
        element: <ProtectedRoute role="renter"><RenterDashboard /></ProtectedRoute>,
      },
      {
        path: "renter/profile",
        element: <ProtectedRoute role="renter"><RenterProfile /></ProtectedRoute>,
      },
      {
        path: "renter/payments",
        element: <ProtectedRoute role="renter"><RenterPayments /></ProtectedRoute>,
      },
      {
        path: "renter/complaints",
        element: <ProtectedRoute role="renter"><RenterComplaints /></ProtectedRoute>,
      },
      {
        path: "renter/messages",
        element: <ProtectedRoute role="renter"><RenterMessages /></ProtectedRoute>,
      },
    ],
  },
]);