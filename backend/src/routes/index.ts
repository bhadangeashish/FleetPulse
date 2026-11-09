import { Router } from 'express';
import authRoutes from './authRoutes';
import companyRoutes from './companyRoutes';
import vehicleRoutes from './vehicleRoutes';
import driverRoutes from './driverRoutes';
import tripRoutes from './tripRoutes';
import fuelRoutes from './fuelRoutes';
import serviceRoutes from './serviceRoutes';
import partyRoutes from './partyRoutes';
import paymentRoutes from './paymentRoutes';
import syncRoutes from './syncRoutes';
import healthRoutes from './healthRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/trips', tripRoutes);
router.use('/fuel', fuelRoutes);
router.use('/services', serviceRoutes);
router.use('/parties', partyRoutes);
router.use('/payments', paymentRoutes);
router.use('/sync', syncRoutes);
router.use('/health', healthRoutes);

export default router;

