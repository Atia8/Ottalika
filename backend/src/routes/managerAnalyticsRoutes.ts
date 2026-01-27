// src/routes/managerAnalyticsRoutes.ts
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



export default router;