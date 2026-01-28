// backend/src/routes/renterRoutes.ts
import { Router, Request, Response } from 'express';
import { pool } from '../database/db';

const router = Router();

// Helper function
const dbQuery = async (text: string, params?: any[]) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Mock authentication middleware (replace with real auth)
const authenticateRenter = async (req: Request, res: Response, next: Function) => {
  try {
    // For demo purposes, we'll extract renter ID from auth token
    // In production, use JWT verification
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // For demo, use user ID 3 (demo renter) or extract from token
    (req as any).renterId = 6; // Demo renter ID (the last one from your seed data)
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

router.use(authenticateRenter);

// GET /api/renter/dashboard - Get renter dashboard data
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    
    // Get renter profile with apartment info
    const profileResult = await dbQuery(`
      SELECT 
        r.*,
        a.apartment_number,
        a.floor,
        a.rent_amount,
        a.lease_start,
        a.lease_end,
        a.amenities,
        b.name as building_name
      FROM renters r
      LEFT JOIN apartments a ON r.id = a.current_renter_id
      LEFT JOIN buildings b ON a.building_id = b.id
      WHERE r.id = $1
    `, [renterId]);
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Renter not found'
      });
    }
    
    const profile = profileResult.rows[0];
    
    // Get current month payment status
    const paymentResult = await dbQuery(`
      SELECT status, paid_at 
      FROM payments 
      WHERE renter_id = $1 
        AND DATE_TRUNC('month', month) = DATE_TRUNC('month', CURRENT_DATE)
      LIMIT 1
    `, [renterId]);
    
    // Get pending complaints count
    const complaintsResult = await dbQuery(`
      SELECT COUNT(*) as pending_count
      FROM maintenance_requests 
      WHERE renter_id = $1 
        AND status IN ('pending', 'in_progress')
    `, [renterId]);
    
    // Get unread messages count (mock for now)
    const unreadCount = 0;
    
    // Get next due date
    const nextPaymentResult = await dbQuery(`
      SELECT due_date, amount
      FROM payments 
      WHERE renter_id = $1 
        AND status = 'pending'
        AND due_date >= CURRENT_DATE
      ORDER BY due_date ASC
      LIMIT 1
    `, [renterId]);
    
    // Get recent payments (last 3)
    const recentPaymentsResult = await dbQuery(`
      SELECT id, month, amount, status, due_date, paid_at, payment_method
      FROM payments 
      WHERE renter_id = $1 
      ORDER BY month DESC 
      LIMIT 3
    `, [renterId]);
    
    // Get recent complaints (last 3)
    const recentComplaintsResult = await dbQuery(`
      SELECT id, title, status, priority, created_at
      FROM maintenance_requests 
      WHERE renter_id = $1 
      ORDER BY created_at DESC 
      LIMIT 3
    `, [renterId]);
    
    res.status(200).json({
      success: true,
      data: {
        profile: {
          ...profile,
          payment_status: paymentResult.rows[0]?.status || 'pending',
          next_due_date: nextPaymentResult.rows[0]?.due_date || null,
          next_payment_amount: nextPaymentResult.rows[0]?.amount || profile.rent_amount,
          pending_complaints: parseInt(complaintsResult.rows[0]?.pending_count) || 0,
          unread_messages: unreadCount
        },
        stats: {
          current_rent: profile.rent_amount || 0,
          payment_status: paymentResult.rows[0]?.status || 'pending',
          pending_complaints: parseInt(complaintsResult.rows[0]?.pending_count) || 0,
          unread_messages: unreadCount
        },
        recent_payments: recentPaymentsResult.rows,
        recent_complaints: recentComplaintsResult.rows
      }
    });
    
  } catch (error) {
    console.error('Get renter dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
});

