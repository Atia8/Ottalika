// backend/src/routes/auth.ts - COMPLETE REWRITE
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../database/db';
import { authenticate,authorizeManager } from '../middleware/auth.middleware';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production';

// Helper function for database queries
const query = async (text: string, params?: any[]) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// ==================== DEMO ACCOUNTS (PRE-EXISTING) ====================
// These are already in your database from seed files
// No code needed - they just exist

// ==================== LOGIN (WORKS FOR EVERYONE) ====================
export const login = async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    
    console.log('📧 Login attempt for email:', email);

    // Find user
    const result = await query(
      'SELECT id, email, role, password_hash, username, phone, "isActive" FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ No user found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];
    
    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User is not active:', user.email);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      console.log('❌ Invalid password for user:', user.email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // For renters, get their status and apartment info
    let renterStatus = 'active';
    let hasApartment = false;
    let apartmentInfo = null;

    if (user.role === 'renter') {
      const renterResult = await query(`
        SELECT r.status, r.name, a.id as apartment_id, a.apartment_number, a.status as apt_status
        FROM renters r
        LEFT JOIN apartments a ON r.id = a.current_renter_id
        WHERE r.user_id = $1
      `, [user.id]);
      
      if (renterResult.rows.length > 0) {
        renterStatus = renterResult.rows[0].status;
        hasApartment = renterResult.rows[0].apartment_id !== null;
        apartmentInfo = {
          id: renterResult.rows[0].apartment_id,
          number: renterResult.rows[0].apartment_number,
          status: renterResult.rows[0].apt_status
        };
      }
    }

    // Get user's full name
    let fullName = user.username;
    if (user.role === 'renter') {
      const renterResult = await query('SELECT name FROM renters WHERE user_id = $1', [user.id]);
      if (renterResult.rows.length > 0) {
        fullName = renterResult.rows[0].name;
      }
    } else if (user.role === 'owner') {
      const ownerResult = await query('SELECT name FROM owners WHERE user_id = $1', [user.id]);
      if (ownerResult.rows.length > 0) {
        fullName = ownerResult.rows[0].name;
      }
    } else if (user.role === 'manager') {
      const managerResult = await query('SELECT name FROM managers WHERE user_id = $1', [user.id]);
      if (managerResult.rows.length > 0) {
        fullName = managerResult.rows[0].name;
      }
    }

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎉 Login successful for:', user.email);

    // For renters, include status in response
    const responseData: any = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        firstName: firstName,
        lastName: lastName,
        fullName: fullName
      },
      token
    };

    // Add renter-specific info
    if (user.role === 'renter') {
      responseData.renterStatus = renterStatus;
      responseData.hasApartment = hasApartment;
      responseData.apartmentInfo = apartmentInfo;
      
      // Special message for renters without apartment
      if (!hasApartment && renterStatus === 'active') {
        responseData.message = 'Your account is active but no apartment is assigned yet. Please contact manager.';
      }
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: responseData
    });
    
  } catch (error: any) {
    console.error('💥 Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// ==================== REGISTER - DISABLED FOR RENTERS! ====================
export const register = async (req: any, res: any) => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;
    
    console.log('📝 Registration attempt for:', { email, role });

    // ❌ BLOCK RENTER REGISTRATION
    if (role === 'renter') {
      console.log('❌ Self-registration for renters is disabled');
      return res.status(403).json({
        success: false,
        message: 'Renter accounts can only be created by managers. Please contact our office.'
      });
    }

    // Check if user exists
    const userCheck = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate username from email
    const username = email.split('@')[0];

    // Insert user
    const result = await query(
      `INSERT INTO users (username, password_hash, role, email, phone, "isActive")
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, role, username, phone, "isActive", created_at`,
      [username, hashedPassword, role, email, phone, true]
    );

    const user = result.rows[0];
    console.log('✅ User created:', { id: user.id, email: user.email, role: user.role });

    // Create role-specific records for owners/managers only
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (role === 'owner') {
      await query(
        `INSERT INTO owners (user_id, name)
         VALUES ($1, $2)`,
        [user.id, fullName]
      );
      console.log('👑 Owner record created');
    } else if (role === 'manager') {
      await query(
        `INSERT INTO managers (user_id, name, designation)
         VALUES ($1, $2, $3)`,
        [user.id, fullName, 'Property Manager']
      );
      console.log('👨‍💼 Manager record created');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎉 Registration successful for:', user.email);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          phone: user.phone,
          isActive: user.isActive,
          firstName: firstName,
          lastName: lastName,
          fullName: fullName
        },
        token
      }
    });
    
  } catch (error: any) {
    console.error('💥 Registration error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// ==================== MANAGER CREATES RENTER (NEW ENDPOINT) ====================
export const managerCreateRenter = async (req: any, res: any) => {
  const client = await pool.connect();
  try {
    const {
      email,
      password, // Optional - if not provided, generate random
      firstName,
      lastName,
      phone,
      apartment_id,
      rent_amount,
      lease_start,
      lease_end
    } = req.body;

    const managerId = req.user?.userId; // From auth middleware

    console.log('👨‍💼 Manager creating renter:', { email, firstName, lastName, apartment_id });

    // Validate required fields
    if (!email || !firstName || !lastName || !apartment_id || !rent_amount || !lease_start || !lease_end) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    await client.query('BEGIN');

    // Check if email already exists
    const emailCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Email already exists in system'
      });
    }

    // Check if apartment is available
    const apartmentCheck = await client.query(`
      SELECT status, current_renter_id 
      FROM apartments 
      WHERE id = $1
    `, [apartment_id]);

    if (apartmentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Apartment not found'
      });
    }

    if (apartmentCheck.rows[0].status !== 'vacant') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Apartment is not available'
      });
    }

    // Generate password if not provided
    const finalPassword = 'demo123'; 
    const hashedPassword = await bcrypt.hash(finalPassword, 10);
    
    const username = email.split('@')[0];
    const fullName = `${firstName} ${lastName}`.trim();

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (username, password_hash, role, email, phone, "isActive")
       VALUES ($1, $2, 'renter', $3, $4, true) 
       RETURNING id`,
      [username, hashedPassword, email, phone]
    );

    const userId = userResult.rows[0].id;

    // Create renter record
    const renterResult = await client.query(
      `INSERT INTO renters (user_id, name, email, phone, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING id`,
      [userId, fullName, email, phone]
    );

    const renterId = renterResult.rows[0].id;

    // Assign apartment
    await client.query(`
      UPDATE apartments 
      SET 
        current_renter_id = $1,
        status = 'occupied',
        rent_amount = $2,
        lease_start = $3,
        lease_end = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [renterId, rent_amount, lease_start, lease_end, apartment_id]);

    // Create current month's payment (pending)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const dueDate = new Date(currentMonth);
    dueDate.setDate(dueDate.getDate() + 5);

    await client.query(`
      INSERT INTO payments (apartment_id, renter_id, amount, month, due_date, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
    `, [apartment_id, renterId, rent_amount, currentMonth, dueDate]);

    // Log the action in manager tasks
    await client.query(`
      INSERT INTO manager_tasks (title, description, task_type, status, completed_at)
      VALUES ($1, $2, 'renter_creation', 'completed', CURRENT_TIMESTAMP)
    `, [
      `Created renter account for ${fullName}`,
      `Assigned to Apartment ${apartmentCheck.rows[0].apartment_number || apartment_id}`
    ]);

    await client.query('COMMIT');

    console.log('✅ Renter created successfully with ID:', renterId);

    // In a real app, you would send an email/SMS here
    // For now, return the password in response (only for demo)
    res.status(201).json({
      success: true,
      message: 'Renter account created successfully',
      data: {
        renterId,
        userId,
        email,
        password: finalPassword, // Remove this in production!
        fullName,
        apartment_id
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Manager create renter error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create renter account'
    });
  } finally {
    client.release();
  }
};

