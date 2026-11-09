import { Router } from 'express';
import {
  getAllVehicles,
  getVehicleById,
  addVehicle,
  updateVehicle,
  updateVehicleOdometer,
} from '../controllers/vehicleController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);
router.post('/', authenticateToken, requireRole(['admin', 'operator']), addVehicle);
router.put('/:id', authenticateToken, requireRole(['admin', 'operator']), updateVehicle);
router.patch('/:id/odometer', authenticateToken, updateVehicleOdometer);

export default router;

