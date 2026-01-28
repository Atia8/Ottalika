// backend/src/routes/managerRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../database/db';

const router = Router();

// Helper function with better error handling
const dbQuery = async (text: string, params?: any[]) => {
  try {
    console.log('📊 Executing query:', text.substring(0, 200), '...');
    const result = await pool.query(text, params);
    console.log('✅ Query successful, rows:', result.rowCount);
    return result;
  } catch (error: any) {
    console.error('❌ Database query error:', error.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
};

// Middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Demo: Set manager ID
  (req as any).managerId = 1;
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
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const pendingPaymentsResult = await dbQuery(
      `SELECT COALESCE(SUM(amount::numeric), 0) as pending_amount 
       FROM payments 
       WHERE status = $1 AND month >= $2`,
      ['pending', currentMonthStart]
    );
    const pendingPayments = parseFloat(pendingPaymentsResult.rows[0].pending_amount) || 0;
    
    // Get total collected this month
    const collectedResult = await dbQuery(
      `SELECT COALESCE(SUM(p.amount::numeric), 0) as collected
       FROM payments p
       LEFT JOIN payment_confirmations pc ON p.id = pc.payment_id
       WHERE p.status = $1 AND p.month >= $2
       AND (pc.status = 'verified' OR pc.status IS NULL)`,
      ['paid', currentMonthStart]
    );
    const monthlyRevenue = parseFloat(collectedResult.rows[0].collected) || 0;
    
    // Calculate occupancy rate
    const occupancyRate = totalApartments > 0 
      ? Math.round((occupiedApartments / totalApartments) * 100)
      : 0;

    // Get total tasks
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
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalRenters: 24,
          pendingApprovals: 5,
          pendingComplaints: 8,
          pendingBills: 3,
          pendingVerifications: 5,
          totalTasks: 38,
          completedTasks: 15,
          monthlyRevenue: 25000,
          occupancyRate: 85
        },
        recentActivities: [],
        quickStats: [],
        taskDistribution: []
      }
    });
  }
});

// ==================== COMPLAINTS/MAINTENANCE ENDPOINTS ====================

// GET /api/manager/complaints - Get all complaints
router.get('/complaints', async (req: Request, res: Response) => {
  try {
    console.log('📡 Fetching complaints from database...');
    
    const { status, priority } = req.query;
    
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
        mr.assigned_to,
        mr.estimated_cost,
        mr.actual_cost,
        mr.completed_at,
        mr.notes,
        COALESCE(mr.manager_marked_resolved, FALSE) as manager_marked_resolved,
        COALESCE(mr.renter_marked_resolved, FALSE) as renter_marked_resolved,
        mr.resolution,
        mr.resolution_notes,
        mr.assigned_at,
        r.id as renter_id,
        r.name as renter_name,
        r.email as renter_email,
        r.phone as renter_phone,
        a.apartment_number,
        a.floor,
        b.name as building_name,
        b.id as building_id
      FROM maintenance_requests mr
      LEFT JOIN renters r ON mr.renter_id = r.id
      LEFT JOIN apartments a ON mr.apartment_id = a.id
      LEFT JOIN buildings b ON a.building_id = b.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;
    
    if (status && status !== 'all') {
      if (status === 'needs_confirmation') {
        query += ` AND COALESCE(mr.manager_marked_resolved, FALSE) = TRUE AND COALESCE(mr.renter_marked_resolved, FALSE) = FALSE`;
      } else {
        paramCount++;
        params.push(status);
        query += ` AND mr.status = $${paramCount}`;
      }
    }
    
    if (priority && priority !== 'all') {
      paramCount++;
      params.push(priority);
      query += ` AND mr.priority = $${paramCount}`;
    }
    
    query += ' ORDER BY mr.created_at DESC';
    
    console.log('📊 Executing complaints query...');
    const result = await dbQuery(query, params);
    
    console.log(`✅ Found ${result.rows.length} complaints`);
    
    const complaints = result.rows.map(row => ({
      id: row.id.toString(),
      renterName: row.renter_name || 'Unknown Renter',
      apartment: row.apartment_number || 'Unknown',
      type: row.type || row.category || 'general',
      title: row.title || 'Maintenance Request',
      description: row.description || 'No description provided',
      status: row.status || 'pending',
      priority: (row.priority || 'medium'),
      createdAt: new Date(row.created_at).toISOString().split('T')[0],
      updatedAt: new Date(row.updated_at).toISOString().split('T')[0],
      assignedTo: row.assigned_to,
      renterPhone: row.renter_phone,
      renterEmail: row.renter_email,
      notes: row.notes,
      floor: row.floor,
      building_name: row.building_name,
      manager_marked_resolved: row.manager_marked_resolved || false,
      renter_marked_resolved: row.renter_marked_resolved || false,
      resolution: row.resolution,
      resolution_notes: row.resolution_notes,
      needs_renter_confirmation: (row.manager_marked_resolved && !row.renter_marked_resolved) || false
    }));
    
    res.status(200).json({
      success: true,
      data: {
        complaints: complaints,
        total: result.rowCount
      }
    });
    
  } catch (error: any) {
    console.error('❌ Get complaints error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints',
      error: error.message
    });
  }
});

