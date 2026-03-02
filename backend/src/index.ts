// backend/src/index.ts
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http'; // 👈 ADD THIS

import { pool } from './database/db';
import { initializeSocket } from './socket/socketServer'; // 👈 IMPORT SOCKET

// Import ALL routes
import authRoutes from './routes/auth.routes';
import managerRoutes from './routes/manager.routes';
import ownerRoutes from './routes/ownerRoutes';
import renterRoutes from './routes/renterRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server 👈 THIS IS KEY
const server = http.createServer(app);

// Initialize Socket.IO 👈 ADD THIS
const io = initializeSocket(server);

// Make io available in routes (optional)
app.set('io', io);

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Building Management API is running' });
});

// Enhanced health check
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
      db: process.env.DB_NAME,
      socket: 'enabled' // 👈 Show socket is enabled
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
app.use('/api/auth', authRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/renter', renterRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 👈 CHANGE THIS: Use server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(`
=========================================
🚀 Server running on http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/api/health
🔐 Auth: http://localhost:${PORT}/api/auth
👨‍💼 Manager: http://localhost:${PORT}/api/manager
👑 Owner: http://localhost:${PORT}/api/owner
🔌 Socket.IO: enabled on same port
=========================================
  `);
});