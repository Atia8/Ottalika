// import { Router } from "express";
// import {
//   getBillsByCategory
// } from "../../controllers/billController";
// import {
//   markBillAsPaid
// } from "../../controllers/paymentController";
// import {
//   getExpenseSummary
// } from "../../controllers/expenseController";

// const router = Router();

// router.get("/", getBillsByCategory);
// router.post("/pay", markBillAsPaid);
// router.get("/expenses/summary", getExpenseSummary);

// export default router;

// backend/src/routes/owner/bills.routes.ts

import { Router } from 'express';
import { dbQuery } from '../manager/utils';

const router = Router();

/**
 * GET /api/owner/bills
 * Query params:
 *   - month: "YYYY-MM" (optional, filters by due_date month)
 *   - status: 'paid' | 'overdue' | 'pending' | 'upcoming' | 'all' (optional)
 *
 * Returns bills from the `bills` table with live status calculation.
 * Since there's only one owner/manager, we just get all bills from manager_id=1
 */
router.get('/', async (req, res) => {
  try {
    const { month, status } = req.query;

    // Build WHERE clauses
    const conditions: string[] = ['b.manager_id = 1']; // Only one manager
    const params: any[] = [];
    let paramIdx = 1;

    // Month filter: match due_date to YYYY-MM
    if (month && typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
      conditions.push(`TO_CHAR(b.due_date, 'YYYY-MM') = $${paramIdx}`);
      params.push(month);
      paramIdx++;
    }

    // Status filter using live calculate_bill_status()
    // Map 'overdue' to 'pending' for the DB function and 'late' to 'overdue'
    if (status && status !== 'all' && ['paid', 'overdue', 'pending', 'upcoming'].includes(status as string)) {
      if (status === 'overdue') {
        // Query for 'late' status from DB function, will map to 'overdue' in response
        conditions.push(`calculate_bill_status(b.due_date, b.paid_date) = 'pending'`);
      } else {
        conditions.push(`calculate_bill_status(b.due_date, b.paid_date) = $${paramIdx}`);
        params.push(status);
        paramIdx++;
      }
    }

    const whereClause = conditions.join(' AND ');

    // Main bills query with live status calculation
    const billsResult = await dbQuery(`
      SELECT
        b.id,
        b.title,
        b.amount::FLOAT AS amount,
        b.due_date,
        b.paid_date,
        b.description,
        CASE 
          WHEN calculate_bill_status(b.due_date, b.paid_date) = 'late' THEN 'overdue'
          ELSE calculate_bill_status(b.due_date, b.paid_date)
        END AS status,
        m.name AS manager_name
      FROM bills b
      JOIN managers m ON b.manager_id = m.id
      WHERE ${whereClause}
      ORDER BY b.due_date DESC
    `, params);

    // Summary query (ignore status filter for summary)
    const summaryWhere = 'b.manager_id = 1' + 
      (month && typeof month === 'string' && /^\d{4}-\d{2}$/.test(month) 
        ? ` AND TO_CHAR(b.due_date, 'YYYY-MM') = '${month}'` 
        : '');

    const summaryResult = await dbQuery(`
      SELECT
        CASE 
          WHEN calculate_bill_status(b.due_date, b.paid_date) = 'late' THEN 'overdue'
          ELSE calculate_bill_status(b.due_date, b.paid_date)
        END AS status,
        COUNT(*)::INT AS count,
        SUM(b.amount)::FLOAT AS total_amount
      FROM bills b
      WHERE ${summaryWhere}
      GROUP BY calculate_bill_status(b.due_date, b.paid_date)
    `);

    // Available months for the picker
    const monthsResult = await dbQuery(`
      SELECT DISTINCT
        TO_CHAR(DATE_TRUNC('month', due_date), 'YYYY-MM') AS month_key,
        TO_CHAR(DATE_TRUNC('month', due_date), 'Mon YYYY') AS month_label
      FROM bills
      WHERE manager_id = 1
      ORDER BY month_key DESC
    `);

    // Build summary object
    const summary = {
      paid:     { count: 0, total_amount: 0 },
      overdue:  { count: 0, total_amount: 0 },
      pending:  { count: 0, total_amount: 0 },
      upcoming: { count: 0, total_amount: 0 },
      total:    { count: 0, total_amount: 0 },
    };

    summaryResult.rows.forEach((row: any) => {
      const statusKey = row.status as keyof typeof summary;
      if (statusKey in summary) {
        summary[statusKey] = { 
          count: row.count, 
          total_amount: row.total_amount 
        };
      }
    });

    // Calculate totals
    summary.total = {
      count: summaryResult.rows.reduce((a: number, r: any) => a + r.count, 0),
      total_amount: summaryResult.rows.reduce((a: number, r: any) => a + r.total_amount, 0),
    };

    return res.status(200).json({
      success: true,
      data: {
        bills: billsResult.rows,
        summary,
        available_months: monthsResult.rows,
        current_month: month || null,
        current_status: status || 'all',
      }
    });

  } catch (error: any) {
    console.error('Error fetching bills:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
      error: error.message
    });
  }
});

export default router;
