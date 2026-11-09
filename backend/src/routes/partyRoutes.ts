import { Router } from 'express';
import { getAllParties, addParty, addPartyDocument } from '../controllers/partyController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.get('/', getAllParties);
router.post('/', authenticateToken, requireRole(['admin', 'operator']), addParty);
router.post('/:id/documents', authenticateToken, requireRole(['admin', 'operator']), addPartyDocument);

export default router;

