import express from 'express';
import {
  generateSchedule,
  getSchedule,
  updateScheduleEntry,
  deleteSchedule
} from '../controllers/scheduleController.js';

const router = express.Router();

// Program oluştur (algoritma çalıştır)
router.post('/generate', generateSchedule);

// Programı getir (sınıf veya öğretmen bazlı)
router.get('/', getSchedule);

// Tek hücre güncelle (yarı otomatik düzenleme)
router.put('/:id', updateScheduleEntry);

// Programı sıfırla
router.delete('/school/:school_id', deleteSchedule);

export default router;