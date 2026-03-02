import { Router } from 'express';
import { authenticate, authorizeManager } from './middleware';

// Import all route modules
import dashboardRoutes from './dashboard.routes';
import complaintsRoutes from './complaints.routes';
import paymentsRoutes from './payments.routes';
import rentersRoutes from './renters.routes';
import billsRoutes from './bills.routes';
import analyticsRoutes from './analytics.routes';
import messagesRoutes from './messages.routes';
import buildingsRoutes from './buildings.routes';

const router = Router();

// Apply middleware to all routes
router.use(authenticate);
router.use(authorizeManager);

// Mount all route modules
router.use(dashboardRoutes);      // /dashboard
router.use(complaintsRoutes);     // /complaints, /complaints/*  
router.use(paymentsRoutes);       // /payments, /payments/*
router.use(rentersRoutes);        // /renters, /renters/*
router.use(billsRoutes);          // /bills, /bills/*
router.use(analyticsRoutes);      // /analytics/*
router.use(messagesRoutes);       // /messages, /messages/*
router.use(buildingsRoutes);      // /buildings, /buildings/*

export default router;