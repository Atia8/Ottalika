import express from "express";
import { getOwnerDashboard } from "../../controllers/ownerDashboardController";

const router = express.Router();

router.get("/", getOwnerDashboard);

export default router;