// GET /api/renter/profile - Get renter profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    
    const result = await dbQuery(`
      SELECT 
        r.*,
        a.apartment_number,
        a.floor,
        a.rent_amount,
        a.lease_start,
        a.lease_end,
        a.amenities,
        b.name as building_name,
        b.address as building_address,
        (
          SELECT status 
          FROM payments p 
          WHERE p.renter_id = r.id 
            AND DATE_TRUNC('month', p.month) = DATE_TRUNC('month', CURRENT_DATE)
          LIMIT 1
        ) as payment_status,
        (
          SELECT COUNT(*) 
          FROM maintenance_requests mr 
          WHERE mr.renter_id = r.id 
            AND mr.status IN ('pending', 'in_progress')
        ) as pending_complaints
      FROM renters r
      LEFT JOIN apartments a ON r.id = a.current_renter_id
      LEFT JOIN buildings b ON a.building_id = b.id
      WHERE r.id = $1
    `, [renterId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Renter not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get renter profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// PUT /api/renter/profile - Update renter profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const { name, phone, emergency_contact, occupation } = req.body;
    
    await dbQuery(`
      UPDATE renters 
      SET 
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        emergency_contact = COALESCE($3, emergency_contact),
        occupation = COALESCE($4, occupation),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [name, phone, emergency_contact, occupation, renterId]);
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Profile updated successfully'
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// GET /api/renter/payments - Get renter payments
router.get('/payments', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const { status, limit = 20 } = req.query;
    
    let query = `
      SELECT 
        p.*,
        a.apartment_number,
        pc.status as verification_status,
        pc.verified_at,
        pc.notes as verification_notes
      FROM payments p
      JOIN apartments a ON p.apartment_id = a.id
      LEFT JOIN payment_confirmations pc ON p.id = pc.payment_id
      WHERE p.renter_id = $1
    `;
    
    const params: any[] = [renterId];
    
    if (status && status !== 'all') {
      query += ' AND p.status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY p.month DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit as string));
    
    const result = await dbQuery(query, params);
    
    // Get payment stats
    const statsResult = await dbQuery(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) as total_overdue
      FROM payments 
      WHERE renter_id = $1
    `, [renterId]);
    
    res.status(200).json({
      success: true,
      data: {
        payments: result.rows,
        stats: statsResult.rows[0],
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

// GET /api/renter/payments/recent - Get recent payments
router.get('/payments/recent', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const limit = req.query.limit || 5;
    
    const result = await dbQuery(`
      SELECT 
        id, 
        month, 
        amount, 
        status, 
        due_date,
        paid_at,
        payment_method
      FROM payments 
      WHERE renter_id = $1
      ORDER BY month DESC 
      LIMIT $2
    `, [renterId, parseInt(limit as string)]);
    
    res.status(200).json({
      success: true,
      data: {
        payments: result.rows
      }
    });
    
  } catch (error) {
    console.error('Get recent payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent payments'
    });
  }
});

// POST /api/renter/payments/make - Make a payment
router.post('/payments/make', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const { month, amount, payment_method, transaction_id } = req.body;
    
    // Validate required fields
    if (!month || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Month, amount, and payment method are required'
      });
    }
    
    // Get apartment ID
    const apartmentResult = await dbQuery(
      'SELECT id, rent_amount FROM apartments WHERE current_renter_id = $1',
      [renterId]
    );
    
    if (apartmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Apartment not found for this renter'
      });
    }
    
    const apartmentId = apartmentResult.rows[0].id;
    const rentAmount = apartmentResult.rows[0].rent_amount;
    
    // Validate amount matches rent
    if (parseFloat(amount) < parseFloat(rentAmount)) {
      return res.status(400).json({
        success: false,
        message: `Payment amount must be at least ${rentAmount}`
      });
    }
    
    const dueDate = new Date(month);
    dueDate.setDate(dueDate.getDate() + 5);
    
    // Check if payment already exists for this month
    const existingPayment = await dbQuery(`
      SELECT id FROM payments 
      WHERE renter_id = $1 
        AND DATE_TRUNC('month', month) = DATE_TRUNC('month', $2::date)
    `, [renterId, month]);
    
    if (existingPayment.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment already exists for this month'
      });
    }
    
    // Create payment record
    const result = await dbQuery(`
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
      ) VALUES ($1, $2, $3, $4, $5, 'paid', $6, $7, CURRENT_TIMESTAMP)
      RETURNING id, amount, month, status
    `, [apartmentId, renterId, amount, month, dueDate, payment_method, transaction_id]);
    
    // Create payment confirmation
    await dbQuery(`
      INSERT INTO payment_confirmations (payment_id, status)
      VALUES ($1, 'pending_review')
    `, [result.rows[0].id]);
    
    res.status(201).json({
      success: true,
      data: {
        message: 'Payment submitted successfully',
        payment: result.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Make payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to make payment'
    });
  }
});

