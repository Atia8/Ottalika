const express = require("express");
const router = express.Router();
const controller = require("../controllers/requestController");

router.get("/", controller.getAllRequests);
router.post("/", controller.createRequest);
router.put("/:id/status", controller.updateStatus);
router.get(
  "/renter/:renter_id",
  controller.getRequestsByRenter
);
module.exports = router;