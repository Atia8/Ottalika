import { Request, Response } from "express";
import { pool } from "../database/db";


export const markBillAsPaid = async (req: Request, res: Response) => {
  try {
    const { billId, paidDate } = req.body;

    await pool.query(
      `CALL mark_bill_paid($1, $2);`,
      [billId, paidDate]
    );

    res.json({ message: "Bill marked as paid successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Payment update failed" });
  }
};