// GET /api/renter/complaints - Get renter complaints
router.get('/complaints', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const { status } = req.query;
    
    let query = `
      SELECT 
        mr.*,
        a.apartment_number,
        a.floor,
        b.name as building_name,
        COALESCE(mr.manager_marked_resolved, FALSE) as manager_marked_resolved,
        COALESCE(mr.renter_marked_resolved, FALSE) as renter_marked_resolved
      FROM maintenance_requests mr
      JOIN apartments a ON mr.apartment_id = a.id
      LEFT JOIN buildings b ON a.building_id = b.id
      WHERE mr.renter_id = $1
    `;
    
    const params: any[] = [renterId];
    
    if (status && status !== 'all') {
      query += ' AND mr.status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY mr.created_at DESC';
    
    const result = await dbQuery(query, params);
    
    // Get complaint stats
    const statsResult = await dbQuery(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status IN ('completed', 'resolved') THEN 1 END) as resolved_count,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_count,
        COUNT(CASE WHEN COALESCE(manager_marked_resolved, FALSE) = TRUE 
          AND COALESCE(renter_marked_resolved, FALSE) = FALSE THEN 1 END) as needs_confirmation
      FROM maintenance_requests 
      WHERE renter_id = $1
    `, [renterId]);
    
    res.status(200).json({
      success: true,
      data: {
        complaints: result.rows,
        stats: statsResult.rows[0],
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

// GET /api/renter/complaints/recent - Get recent complaints
router.get('/complaints/recent', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const limit = req.query.limit || 5;
    
    const result = await dbQuery(`
      SELECT 
        id, 
        title, 
        status, 
        priority, 
        created_at,
        COALESCE(manager_marked_resolved, FALSE) as manager_marked_resolved,
        COALESCE(renter_marked_resolved, FALSE) as renter_marked_resolved
      FROM maintenance_requests 
      WHERE renter_id = $1
      ORDER BY created_at DESC 
      LIMIT $2
    `, [renterId, parseInt(limit as string)]);
    
    res.status(200).json({
      success: true,
      data: {
        complaints: result.rows
      }
    });
    
  } catch (error) {
    console.error('Get recent complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent complaints'
    });
  }
});

// POST /api/renter/complaints - Create complaint
router.post('/complaints', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const { title, category, priority, description } = req.body;
    
    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }
    
    // Get apartment ID
    const apartmentResult = await dbQuery(
      'SELECT id FROM apartments WHERE current_renter_id = $1',
      [renterId]
    );
    
    if (apartmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Apartment not found for this renter'
      });
    }
    
    const apartmentId = apartmentResult.rows[0].id;
    
    const result = await dbQuery(`
      INSERT INTO maintenance_requests (
        apartment_id,
        renter_id,
        title,
        category,
        priority,
        description,
        status,
        type,
        manager_marked_resolved,
        renter_marked_resolved
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $4, FALSE, FALSE)
      RETURNING id, title, priority, status, created_at
    `, [apartmentId, renterId, title, category || 'general', priority || 'medium', description]);
    
    res.status(201).json({
      success: true,
      data: {
        message: 'Complaint submitted successfully',
        complaint: result.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit complaint'
    });
  }
});

// PUT /api/renter/complaints/:id/escalate - Escalate complaint
router.put('/complaints/:id/escalate', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const complaintId = parseInt(req.params.id);
    
    // Check if complaint belongs to renter
    const checkResult = await dbQuery(
      'SELECT id, priority FROM maintenance_requests WHERE id = $1 AND renter_id = $2',
      [complaintId, renterId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or access denied'
      });
    }
    
    // Update priority to higher level
    const currentPriority = checkResult.rows[0].priority;
    let newPriority = 'high';
    
    if (currentPriority === 'high') {
      newPriority = 'urgent';
    } else if (currentPriority === 'medium') {
      newPriority = 'high';
    } else if (currentPriority === 'low') {
      newPriority = 'medium';
    }
    
    await dbQuery(`
      UPDATE maintenance_requests 
      SET 
        priority = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [newPriority, complaintId]);
    
    res.status(200).json({
      success: true,
      data: {
        message: `Complaint escalated to ${newPriority} priority`
      }
    });
    
  } catch (error) {
    console.error('Escalate complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to escalate complaint'
    });
  }
});