// PUT /api/manager/complaints/:id/status - Update complaint status
router.put('/complaints/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, resolution, resolutionNotes } = req.body;
    
    console.log(`📝 Updating complaint ${id} to status: ${status}`);
    
    // Check if complaint exists
    const checkResult = await dbQuery(
      'SELECT id, status FROM maintenance_requests WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      console.log(`❌ Complaint ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    // Build update query
    let updateQuery = `
      UPDATE maintenance_requests 
      SET 
        status = $1,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    const params: any[] = [status];
    
    // Add resolution fields if provided
    if (resolution !== undefined) {
      updateQuery += `, resolution = $${params.length + 1}`;
      params.push(resolution);
    }
    
    if (resolutionNotes !== undefined) {
      updateQuery += `, resolution_notes = $${params.length + 1}`;
      params.push(resolutionNotes);
    }
    
    // Handle status-specific updates
    if (status === 'in_progress') {
      updateQuery += `, assigned_at = CURRENT_TIMESTAMP`;
    }
    
    if (status === 'completed' || status === 'resolved') {
      updateQuery += `, 
        manager_marked_resolved = TRUE,
        completed_at = CURRENT_TIMESTAMP`;
    }
    
    updateQuery += ` WHERE id = $${params.length + 1} RETURNING *`;
    params.push(id);
    
    console.log('📊 Executing update query...');
    const result = await dbQuery(updateQuery, params);
    
    console.log(`✅ Complaint ${id} updated successfully`);
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Complaint status updated successfully',
        complaint: result.rows[0]
      }
    });
    
  } catch (error: any) {
    console.error('❌ Update complaint status error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint status'
    });
  }
});

// POST /api/manager/complaints/:id/assign - Assign complaint to staff
router.post('/complaints/:id/assign', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;
    
    if (!assigned_to) {
      return res.status(400).json({
        success: false,
        message: 'Assignee name is required'
      });
    }
    
    console.log(`👤 Assigning complaint ${id} to ${assigned_to}`);
    
    const result = await dbQuery(`
      UPDATE maintenance_requests 
      SET 
        assigned_to = $1,
        status = 'in_progress',
        assigned_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, title, assigned_to, status
    `, [assigned_to, id]);
    
    console.log(`✅ Complaint ${id} assigned successfully`);
    
    res.status(200).json({
      success: true,
      data: {
        message: `Complaint assigned to ${assigned_to}`,
        complaint: result.rows[0]
      }
    });
    
  } catch (error: any) {
    console.error('❌ Assign complaint error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to assign complaint'
    });
  }
});

// PUT /api/manager/complaints/:id/mark-resolved - Manager marks as resolved
router.put('/complaints/:id/mark-resolved', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution, resolution_notes } = req.body;

    console.log(`✅ Manager marking complaint ${id} as resolved`);

    // Validate required fields
    if (!resolution || resolution.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Resolution details are required'
      });
    }

    // Check if complaint exists
    const checkResult = await dbQuery(
      'SELECT id, status FROM maintenance_requests WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      console.log(`❌ Complaint ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Update complaint: manager marks as resolved
    const result = await dbQuery(`
      UPDATE maintenance_requests 
      SET 
        status = 'completed',
        manager_marked_resolved = TRUE,
        resolution = $1,
        resolution_notes = $2,
        completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [resolution, resolution_notes || '', id]);

    console.log(`✅ Complaint ${id} marked as resolved by manager`);

    res.status(200).json({
      success: true,
      data: {
        message: 'Complaint marked as resolved. Waiting for renter confirmation.',
        complaint: result.rows[0]
      }
    });

  } catch (error: any) {
    console.error('❌ Mark resolved error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark complaint as resolved',
      error: error.message
    });
  }
});

// GET /api/manager/complaints/stats - Get complaint statistics
router.get('/complaints/stats', async (req: Request, res: Response) => {
  try {
    const result = await dbQuery(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status IN ('completed', 'resolved') THEN 1 END) as resolved,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high,
        COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium,
        COUNT(CASE WHEN priority = 'low' THEN 1 END) as low,
        ROUND(AVG(
          EXTRACT(EPOCH FROM (COALESCE(completed_at, CURRENT_TIMESTAMP) - created_at)) / 86400
        ), 1) as avg_resolution_days
      FROM maintenance_requests
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);
    
    res.status(200).json({
      success: true,
      data: {
        stats: result.rows[0]
      }
    });
    
  } catch (error: any) {
    console.error('❌ Get complaint stats error:', error.message);
    
    // Fallback stats
    res.status(200).json({
      success: true,
      data: {
        stats: {
          total: 8,
          pending: 2,
          in_progress: 3,
          resolved: 3,
          urgent: 1,
          high: 2,
          medium: 4,
          low: 1,
          avg_resolution_days: 3.5
        }
      }
    });
  }
});

// POST /api/manager/complaints - Manager can create complaint
router.post('/complaints', async (req: Request, res: Response) => {
  try {
    const {
      apartment_id,
      renter_id,
      title,
      description,
      category,
      priority = 'medium',
      assigned_to
    } = req.body;

    console.log('📝 Creating new complaint as manager');

    const result = await dbQuery(`
      INSERT INTO maintenance_requests (
        apartment_id,
        renter_id,
        title,
        description,
        category,
        priority,
        status,
        assigned_to,
        manager_marked_resolved,
        renter_marked_resolved,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [apartment_id, renter_id, title, description, category, priority, assigned_to]);

    res.status(201).json({
      success: true,
      data: {
        complaint: result.rows[0],
        message: 'Complaint created successfully'
      }
    });

  } catch (error: any) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create complaint',
      error: error.message
    });
  }
});

