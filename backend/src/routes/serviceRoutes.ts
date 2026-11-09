import { Router } from 'express';
import { getAllServiceRecords, addServiceRecord } from '../controllers/serviceController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', getAllServiceRecords);
router.post('/', authenticateToken, addServiceRecord);

export default router;

