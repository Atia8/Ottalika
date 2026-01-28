import { Router } from 'express';
import { getOwnerComplaints } from '../controllers/complaintController';
import { authenticate, authorizeOwner } from '../middleware/auth.middleware';

const router = Router();

// GET /api/owner/complaints
router.get('/', authenticate, authorizeOwner, getOwnerComplaints);

export default router;
