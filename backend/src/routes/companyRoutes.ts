import { Router } from 'express';
import {
  getCompanyProfile,
  updateCompanyProfile,
  renameCompany,
} from '../controllers/companyController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.get('/profile', getCompanyProfile);
router.put('/profile', authenticateToken, requireRole(['admin']), updateCompanyProfile);
router.patch('/rename', authenticateToken, requireRole(['admin']), renameCompany);

export default router;

