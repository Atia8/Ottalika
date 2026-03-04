import { Router } from "express";

import legacyOwnerRoutes from "./legacyOwnerRoutes";

import dashboardRoutes from "./ownerDashboardRoutes";
import complaintRoutes from "./complaintRoutes";
import requestRoutes from "./requestRoutes";
import billRoutes from "./billRoutes";
import messagesRoutes from "./messages.routes";
import searchRoutes from "./search.routes";

const router = Router();

// Old routes (keep logic + auth inside file)
router.use("/", legacyOwnerRoutes);

// New modular routes

router.use("/dashboard", dashboardRoutes);
router.use("/complaints", complaintRoutes);
router.use("/requests", requestRoutes);
router.use("/bills", billRoutes);
router.use("/messages", messagesRoutes);
router.use("/searchManager", searchRoutes);
export default router;