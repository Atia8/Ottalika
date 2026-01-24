// src/routes/managerRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../database/db';

const router = Router();

// Helper function - use consistent name
const dbQuery = async (text: string, params?: any[]) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Middleware placeholder
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  next();
};

const authorizeManager = (req: Request, res: Response, next: NextFunction) => {
  next();
};

router.use(authenticate);
router.use(authorizeManager);

// ==================== MANAGER DASHBOARD ====================
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    // Get total apartments
    const apartmentsResult = await dbQuery('SELECT COUNT(*) as total FROM apartments');
    const totalApartments = parseInt(apartmentsResult.rows[0].total) || 0;
    
    // Get occupied apartments
    const occupiedResult = await dbQuery(
      'SELECT COUNT(*) as occupied FROM apartments WHERE status = $1',
      ['occupied']
    );
    const occupiedApartments = parseInt(occupiedResult.rows[0].occupied) || 0;
    
    // Get pending renters
    const pendingRentersResult = await dbQuery(
      'SELECT COUNT(*) as pending FROM renters WHERE status = $1',
      ['pending']
    );
    const pendingRenters = parseInt(pendingRentersResult.rows[0].pending) || 0;
    
    // Get pending maintenance issues
    const maintenanceResult = await dbQuery(
      'SELECT COUNT(*) as pending FROM maintenance_requests WHERE status IN ($1, $2)',
      ['pending', 'in_progress']
    );
    const pendingComplaints = parseInt(maintenanceResult.rows[0].pending) || 0;
    
    // Get pending payments for current month
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const pendingPaymentsResult = await dbQuery(
      `SELECT COALESCE(SUM(amount::numeric), 0) as pending_amount 
       FROM payments 
       WHERE status = $1 AND DATE_TRUNC('month', month) = DATE_TRUNC('month', $2::date)`,
      ['pending', currentMonth]
    );
    const pendingPayments = parseFloat(pendingPaymentsResult.rows[0].pending_amount) || 0;
    
    // Get overdue payments
    const overdueResult = await dbQuery(
      `SELECT COALESCE(SUM(amount::numeric), 0) as overdue_amount 
       FROM payments 
       WHERE status = $1 AND due_date < CURRENT_DATE`,
      ['overdue']
    );
    const overdueAmount = parseFloat(overdueResult.rows[0].overdue_amount) || 0;
    
    // Get total collected this month
    const collectedResult = await dbQuery(
      `SELECT COALESCE(SUM(p.amount::numeric), 0) as collected
       FROM payments p
       JOIN payment_confirmations pc ON p.id = pc.payment_id
       WHERE p.status = $1 AND pc.status = $2 
         AND DATE_TRUNC('month', p.month) = DATE_TRUNC('month', CURRENT_DATE)`,
      ['paid', 'verified']
    );
    const monthlyRevenue = parseFloat(collectedResult.rows[0].collected) || 0;
    
    // Calculate occupancy rate
    const occupancyRate = totalApartments > 0 
      ? Math.round((occupiedApartments / totalApartments) * 100)
      : 0;

    // Get total tasks from manager_tasks table
    const tasksResult = await dbQuery('SELECT COUNT(*) as total FROM manager_tasks');
    const totalTasks = parseInt(tasksResult.rows[0].total) || 0;
    
    const completedTasksResult = await dbQuery(
      'SELECT COUNT(*) as completed FROM manager_tasks WHERE status = $1',
      ['completed']
    );
    const completedTasks = parseInt(completedTasksResult.rows[0].completed) || 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalRenters: occupiedApartments,
          pendingApprovals: pendingRenters,
          pendingComplaints: pendingComplaints,
          pendingBills: Math.ceil(pendingPayments / 1000),
          pendingVerifications: 5,
          totalTasks: totalTasks || 38,
          completedTasks: completedTasks || 15,
          monthlyRevenue: monthlyRevenue || 25000,
          occupancyRate: occupancyRate
        },
        recentActivities: [
          {
            id: 1,
            type: 'payment',
            title: 'Rent payment received from Apartment 101',
            time: '2 hours ago',
            status: 'completed',
            amount: 5000
          },
          {
            id: 2,
            type: 'renter_approval',
            title: 'New renter application for Apartment 103',
            time: '4 hours ago',
            status: 'pending',
            priority: 'medium'
          }
        ],
        quickStats: [
          { label: "Today's Tasks", value: 8, change: '+2', color: 'violet' },
          { label: 'Pending Approvals', value: pendingRenters, change: '-1', color: 'amber' },
          { label: 'Pending Payments', value: Math.ceil(pendingPayments/1000), change: '+3', color: 'rose' },
          { label: 'Bills Due', value: 2, change: '0', color: 'blue' }
        ],
        taskDistribution: [
          { name: 'Completed', value: completedTasks || 15, color: '#10b981' },
          { name: 'In Progress', value: 8, color: '#8b5cf6' },
          { name: 'Pending', value: 12, color: '#f59e0b' },
          { name: 'Overdue', value: 3, color: '#ef4444' }
        ]
      }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
});

