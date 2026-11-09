import { Router } from 'express';
import { processBatchSync } from '../controllers/syncController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Batch offline synchronization endpoint (Protected by Auth or device credential)
router.post('/batch', authenticateToken, processBatchSync);

export default router;

