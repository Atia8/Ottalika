import { createBrowserRouter } from "react-router";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { OwnerPayments } from "./components/OwnerPayments";
import { OwnerManagerStatus } from "./components/OwnerManagerStatus";
import { OwnerComplaints } from "./components/OwnerComplaints";

console.log("OwnerDashboard imported:");
export const router = createBrowserRouter([
  
 
  {
    path: "/owner",
    element: <OwnerDashboard/>,
  },
  {
    path: "/owner/payments",
    Component: OwnerPayments,
  },
   {
    path: "/owner/manager-status",
    Component: OwnerManagerStatus,
  },

  {
    path: "/owner/complaints",
    Component: OwnerComplaints,
  },

]);
