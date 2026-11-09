import { Router } from 'express';
import {
  getAllTrips,
  getTripById,
  addTrip,
  updateTripDestinations,
  addReturnLoad,
} from '../controllers/tripController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.get('/', getAllTrips);
router.get('/:id', getTripById);
router.post('/', authenticateToken, requireRole(['admin', 'operator']), addTrip);
router.put('/:id/destinations', authenticateToken, requireRole(['admin', 'operator']), updateTripDestinations);
router.post('/:id/return-load', authenticateToken, requireRole(['admin', 'operator']), addReturnLoad);

export default router;

