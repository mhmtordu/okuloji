import express from 'express';
import {
  generateSchedule,
  debugSchedule,
  getSchedule,
  updateScheduleEntry,
  deleteSchedule
} from '../controllers/scheduleController.js';

const router = express.Router();

// Program oluştur (algoritma çalıştır)
router.post('/generate', generateSchedule);

// Debug - yerleşemeyen blokları analiz et
router.post('/debug', debugSchedule);

// Programı getir (sınıf veya öğretmen bazlı)
router.get('/', getSchedule);

// Tek hücre güncelle (yarı otomatik düzenleme)
router.put('/:id', updateScheduleEntry);

// Programı sıfırla
router.delete('/school/:school_id', deleteSchedule);

export default router;