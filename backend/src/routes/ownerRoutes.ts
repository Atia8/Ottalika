// backend/src/routes/ownerRoutes.ts (Fixed version)
import express from 'express';
import { pool } from '../database/db';
import { authenticate, authorizeOwner } from '../middleware/auth.middleware';

const router = express.Router();

// Add authentication and authorization middleware to ALL owner routes
router.use(authenticate);
router.use(authorizeOwner);

// Helper function to parse amounts to numbers
const parseAmount = (amount: any): number => {
  if (amount === null || amount === undefined) return 0;
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// ============ OWNER COMPLAINTS (FROM MAINTENANCE_REQUESTS) ============
// GET /api/owner/complaints
router.get('/complaints', async (req: any, res) => {
  try {
    console.log('📡 Owner: Fetching complaints from maintenance_requests...');
    
    const { status } = req.query;
    
    let query = `
      SELECT 
        mr.id,
        mr.title,
        mr.description,
        mr.category,
        mr.type,
        mr.priority,
        mr.status,
        mr.created_at,
        mr.updated_at,
        mr.completed_at,
        mr.assigned_to,
        mr.estimated_cost,
        mr.actual_cost,
        mr.notes,
        mr.manager_marked_resolved,
        mr.renter_marked_resolved,
        mr.resolution,
        mr.resolution_notes,
        r.id as renter_id,
        r.name as renter_name,
        r.email as renter_email,
        r.phone as renter_phone,
        a.apartment_number,
        a.floor,
        b.name as building_name,
        b.id as building_id,
        o.id as owner_id,
        o.name as owner_name
      FROM maintenance_requests mr
      LEFT JOIN renters r ON mr.renter_id = r.id
      LEFT JOIN apartments a ON mr.apartment_id = a.id
      LEFT JOIN buildings b ON a.building_id = b.id
      LEFT JOIN owners o ON b.owner_id = o.id
      WHERE o.id = $1  -- Only show complaints from owner's buildings
    `;
    
    const params: any[] = [req.user?.ownerId || 1]; // Get owner ID from auth token
    
    if (status && status !== 'all') {
      if (status === 'needs_confirmation') {
        query += ` AND COALESCE(mr.manager_marked_resolved, FALSE) = TRUE 
                   AND COALESCE(mr.renter_marked_resolved, FALSE) = FALSE`;
      } else {
        params.push(status);
        query += ` AND mr.status = $${params.length}`;
      }
    }
    
    query += ' ORDER BY mr.created_at DESC';
    
    console.log('📊 Owner complaints query:', query.substring(0, 200));
    const result = await pool.query(query, params);
    
    console.log(`✅ Found ${result.rows.length} complaints for owner`);
    
    // Map to frontend-friendly format
    const complaints = result.rows.map(row => {
      // Determine status for owner dashboard
      let status: 'pending' | 'in-progress' | 'resolved' = 'pending';
      
      if (row.manager_marked_resolved && !row.renter_marked_resolved) {
        status = 'in-progress';
      } else if (row.manager_marked_resolved && row.renter_marked_resolved) {
        status = 'resolved';
      } else if (row.status === 'completed' || row.status === 'resolved') {
        status = 'resolved';
      } else if (row.status === 'in_progress') {
        status = 'in-progress';
      }
      
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        priority: row.priority,
        status: status,
        apartment: row.apartment_number || 'Unknown',
        renterName: row.renter_name || 'Unknown',
        createdAt: row.created_at,
        resolvedAt: row.resolved_at || row.completed_at,
        assignedTo: row.assigned_to,
        buildingName: row.building_name,
        estimatedCost: parseAmount(row.estimated_cost),
        actualCost: parseAmount(row.actual_cost),
        resolution: row.resolution,
        managerMarkedResolved: row.manager_marked_resolved,
        renterMarkedResolved: row.renter_marked_resolved
      };
    });
    
    res.json({
      success: true,
      data: complaints,
    });
    
  } catch (error) {
    console.error('❌ Error fetching owner complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============ MANAGER STATUS DATA ============
// GET /api/owner/manager-status
router.get('/manager-status', async (req: any, res) => {
  try {
    const ownerId = req.user?.ownerId || 1;
    console.log(`📊 Owner ${ownerId}: Fetching manager status data...`);
    
    // Get all data needed for manager status dashboard
    const [billsResult, complaintsResult, paymentsResult, rentersResult] = await Promise.all([
      // Get bills (utility bills for owner's buildings) - FIXED: removed amount_paid column
      pool.query(`
        SELECT b.* 
        FROM bills b
        WHERE b.manager_id IN (
          SELECT m.id FROM managers m WHERE m.assigned_owner_id = $1
        ) OR b.manager_id IS NULL
        ORDER BY b.due_date
      `, [ownerId]),
      
      // Get complaints from maintenance_requests for owner's buildings
      pool.query(`
        SELECT 
          mr.id,
          mr.title,
          mr.description,
          mr.category,
          mr.priority,
          mr.status,
          mr.created_at,
          mr.completed_at,
          mr.manager_marked_resolved,
          mr.renter_marked_resolved,
          mr.resolution,
          mr.estimated_cost,
          mr.actual_cost,
          a.apartment_number,
          r.name as renter_name
        FROM maintenance_requests mr
        JOIN apartments a ON mr.apartment_id = a.id
        JOIN renters r ON mr.renter_id = r.id
        JOIN buildings b ON a.building_id = b.id
        WHERE b.owner_id = $1
        ORDER BY mr.created_at DESC
      `, [ownerId]),
      
      // Get payments for owner's buildings (current month)
      pool.query(`
        SELECT 
          p.id,
          p.apartment_id,
          p.renter_id,
          p.amount,
          p.status as payment_status,
          p.month,
          p.due_date,
          p.paid_at,
          p.payment_method,
          pc.status as confirmation_status,
          a.apartment_number,
          a.rent_amount,
          r.name as renter_name,
          b.name as building_name
        FROM payments p
        JOIN apartments a ON p.apartment_id = a.id
        JOIN renters r ON p.renter_id = r.id
        JOIN buildings b ON a.building_id = b.id
        LEFT JOIN payment_confirmations pc ON p.id = pc.payment_id
        WHERE b.owner_id = $1
          AND DATE_TRUNC('month', p.month) = DATE_TRUNC('month', CURRENT_DATE)
        ORDER BY a.apartment_number
      `, [ownerId]),
      
      // Get renters from owner's buildings
      pool.query(`
        SELECT DISTINCT
          r.id,
          r.name,
          r.status,
          a.id as apartment_id
        FROM renters r
        JOIN apartments a ON r.id = a.current_renter_id
        JOIN buildings b ON a.building_id = b.id
        WHERE b.owner_id = $1
          AND a.status = 'occupied'
      `, [ownerId])
    ]);
    
    // Format bills with parsed amounts - FIXED: no amount_paid column
    const bills = billsResult.rows.map(row => ({
      ...row,
      amount: parseAmount(row.amount),
      isPaid: row.status === 'paid' || row.paid_date !== null,
      paidDate: row.paid_date
    }));
    
    // Format complaints for frontend
    const complaints = complaintsResult.rows.map(row => {
      let status: 'pending' | 'in-progress' | 'resolved' = 'pending';
      if (row.manager_marked_resolved && !row.renter_marked_resolved) {
        status = 'in-progress';
      } else if (row.manager_marked_resolved && row.renter_marked_resolved) {
        status = 'resolved';
      } else if (row.status === 'completed' || row.status === 'resolved') {
        status = 'resolved';
      } else if (row.status === 'in_progress') {
        status = 'in-progress';
      }
      
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        priority: row.priority,
        status: status,
        apartment: row.apartment_number,
        renterName: row.renter_name,
        createdAt: row.created_at,
        resolvedAt: row.completed_at,
        managerMarkedResolved: row.manager_marked_resolved,
        renterMarkedResolved: row.renter_marked_resolved,
        resolution: row.resolution,
        estimatedCost: parseAmount(row.estimated_cost),
        actualCost: parseAmount(row.actual_cost)
      };
    });
    
    // Format payments for frontend
    const payments = paymentsResult.rows.map(row => ({
      id: row.id,
      apartment_number: row.apartment_number,
      renter_name: row.renter_name,
      payment_status: row.payment_status,
      confirmation_status: row.confirmation_status,
      amount: parseAmount(row.amount),
      rent_amount: parseAmount(row.rent_amount),
      month: row.month,
      due_date: row.due_date
    }));
    
    // Format renters for frontend
    const renters = rentersResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      status: row.status,
      apartment_id: row.apartment_id
    }));
    
    res.json({
      success: true,
      data: {
        bills: bills,
        complaints: complaints,
        payments: payments,
        renters: renters
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching manager status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch manager status data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============ BILLS ROUTES ============
// GET /api/owner/bills?category=pending|upcoming|monthly-summary
router.get('/bills', async (req: any, res) => {
  try {
    const ownerId = req.user?.ownerId || 1;
    const { category, month } = req.query;

    let query = "";
    const params: any[] = [ownerId];

    if (category === "pending") {
      query = `
        SELECT b.* 
        FROM bills b
        WHERE (b.manager_id IN (SELECT m.id FROM managers m WHERE m.assigned_owner_id = $1) 
               OR b.manager_id IS NULL)
          AND b.status = 'pending'
        ORDER BY b.due_date;
      `;
    } else if (category === "upcoming") {
      query = `
        SELECT b.* 
        FROM bills b
        WHERE (b.manager_id IN (SELECT m.id FROM managers m WHERE m.assigned_owner_id = $1) 
               OR b.manager_id IS NULL)
          AND b.status = 'upcoming'
          AND DATE_TRUNC('month', b.due_date) = DATE_TRUNC('month', CURRENT_DATE)
        ORDER BY b.due_date;
      `;
    } else if (category === "monthly-summary") {
      query = `
        SELECT b.* 
        FROM bills b
        WHERE (b.manager_id IN (SELECT m.id FROM managers m WHERE m.assigned_owner_id = $1) 
               OR b.manager_id IS NULL)
        ORDER BY b.due_date;
      `;
    } else if (category === "all" || !category) {
      query = `
        SELECT b.* 
        FROM bills b
        WHERE (b.manager_id IN (SELECT m.id FROM managers m WHERE m.assigned_owner_id = $1) 
               OR b.manager_id IS NULL)
        ORDER BY b.due_date;
      `;
    } else {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }

    const { rows } = await pool.query(query, params);
    
    // Parse all amounts to numbers - FIXED: no amount_paid column
    const bills = rows.map((row: any) => ({
      ...row,
      amount: parseAmount(row.amount),
      isPaid: row.status === 'paid' || row.paid_date !== null
    }));
    
    res.json({ success: true, data: bills });

  } catch (error) {
    console.error('❌ Error fetching bills:', error);
    res.status(500).json({ success: false, message: "Failed to fetch bills" });
  }
});

// ============ PAYMENTS ROUTES ============
// GET /api/owner/payments?month=2025-01-01
router.get('/payments', async (req: any, res) => {
  try {
    const ownerId = req.user?.ownerId || 1;
    const { month } = req.query;
    
    if (!month || typeof month !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: 'Month parameter is required in format YYYY-MM-DD' 
      });
    }

    const monthRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return res.status(400).json({ 
        success: false,
        message: 'Month must be in format YYYY-MM-DD (e.g., 2025-01-01)' 
      });
    }

    console.log(`Owner ${ownerId}: Fetching payments for month: ${month}`);

    // Query 1: Get apartments with payment and confirmation status
    const apartmentsQuery = `
      SELECT 
        a.id,
        a.apartment_number,
        a.floor,
        a.rent_amount,
        r.id as renter_id,
        r.name as renter_name,
        r.email as renter_email,
        r.phone as renter_phone,
        p.id as payment_id,
        p.amount,
        p.status as payment_status,
        p.paid_at,
        p.payment_method,
        p.transaction_id,
        pc.status as confirmation_status,
        pc.verified_at
      FROM apartments a
      LEFT JOIN renters r ON a.current_renter_id = r.id
      LEFT JOIN payments p ON p.apartment_id = a.id 
        AND p.month = $2::date
      LEFT JOIN payment_confirmations pc ON pc.payment_id = p.id
      JOIN buildings b ON a.building_id = b.id
      WHERE b.owner_id = $1
        AND a.status = 'occupied'
      ORDER BY a.apartment_number;
    `;

    // Query 2: Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_apartments,
        COUNT(CASE WHEN pc.status = 'verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN p.status = 'paid' AND (pc.status IS NULL OR pc.status != 'verified') THEN 1 END) as pending_review_count,
        COUNT(CASE WHEN p.status IS NULL OR p.status = 'pending' THEN 1 END) as unpaid_count,
        COUNT(CASE WHEN p.status = 'overdue' THEN 1 END) as overdue_count,
        COALESCE(SUM(a.rent_amount), 0) as total_expected,
        COALESCE(SUM(CASE WHEN pc.status = 'verified' THEN p.amount ELSE 0 END), 0) as total_collected
      FROM apartments a
      JOIN buildings b ON a.building_id = b.id
      LEFT JOIN payments p ON p.apartment_id = a.id 
        AND p.month = $2::date
      LEFT JOIN payment_confirmations pc ON pc.payment_id = p.id
      WHERE b.owner_id = $1
        AND a.status = 'occupied';
    `;

    // Execute both queries in parallel
    const [apartmentsResult, summaryResult] = await Promise.all([
      pool.query(apartmentsQuery, [ownerId, month]),
      pool.query(summaryQuery, [ownerId, month])
    ]);

    const summary = summaryResult.rows[0] || {
      total_apartments: 0,
      verified_count: 0,
      pending_review_count: 0,
      unpaid_count: 0,
      overdue_count: 0,
      total_expected: 0,
      total_collected: 0
    };

    // Parse summary amounts
    const parsedSummary = {
      total_apartments: parseInt(summary.total_apartments) || 0,
      verified_count: parseInt(summary.verified_count) || 0,
      pending_review_count: parseInt(summary.pending_review_count) || 0,
      unpaid_count: parseInt(summary.unpaid_count) || 0,
      overdue_count: parseInt(summary.overdue_count) || 0,
      total_expected: parseAmount(summary.total_expected),
      total_collected: parseAmount(summary.total_collected)
    };

    const collectionPercentage = parsedSummary.total_expected > 0 
      ? (parsedSummary.total_collected / parsedSummary.total_expected * 100) 
      : 0;

    // Parse apartment data amounts
    const apartments = apartmentsResult.rows.map(row => ({
      ...row,
      rent_amount: parseAmount(row.rent_amount),
      amount: parseAmount(row.amount)
    }));

    const response = {
      success: true,
      month: month,
      summary: {
        ...parsedSummary,
        collection_percentage: Math.round(collectionPercentage * 100) / 100
      },
      apartments: apartments
    };

    console.log(`Found ${response.apartments.length} apartments for owner ${ownerId}`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching owner payments:', error);
    res.status(500).json({ 
      success: false,
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/owner/payments/months
router.get('/payments/months', async (req: any, res) => {
  try {
    const ownerId = req.user?.ownerId || 1;
    
    const query = `
      SELECT DISTINCT 
        TO_CHAR(p.month, 'Month YYYY') as display_month,
        p.month as value
      FROM payments p
      JOIN apartments a ON p.apartment_id = a.id
      JOIN buildings b ON a.building_id = b.id
      WHERE b.owner_id = $1
      ORDER BY p.month DESC
      LIMIT 12;
    `;
    
    const result = await pool.query(query, [ownerId]);
    
    // If no payments yet, return current month
    if (result.rows.length === 0) {
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-01`;
      res.json({
        success: true,
        months: [{
          display_month: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          value: currentMonth
        }]
      });
    } else {
      res.json({
        success: true,
        months: result.rows
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching payment months:', error);
    res.status(500).json({ 
      success: false,
      message: 'Database error' 
    });
  }
});

// ============ OWNER DASHBOARD DATA ============
// GET /api/owner/dashboard
router.get('/dashboard', async (req: any, res) => {
  try {
    const ownerId = req.user?.ownerId || 1;
    console.log(`📊 Owner ${ownerId}: Fetching dashboard data...`);
    
    // Get owner financial summary using the SQL function
    const summaryResult = await pool.query(
      'SELECT * FROM get_owner_financial_summary($1)',
      [ownerId]
    );
    
    // Get monthly income data for charts
    const monthlyIncomeResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', p.month) as month,
        EXTRACT(MONTH FROM p.month) as month_num,
        EXTRACT(YEAR FROM p.month) as year,
        SUM(p.amount) as income,
        COUNT(p.id) as payment_count
      FROM payments p
      JOIN apartments a ON p.apartment_id = a.id
      JOIN buildings b ON a.building_id = b.id
      WHERE b.owner_id = $1
        AND p.status = 'paid'
        AND p.month >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', p.month)
      ORDER BY DATE_TRUNC('month', p.month) ASC
    `, [ownerId]);
    
    // Format monthly income for charts with parsed amounts
    const monthlyIncome = monthlyIncomeResult.rows.map(row => {
      const date = new Date(row.month);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear().toString().slice(-2);
      const income = parseAmount(row.income);
      
      return {
        month: `${monthName} '${year}`,
        income: income,
        profit: income * 0.7, // Simplified profit calculation
        expenses: income * 0.3
      };
    });
    
    // Get pending complaints
    const pendingComplaintsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM maintenance_requests mr
      JOIN apartments a ON mr.apartment_id = a.id
      JOIN buildings b ON a.building_id = b.id
      WHERE b.owner_id = $1
        AND mr.status IN ('pending', 'in_progress')
    `, [ownerId]);
    
    const pendingComplaints = parseInt(pendingComplaintsResult.rows[0]?.count) || 0;
    
    const summary = summaryResult.rows[0] || {
      total_income: 0,
      total_expenses: 0,
      net_profit: 0,
      pending_payments: 0,
      overdue_payments: 0,
      vacant_apartments: 0,
      occupied_apartments: 0
    };
    
    // Parse all financial amounts
    res.json({
      success: true,
      data: {
        totalIncome: parseAmount(summary.total_income),
        totalExpenses: parseAmount(summary.total_expenses),
        totalProfit: parseAmount(summary.net_profit),
        pendingPayments: parseInt(summary.pending_payments) || 0,
        overduePayments: parseInt(summary.overdue_payments) || 0,
        occupiedApartments: parseInt(summary.occupied_apartments) || 0,
        totalApartments: (parseInt(summary.occupied_apartments) + parseInt(summary.vacant_apartments)) || 0,
        occupancyRate: (parseInt(summary.occupied_apartments) / 
          ((parseInt(summary.occupied_apartments) + parseInt(summary.vacant_apartments)) || 1) * 100) || 0,
        monthlyIncome: monthlyIncome,
        pendingComplaints: pendingComplaints
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching owner dashboard:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;