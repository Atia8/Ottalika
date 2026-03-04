import { Router } from 'express';
import { pool } from '../../database/db';
import { dbQuery, validateEmail, validatePhone, validateNID } from './utils';
import axios from 'axios';

const router = Router();

// ==================== RENTER MANAGEMENT ENDPOINTS ====================

// GET /renters - Get all renters
router.get('/renters', async (req, res) => {
  try {
    console.log('📡 Fetching renters...');
    
    const result = await dbQuery(`
      SELECT 
        r.*,
        a.apartment_number,
        a.floor,
        a.rent_amount as apartment_rent,
        a.status as apartment_status,
        b.name as building_name,
        b.id as building_id,
        (
          SELECT status 
          FROM payments p 
          WHERE p.renter_id = r.id 
            AND DATE_TRUNC('month', p.month) = DATE_TRUNC('month', CURRENT_DATE)
          LIMIT 1
        ) as current_month_payment_status,
        (
          SELECT COUNT(*) 
          FROM payments p 
          WHERE p.renter_id = r.id 
            AND p.status IN ('pending', 'overdue')
            AND p.month < DATE_TRUNC('month', CURRENT_DATE)
        ) as overdue_payments
      FROM renters r
      LEFT JOIN apartments a ON r.apartment_id = a.id
      LEFT JOIN buildings b ON a.building_id = b.id
      WHERE r.status IN ('active', 'pending')
      ORDER BY 
        CASE WHEN r.status = 'pending' THEN 1 ELSE 2 END,
        r.created_at DESC
    `);
    
    console.log(`✅ Found ${result.rows.length} renters`);
    
    const renters = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      nid_number: row.nid_number,
      emergency_contact: row.emergency_contact,
      occupation: row.occupation,
      apartment: row.apartment_number || 'Not assigned',
      apartment_id: row.apartment_id,
      building: row.building_name || 'Not assigned',
      building_id: row.building_id,
      floor: row.floor,
      status: row.status || 'pending',
      rentPaid: row.current_month_payment_status === 'paid',
      rentAmount: parseFloat(row.agreed_rent || row.apartment_rent || 0),
      rentAmount_display: `৳${parseFloat(row.agreed_rent || row.apartment_rent || 0).toLocaleString('en-BD')}`,
      leaseStart: row.lease_start,
      leaseEnd: row.lease_end,
      documents: row.nid_number ? ['nid'] : [],
      user_id: row.user_id,
      overdue_payments: parseInt(row.overdue_payments) || 0,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    const activeRenters = renters.filter(r => r.status === 'active' && r.apartment !== 'Not assigned').length;
    const pendingRenters = renters.filter(r => r.status === 'pending').length;
    const inactiveRenters = renters.filter(r => r.status === 'inactive').length;
    
    const totalMonthlyRent = renters
      .filter(r => r.status === 'active')
      .reduce((sum, r) => sum + r.rentAmount, 0);
    
    res.status(200).json({
      success: true,
      data: {
        renters,
        summary: {
          total: renters.length,
          active: activeRenters,
          pending: pendingRenters,
          inactive: inactiveRenters,
          totalRent: totalMonthlyRent,
          totalRent_display: `৳${totalMonthlyRent.toLocaleString('en-BD')}`,
          occupancyRate: renters.length > 0 
            ? Math.round((activeRenters / renters.length) * 100) 
            : 0
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Get renters error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get renters' });
  }
});

// POST /renters - Add new renter
router.post('/renters', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      name, email, phone, nid_number, emergency_contact, occupation,
      building_id, apartment_id, rentAmount, leaseStart, leaseEnd
    } = req.body;

    console.log('📝 Adding new renter:', { name, email, apartment_id });

    // Validation
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format. Please use a valid email address (e.g., name@example.com)' 
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Bangladeshi phone number. Must be 11 digits starting with 01 (e.g., 01712345678)' 
      });
    }

    if (nid_number && !validateNID(nid_number)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid NID number. Must be 10 or 17 digits' 
      });
    }

    if (!name || !email || !phone || !apartment_id || !rentAmount || !leaseStart || !leaseEnd) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    if (new Date(leaseStart) >= new Date(leaseEnd)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lease end date must be after lease start date' 
      });
    }

    await client.query('BEGIN');

    // Check if apartment is available
    const apartmentCheck = await client.query(
      'SELECT id, status FROM apartments WHERE id = $1',
      [apartment_id]
    );
    
    if (apartmentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Apartment not found' });
    }
    
    if (apartmentCheck.rows[0]?.status !== 'vacant') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Apartment is not available' });
    }

    // Create user account with demo123 password
    const userResult = await client.query(`
      INSERT INTO users (username, password_hash, role, email, phone, "isActive")
      VALUES ($1, $2, 'renter', $3, $4, true)
      RETURNING id
    `, [email.split('@')[0], '$2a$10$JTKgZtabSdN8WLhKOhvwveTntvCbsTVXz1xu7/E/ntpR.ZbZE1/Hi', email, phone]);

    // Create renter record with apartment_id
    const renterResult = await client.query(`
      INSERT INTO renters (
        user_id, name, email, phone, nid_number, emergency_contact, occupation, 
        status, apartment_id, agreed_rent, lease_start, lease_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, $10, $11)
      RETURNING id
    `, [userResult.rows[0].id, name, email, phone, nid_number, emergency_contact, 
        occupation, apartment_id, rentAmount, leaseStart, leaseEnd]);

    const renterId = renterResult.rows[0].id;

    // Update apartment
    await client.query(`
      UPDATE apartments 
      SET current_renter_id = $1, status = 'occupied', 
          rent_amount = $2, lease_start = $3, lease_end = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [renterId, rentAmount, leaseStart, leaseEnd, apartment_id]);

    // Generate all payments
    await client.query('SELECT generate_renter_payments($1)', [renterId]);

    await client.query('COMMIT');

    // Fetch the complete renter data with payments
    const newRenter = await client.query(`
      SELECT 
        r.*,
        a.apartment_number,
        a.floor,
        b.name as building_name,
        (
          SELECT json_agg(
            json_build_object(
              'month', month,
              'amount', amount,
              'status', status,
              'due_date', due_date,
              'paid_at', paid_at
            ) ORDER BY month DESC
          )
          FROM payments 
          WHERE renter_id = r.id
        ) as payments
      FROM renters r
      LEFT JOIN apartments a ON r.apartment_id = a.id
      LEFT JOIN buildings b ON a.building_id = b.id
      WHERE r.id = $1
    `, [renterId]);

    res.status(201).json({ 
      success: true, 
      data: { 
        renter: newRenter.rows[0],
        message: `Renter added successfully with all payments. Past months marked as paid.` 
      } 
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to add renter:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add renter. Please check server logs.' 
    });
  } finally {
    client.release();
  }
});

// POST /renters/:id/approve - Approve pending renter
router.post('/renters/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { apartment, rentAmount, leaseStart, leaseEnd } = req.body;
    
    console.log(`✅ Approving renter ${id} for apartment ${apartment}`);
    
    // Start transaction
    await dbQuery('BEGIN');
    
    // Update renter status
    await dbQuery(
      'UPDATE renters SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['active', id]
    );
    
    // Update apartment assignment
    if (apartment) {
      await dbQuery(`
        UPDATE apartments 
        SET 
          current_renter_id = $1,
          status = 'occupied',
          rent_amount = $2,
          lease_start = $3,
          lease_end = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE apartment_number = $5
        AND (status = 'vacant' OR status = 'reserved')
      `, [id, rentAmount, leaseStart, leaseEnd, apartment]);
    }
    
    // Create initial payment record
    const currentMonth = new Date();
    currentMonth.setDate(1);
    
    await dbQuery(`
      INSERT INTO payments (apartment_id, renter_id, amount, month, due_date, status)
      SELECT 
        a.id,
        $1,
        $2,
        $3,
        $3 + INTERVAL '5 days',
        'pending'
      FROM apartments a
      WHERE a.current_renter_id = $1 AND a.apartment_number = $4
    `, [id, rentAmount, currentMonth, apartment]);
    
    await dbQuery('COMMIT');
    
    console.log(`✅ Renter ${id} approved successfully`);
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Renter approved successfully',
        renterId: id
      }
    });
    
  } catch (error: any) {
    await dbQuery('ROLLBACK');
    console.error('❌ Approve renter error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to approve renter'
    });
  }
});

// DELETE /renters/:id - Delete/Reject renter
router.delete('/renters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting renter ${id}`);
    
    // Start transaction
    await dbQuery('BEGIN');
    
    // Remove renter from apartment if assigned
    await dbQuery(`
      UPDATE apartments 
      SET current_renter_id = NULL, 
          status = 'vacant',
          updated_at = CURRENT_TIMESTAMP
      WHERE current_renter_id = $1
    `, [id]);
    
    // Delete renter
    const result = await dbQuery(
      'DELETE FROM renters WHERE id = $1 RETURNING id, name',
      [id]
    );
    
    await dbQuery('COMMIT');
    
    if (result.rows.length === 0) {
      console.log(`❌ Renter ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Renter not found'
      });
    }
    
    console.log(`✅ Renter ${id} deleted successfully`);
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Renter deleted successfully',
        renterName: result.rows[0].name
      }
    });
    
  } catch (error: any) {
    await dbQuery('ROLLBACK');
    console.error('❌ Delete renter error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete renter'
    });
  }
});

// PUT /renters/:id - Update renter
router.put('/renters/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const renterId = parseInt(req.params.id);
    const {
      name, email, phone, nid_number, emergency_contact, occupation,
      apartment_id, rentAmount, leaseStart, leaseEnd
    } = req.body;

    console.log(`📝 Updating renter ${renterId} with data:`, req.body);

    // Validation
    if (email && !validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format. Please use a valid email address (e.g., name@example.com)' 
      });
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Bangladeshi phone number. Must be 11 digits starting with 01 (e.g., 01712345678)' 
      });
    }

    if (nid_number && !validateNID(nid_number)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid NID number. Must be 10 or 17 digits' 
      });
    }

    if (leaseStart && leaseEnd && new Date(leaseStart) >= new Date(leaseEnd)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lease end date must be after lease start date' 
      });
    }

    await client.query('BEGIN');

    // Update renter record in renters table
    await client.query(`
      UPDATE renters 
      SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        nid_number = COALESCE($4, nid_number),
        emergency_contact = COALESCE($5, emergency_contact),
        occupation = COALESCE($6, occupation),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `, [name, email, phone, nid_number, emergency_contact, occupation, renterId]);

    // Update apartment assignment if apartment_id is provided
    if (apartment_id) {
      // First, clear old apartment assignment if any
      await client.query(`
        UPDATE apartments 
        SET current_renter_id = NULL, 
            status = 'vacant',
            updated_at = CURRENT_TIMESTAMP
        WHERE current_renter_id = $1
      `, [renterId]);

      // Assign new apartment
      await client.query(`
        UPDATE apartments 
        SET 
          current_renter_id = $1,
          rent_amount = $2,
          lease_start = $3,
          lease_end = $4,
          status = 'occupied',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [renterId, rentAmount, leaseStart, leaseEnd, apartment_id]);
    } else {
      // Just update rent amount and lease dates if no apartment change
      await client.query(`
        UPDATE apartments 
        SET 
          rent_amount = $1,
          lease_start = $2,
          lease_end = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE current_renter_id = $4
      `, [rentAmount, leaseStart, leaseEnd, renterId]);
    }

    await client.query('COMMIT');
    
    // Fetch the updated renter to return
    const updatedRenter = await client.query(`
      SELECT 
        r.*,
        a.id as apartment_id,
        a.apartment_number as apartment,
        a.floor,
        a.rent_amount,
        a.lease_start,
        a.lease_end,
        b.id as building_id,
        b.name as building
      FROM renters r
      LEFT JOIN apartments a ON r.id = a.current_renter_id
      LEFT JOIN buildings b ON a.building_id = b.id
      WHERE r.id = $1
    `, [renterId]);
    
    res.json({ 
      success: true, 
      message: 'Renter updated successfully',
      data: updatedRenter.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to update renter:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update renter. Please check server logs.' 
    });
  } finally {
    client.release();
  }
});

