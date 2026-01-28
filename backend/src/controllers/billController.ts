import { Request, Response } from "express";
import { pool } from "../database/db";

/**
 * GET bills by category
 * pending | upcoming | monthly-summary
 */
export const getBillsByCategory = async (req: Request, res: Response) => {
  try {
    const { category, month } = req.query;

    let query = "";
    let values: any[] = [];

    if (category === "pending") {
      query = `
        SELECT * FROM bills
        WHERE status = 'pending'
        ORDER BY due_date;
      `;
    }

    else if (category === "upcoming") {
      query = `
        SELECT * FROM bills
        WHERE status = 'upcoming'
          AND DATE_TRUNC('month', due_date) = DATE_TRUNC('month', CURRENT_DATE)
        ORDER BY due_date;
      `;
     
    }

    else if (category === "monthly-summary") {
      query = `
        SELECT * FROM bills
        
        ORDER BY due_date;
      `;
      
    }

    else {
      return res.status(400).json({ message: "Invalid category" });
    }

    const { rows } = await pool.query(query, values);
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch bills" });
  }
};
