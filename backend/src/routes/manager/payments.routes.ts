import { Router } from 'express';
import { pool } from '../../database/db';
import { dbQuery } from './utils';

const router = Router();

// ==================== PAYMENTS ENDPOINTS ====================

// GET /payments - Get rent payments
router.get('/payments', async (req, res) => {
  try {
    const { month, year, status, renter_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let query = `
      SELECT 
        p.*,
        a.apartment_number,
        a.floor,
        r.name as renter_name,
        r.email as renter_email,
        r.phone as renter_phone,
        b.name as building_name,
        pc.status as confirmation_status,
        pc.verified_at,
        EXTRACT(YEAR FROM p.month) as year,
        TO_CHAR(p.month, 'Mon YYYY') as month_display,
        CASE 
          WHEN p.status = 'paid' THEN 'paid'
          WHEN p.status = 'pending' AND p.month < $1::date THEN 'overdue'
          WHEN p.status = 'pending' AND p.month = $1::date THEN 'pending'
          WHEN p.status = 'pending' AND p.month > $1::date THEN 'upcoming'
          ELSE p.status::text
        END as display_status
      FROM payments p
      LEFT JOIN apartments a ON p.apartment_id = a.id
      LEFT JOIN renters r ON p.renter_id = r.id
      LEFT JOIN buildings b ON a.building_id = b.id
      LEFT JOIN payment_confirmations pc ON p.id = pc.payment_id
      WHERE 1=1
    `;
    
    const params: any[] = [currentMonth];
    let paramCount = 1;
    
    // Year filter
    if (year && year !== 'all' && year !== 'undefined') {
      paramCount++;
      params.push(parseInt(year as string));
      query += ` AND EXTRACT(YEAR FROM p.month) = $${paramCount}`;
    }
    
    // Month filter
    if (month && month !== 'all' && month !== 'undefined') {
      paramCount++;
      
      if ((month as string).includes('-')) {
        const dateParts = (month as string).split('-');
        const year = parseInt(dateParts[0]);
        const monthNum = parseInt(dateParts[1]);
        
        params.push(year);
        paramCount++;
        params.push(monthNum);
        
        query += ` AND EXTRACT(YEAR FROM p.month) = $${paramCount-1} 
                   AND EXTRACT(MONTH FROM p.month) = $${paramCount}`;
      } else {
        params.push(parseInt(month as string));
        query += ` AND EXTRACT(MONTH FROM p.month) = $${paramCount}`;
      }
    }
    
    // Status filter
    if (status && status !== 'all' && status !== 'undefined') {
      if (status === 'overdue') {
        query += ` AND p.status = 'pending' AND p.month < $1::date`;
      } else if (status === 'pending') {
        query += ` AND p.status = 'pending' AND p.month = $1::date`;
      } else if (status === 'upcoming') {
        query += ` AND p.status = 'pending' AND p.month > $1::date`;
      } else if (status === 'paid') {
        query += ` AND p.status = 'paid'`;
      } else {
        paramCount++;
        params.push(status);
        query += ` AND p.status = $${paramCount}`;
      }
    }
    
    // Renter filter
    if (renter_id && renter_id !== 'all' && renter_id !== 'undefined') {
      paramCount++;
      params.push(renter_id);
      query += ` AND p.renter_id = $${paramCount}`;
    }
    
    // Get total count
    const countQuery = query.replace(
      'SELECT p.*, a.apartment_number, a.floor, r.name as renter_name, r.email as renter_email, r.phone as renter_phone, b.name as building_name, pc.status as confirmation_status, pc.verified_at, EXTRACT(YEAR FROM p.month) as year, TO_CHAR(p.month, \'Mon YYYY\') as month_display',
      'SELECT COUNT(*) as total'
    );
    const countResult = await dbQuery(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total) || 0;
    
    // Add pagination
    query += ` ORDER BY p.month DESC, a.apartment_number 
               LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string), offset);
    
    const result = await dbQuery(query, params);
    
    // Get filter options
    const yearsResult = await dbQuery(`
      SELECT DISTINCT EXTRACT(YEAR FROM month) as year
      FROM payments ORDER BY year DESC
    `);
    
    const rentersResult = await dbQuery(`
      SELECT DISTINCT r.id, r.name
      FROM renters r
      JOIN payments p ON r.id = p.renter_id
      WHERE r.status = 'active'
      ORDER BY r.name
    `);
    
    // Calculate summary
    const summary = {
      total_pending: result.rows.filter((p: any) => p.display_status === 'pending').length,
      total_overdue: result.rows.filter((p: any) => p.display_status === 'overdue').length,
      total_upcoming: result.rows.filter((p: any) => p.display_status === 'upcoming').length,
      total_paid: result.rows.filter((p: any) => p.status === 'paid').length,
      amount_pending: result.rows
        .filter((p: any) => p.display_status === 'pending')
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0),
      amount_overdue: result.rows
        .filter((p: any) => p.display_status === 'overdue')
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0),
      amount_upcoming: result.rows
        .filter((p: any) => p.display_status === 'upcoming')
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0),
      amount_paid: result.rows
        .filter((p: any) => p.status === 'paid')
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0)
    };
    
    res.json({
      success: true,
      data: {
        payments: result.rows,
        summary,
        filters: {
          years: yearsResult.rows.map(y => y.year),
          renters: rentersResult.rows,
          statuses: ['all', 'paid', 'pending', 'overdue', 'upcoming']
        },
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Get payments error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get payments',
      error: error.message 
    });
  }
});

// GET /payments/months - Get available months
router.get('/payments/months', async (req, res) => {
  try {
    console.log('📅 Fetching payment months...');
    
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    
    const query = `
      SELECT DISTINCT 
        EXTRACT(MONTH FROM month) as month_num,
        EXTRACT(YEAR FROM month) as year
      FROM payments 
      WHERE EXTRACT(YEAR FROM month) = $1
      ORDER BY month_num;
    `;
    
    const result = await dbQuery(query, [year]);
    console.log(`✅ Found ${result.rows.length} unique months for year ${year}`);
    
    const months = result.rows.map(row => {
      const monthNum = parseInt(row.month_num);
      return {
        value: monthNum.toString().padStart(2, '0'),
        display_month: new Date(2000, monthNum - 1, 1).toLocaleDateString('en-US', { month: 'long' }),
        full_date: `${year}-${monthNum.toString().padStart(2, '0')}-01`
      };
    });
    
    res.json({
      success: true,
      months
    });
    
  } catch (error: any) {
    console.error('💥 Error in /payments/months:', error.message);
    
    const currentYear = new Date().getFullYear();
    const fallbackMonths = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    for (let i = 1; i <= 12; i++) {
      fallbackMonths.push({
        value: i.toString().padStart(2, '0'),
        display_month: monthNames[i-1],
        full_date: `${currentYear}-${i.toString().padStart(2, '0')}-01`
      });
    }
    
    res.status(200).json({
      success: true,
      months: fallbackMonths
    });
  }
});

// GET /payments/years - Get available years
router.get('/payments/years', async (req, res) => {
  try {
    console.log('📅 Fetching payment years...');
    
    const query = `
      SELECT DISTINCT 
        EXTRACT(YEAR FROM month) as year
      FROM payments 
      ORDER BY year DESC;
    `;
    
    const result = await dbQuery(query);
    console.log(`✅ Found ${result.rows.length} years`);
    
    const years = result.rows.map(row => row.year);
    
    res.json({
      success: true,
      years
    });
    
  } catch (error: any) {
    console.error('💥 Error in /payments/years:', error.message);
    
    const currentYear = new Date().getFullYear();
    res.status(200).json({
      success: true,
      years: [currentYear, currentYear - 1, currentYear - 2]
    });
  }
});

// POST /payments/generate-next-month - Generate next month's payments only
router.post('/payments/generate-next-month', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const dueDate = new Date(nextMonth);
    dueDate.setDate(5);
    
    const existingCheck = await client.query(`
      SELECT COUNT(*) as count FROM payments 
      WHERE DATE_TRUNC('month', month) = DATE_TRUNC('month', $1::date)
    `, [nextMonth]);
    
    if (parseInt(existingCheck.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Payments for ${nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} already exist`
      });
    }
    
    const result = await client.query(`
      INSERT INTO payments (apartment_id, renter_id, amount, month, due_date, status, created_at, updated_at)
      SELECT 
        r.apartment_id,
        r.id,
        r.agreed_rent,
        $1::date,
        $2::date,
        'pending',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM renters r
      WHERE r.status = 'active'
        AND r.apartment_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payments p 
          WHERE p.renter_id = r.id 
            AND DATE_TRUNC('month', p.month) = DATE_TRUNC('month', $1::date)
        )
      RETURNING id, apartment_id, renter_id, amount, month, due_date
    `, [nextMonth, dueDate]);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      data: {
        message: `Generated ${result.rowCount} payments for ${nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        count: result.rowCount,
        payments: result.rows,
        month: nextMonth.toISOString().split('T')[0]
      }
    });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error generating payments:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// ==================== PAYMENT VERIFICATION ENDPOINTS ====================

// GET /payments/pending - Get payments pending verification
router.get('/payments/pending', async (req, res) => {
  try {
    console.log('📡 Fetching pending payments for verification...');
    
    const result = await dbQuery(`
      SELECT 
        p.*,
        a.apartment_number,
        r.name as renter_name,
        COALESCE(pc.status, 'pending_verification') as verification_status
      FROM payments p
      LEFT JOIN apartments a ON p.apartment_id = a.id
      LEFT JOIN renters r ON p.renter_id = r.id
      LEFT JOIN payment_confirmations pc ON p.id = pc.payment_id
      WHERE p.status = 'paid' 
        AND (pc.status IS NULL OR pc.status = 'pending_review')
      ORDER BY p.paid_at DESC
    `);
    
    console.log(`✅ Found ${result.rows.length} pending payments`);
    
    const pendingPayments = result.rows.map(row => ({
      id: row.id.toString(),
      renterName: row.renter_name,
      apartment: row.apartment_number,
      type: 'rent',
      amount: parseFloat(row.amount),
      amount_display: `৳${parseFloat(row.amount).toLocaleString('en-BD')}`,
      month: new Date(row.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      paymentDate: row.paid_at ? new Date(row.paid_at).toISOString().split('T')[0] : null,
      paymentMethod: row.payment_method || 'cash',
      reference: row.transaction_id || `PAY-${row.id}`,
      status: row.verification_status,
      submittedAt: row.paid_at || row.created_at
    }));
    
    res.status(200).json({
      success: true,
      data: {
        pendingPayments,
        total: result.rowCount
      }
    });
    
  } catch (error: any) {
    console.error('❌ Get pending payments error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending payments'
    });
  }
});

// POST /payments/:id/verify - Verify or reject payment
router.post('/payments/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    console.log(`✅ Verifying payment ${id} with status: ${status}`);
    
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "verified" or "rejected"'
      });
    }
    
    const paymentCheck = await dbQuery(
      'SELECT id FROM payments WHERE id = $1 AND status = $2',
      [id, 'paid']
    );
    
    if (paymentCheck.rows.length === 0) {
      console.log(`❌ Payment ${id} not found or not paid`);
      return res.status(404).json({
        success: false,
        message: 'Payment not found or not paid'
      });
    }
    
    const verificationCheck = await dbQuery(
      'SELECT id FROM payment_confirmations WHERE payment_id = $1',
      [id]
    );
    
    if (verificationCheck.rows.length > 0) {
      await dbQuery(`
        UPDATE payment_confirmations 
        SET status = $1, verified_at = CURRENT_TIMESTAMP, notes = $2 
        WHERE payment_id = $3
      `, [status, notes, id]);
    } else {
      await dbQuery(`
        INSERT INTO payment_confirmations (payment_id, manager_id, status, verified_at, notes)
        VALUES ($1, 1, $2, CURRENT_TIMESTAMP, $3)
      `, [id, status, notes]);
    }
    
    console.log(`✅ Payment ${id} ${status === 'verified' ? 'verified' : 'rejected'}`);
    
    res.status(200).json({
      success: true,
      data: {
        message: `Payment ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
        paymentId: id,
        status
      }
    });
    
  } catch (error: any) {
    console.error('❌ Verify payment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
});