// GET /api/manager/complaints/needs-confirmation - Get complaints needing renter confirmation
router.get('/complaints/needs-confirmation', async (req: Request, res: Response) => {
  try {
    const result = await dbQuery(`
      SELECT 
        mr.*,
        r.name as renter_name,
        r.email as renter_email,
        r.phone as renter_phone,
        a.apartment_number,
        a.floor,
        b.name as building_name
      FROM maintenance_requests mr
      JOIN renters r ON mr.renter_id = r.id
      JOIN apartments a ON mr.apartment_id = a.id
      JOIN buildings b ON a.building_id = b.id
      WHERE COALESCE(mr.manager_marked_resolved, FALSE) = TRUE 
        AND COALESCE(mr.renter_marked_resolved, FALSE) = FALSE
        AND mr.status = 'completed'
      ORDER BY mr.completed_at DESC
    `);

    res.status(200).json({
      success: true,
      data: {
        complaints: result.rows,
        count: result.rowCount
      }
    });

  } catch (error: any) {
    console.error('Get needs confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get complaints needing confirmation',
      error: error.message
    });
  }
});

// ==================== PAYMENTS ENDPOINTS ====================

// GET /api/manager/payments - Get rent payments
router.get('/payments', async (req: Request, res: Response) => {
  try {
    const { month, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
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
        pc.notes as verification_notes
      FROM payments p
      LEFT JOIN apartments a ON p.apartment_id = a.id
      LEFT JOIN renters r ON p.renter_id = r.id
      LEFT JOIN buildings b ON a.building_id = b.id
      LEFT JOIN payment_confirmations pc ON p.id = pc.payment_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;
    
    if (month) {
      paramCount++;
      params.push(month);
      query += ` AND DATE_TRUNC('month', p.month) = DATE_TRUNC('month', $${paramCount}::date)`;
    }
    
    if (status && status !== 'all') {
      paramCount++;
      params.push(status);
      query += ` AND p.status = $${paramCount}`;
    }
    
    // Get total count
    const countQuery = query.replace(
      'SELECT p.*, a.apartment_number, a.floor, r.name as renter_name, r.email as renter_email, r.phone as renter_phone, b.name as building_name, pc.status as confirmation_status, pc.verified_at, pc.notes as verification_notes',
      'SELECT COUNT(*) as total'
    );
    console.log('📊 Getting payment count...');
    const countResult = await dbQuery(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated data
    query += ` ORDER BY p.due_date DESC, a.apartment_number 
               LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string), offset);
    
    console.log('📊 Getting paginated payments...');
    const result = await dbQuery(query, params);
    console.log(`✅ Found ${result.rows.length} payments`);
    
    // Calculate summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) as total_overdue
      FROM payments
      ${month ? 'WHERE DATE_TRUNC(\'month\', month) = DATE_TRUNC(\'month\', $1::date)' : ''}
    `;
    
    const summaryResult = await dbQuery(summaryQuery, month ? [month] : []);
    
    res.status(200).json({
      success: true,
      data: {
        payments: result.rows,
        summary: summaryResult.rows[0],
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
      message: 'Failed to get payments'
    });
  }
});

// GET /api/manager/payments/months - Get available months
router.get('/payments/months', async (req: Request, res: Response) => {
  try {
    console.log('📅 Fetching payment months...');
    
    const query = `
      SELECT DISTINCT 
        DATE_TRUNC('month', month) as month_date,
        EXTRACT(YEAR FROM month) as year,
        EXTRACT(MONTH FROM month) as month_num
      FROM payments 
      ORDER BY month_date DESC
      LIMIT 12;
    `;
    
    const result = await dbQuery(query);
    console.log(`✅ Found ${result.rows.length} months`);
    
    // Format the results properly
    const months = result.rows.map(row => {
      const monthDate = row.month_date;
      const displayMonth = new Date(monthDate).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      // Create proper YYYY-MM-01 format for value
      const year = row.year;
      const monthNum = String(row.month_num).padStart(2, '0');
      const value = `${year}-${monthNum}-01`;
      
      return { display_month: displayMonth, value };
    });
    
    // If no payments yet, return current and previous months
    if (months.length === 0) {
      const currentDate = new Date();
      const fallbackMonths = [];
      
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - i);
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        fallbackMonths.push({
          display_month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          value: `${year}-${month}-01`
        });
      }
      
      console.log('📅 Using fallback months:', fallbackMonths);
      return res.json({
        success: true,
        months: fallbackMonths
      });
    }
    
    console.log('✅ Sending months:', months);
    res.json({
      success: true,
      months
    });
    
  } catch (error: any) {
    console.error('💥 Error in /payments/months:', error.message);
    
    // Provide fallback response
    const currentDate = new Date();
    const fallbackMonths = [];
    
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      
      fallbackMonths.push({
        display_month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        value: `${year}-${month}-01`
      });
    }
    
    res.status(200).json({
      success: true,
      months: fallbackMonths,
      note: 'Using fallback data due to error'
    });
  }
});

