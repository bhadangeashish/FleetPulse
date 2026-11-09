import { Router } from 'express';
import { getAllPayments, recordPartialPayment, settlePayment } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.get('/', getAllPayments);
router.post('/:id/partial-payment', authenticateToken, requireRole(['admin', 'operator']), recordPartialPayment);
router.post('/:id/settle', authenticateToken, requireRole(['admin']), settlePayment);

export default router;

