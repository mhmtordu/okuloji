import express from 'express';
import * as timeSlotController from '../controllers/timeSlotController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Tüm route'lar için auth middleware kullan
router.use(authMiddleware);

// GET /api/timeslots - Tüm zaman dilimlerini getir
router.get('/', timeSlotController.getTimeSlots);

// POST /api/timeslots - Yeni zaman dilimi ekle
router.post('/', timeSlotController.createTimeSlot);

// POST /api/timeslots/bulk - Toplu zaman dilimi ekle
router.post('/bulk', timeSlotController.createBulkTimeSlots);

// POST /api/timeslots/template - Standart şablon oluştur
router.post('/template', timeSlotController.createStandardTemplate);

// PUT /api/timeslots/:id - Zaman dilimi güncelle
router.put('/:id', timeSlotController.updateTimeSlot);

// DELETE /api/timeslots/:id - Zaman dilimi sil
router.delete('/:id', timeSlotController.deleteTimeSlot);

// DELETE /api/timeslots - Tüm zaman dilimlerini sil
router.delete('/', timeSlotController.deleteAllTimeSlots);

// GET /api/timeslots/day/:day - Belirli bir güne göre zaman dilimlerini getir
router.get('/day/:day', timeSlotController.getTimeSlotsByDay);

export default router;