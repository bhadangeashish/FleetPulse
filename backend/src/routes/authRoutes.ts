import { Router } from 'express';
import {
  login,
  register,
  me,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getAllUsers,
  updateUserVerification,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateToken, me);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// User Accounts Management (Admin exclusive)
router.get('/users', authenticateToken, requireRole(['admin']), getAllUsers);
router.patch('/users/:userId/verification', authenticateToken, requireRole(['admin']), updateUserVerification);

export default router;

