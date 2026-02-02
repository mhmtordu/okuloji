import express from 'express';
import {
  getTeacherUnavailability,
  createUnavailability,
  deleteUnavailability,
  bulkUpdateUnavailability
} from '../controllers/teacherUnavailabilityController.js';

const router = express.Router();

// GET - Öğretmen kısıtlamalarını getir
router.get('/', getTeacherUnavailability);

// POST - Yeni kısıtlama ekle
router.post('/', createUnavailability);

// POST - Toplu güncelleme
router.post('/bulk', bulkUpdateUnavailability);

// DELETE - Kısıtlama sil
router.delete('/:id', deleteUnavailability);

export default router;