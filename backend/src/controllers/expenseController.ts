import { Request, Response } from "express";
import { pool } from "../database/db";

export const getExpenseSummary = async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT
        COALESCE(
          TO_CHAR(DATE_TRUNC('month', due_date), 'Mon YYYY'),
          'TOTAL'
        ) AS period,
        SUM(amount) AS total_expense
      FROM bills
      WHERE status IN ('paid', 'late')
      GROUP BY ROLLUP (DATE_TRUNC('month', due_date))
      ORDER BY period;
    `;

    const { rows } = await pool.query(query);
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch expense summary" });
  }
};
