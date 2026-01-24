// backend/src/index.ts - Merged version using PostgreSQL
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import { pool } from './database/db'; // Her PostgreSQL

// Import ALL routes
import authRoutes from './routes/auth.routes'; // YOURS
import managerRoutes from './routes/manager.routes'; // YOURS  
import ownerRoutes from './routes/ownerRoutes'; // HERS

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000', // Just the frontend origin (5000)
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route (HERS)
app.get('/', (req, res) => {
  res.json({ message: 'Building Management API is running' });
});

// Enhanced health check (combined)
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      message: '🚀 Smart Building Management System API is running',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: 'PostgreSQL',
      db: process.env.DB_NAME
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Routes - ALL
app.use('/api/auth', authRoutes); // YOURS
app.use('/api/manager', managerRoutes); // YOURS
app.use('/api/owner', ownerRoutes); // HERS

// 404 handler (HERS)
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware (HERS)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
=========================================
🚀 Server running on http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/api/health
🔐 Auth: http://localhost:${PORT}/api/auth
👨‍💼 Manager: http://localhost:${PORT}/api/manager
👑 Owner: http://localhost:${PORT}/api/owner
=========================================
  `);
});