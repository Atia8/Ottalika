import { createBrowserRouter } from "react-router";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { OwnerPayments } from "./components/OwnerPayments";
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
 

]);