// ==================== MANAGER BILLS ====================
router.get('/bills', async (req: Request, res: Response) => {
  try {
    // Get building bills (you need to add buildings table)
    const billsResult = await dbQuery(`
      SELECT 
        'electricity' as type,
        'Main Building' as building,
        ROUND(RANDOM() * 1000 + 500) as amount,
        (CURRENT_DATE + INTERVAL '10 days')::date as due_date,
        CASE 
          WHEN RANDOM() > 0.7 THEN 'paid'
          WHEN RANDOM() > 0.4 THEN 'overdue'
          ELSE 'pending'
        END as status,
        'National Grid' as provider,
        'NG-' || FLOOR(RANDOM() * 1000000)::text as account_number,
        TO_CHAR(CURRENT_DATE, 'Month YYYY') as month
      FROM generate_series(1, 4)  -- Generate 4 mock bills
    `);
    
    const bills = billsResult.rows;
    
    // Calculate summary
    const summary = {
      totalPending: bills
        .filter(b => b.status === 'pending')
        .reduce((sum, b) => sum + parseFloat(b.amount), 0),
      totalPaid: bills
        .filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + parseFloat(b.amount), 0),
      overdueBills: bills.filter(b => b.status === 'overdue').length,
      nextDue: bills.length > 0 
        ? new Date(Math.min(...bills.map(b => new Date(b.due_date).getTime()))).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    };

    res.status(200).json({
      success: true,
      data: {
        bills,
        summary
      }
    });
    
  } catch (error) {
    console.error('Bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bills'
    });
  }
});

// ==================== GENERATE MONTHLY RENT BILLS ====================
router.post('/bills/generate-monthly', async (req: Request, res: Response) => {
  try {
    // Get next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    const monthStr = nextMonth.toISOString().slice(0, 7) + '-01';
    
    // Generate rent bills for all occupied apartments
    const result = await dbQuery(`
      INSERT INTO payments (apartment_id, renter_id, amount, month, status, due_date)
      SELECT 
        a.id,
        a.current_renter_id,
        a.rent_amount,
        $1::date,
        'pending',
        DATE($1::date + INTERVAL '5 days')
      FROM apartments a
      WHERE a.status = 'occupied' 
        AND a.current_renter_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payments p 
          WHERE p.apartment_id = a.id 
            AND DATE_TRUNC('month', p.month) = DATE_TRUNC('month', $1::date)
        )
      RETURNING id, apartment_id, amount, due_date
    `, [monthStr]);
    
    res.status(200).json({
      success: true,
      data: {
        message: `Generated ${result.rowCount} monthly rent bills`,
        bills: result.rows
      }
    });
    
  } catch (error) {
    console.error('Generate bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly bills'
    });
  }
});

// ==================== MARK BILL AS PAID ====================
router.post('/bills/:id/pay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod, transactionId } = req.body;
    
    // Update payment status
    await dbQuery(`
      UPDATE payments 
      SET 
        status = 'paid',
        payment_method = $1,
        transaction_id = $2,
        paid_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, amount, apartment_id
    `, [paymentMethod, transactionId, id]);
    
    // Create payment confirmation
    await dbQuery(`
      INSERT INTO payment_confirmations (payment_id, manager_id, status, verified_at)
      VALUES ($1, 1, 'verified', CURRENT_TIMESTAMP)
    `, [id]);
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Bill marked as paid and verified',
        paymentId: id
      }
    });
    
  } catch (error) {
    console.error('Mark bill as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bill status'
    });
  }
});

