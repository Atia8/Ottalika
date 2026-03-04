import { Request, Response } from "express";
import { pool } from "../database/db";

export const getOwnerDashboard = async (req: Request, res: Response) => {
  try {
    const { month } = req.query;

    const incomeResult = await pool.query(
      `
      SELECT COALESCE(SUM(p.amount), 0) AS total_income
      FROM payments p
      JOIN payment_confirmations pc ON pc.payment_id = p.id
      WHERE DATE_TRUNC('month', p.month) = DATE_TRUNC('month', $1::date)
      AND p.status = 'paid'
      AND pc.status = 'verified';
      `,
      [month]
    );

    const billsResult = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS total_bills
      FROM bills
      WHERE DATE_TRUNC('month', due_date) = DATE_TRUNC('month', $1::date)
      AND status = 'paid';
      `,
      [month]
    );

    const vacancyResult = await pool.query(`
      SELECT COUNT(*) AS vacancy_count
      FROM apartments
      WHERE status = 'vacant';
    `);

    const totalIncome = incomeResult.rows[0].total_income;
    const totalBills = billsResult.rows[0].total_bills;
    const vacancy = vacancyResult.rows[0].vacancy_count;

    const profit = totalIncome - totalBills;

    res.json({
      totalIncome,
      totalBills,
      profit,
      vacancy
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};