import { Router } from "express";
import {
  getBillsByCategory
} from "../controllers/billController";
import {
  markBillAsPaid
} from "../controllers/paymentController";
import {
  getExpenseSummary
} from "../controllers/expenseController";

const router = Router();

router.get("/", getBillsByCategory);
router.post("/pay", markBillAsPaid);
router.get("/expenses/summary", getExpenseSummary);

export default router;