// POST /api/manager/payments/generate-monthly - Generate monthly rent bills
router.post('/payments/generate-monthly', async (req: Request, res: Response) => {
  try {
    const { month } = req.body;
    
    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'Month is required'
      });
    }
    
    console.log(`💰 Generating rent bills for month: ${month}`);
    
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
    `, [month]);
    
    console.log(`✅ Generated ${result.rowCount} monthly rent bills`);
    
    res.status(200).json({
      success: true,
      data: {
        message: `Generated ${result.rowCount} monthly rent bills`,
        bills: result.rows
      }
    });
    
  } catch (error: any) {
    console.error('❌ Generate bills error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly bills'
    });
  }
});

// POST /api/manager/bills/generate-monthly - Generate monthly rent bills (alternative endpoint)
router.post('/bills/generate-monthly', async (req: Request, res: Response) => {
  try {
    // Get next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    const monthStr = nextMonth.toISOString().slice(0, 7) + '-01';
    
    console.log(`💰 Generating rent bills for next month: ${monthStr}`);
    
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
    
    console.log(`✅ Generated ${result.rowCount} monthly rent bills`);
    
    res.status(200).json({
      success: true,
      data: {
        message: `Generated ${result.rowCount} monthly rent bills`,
        bills: result.rows
      }
    });
    
  } catch (error: any) {
    console.error('❌ Generate bills error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly bills'
    });
  }
});

// ==================== PAYMENT VERIFICATION ENDPOINTS ====================

// GET /api/manager/payments/pending - Get payments pending verification
router.get('/payments/pending', async (req: Request, res: Response) => {
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

// POST /api/manager/payments/:id/verify - Verify or reject payment
router.post('/payments/:id/verify', async (req: Request, res: Response) => {
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
    
    // Check if payment exists and is paid
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

// ==================== RENTER MANAGEMENT ENDPOINTS ====================

// GET /api/manager/renters - Get all renters
router.get('/renters', async (req: Request, res: Response) => {
  try {
    console.log('📡 Fetching renters...');
    
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
    
    console.log(`✅ Found ${result.rows.length} renters`);
    
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
    
  } catch (error: any) {
    console.error('❌ Get renters error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get renters'
    });
  }
});

// ==================== SIMPLIFIED GET BILLS ENDPOINT ====================
router.get('/bills', async (req: Request, res: Response) => {
  try {
    console.log('📡 Fetching all bills...');
    
    // Get rent bills
    const rentBillsResult = await dbQuery(`
      SELECT 
        p.*,
        a.apartment_number,
        r.name as renter_name,
        b.name as building_name,
        'rent' as bill_type
      FROM payments p
      LEFT JOIN apartments a ON p.apartment_id = a.id
      LEFT JOIN renters r ON p.renter_id = r.id
      LEFT JOIN buildings b ON a.building_id = b.id
      WHERE p.status = 'pending'
      ORDER BY p.due_date ASC
      LIMIT 20
    `);
    
    console.log(`✅ Found ${rentBillsResult.rows.length} rent bills`);
    
    const allBills = rentBillsResult.rows.map((bill: any) => ({ ...bill, bill_type: 'rent' }));
    
    const summary = {
      totalPending: allBills
        .filter((b: any) => b.status === 'pending')
        .reduce((sum: number, b: any) => sum + parseFloat(b.amount || 0), 0),
      totalPaid: allBills
        .filter((b: any) => b.status === 'paid')
        .reduce((sum: number, b: any) => sum + parseFloat(b.amount || 0), 0),
      overdueBills: allBills.filter((b: any) => b.status === 'overdue').length,
      nextDueDate: allBills.length > 0 
        ? allBills.reduce((min: any, b: any) => 
            b.status === 'pending' && new Date(b.due_date) < new Date(min.due_date) ? b : min, 
            allBills[0]
          ).due_date
        : null
    };

    res.status(200).json({
      success: true,
      data: {
        bills: allBills,
        summary
      }
    });
    
  } catch (error: any) {
    console.error('❌ Bills error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get bills'
    });
  }
});

// ==================== MARK BILL AS PAID ====================
router.post('/bills/:id/pay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod, transactionId } = req.body;
    
    console.log(`💰 Marking bill ${id} as paid with method: ${paymentMethod}`);
    
    // Update payment status
    const paymentResult = await dbQuery(`
      UPDATE payments 
      SET 
        status = 'paid',
        payment_method = $1,
        transaction_id = $2,
        paid_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, amount, apartment_id, renter_id
    `, [paymentMethod, transactionId, id]);
    
    if (paymentResult.rows.length === 0) {
      console.log(`❌ Payment ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Create payment confirmation
    await dbQuery(`
      INSERT INTO payment_confirmations (payment_id, manager_id, status, verified_at)
      VALUES ($1, 1, 'verified', CURRENT_TIMESTAMP)
      ON CONFLICT (payment_id) DO UPDATE 
      SET status = 'verified', verified_at = CURRENT_TIMESTAMP
    `, [id]);
    
    console.log(`✅ Payment ${id} marked as paid and verified`);
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Bill marked as paid and verified',
        paymentId: id
      }
    });
    
  } catch (error: any) {
    console.error('❌ Mark bill as paid error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update bill status'
    });
  }
});