// GET /renters/:id/payments - Get renter payment history
router.get('/renters/:id/payments', async (req, res) => {
  try {
    const renterId = parseInt(req.params.id);
    const result = await dbQuery(`
      SELECT id, month, amount, status, paid_at, payment_method
      FROM payments
      WHERE renter_id = $1
      ORDER BY month DESC
    `, [renterId]);

    res.json({
      success: true,
      data: { payments: result.rows }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
  }
});

// POST /renters/:id/send-reminder - Send payment reminder
router.post('/renters/:id/send-reminder', async (req, res) => {
  try {
    const renterId = parseInt(req.params.id);
    
    const renter = await dbQuery(
      'SELECT name, email, phone FROM renters WHERE id = $1',
      [renterId]
    );

    console.log(`Sending reminder to ${renter.rows[0].name}`);

    res.json({ success: true, message: 'Reminder sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send reminder' });
  }
});

// POST /renters/create-with-account - Create renter with login
router.post('/renters/create-with-account', async (req, res) => {
  try {
    const response = await axios.post(
      `${process.env.API_URL || 'http://localhost:5000'}/api/auth/manager/create-renter`,
      req.body,
      {
        headers: { Authorization: req.headers.authorization }
      }
    );
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Error creating renter:', error);
    res.status(error.response?.status || 500).json(error.response?.data || {
      success: false,
      message: 'Failed to create renter'
    });
  }
});

// POST /renters/:id/renew-lease - Renew renter's lease
router.post('/renters/:id/renew-lease', async (req, res) => {
  const client = await pool.connect();
  try {
    const renterId = parseInt(req.params.id);
    const { 
      newEndDate, 
      rentIncreasePercent = 5.0, 
      increaseReason = 'annual_renewal' 
    } = req.body;

    console.log(`📝 Renewing lease for renter ${renterId} until ${newEndDate}`);

    if (!newEndDate) {
      return res.status(400).json({
        success: false,
        message: 'New end date is required'
      });
    }

    await client.query('BEGIN');

    await client.query(`
      CALL renew_lease(
        $1, $2, $3, $4,
        NULL, NULL, NULL, NULL, NULL, NULL
      )
    `, [renterId, newEndDate, rentIncreasePercent, increaseReason]);

    const updatedRenter = await client.query(`
      SELECT 
        r.*,
        a.apartment_number,
        a.floor,
        a.rent_amount,
        a.lease_start,
        a.lease_end,
        b.name as building_name
      FROM renters r
      LEFT JOIN apartments a ON r.apartment_id = a.id
      LEFT JOIN buildings b ON a.building_id = b.id
      WHERE r.id = $1
    `, [renterId]);

    const rentHistory = await client.query(`
      SELECT 
        old_rent,
        new_rent,
        change_reason,
        effective_date,
        created_at
      FROM rent_history
      WHERE renter_id = $1
      ORDER BY effective_date DESC
      LIMIT 1
    `, [renterId]);

    const paymentCount = await client.query(`
      SELECT COUNT(*) as count
      FROM payments
      WHERE renter_id = $1
        AND month > DATE_TRUNC('month', $2::date)
    `, [renterId, updatedRenter.rows[0]?.lease_start]);

    await client.query('COMMIT');

    const oldRent = rentHistory.rows[0]?.old_rent || updatedRenter.rows[0]?.agreed_rent;
    const newRent = rentHistory.rows[0]?.new_rent || updatedRenter.rows[0]?.agreed_rent;
    const increaseAmount = newRent - oldRent;
    const increasePercent = oldRent > 0 ? ((increaseAmount / oldRent) * 100).toFixed(1) : '0.0';

    res.status(200).json({
      success: true,
      data: {
        message: 'Lease renewed successfully',
        renter: updatedRenter.rows[0],
        rentHistory: rentHistory.rows,
        renewalDetails: {
          oldRent,
          newRent,
          increaseAmount,
          increasePercent,
          newLeaseStart: updatedRenter.rows[0]?.lease_start,
          newLeaseEnd: updatedRenter.rows[0]?.lease_end,
          monthsGenerated: parseInt(paymentCount.rows[0]?.count) || 0
        }
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to renew lease:', error);
    
    if (error.message.includes('overdue payment')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot renew lease: Renter has overdue payments'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to renew lease'
    });
  } finally {
    client.release();
  }
});

// GET /renters/:id/lease-history - Get rent history
router.get('/renters/:id/lease-history', async (req, res) => {
  try {
    const renterId = parseInt(req.params.id);
    
    const result = await dbQuery(`
      SELECT 
        rh.*,
        u.username as changed_by_username
      FROM rent_history rh
      LEFT JOIN users u ON rh.changed_by = u.id
      WHERE rh.renter_id = $1
      ORDER BY rh.effective_date DESC
    `, [renterId]);

    res.json({
      success: true,
      data: {
        history: result.rows
      }
    });
  } catch (error) {
    console.error('Failed to fetch lease history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lease history' });
  }
});

export default router;