// PUT /api/renter/complaints/:id/confirm-resolve - Renter confirms resolution
router.put('/complaints/:id/confirm-resolve', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const complaintId = parseInt(req.params.id);
    
    console.log(`✅ Renter ${renterId} confirming resolution for complaint ${complaintId}`);
    
    // Check if complaint exists and belongs to renter
    const checkResult = await dbQuery(`
      SELECT 
        id, 
        COALESCE(manager_marked_resolved, FALSE) as manager_marked_resolved, 
        COALESCE(renter_marked_resolved, FALSE) as renter_marked_resolved, 
        status
      FROM maintenance_requests 
      WHERE id = $1 AND renter_id = $2
    `, [complaintId, renterId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or access denied'
      });
    }
    
    const complaint = checkResult.rows[0];
    
    // Check if manager has marked as resolved
    if (!complaint.manager_marked_resolved) {
      return res.status(400).json({
        success: false,
        message: 'Manager has not marked this complaint as resolved yet'
      });
    }
    
    // Check if already confirmed by renter
    if (complaint.renter_marked_resolved) {
      return res.status(400).json({
        success: false,
        message: 'You have already confirmed this resolution'
      });
    }
    
    // Update complaint: renter confirms resolution
    const updateResult = await dbQuery(`
      UPDATE maintenance_requests 
      SET 
        renter_marked_resolved = TRUE,
        status = 'resolved',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [complaintId]);
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Resolution confirmed! Complaint is now fully resolved.',
        complaint: updateResult.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Confirm resolution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm resolution'
    });
  }
});

// DELETE /api/renter/complaints/:id - Delete complaint
router.delete('/complaints/:id', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const complaintId = parseInt(req.params.id);
    
    // Check if complaint belongs to renter
    const checkResult = await dbQuery(
      'SELECT id FROM maintenance_requests WHERE id = $1 AND renter_id = $2',
      [complaintId, renterId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or access denied'
      });
    }
    
    // Delete only if status is pending
    const statusResult = await dbQuery(
      'SELECT status FROM maintenance_requests WHERE id = $1',
      [complaintId]
    );
    
    if (statusResult.rows[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending complaints can be deleted'
      });
    }
    
    await dbQuery('DELETE FROM maintenance_requests WHERE id = $1', [complaintId]);
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Complaint deleted successfully'
      }
    });
    
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete complaint'
    });
  }
});

// GET /api/renter/contacts - Get contacts (managers, owners)
router.get('/contacts', async (req: Request, res: Response) => {
  try {
    // Get building managers and owners
    const result = await dbQuery(`
      SELECT 
        m.id,
        m.name,
        'manager' as role,
        m.designation,
        NULL as avatar,
        'Available during office hours' as last_message,
        CURRENT_TIMESTAMP - INTERVAL '2 hours' as last_message_time,
        0 as unread_count
      FROM managers m
      WHERE m.id IS NOT NULL
      
      UNION ALL
      
      SELECT 
        o.id,
        o.name,
        'owner' as role,
        'Building Owner' as designation,
        NULL as avatar,
        'Contact for urgent matters' as last_message,
        CURRENT_TIMESTAMP - INTERVAL '1 day' as last_message_time,
        0 as unread_count
      FROM owners o
      WHERE o.id IS NOT NULL
      
      ORDER BY role, name
    `);
    
    res.status(200).json({
      success: true,
      data: {
        contacts: result.rows
      }
    });
    
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contacts'
    });
  }
});

// GET /api/renter/messages - Get messages (mock data)
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    
    // Mock messages - in production, implement actual messaging system
    const mockMessages = [
      {
        id: 1,
        sender: 'Building Manager',
        sender_type: 'manager',
        subject: 'Monthly Maintenance Notice',
        content: 'Monthly building maintenance is scheduled for next Monday, January 15th, from 10 AM to 2 PM. Please ensure your apartment is accessible if maintenance is needed.',
        is_read: false,
        is_important: true,
        created_at: new Date().toISOString(),
        attachments: [
          { id: 1, name: 'maintenance-schedule.pdf', type: 'pdf', size: '2.4 MB', url: '#' }
        ]
      },
      {
        id: 2,
        sender: 'System',
        sender_type: 'system',
        subject: 'Payment Received - Confirmation',
        content: 'Your rent payment for January 2025 has been received and is pending verification. Thank you for your timely payment.',
        is_read: true,
        is_important: false,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        attachments: []
      },
      {
        id: 3,
        sender: 'Owner',
        sender_type: 'owner',
        subject: 'Building Renovation Update',
        content: 'The lobby renovation is complete. New furniture and lighting have been installed. We appreciate your patience during the renovation period.',
        is_read: true,
        is_important: true,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        attachments: [
          { id: 2, name: 'lobby-photos.zip', type: 'zip', size: '5.8 MB', url: '#' }
        ]
      },
      {
        id: 4,
        sender: 'System',
        sender_type: 'system',
        subject: 'Complaint Status Update',
        content: 'Your maintenance complaint #MR-001 has been assigned to our technical team. Estimated resolution time: 2-3 business days.',
        is_read: false,
        is_important: false,
        created_at: new Date(Date.now() - 259200000).toISOString(),
        attachments: []
      }
    ];
    
    res.status(200).json({
      success: true,
      data: {
        messages: mockMessages,
        total: mockMessages.length,
        unread_count: mockMessages.filter(m => !m.is_read).length
      }
    });
    
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
});

// POST /api/renter/messages/send - Send message
router.post('/messages/send', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const { to, subject, content } = req.body;
    
    // Validate required fields
    if (!to || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, subject, and content are required'
      });
    }
    
    // In production, insert into messages table
    // For now, return success
    res.status(201).json({
      success: true,
      data: {
        message: 'Message sent successfully',
        message_id: Date.now()
      }
    });
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// PUT /api/renter/messages/:id/read - Mark message as read
router.put('/messages/:id/read', async (req: Request, res: Response) => {
  try {
    // In production, update message read status
    // For now, return success
    res.status(200).json({
      success: true,
      data: {
        message: 'Message marked as read'
      }
    });
    
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message status'
    });
  }
});

// PUT /api/renter/messages/:id/important - Toggle important status
router.put('/messages/:id/important', async (req: Request, res: Response) => {
  try {
    const { important } = req.body;
    
    // In production, update message important status
    // For now, return success
    res.status(200).json({
      success: true,
      data: {
        message: `Message ${important ? 'marked as' : 'removed from'} important`
      }
    });
    
  } catch (error) {
    console.error('Toggle important error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message status'
    });
  }
});

// DELETE /api/renter/messages/:id - Delete message
router.delete('/messages/:id', async (req: Request, res: Response) => {
  try {
    // In production, delete message from database
    // For now, return success
    res.status(200).json({
      success: true,
      data: {
        message: 'Message deleted successfully'
      }
    });
    
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

// GET /api/renter/documents - Get available documents
router.get('/documents', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    
    // Mock documents - in production, fetch from documents table
    const mockDocuments = [
      {
        id: 1,
        name: 'Lease Agreement',
        type: 'pdf',
        size: '2.5 MB',
        uploaded_at: '2024-01-15',
        status: 'verified',
        download_url: '#'
      },
      {
        id: 2,
        name: 'NID Copy',
        type: 'pdf',
        size: '1.2 MB',
        uploaded_at: '2024-01-15',
        status: 'verified',
        download_url: '#'
      },
      {
        id: 3,
        name: 'Rent Receipts - 2024',
        type: 'zip',
        size: '5.8 MB',
        uploaded_at: '2024-12-31',
        status: 'pending',
        download_url: '#'
      },
      {
        id: 4,
        name: 'Maintenance Records',
        type: 'pdf',
        size: '3.1 MB',
        uploaded_at: '2024-11-30',
        status: 'verified',
        download_url: '#'
      }
    ];
    
    res.status(200).json({
      success: true,
      data: {
        documents: mockDocuments
      }
    });
    
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get documents'
    });
  }
});

export default router;