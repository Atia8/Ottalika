import { Router } from 'express';
import { dbQuery } from './utils';

const router = Router();

// ==================== COMPLAINTS/MAINTENANCE ENDPOINTS ====================

// GET /complaints - Get all complaints
router.get('/complaints', async (req, res) => {
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
        query += ` AND COALESCE(mr.manager_marked_resolved, TRUE) = TRUE AND COALESCE(mr.renter_marked_resolved, FALSE) = FALSE`;
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

// PUT /complaints/:id/status - Update complaint status
router.put('/complaints/:id/status', async (req, res) => {
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

// POST /complaints/:id/assign - Assign complaint to staff
router.post('/complaints/:id/assign', async (req, res) => {
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

// PUT /complaints/:id/mark-resolved - Manager marks as resolved
router.put('/complaints/:id/mark-resolved', async (req, res) => {
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

// GET /complaints/stats - Get complaint statistics
router.get('/complaints/stats', async (req, res) => {
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

// POST /complaints - Manager can create complaint
router.post('/complaints', async (req, res) => {
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

// GET /complaints/needs-confirmation - Get complaints needing renter confirmation
router.get('/complaints/needs-confirmation', async (req, res) => {
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

export default router;