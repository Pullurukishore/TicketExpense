import { Router } from 'express';
import {
  getDashboardStats,
  getPoSoCostingReport,
} from '../controllers/expense/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/poso', getPoSoCostingReport);

export default router;
