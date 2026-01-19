import express from 'express';
import { pool } from '../database/db';
import { authenticate, authorizeOwner } from '../middleware/auth.middleware';

const router = express.Router();

// Add authentication and authorization middleware to ALL owner routes
router.use(authenticate);
router.use(authorizeOwner);

// GET /api/owner/payments?month=2025-01-01
router.get('/payments', async (req: any, res) => {  // Changed to 'any' to access req.user
  try {
    const { month } = req.query;
    
    if (!month || typeof month !== 'string') {
      return res.status(400).json({ 
        success: false,  // Added to match teammate's format
        message: 'Month parameter is required in format YYYY-MM-DD' 
      });
    }

    // Validate month format (should be YYYY-MM-DD)
    const monthRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return res.status(400).json({ 
        success: false,  // Added to match teammate's format
        message: 'Month must be in format YYYY-MM-DD (e.g., 2025-01-01)' 
      });
    }

    console.log(`Fetching owner payments for month: ${month} for user: ${req.user?.userId}`);

    // Query 1: Get apartments with payment and confirmation status
    const apartmentsQuery = `
      SELECT 
        a.id,
        a.apartment_number,
        a.floor,
        a.rent_amount,
        
        -- Renter info
        r.id as renter_id,
        r.name as renter_name,
        r.email as renter_email,
        r.phone as renter_phone,
        
        -- Payment info
        p.id as payment_id,
        p.status as payment_status,
        p.paid_at,
        p.payment_method,
        p.transaction_id,
        
        -- Confirmation info
        pc.status as confirmation_status,
        pc.verified_at
        
      FROM apartments a
      LEFT JOIN renters r ON a.current_renter_id = r.id
      LEFT JOIN payments p ON p.apartment_id = a.id 
        AND p.month = $1::date
      LEFT JOIN payment_confirmations pc ON pc.payment_id = p.id
      WHERE a.status = 'occupied'
      ORDER BY a.apartment_number;
    `;

    // Query 2: Get summary statistics
    const summaryQuery = `
      SELECT 
        -- Counts
        COUNT(*) as total_apartments,
        COUNT(CASE WHEN pc.status = 'verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN p.status = 'paid' AND (pc.status IS NULL OR pc.status != 'verified') THEN 1 END) as pending_review_count,
        COUNT(CASE WHEN p.status IS NULL OR p.status = 'pending' THEN 1 END) as unpaid_count,
        COUNT(CASE WHEN p.status = 'overdue' THEN 1 END) as overdue_count,
        
        -- Amounts
        COALESCE(SUM(a.rent_amount), 0) as total_expected,
        COALESCE(SUM(CASE WHEN pc.status = 'verified' THEN a.rent_amount ELSE 0 END), 0) as total_collected
        
      FROM apartments a
      LEFT JOIN payments p ON p.apartment_id = a.id 
        AND p.month = $1::date
      LEFT JOIN payment_confirmations pc ON pc.payment_id = p.id
      WHERE a.status = 'occupied';
    `;

    // Execute both queries in parallel
    const [apartmentsResult, summaryResult] = await Promise.all([
      pool.query(apartmentsQuery, [month]),
      pool.query(summaryQuery, [month])
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

    // Calculate collection percentage
    const collectionPercentage = summary.total_expected > 0 
      ? (summary.total_collected / summary.total_expected * 100) 
      : 0;

    const response = {
      success: true,  // Added to match teammate's format
      month: month,
      summary: {
        ...summary,
        collection_percentage: Math.round(collectionPercentage * 100) / 100
      },
      apartments: apartmentsResult.rows
    };

    console.log(`Found ${response.apartments.length} apartments for month ${month}`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching owner payments:', error);
    res.status(500).json({ 
      success: false,  // Added to match teammate's format
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/owner/payments/months - Get available months
router.get('/payments/months', async (req: any, res) => {  // Changed to 'any'
  try {
    const query = `
      SELECT DISTINCT 
        TO_CHAR(month, 'Month YYYY') as display_month,
        month as value
      FROM payments 
      ORDER BY month DESC
      LIMIT 12;
    `;
    
    const result = await pool.query(query);
    
    // If no payments yet, return current month
    if (result.rows.length === 0) {
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-01`;
      res.json({
        success: true,  // Added to match teammate's format
        months: [{
          display_month: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          value: currentMonth
        }]
      });
    } else {
      res.json({
        success: true,  // Added to match teammate's format
        months: result.rows
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching payment months:', error);
    res.status(500).json({ 
      success: false,  // Added to match teammate's format
      message: 'Database error' 
    });
  }
});

export default router;