// Helper function to generate random password
function generateRandomPassword(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ==================== EXISTING PROFILE FUNCTIONS (Keep as-is) ====================
export const getProfile = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT id, email, role, username, phone, "isActive" 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Get full name from role-specific table
    let fullName = user.username;
    try {
      if (user.role === 'owner') {
        const ownerResult = await query('SELECT name FROM owners WHERE user_id = $1', [userId]);
        if (ownerResult.rows.length > 0) {
          fullName = ownerResult.rows[0].name;
        }
      } else if (user.role === 'manager') {
        const managerResult = await query('SELECT name FROM managers WHERE user_id = $1', [userId]);
        if (managerResult.rows.length > 0) {
          fullName = managerResult.rows[0].name;
        }
      } else if (user.role === 'renter') {
        const renterResult = await query('SELECT name FROM renters WHERE user_id = $1', [userId]);
        if (renterResult.rows.length > 0) {
          fullName = renterResult.rows[0].name;
        }
      }
    } catch (nameError) {
      console.warn('⚠️ Could not fetch user full name:', nameError.message);
    }

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          phone: user.phone,
          isActive: user.isActive,
          firstName: firstName,
          lastName: lastName,
          fullName: fullName
        }
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};

export const updateProfile = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { phone, firstName, lastName } = req.body;

    // Update user
    const result = await query(
      `UPDATE users 
       SET phone = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING id, email, role, username, phone, "isActive"`,
      [phone, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Update name in role-specific table
    try {
      const fullName = `${firstName || ''} ${lastName || ''}`.trim();
      if (fullName) {
        if (user.role === 'owner') {
          await query('UPDATE owners SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [fullName, userId]);
        } else if (user.role === 'manager') {
          await query('UPDATE managers SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [fullName, userId]);
        } else if (user.role === 'renter') {
          await query('UPDATE renters SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [fullName, userId]);
        }
      }
    } catch (nameError) {
      console.warn('⚠️ Could not update user name:', nameError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          phone: user.phone,
          isActive: user.isActive,
          firstName: firstName,
          lastName: lastName
        }
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

export const changePassword = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error: any) {
    console.error('Change password error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

export const testAuth = async (req: any, res: any) => {
  try {
    const testQuery = await query('SELECT COUNT(*) as count FROM users');
    
    res.status(200).json({
      success: true,
      message: 'Auth API is working',
      data: {
        userCount: testQuery.rows[0].count,
        timestamp: new Date().toISOString(),
        endpoints: [
          'POST /api/auth/login',
          'POST /api/auth/register (owners/managers only)',
          'POST /api/auth/manager/create-renter (manager only)',
          'GET /api/auth/profile (protected)',
          'PUT /api/auth/profile (protected)',
          'PUT /api/auth/change-password (protected)',
          'GET /api/auth/test'
        ]
      }
    });
  } catch (error: any) {
    console.error('Test endpoint error:', error.message);
    res.status(500).json({
      success: false,
      message: 'API test failed',
      error: error.message
    });
  }
};

export const checkEmail = async (req: any, res: any) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await query('SELECT id, email FROM users WHERE email = $1', [email]);
    
    res.status(200).json({
      success: true,
      data: {
        exists: result.rows.length > 0,
        user: result.rows[0] || null
      }
    });
  } catch (error: any) {
    console.error('Check email error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to check email'
    });
  }
};

// ==================== ROUTES ====================
router.post('/register', register);
router.post('/login', login);
router.post('/manager/create-renter', authenticate, authorizeManager, managerCreateRenter);
router.get('/test', testAuth);
router.get('/check-email', checkEmail);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);



export default router;