// ==================== GET ALL PAYMENTS ====================
router.get('/payments', async (req: Request, res: Response) => {
  try {
    const { month } = req.query;
    
    let queryStr = `
      SELECT 
        p.*,
        a.apartment_number,
        a.floor,
        r.name as renter_name,
        r.email as renter_email,
        r.phone as renter_phone,
        pc.status as confirmation_status,
        pc.verified_at
      FROM payments p
      JOIN apartments a ON p.apartment_id = a.id
      JOIN renters r ON p.renter_id = r.id
      LEFT JOIN payment_confirmations pc ON p.id = pc.payment_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (month) {
      queryStr += ' AND DATE_TRUNC(\'month\', p.month) = DATE_TRUNC(\'month\', $1::date)';
      params.push(month);
    }
    
    queryStr += ' ORDER BY p.due_date DESC, a.apartment_number';
    
    const result = await dbQuery(queryStr, params);
    
    res.status(200).json({
      success: true,
      data: {
        payments: result.rows,
        total: result.rowCount
      }
    });
    
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments'
    });
  }
});

// GET /api/manager/payments/months - Get available months with payments
router.get('/payments/months', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT DISTINCT 
        TO_CHAR(month, 'Month YYYY') as display_month,
        TO_CHAR(month, 'YYYY-MM-01') as value
      FROM payments 
      ORDER BY month DESC
      LIMIT 12;
    `;
    
    const result = await dbQuery(query);
    
    // If no payments yet, return current and next few months
    if (result.rows.length === 0) {
      const months = [];
      const currentDate = new Date();
      
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - i);
        
        months.push({
          display_month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
        });
      }
      
      res.json({
        success: true,
        months
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

// ==================== MAINTENANCE REQUESTS ====================

// GET /api/manager/maintenance - Get all maintenance requests
router.get('/maintenance', async (req: Request, res: Response) => {
  try {
    const result = await dbQuery(`
      SELECT 
        mr.*,
        a.apartment_number,
        r.name as renter_name,
        r.phone as renter_phone,
        r.email as renter_email
      FROM maintenance_requests mr
      JOIN apartments a ON mr.apartment_id = a.id
      JOIN renters r ON mr.renter_id = r.id
      ORDER BY 
        CASE mr.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        mr.created_at DESC
      LIMIT 50
    `);
    
    res.status(200).json({
      success: true,
      data: {
        issues: result.rows,
        total: result.rowCount
      }
    });
    
  } catch (error) {
    console.error('Get maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get maintenance issues',
      error: error instanceof Error ? error.message : 'Database error'
    });
  }
});

// GET /api/manager/complaints - Alias for maintenance (for ManagerMaintenance component)
router.get('/complaints', async (req: Request, res: Response) => {
  try {
    const result = await dbQuery(`
      SELECT 
        mr.id,
        r.name as "renterName",
        a.apartment_number as apartment,
        mr.type,
        mr.title,
        mr.description,
        mr.status,
        mr.priority,
        mr.created_at as "createdAt",
        mr.updated_at as "updatedAt",
        mr.assigned_to as "assignedTo",
        mr.completed_at as "resolvedAt"
      FROM maintenance_requests mr
      JOIN apartments a ON mr.apartment_id = a.id
      JOIN renters r ON mr.renter_id = r.id
      ORDER BY 
        CASE mr.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        mr.created_at DESC
    `);
    
    const complaints = result.rows.map(row => ({
      id: row.id.toString(),
      renterName: row.renterName,
      apartment: row.apartment,
      type: row.type,
      title: row.title,
      description: row.description,
      status: row.status === 'completed' ? 'resolved' : row.status,
      priority: row.priority,
      createdAt: row.createdAt.toISOString().split('T')[0],
      updatedAt: row.updatedAt.toISOString().split('T')[0],
      assignedTo: row.assignedTo,
      resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString().split('T')[0] : undefined
    }));
    
    res.status(200).json({
      success: true,
      data: {
        complaints: complaints,
        total: result.rowCount
      }
    });
    
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get complaints'
    });
  }
});

// PUT /api/manager/complaints/:id/status - Update complaint status
router.put('/complaints/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;
    
    let query = 'UPDATE maintenance_requests SET status = $1, updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [status, id];
    
    if (status === 'completed' || status === 'resolved') {
      query += ', completed_at = CURRENT_TIMESTAMP';
    }
    
    if (resolution) {
      query += ', resolution = $3';
      params.push(resolution);
    }
    
    query += ' WHERE id = $2 RETURNING id, status';
    
    await dbQuery(query, params);
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Complaint status updated successfully',
        id,
        status
      }
    });
    
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint status'
    });
  }
});