// POST /payments - Record payment
router.post('/payments', async (req, res) => {
  const client = await pool.connect();
  try {
    const { renter_id, apartment_id, amount, month, payment_method, transaction_id } = req.body;

    console.log('💰 Recording payment:', { renter_id, apartment_id, amount, month, payment_method });

    if (!renter_id || !apartment_id || !amount || !month || !payment_method) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    await client.query('BEGIN');

    const existingPayment = await client.query(`
      SELECT id FROM payments 
      WHERE renter_id = $1 
        AND DATE_TRUNC('month', month) = DATE_TRUNC('month', $2::date)
    `, [renter_id, month]);

    if (existingPayment.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Payment already exists for this month' 
      });
    }

    const paymentResult = await client.query(`
      INSERT INTO payments (
        apartment_id, 
        renter_id, 
        amount, 
        month, 
        due_date, 
        status, 
        payment_method, 
        transaction_id, 
        paid_at
      ) VALUES ($1, $2, $3, $4::date, $4::date + INTERVAL '5 days', 'paid', $5, $6, CURRENT_TIMESTAMP)
      RETURNING id
    `, [apartment_id, renter_id, amount, month, payment_method, transaction_id]);

    await client.query(`
      INSERT INTO payment_confirmations (payment_id, manager_id, status, verified_at)
      VALUES ($1, $2, 'verified', CURRENT_TIMESTAMP)
    `, [paymentResult.rows[0].id, (req as any).managerId || 1]);

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      data: { 
        paymentId: paymentResult.rows[0].id,
        message: 'Payment recorded successfully' 
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to record payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to record payment. Please check server logs.' 
    });
  } finally {
    client.release();
  }
});

export default router;