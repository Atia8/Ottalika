import { Router, Request, Response } from 'express';
import { pool } from '../database/db';
import { authenticate } from '../middleware/auth.middleware';

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

// Fix: Use real JWT token verification
const authenticateRenter = async (req: Request, res: Response, next: Function) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production';
    
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      role: string;
    };

    // Get the renter ID from the database using the user_id
    const result = await dbQuery(
      'SELECT id FROM renters WHERE user_id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Renter profile not found'
      });
    }

    // ✅ FIX: Set renterId (not userId)
    (req as any).renterId = result.rows[0].id;
    
    console.log(`✅ Authenticated renter ID: ${result.rows[0].id} from user ID: ${decoded.userId}`);
    next();
    
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};
// Apply authentication to all routes
router.use(authenticateRenter);

// ==================== RENTER MESSAGES ENDPOINTS (CONSOLIDATED & FIXED) ====================

// GET /api/renter/messages - Get all conversations for renter (WORKING VERSION)
// ==================== FIXED RENTER MESSAGES ENDPOINTS ====================

// GET /api/renter/messages - Get all conversations for renter
router.get('/messages', async (req: any, res: any) => {
  try {
    const renterId = req.renterId; // ✅ FIXED: Use renterId
    console.log('📱 Fetching conversations for renter ID:', renterId);

    // Get manager info (always ID 1)
    const managerResult = await dbQuery(
      'SELECT id, name FROM managers WHERE id = 1'
    );

    // Get owner info (from the building they're renting)
    const ownerResult = await dbQuery(`
      SELECT o.id, o.name
      FROM apartments a
      JOIN buildings b ON a.building_id = b.id
      JOIN owners o ON b.owner_id = o.id
      WHERE a.current_renter_id = $1
      LIMIT 1
    `, [renterId]);

    const conversations = [];

    // Add manager conversation
    if (managerResult.rows.length > 0) {
      // Get last message with manager
      const managerMessages = await dbQuery(`
        SELECT 
          message,
          created_at
        FROM messages 
        WHERE (sender_id = 'manager_1' AND receiver_id = 'renter_' || $1) OR
              (sender_id = 'renter_' || $1 AND receiver_id = 'manager_1')
        ORDER BY created_at DESC
        LIMIT 1
      `, [renterId]);

      // Get unread count from manager
      const unreadCount = await dbQuery(`
        SELECT COUNT(*) as count
        FROM messages 
        WHERE sender_id = 'manager_1' 
          AND receiver_id = 'renter_' || $1 
          AND is_read = false
      `, [renterId]);

      conversations.push({
        id: managerResult.rows[0].id,
        name: managerResult.rows[0].name,
        role: 'manager',
        designation: 'Building Manager',
        last_message: managerMessages.rows[0]?.message || 'No messages yet',
        last_message_time: managerMessages.rows[0]?.created_at || new Date().toISOString(),
        unread_count: parseInt(unreadCount.rows[0]?.count) || 0
      });
    }

    // Add owner conversation if exists
    if (ownerResult.rows.length > 0) {
      const ownerId = ownerResult.rows[0].id;
      
      // Get last message with owner
      const ownerMessages = await dbQuery(`
        SELECT 
          message,
          created_at
        FROM messages 
        WHERE (sender_id = 'owner_' || $2 AND receiver_id = 'renter_' || $1) OR
              (sender_id = 'renter_' || $1 AND receiver_id = 'owner_' || $2)
        ORDER BY created_at DESC
        LIMIT 1
      `, [renterId, ownerId]);

      // Get unread count from owner
      const unreadCount = await dbQuery(`
        SELECT COUNT(*) as count
        FROM messages 
        WHERE sender_id = 'owner_' || $2 
          AND receiver_id = 'renter_' || $1 
          AND is_read = false
      `, [renterId, ownerId]);

      conversations.push({
        id: ownerId,
        name: ownerResult.rows[0].name,
        role: 'owner',
        designation: 'Building Owner',
        last_message: ownerMessages.rows[0]?.message || 'No messages yet',
        last_message_time: ownerMessages.rows[0]?.created_at || new Date().toISOString(),
        unread_count: parseInt(unreadCount.rows[0]?.count) || 0
      });
    }

    // Sort by last_message_time (most recent first)
  // 👇 IMPROVED SORTING: Most recent first, then alphabetically
conversations.sort((a, b) => {
  const timeA = new Date(a.last_message_time).getTime();
  const timeB = new Date(b.last_message_time).getTime();
  
  // If both have messages, sort by most recent
  if (a.last_message !== 'No messages yet' && b.last_message !== 'No messages yet') {
    return timeB - timeA;
  }
  // If only A has messages, A comes first
  if (a.last_message !== 'No messages yet') return -1;
  // If only B has messages, B comes first
  if (b.last_message !== 'No messages yet') return 1;
  // If neither has messages, sort alphabetically
  return a.name.localeCompare(b.name);
});

    console.log('✅ Sending conversations:', conversations.length);

    res.status(200).json({
      success: true,
      data: {
        conversations: conversations,
        total: conversations.length,
        unread_count: conversations.reduce((sum, c) => sum + c.unread_count, 0)
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
});

// GET /api/renter/messages/:contactId - Get messages with specific contact
router.get('/messages/:contactId', async (req: any, res: any) => {
  try {
    const renterId = req.renterId; // ✅ FIXED: Use renterId
    const contactId = parseInt(req.params.contactId);
    const { role } = req.query;

    console.log('📥 Fetching messages:', { renterId, contactId, role });

    if (!role || (role !== 'manager' && role !== 'owner')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role parameter'
      });
    }

    const renterString = 'renter_' + renterId;
    const contactString = role + '_' + contactId;

    // Get all messages between renter and contact
    const messages = await dbQuery(`
      SELECT 
        m.id,
        m.message,
        m.created_at as timestamp,
        m.is_read,
        CASE 
          WHEN m.sender_id = $1 THEN true
          ELSE false
        END as is_own,
        CASE 
          WHEN m.sender_id = $1 THEN 'You'
          ELSE COALESCE(u.name, 'Unknown')
        END as sender_name
      FROM messages m
      LEFT JOIN ${role === 'manager' ? 'managers' : 'owners'} u ON u.id = $3
      WHERE 
        (m.sender_id = $1 AND m.receiver_id = $2) OR
        (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC
    `, [renterString, contactString, contactId]);

    console.log(`✅ Found ${messages.rows.length} messages`);

    // Mark messages as read (removed read_at since column doesn't exist)
    const updateResult = await dbQuery(`
      UPDATE messages 
      SET is_read = true
      WHERE 
        receiver_id = $1 AND
        sender_id = $2 AND
        is_read = false
      RETURNING id
    `, [renterString, contactString]);

    // Emit read receipt if messages were marked
    if (updateResult.rows.length > 0) {
      const io = req.app.get('io');
      if (io) {
        io.to(contactString).emit('messages_read_receipt', {
          conversationId: renterString,
          messageIds: updateResult.rows.map(r => r.id),
          readAt: new Date().toISOString()
        });
      }
    }

    // Map messages to include status
    const mappedMessages = messages.rows.map(msg => ({
      id: msg.id,
      message: msg.message,
      timestamp: msg.timestamp,
      is_own: msg.is_own,
      sender_name: msg.sender_name,
      status: msg.is_read ? 'read' : (msg.is_own ? 'delivered' : 'sent')
    }));

    res.status(200).json({
      success: true,
      data: {
        messages: mappedMessages
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

// POST /api/renter/messages - Send a message
router.post('/messages', async (req: any, res: any) => {
  try {
    const renterId = req.renterId; // ✅ FIXED: Use renterId
    const { receiverId, message, role } = req.body;

    console.log('📨 Sending message:', { renterId, receiverId, message, role });

    if (!receiverId || !message || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get renter name
    const renterResult = await dbQuery(
      'SELECT name FROM renters WHERE id = $1',
      [renterId]
    );

    const renterName = renterResult.rows[0]?.name || 'Renter';
    const renterString = 'renter_' + renterId;
    const receiverString = role + '_' + receiverId;

    // Insert the message
    const result = await dbQuery(`
      INSERT INTO messages (
        sender_id,
        receiver_id,
        message,
        created_at,
        is_read
      ) VALUES (
        $1,
        $2,
        $3,
        NOW(),
        false
      ) RETURNING id, sender_id, receiver_id, message, created_at, is_read
    `, [renterString, receiverString, message]);

    console.log('✅ Message inserted:', result.rows[0]);

    // Emit socket event if available
    const io = req.app.get('io');
    if (io) {
      const messageData = {
        id: result.rows[0].id,
        message: result.rows[0].message,
        timestamp: result.rows[0].created_at,
        sender_id: renterString,
        receiver_id: receiverString,
        is_read: false
      };

      io.to(receiverString).emit('new_message', messageData);
      io.to(renterString).emit('message_sent', messageData);
      
      // Update unread count for receiver
      const unreadResult = await dbQuery(
        `SELECT COUNT(*) as count 
         FROM messages 
         WHERE receiver_id = $1 AND is_read = false`,
        [receiverString]
      );
      
      io.to(receiverString).emit('unread_count_update', {
        conversationId: renterString,
        unreadCount: parseInt(unreadResult.rows[0]?.count) || 0
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: {
          id: result.rows[0].id,
          message: result.rows[0].message,
          timestamp: result.rows[0].created_at,
          is_own: true,
          sender_name: renterName,
          status: 'sent'
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});
// Debug endpoint - to check what's in the database
router.get('/messages/debug/:renterId', async (req: any, res: any) => {
  try {
    const renterId = req.params.renterId;
    
    const messages = await dbQuery(`
      SELECT 
        id,
        sender_id,
        receiver_id,
        message,
        created_at,
        is_read
      FROM messages 
      WHERE sender_id = $1 OR receiver_id = $1
      ORDER BY created_at DESC
    `, [`renter_${renterId}`]);
    
    res.json({
      success: true,
      data: {
        renter_id: renterId,
        renter_string: `renter_${renterId}`,
        total_messages: messages.rows.length,
        messages: messages.rows
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== OTHER RENTER ENDPOINTS ====================

// GET /api/renter/dashboard - Get renter dashboard data
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    
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
    
    const paymentResult = await dbQuery(`
      SELECT status, paid_at 
      FROM payments 
      WHERE renter_id = $1 
        AND DATE_TRUNC('month', month) = DATE_TRUNC('month', CURRENT_DATE)
      LIMIT 1
    `, [renterId]);
    
    const complaintsResult = await dbQuery(`
      SELECT COUNT(*) as pending_count
      FROM maintenance_requests 
      WHERE renter_id = $1 
        AND status IN ('pending', 'in_progress')
    `, [renterId]);
    
    const nextPaymentResult = await dbQuery(`
      SELECT due_date, amount
      FROM payments 
      WHERE renter_id = $1 
        AND status = 'pending'
        AND due_date >= CURRENT_DATE
      ORDER BY due_date ASC
      LIMIT 1
    `, [renterId]);
    
    const recentPaymentsResult = await dbQuery(`
      SELECT id, month, amount, status, due_date, paid_at, payment_method
      FROM payments 
      WHERE renter_id = $1 
      ORDER BY month DESC 
      LIMIT 3
    `, [renterId]);
    
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
          unread_messages: 0
        },
        stats: {
          current_rent: profile.rent_amount || 0,
          payment_status: paymentResult.rows[0]?.status || 'pending',
          pending_complaints: parseInt(complaintsResult.rows[0]?.pending_count) || 0,
          unread_messages: 0
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
    
    // Use the database function
    const result = await dbQuery(
      'SELECT * FROM get_renter_payment_status($1)',
      [renterId]
    );
    
    // Group payments for frontend
    const payments = result.rows;
    const grouped = {
      overdue: payments.filter((p: any) => p.display_status === 'overdue'),
      due_now: payments.filter((p: any) => p.display_status === 'due_now'),
      upcoming: payments.filter((p: any) => p.display_status === 'upcoming'),
      paid: payments.filter((p: any) => p.display_status === 'paid')
    };
    
    // Calculate summary
    const summary = {
      total_due: [...grouped.overdue, ...grouped.due_now].reduce((sum, p) => sum + parseFloat(p.amount), 0),
      overdue_count: grouped.overdue.length,
      due_now_count: grouped.due_now.length,
      upcoming_count: grouped.upcoming.length,
      paid_count: grouped.paid.length
    };
    
    // Get current month for reference
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    
    res.json({
      success: true,
      data: {
        ...grouped,
        summary,
        current_month: currentMonth,
        all_payments: payments
      }
    });
    
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, message: 'Failed to get payments' });
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
  const client = await pool.connect();
  try {
    const renterId = (req as any).renterId;
    const { payment_id, payment_method, transaction_id } = req.body;
    
    console.log('💰 Payment request received:', { renterId, payment_id, payment_method });
    
    if (!payment_id || !payment_method) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Payment ID and payment method are required'
      });
    }
    
    await client.query('BEGIN');
    
    // First, check if the payment exists and belongs to this renter
    const paymentCheck = await client.query(
      'SELECT * FROM payments WHERE id = $1 AND renter_id = $2',
      [payment_id, renterId]
    );
    
    if (paymentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    const payment = paymentCheck.rows[0];
    
    // Check if already paid
    if (payment.status === 'paid') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'This payment has already been made'
      });
    }
    
    // Validate the payment using database function
    const validationResult = await client.query(
      'SELECT validate_renter_payment($1, $2) as valid',
      [renterId, payment_id]
    );
    
    // If validation passes, update payment
    const updateResult = await client.query(`
      UPDATE payments 
      SET 
        status = 'paid',
        payment_method = $1,
        transaction_id = $2,
        paid_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND renter_id = $4
      RETURNING id, amount, month, status
    `, [payment_method, transaction_id || null, payment_id, renterId]);
    
    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Create payment confirmation
    await client.query(`
      INSERT INTO payment_confirmations (payment_id, status, created_at)
      VALUES ($1, 'pending_review', CURRENT_TIMESTAMP)
    `, [payment_id]);
    
    await client.query('COMMIT');
    
    // Get updated payment list
    const updatedPayments = await client.query(
      'SELECT * FROM get_renter_payment_status($1)',
      [renterId]
    );
    
    res.json({
      success: true,
      data: {
        message: 'Payment submitted successfully!',
        payment: updateResult.rows[0],
        all_payments: updatedPayments.rows
      }
    });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error making payment:', error);
    
    // Check if it's a validation error from the database
    if (error.message.includes('Cannot pay for future months') ||
        error.message.includes('Must pay older months first')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Failed to make payment' });
  } finally {
    client.release();
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
        COALESCE(mr.renter_marked_resolved, FALSE) as renter_marked_resolved,
        mr.resolution,
        mr.resolution_notes,
        mr.assigned_at,
        mr.completed_at
      FROM maintenance_requests mr
      JOIN apartments a ON mr.apartment_id = a.id
      LEFT JOIN buildings b ON a.building_id = b.id
      WHERE mr.renter_id = $1
    `;
    
    const params: any[] = [renterId];
    
    if (status && status !== 'all') {
      if (status === 'needs_confirmation') {
        query += ' AND mr.manager_marked_resolved = TRUE AND mr.renter_marked_resolved = FALSE';
      } else {
        query += ' AND mr.status = $2';
        params.push(status);
      }
    }
    
    query += ' ORDER BY mr.created_at DESC';
    
    const result = await dbQuery(query, params);
    
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
    
    const processedComplaints = result.rows.map(complaint => ({
      ...complaint,
      needs_renter_confirmation: complaint.manager_marked_resolved && !complaint.renter_marked_resolved
    }));
    
    res.status(200).json({
      success: true,
      data: {
        complaints: processedComplaints,
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
    
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }
    
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

// PUT /api/renter/complaints/:id/resolve - Renter marks their own complaint as resolved
router.put('/complaints/:id/resolve', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const complaintId = parseInt(req.params.id);
    
    const checkResult = await dbQuery(
      'SELECT id, status FROM maintenance_requests WHERE id = $1 AND renter_id = $2',
      [complaintId, renterId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or access denied'
      });
    }
    
    const complaint = checkResult.rows[0];
    if (!['pending', 'in_progress'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or in-progress complaints can be marked as resolved'
      });
    }
    
    await dbQuery(`
      UPDATE maintenance_requests 
      SET 
        renter_marked_resolved = TRUE,
        manager_marked_resolved = TRUE,
        status = 'resolved',
        updated_at = CURRENT_TIMESTAMP,
        resolved_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [complaintId]);
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Complaint marked as resolved'
      }
    });
    
  } catch (error) {
    console.error('Mark resolved error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark complaint as resolved'
    });
  }
});

// PUT /api/renter/complaints/:id/confirm-resolve - Renter confirms manager's resolution
router.put('/complaints/:id/confirm-resolve', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const complaintId = parseInt(req.params.id);
    
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
    
    if (!complaint.manager_marked_resolved) {
      return res.status(400).json({
        success: false,
        message: 'Manager has not marked this complaint as resolved yet'
      });
    }
    
    if (complaint.renter_marked_resolved) {
      return res.status(400).json({
        success: false,
        message: 'You have already confirmed this resolution'
      });
    }
    
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

// PUT /api/renter/complaints/:id/escalate - Escalate complaint
router.put('/complaints/:id/escalate', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const complaintId = parseInt(req.params.id);
    
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

// DELETE /api/renter/complaints/:id - Delete complaint
router.delete('/complaints/:id', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    const complaintId = parseInt(req.params.id);
    
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

// GET /api/renter/documents - Get available documents
router.get('/documents', async (req: Request, res: Response) => {
  try {
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

// GET /api/renter/contacts - Get contacts (simplified)
router.get('/contacts', async (req: Request, res: Response) => {
  try {
    const renterId = (req as any).renterId;
    
    console.log('📱 Fetching contacts for renter:', renterId);
    
    const contacts = [
      {
        id: 1,
        name: 'Building Manager',
        role: 'manager',
        designation: 'Property Manager',
        last_message: 'How can I help you?',
        last_message_time: new Date().toISOString(),
        unread_count: 0
      }
    ];
    
    // Check if owner exists
    const ownerResult = await dbQuery(`
      SELECT o.id, o.name
      FROM apartments a
      JOIN buildings b ON a.building_id = b.id
      JOIN owners o ON b.owner_id = o.id
      WHERE a.current_renter_id = $1
    `, [renterId]);
    
    if (ownerResult.rows.length > 0) {
      contacts.push({
        id: ownerResult.rows[0].id,
        name: ownerResult.rows[0].name,
        role: 'owner',
        designation: 'Building Owner',
        last_message: 'Contact the owner',
        last_message_time: new Date().toISOString(),
        unread_count: 0
      });
    }

    res.status(200).json({
      success: true,
      data: {
        contacts: contacts
      }
    });
    
  } catch (error: any) {
    console.error('❌ Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contacts'
    });
  }
});

export default router;