// POST /api/manager/maintenance - Create new maintenance request
router.post('/maintenance', async (req: Request, res: Response) => {
  try {
    const { apartment_id, renter_id, title, description, priority, type } = req.body;
    
    const result = await dbQuery(`
      INSERT INTO maintenance_requests 
        (apartment_id, renter_id, title, description, priority, type, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING id, title, priority, status
    `, [apartment_id, renter_id, title, description, priority, type]);
    
    res.status(201).json({
      success: true,
      data: {
        message: 'Maintenance request created successfully',
        request: result.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Create maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create maintenance request'
    });
  }
});

// PUT /api/manager/maintenance/:id - Update maintenance request
router.put('/maintenance/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assigned_to, notes, priority } = req.body;
    
    const updates = [];
    const params: any[] = [id];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);
      
      if (status === 'completed') {
        paramCount++;
        updates.push(`completed_at = CURRENT_TIMESTAMP`);
      }
    }
    
    if (assigned_to) {
      paramCount++;
      updates.push(`assigned_to = $${paramCount}`);
      params.push(assigned_to);
    }
    
    if (notes) {
      paramCount++;
      updates.push(`notes = $${paramCount}`);
      params.push(notes);
    }
    
    if (priority) {
      paramCount++;
      updates.push(`priority = $${paramCount}`);
      params.push(priority);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    const query = `
      UPDATE maintenance_requests 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, title, status, priority, assigned_to
    `;
    
    const result = await dbQuery(query, params);
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Maintenance request updated successfully',
        request: result.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Update maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update maintenance request'
    });
  }
});

// DELETE /api/manager/maintenance/:id - Delete maintenance request
router.delete('/maintenance/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await dbQuery('DELETE FROM maintenance_requests WHERE id = $1', [id]);
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Maintenance request deleted successfully'
      }
    });
    
  } catch (error) {
    console.error('Delete maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete maintenance request'
    });
  }
});

// ==================== GET ALL RENTERS ====================
router.get('/renters', async (req: Request, res: Response) => {
  try {
    const result = await dbQuery(`
      SELECT 
        r.*,
        a.apartment_number,
        a.floor,
        a.rent_amount,
        a.status as apartment_status,
        (
          SELECT status 
          FROM payments p 
          WHERE p.renter_id = r.id 
            AND DATE_TRUNC('month', p.month) = DATE_TRUNC('month', CURRENT_DATE)
          ORDER BY p.due_date DESC 
          LIMIT 1
        ) as payment_status
      FROM renters r
      LEFT JOIN apartments a ON r.id = a.current_renter_id
      ORDER BY r.created_at DESC
    `);
    
    const renters = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      apartment: row.apartment_number || 'Not assigned',
      building: 'Main Building',
      status: row.apartment_status === 'occupied' ? 'active' : row.status || 'pending',
      rentPaid: row.payment_status === 'paid',
      rentAmount: row.rent_amount || 0,
      leaseStart: '2024-01-01',
      leaseEnd: '2024-12-31',
      documents: ['nid', 'contract']
    }));
    
    const activeRenters = renters.filter(r => r.status === 'active').length;
    const pendingRenters = renters.filter(r => r.status === 'pending').length;
    
    res.status(200).json({
      success: true,
      data: {
        renters,
        summary: {
          total: renters.length,
          active: activeRenters,
          pending: pendingRenters,
          inactive: renters.filter(r => r.status === 'inactive').length,
          totalRent: renters.reduce((sum, r) => sum + (r.rentAmount || 0), 0),
          collectedRent: renters.filter(r => r.rentPaid).reduce((sum, r) => sum + (r.rentAmount || 0), 0),
          occupancyRate: renters.length > 0 ? Math.round((activeRenters / renters.length) * 100) : 0
        }
      }
    });
    
  } catch (error) {
    console.error('Get renters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get renters'
    });
  }
});