// ==================== CREATE ANALYTICS SUB-ROUTER ====================
const analyticsRouter = Router();

// Payment patterns analytics
analyticsRouter.get('/payment-patterns', async (req: Request, res: Response) => {
  try {
    const { year, pattern } = req.query;
    
    const query = `
      SELECT 
        renter_id,
        renter_name,
        apartment_number,
        total_payments,
        late_payments,
        on_time_payments,
        late_payment_percentage,
        CASE 
          WHEN late_payment_percentage > 50 THEN 'High Risk'
          WHEN late_payment_percentage > 20 THEN 'Medium Risk'
          ELSE 'Low Risk'
        END as risk_category
      FROM find_payment_pattern_renters($1)
      ORDER BY late_payment_percentage DESC
      LIMIT 50;
    `;
    
    const result = await dbQuery(query, [pattern || 'late']);
    
    res.status(200).json({
      success: true,
      data: {
        patterns: result.rows,
        summary: {
          total: result.rowCount,
          highRisk: result.rows.filter((r: any) => r.risk_category === 'High Risk').length,
          averageLatePercentage: result.rows.length > 0 
            ? (result.rows.reduce((sum: number, r: any) => sum + parseFloat(r.late_payment_percentage), 0) / result.rows.length).toFixed(2)
            : 0
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Payment patterns error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze payment patterns'
    });
  }
});

// Mount analytics router
router.use('/analytics', analyticsRouter);

// ==================== EXPORT ROUTER ====================
export default router;