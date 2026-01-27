import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../database/db';
import { authenticateToken } from '../middleware/auth';

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

// Register user
export const register = async (req: any, res: any) => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;
    
    console.log('📝 Registration attempt for:', { email, role, firstName, lastName });

    // Check if user exists
    const userCheck = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      console.log('❌ User already exists:', email);
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

    // Create role-specific records
    const fullName = `${firstName} ${lastName}`.trim();
    try {
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
      } else if (role === 'renter') {
        // Create renter record
        await query(
          `INSERT INTO renters (name, email, phone, status, user_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [fullName, email, phone, 'active', user.id]
        );
        console.log('👤 Renter record created');
      }
    } catch (roleError) {
      console.warn('⚠️ Could not create role-specific record:', roleError.message);
      // Continue anyway
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
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
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

    console.log('👤 User found:', { id: user.id, email: user.email, role: user.role });

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      console.log('❌ Invalid password for user:', user.email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get user's full name from role-specific table
    let fullName = user.username;
    try {
      if (user.role === 'owner') {
        const ownerResult = await query('SELECT name FROM owners WHERE user_id = $1', [user.id]);
        if (ownerResult.rows.length > 0) {
          fullName = ownerResult.rows[0].name;
        }
      } else if (user.role === 'manager') {
        const managerResult = await query('SELECT name FROM managers WHERE user_id = $1', [user.id]);
        if (managerResult.rows.length > 0) {
          fullName = managerResult.rows[0].name;
        }
      } else if (user.role === 'renter') {
        const renterResult = await query('SELECT name FROM renters WHERE user_id = $1', [user.id]);
        if (renterResult.rows.length > 0) {
          fullName = renterResult.rows[0].name;
        }
      }
    } catch (nameError) {
      console.warn('⚠️ Could not fetch user full name:', nameError.message);
    }

    // Split full name into first and last name
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

    res.status(200).json({
      success: true,
      message: 'Login successful',
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
    console.error('💥 Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user profile
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

// Update profile
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

// Change password
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

// Test endpoint
export const testAuth = async (req: any, res: any) => {
  try {
    // Test database connection
    const testQuery = await query('SELECT COUNT(*) as count FROM users');
    
    res.status(200).json({
      success: true,
      message: 'Auth API is working',
      data: {
        userCount: testQuery.rows[0].count,
        timestamp: new Date().toISOString(),
        endpoints: [
          'POST /api/auth/register',
          'POST /api/auth/login',
          'GET /api/auth/profile (protected)',
          'PUT /api/auth/profile (protected)',
          'PUT /api/auth/change-password (protected)'
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

// Check if email exists
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

// Routes
router.post('/register', register);
router.post('/login', login);
router.get('/test', testAuth);
router.get('/check-email', checkEmail);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

export default router;