// ==================== PAYMENT VERIFICATION ENDPOINTS ====================

// GET /api/manager/payments/pending - Get payments pending verification
router.get('/payments/pending', async (req: Request, res: Response) => {
  try {
    const result = await dbQuery(`
      SELECT 
        p.*,
        a.apartment_number,
        r.name as renter_name,
        COALESCE(pc.status, 'pending_verification') as verification_status
      FROM payments p
      JOIN apartments a ON p.apartment_id = a.id
      JOIN renters r ON p.renter_id = r.id
      LEFT JOIN payment_confirmations pc ON p.id = pc.payment_id
      WHERE p.status = 'paid' 
        AND (pc.status IS NULL OR pc.status = 'pending_review')
      ORDER BY p.paid_at DESC
    `);
    
    const pendingPayments = result.rows.map(row => ({
      id: row.id.toString(),
      renterName: row.renter_name,
      apartment: row.apartment_number,
      type: 'rent',
      amount: parseFloat(row.amount),
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
    
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending payments'
    });
  }
});

// POST /api/manager/payments/:id/verify - Verify or reject payment
router.post('/payments/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "verified" or "rejected"'
      });
    }
    
    // Check if payment exists and is paid
    const paymentCheck = await dbQuery(
      'SELECT id FROM payments WHERE id = $1 AND status = $2',
      [id, 'paid']
    );
    
    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or not paid'
      });
    }
    
    // Check if verification already exists
    const verificationCheck = await dbQuery(
      'SELECT id FROM payment_confirmations WHERE payment_id = $1',
      [id]
    );
    
    if (verificationCheck.rows.length > 0) {
      // Update existing verification
      await dbQuery(`
        UPDATE payment_confirmations 
        SET status = $1, verified_at = CURRENT_TIMESTAMP, notes = $2 
        WHERE payment_id = $3
      `, [status, notes, id]);
    } else {
      // Create new verification
      await dbQuery(`
        INSERT INTO payment_confirmations (payment_id, manager_id, status, verified_at, notes)
        VALUES ($1, 1, $2, CURRENT_TIMESTAMP, $3)
      `, [id, status, notes]);
    }
    
    res.status(200).json({
      success: true,
      data: {
        message: `Payment ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
        paymentId: id,
        status
      }
    });
    
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
});

// GET /api/manager/payments/verified - Get all verified payments
router.get('/payments/verified', async (req: Request, res: Response) => {
  try {
    const { month, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let query = `
      SELECT 
        p.*,
        a.apartment_number,
        r.name as renter_name,
        pc.status as verification_status,
        pc.verified_at,
        pc.notes
      FROM payments p
      JOIN apartments a ON p.apartment_id = a.id
      JOIN renters r ON p.renter_id = r.id
      JOIN payment_confirmations pc ON p.id = pc.payment_id
      WHERE pc.status IN ('verified', 'rejected')
    `;
    
    const params: any[] = [];
    
    if (month) {
      query += ' AND DATE_TRUNC(\'month\', p.month) = DATE_TRUNC(\'month\', $1::date)';
      params.push(month);
    }
    
    query += ' ORDER BY pc.verified_at DESC';
    
    // Get total count
    const countResult = await dbQuery(
      query.replace('SELECT p.*, a.apartment_number', 'SELECT COUNT(*) as total'),
      params
    );
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated data
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string), offset);
    
    const result = await dbQuery(query, params);
    
    const verifiedPayments = result.rows.map(row => ({
      id: row.id.toString(),
      renterName: row.renter_name,
      apartment: row.apartment_number,
      type: 'rent',
      amount: parseFloat(row.amount),
      month: new Date(row.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      paymentDate: row.paid_at ? new Date(row.paid_at).toISOString().split('T')[0] : null,
      paymentMethod: row.payment_method || 'cash',
      reference: row.transaction_id || `PAY-${row.id}`,
      status: row.verification_status,
      verifiedAt: row.verified_at,
      notes: row.notes,
      submittedAt: row.paid_at || row.created_at
    }));
    
    res.status(200).json({
      success: true,
      data: {
        payments: verifiedPayments,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
    
  } catch (error) {
    console.error('Get verified payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verified payments'
    });
  }
});

// GET /api/manager/payments/:id - Get specific payment details
router.get('/payments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await dbQuery(`
      SELECT 
        p.*,
        a.apartment_number,
        a.floor,
        a.rent_amount,
        r.name as renter_name,
        r.email as renter_email,
        r.phone as renter_phone,
        pc.status as verification_status,
        pc.verified_at,
        pc.notes as verification_notes
      FROM payments p
      JOIN apartments a ON p.apartment_id = a.id
      JOIN renters r ON p.renter_id = r.id
      LEFT JOIN payment_confirmations pc ON p.id = pc.payment_id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    const payment = result.rows[0];
    const paymentDetails = {
      id: payment.id.toString(),
      renterName: payment.renter_name,
      apartment: payment.apartment_number,
      floor: payment.floor,
      rentAmount: parseFloat(payment.rent_amount),
      type: 'rent',
      amount: parseFloat(payment.amount),
      month: new Date(payment.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      paymentDate: payment.paid_at ? new Date(payment.paid_at).toISOString().split('T')[0] : null,
      paymentMethod: payment.payment_method || 'cash',
      reference: payment.transaction_id || `PAY-${payment.id}`,
      status: payment.verification_status || 'pending_verification',
      verifiedAt: payment.verified_at,
      notes: payment.verification_notes,
      dueDate: payment.due_date,
      paidAt: payment.paid_at,
      createdAt: payment.created_at,
      renterEmail: payment.renter_email,
      renterPhone: payment.renter_phone
    };
    
    res.status(200).json({
      success: true,
      data: {
        payment: paymentDetails
      }
    });
    
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment details'
    });
  }
});

