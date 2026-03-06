import express from 'express';
import {
  getTeacherUnavailability,
  createUnavailability,
  deleteUnavailability,
  bulkUpdateUnavailability
} from '../controllers/teacherUnavailabilityController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getTeacherUnavailability);
router.post('/', createUnavailability);
router.post('/bulk', bulkUpdateUnavailability);
router.delete('/:id', deleteUnavailability);

export default router;