import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../database/db';

const router = Router();

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

// Register user - FIXED: Use camelCase columns with quotes
const register = async (req: any, res: any) => {
  try {
    const { email, password, role, firstName, lastName, phone, buildingId, apartmentNumber } = req.body;

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

    // Insert user - FIXED: Use quoted camelCase column names
    const result = await query(
      `INSERT INTO users (email, password, role, "firstName", "lastName", phone, "buildingId", "apartmentNumber", "isActive")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, email, role, "firstName", "lastName"`,
      [email, hashedPassword, role, firstName, lastName, phone, buildingId, apartmentNumber, true]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,  // camelCase
          lastName: user.lastName,    // camelCase
          role: user.role,
          phone,
          buildingId,
          apartmentNumber,
          isActive: true
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

// Login user - FIXED: Use "isActive" with quotes
const login = async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    // Find user - FIXED: Use "isActive" with quotes
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND "isActive" = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,      // camelCase
          lastName: user.lastName,        // camelCase
          role: user.role,
          phone: user.phone,
          buildingId: user.buildingId,    // camelCase
          apartmentNumber: user.apartmentNumber, // camelCase
          isActive: user.isActive         // camelCase
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// Get user profile - FIXED: Use quoted camelCase columns
const getProfile = async (req: any, res: any) => {
  try {
    const userId = (req as any).user?.userId;

    const result = await query(
      `SELECT id, email, role, "firstName", "lastName", phone, "buildingId", "apartmentNumber", "isActive" 
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

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,      // camelCase
          lastName: user.lastName,        // camelCase
          role: user.role,
          phone: user.phone,
          buildingId: user.buildingId,    // camelCase
          apartmentNumber: user.apartmentNumber, // camelCase
          isActive: user.isActive         // camelCase
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};

// Update profile - FIXED: Use quoted camelCase columns
const updateProfile = async (req: any, res: any) => {
  try {
    const userId = (req as any).user?.userId;
    const { firstName, lastName, phone } = req.body;

    const result = await query(
      `UPDATE users 
       SET "firstName" = $1, "lastName" = $2, phone = $3 
       WHERE id = $4 
       RETURNING id, email, role, "firstName", "lastName", phone, "buildingId", "apartmentNumber", "isActive"`,
      [firstName, lastName, phone, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,      // camelCase
          lastName: user.lastName,        // camelCase
          role: user.role,
          phone: user.phone,
          buildingId: user.buildingId,    // camelCase
          apartmentNumber: user.apartmentNumber, // camelCase
          isActive: user.isActive         // camelCase
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Change password - This one is fine (no camelCase columns)
const changePassword = async (req: any, res: any) => {
  try {
    const userId = (req as any).user?.userId;
    const { currentPassword, newPassword } = req.body;

    const userResult = await query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Test route
router.get('/test-auth', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication test successful'
  });
});

export default router;