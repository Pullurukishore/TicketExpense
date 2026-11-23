import { Router } from 'express';
import {
  getPendingApprovals,
  approveExpense,
  rejectExpense,
  approveAdvance,
  rejectAdvance,
} from '../controllers/expense/approval.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRole(['ADMIN', 'ZONE_MANAGER', 'ZONE_USER']));

router.get('/', getPendingApprovals);
router.post('/expenses/:id/approve', approveExpense);
router.post('/expenses/:id/reject', rejectExpense);
router.post('/advances/:id/approve', approveAdvance);
router.post('/advances/:id/reject', rejectAdvance);

export default router;