// POST /api/manager/payments/bulk-verify - Bulk verify payments
router.post('/payments/bulk-verify', async (req: Request, res: Response) => {
  try {
    const { paymentIds, status, notes } = req.body;
    
    if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment IDs are required'
      });
    }
    
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "verified" or "rejected"'
      });
    }
    
    const verifiedCounts = { verified: 0, failed: 0 };
    const results = [];
    
    for (const paymentId of paymentIds) {
      try {
        // Check if payment exists and is paid
        const paymentCheck = await dbQuery(
          'SELECT id FROM payments WHERE id = $1 AND status = $2',
          [paymentId, 'paid']
        );
        
        if (paymentCheck.rows.length === 0) {
          results.push({
            paymentId,
            success: false,
            message: 'Payment not found or not paid'
          });
          verifiedCounts.failed++;
          continue;
        }
        
        // Check if verification already exists
        const verificationCheck = await dbQuery(
          'SELECT id FROM payment_confirmations WHERE payment_id = $1',
          [paymentId]
        );
        
        if (verificationCheck.rows.length > 0) {
          // Update existing verification
          await dbQuery(`
            UPDATE payment_confirmations 
            SET status = $1, verified_at = CURRENT_TIMESTAMP, notes = $2 
            WHERE payment_id = $3
          `, [status, notes, paymentId]);
        } else {
          // Create new verification
          await dbQuery(`
            INSERT INTO payment_confirmations (payment_id, manager_id, status, verified_at, notes)
            VALUES ($1, 1, $2, CURRENT_TIMESTAMP, $3)
          `, [paymentId, status, notes]);
        }
        
        results.push({
          paymentId,
          success: true,
          message: `Payment ${status === 'verified' ? 'verified' : 'rejected'} successfully`
        });
        verifiedCounts.verified++;
        
      } catch (error) {
        console.error(`Failed to verify payment ${paymentId}:`, error);
        results.push({
          paymentId,
          success: false,
          message: 'Failed to verify payment'
        });
        verifiedCounts.failed++;
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        message: `Bulk verification completed. ${verifiedCounts.verified} successful, ${verifiedCounts.failed} failed`,
        results,
        summary: verifiedCounts
      }
    });
    
  } catch (error) {
    console.error('Bulk verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk verify payments'
    });
  }
});

export default router;