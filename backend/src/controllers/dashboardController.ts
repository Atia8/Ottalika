import { Request, Response } from "express";
import { pool } from "../database/db";

export const getOwnerDashboard = async (req: any, res: Response) => {
  try {

    //const ownerId = req.user?.ownerId || 1;
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Month is required (YYYY-MM)"
      });
    }
   
const userId = req.user?.userId;

const ownerResult = await pool.query(
  `SELECT id FROM owners WHERE user_id = $1`,
  [userId]
);

const ownerId = ownerResult.rows[0]?.id;

if (!ownerId) {
  return res.status(403).json({
    success:false,
    message:"Owner not found"
  });
}

    // Convert YYYY-MM → YYYY-MM-01
    const monthDate = `${month}-01`;

    /*
    ====================================
    INCOME (Verified Payments Only)
    ====================================
    */
    const incomeQuery = `
      SELECT COALESCE(SUM(p.amount),0) AS total_income
      FROM payments p
      JOIN apartments a ON p.apartment_id = a.id
      JOIN buildings b ON a.building_id = b.id
      LEFT JOIN payment_confirmations pc ON pc.payment_id = p.id
      WHERE b.owner_id = $1
        AND p.status = 'paid'
        AND pc.status = 'verified'
        AND DATE_TRUNC('month', p.month) =
            DATE_TRUNC('month', $2::date)
    `;

    /*
    ====================================
    EXPENSES
    ====================================
    */
    const expenseQuery = `
      SELECT COALESCE(SUM(amount),0) AS total_expense
      FROM bills
      WHERE status IN ('paid','late')
        AND DATE_TRUNC('month', due_date) =
            DATE_TRUNC('month', $1::date)
    `;

    /*
    ====================================
    OCCUPANCY
    ====================================
    */
    const occupancyQuery = `
      SELECT 
        COUNT(*) AS total_units,
        COUNT(*) FILTER (WHERE status = 'occupied') AS occupied_units
      FROM apartments a
      JOIN buildings b ON a.building_id = b.id
      WHERE b.owner_id = $1
    `;

    /*
    ====================================
    EXECUTE QUERIES
    ====================================
    */

    const incomeResult = await pool.query(incomeQuery, [
      ownerId,
      monthDate
    ]);

    const expenseResult = await pool.query(expenseQuery, [
      monthDate
    ]);

    const occupancyResult = await pool.query(occupancyQuery, [
      ownerId
    ]);

    /*
    ====================================
    SAFE VALUE EXTRACTION
    ====================================
    */

    const totalIncome =
      Number(incomeResult.rows[0]?.total_income || 0);

    const totalExpense =
      Number(expenseResult.rows[0]?.total_expense || 0);

    const totalUnits =
      Number(occupancyResult.rows[0]?.total_units || 0);

    const occupiedUnits =
      Number(occupancyResult.rows[0]?.occupied_units || 0);

    const occupancyRate =
      totalUnits === 0
        ? 0
        : (occupiedUnits / totalUnits) * 100;

    /*
    ====================================
    RESPONSE
    ====================================
    */

    res.json({
      success: true,
      data: {
        total_income: totalIncome,
        total_expense: totalExpense,
        net_profit: totalIncome - totalExpense,
        total_units: totalUnits,
        occupied_units: occupiedUnits,
        occupancy_rate: occupancyRate
      }
    });

  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Dashboard error"
    });
  }
};