import { Router } from 'express';
import {
  getAdvances,
  getAdvance,
  createAdvance,
  updateAdvance,
  deleteAdvance,
  submitAdvance,
} from '../controllers/expense/advance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAdvances);
router.get('/:id', getAdvance);
router.post('/', createAdvance);
router.put('/:id', updateAdvance);
router.delete('/:id', deleteAdvance);
router.post('/:id/submit', submitAdvance);

export default router;
