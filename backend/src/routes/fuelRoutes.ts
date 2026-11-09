import { Router } from 'express';
import { getAllFuelRecords, addFuelRecord } from '../controllers/fuelController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', getAllFuelRecords);
router.post('/', authenticateToken, addFuelRecord);

export default router;

