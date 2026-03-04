import { Router } from "express";

const router = Router();
const controller = require("../../controllers/requestController");

router.get("/", controller.getAllRequests);
router.post("/", controller.createRequest);
router.put("/:id/status", controller.updateStatus);
router.get("/renter/:renter_id", controller.getRequestsByRenter);

export default router;