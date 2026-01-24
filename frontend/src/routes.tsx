// frontend/src/routes.tsx - Hybrid version
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import Layout from "./Layout"; // Your Layout

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
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Public routes
      {
        path: "login",
        element: <Login />,
      },
      
      // Protected routes - using your Layout
      {
        path: "/",
        element: <Layout>{/* This will be replaced by outlet */}</Layout>,
        children: [
          // Owner routes (from her)
          {
            path: "owner",
            element: <OwnerDashboard />,
          },
          {
            path: "owner/payments",
            element: <OwnerPayments />,
          },
          
          // Manager routes (yours)
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
            path: "manager/settings",
            element: <ManagerSettings />,
          },
          {
            path: "manager/messages",
            element: <ManagerMessages />,
          },
          
          // Renter routes (yours)
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
        ],
      },
    ],
  },
]);