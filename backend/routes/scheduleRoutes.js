/**
 * SCHEDULE ROUTES (FINAL FIX)
 */

import express from 'express';
import { 
  generateSchedule, 
  getSchedule, 
  deleteSchedule,
  getScheduleByClassroom,
  getScheduleByTeacher
} from '../controllers/scheduleController.js';

import auth from '../middleware/auth.js'; // ✅ DOĞRU: 'auth' olarak import et

const router = express.Router();

// Routes
router.post('/generate', auth, generateSchedule);
router.get('/', auth, getSchedule);
router.delete('/', auth, deleteSchedule);
router.get('/classroom/:classroom_id', auth, getScheduleByClassroom);
router.get('/teacher/:teacher_id', auth, getScheduleByTeacher);

export default router;