import { Router } from 'express';
import {
  getAllDrivers,
  getDriverById,
  addDriver,
  updateDriver,
} from '../controllers/driverController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.get('/', getAllDrivers);
router.get('/:id', getDriverById);
router.post('/', authenticateToken, requireRole(['admin', 'operator']), addDriver);
router.put('/:id', authenticateToken, requireRole(['admin', 'operator']), updateDriver);

export default router;

