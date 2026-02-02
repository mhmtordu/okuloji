import express from 'express';
import * as assignmentController from '../controllers/subjectAssignmentController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Tüm route'lar için auth middleware
router.use(authMiddleware);

// GET /api/subject-assignments - Tüm atamaları getir
router.get('/', assignmentController.getAssignments);

// GET /api/subject-assignments/classroom/:id - Sınıf bazlı atamalar
router.get('/classroom/:classroom_id', assignmentController.getAssignmentsByClassroom);

// GET /api/subject-assignments/summary - Özet istatistik
router.get('/summary', assignmentController.getAssignmentSummary);

// POST /api/subject-assignments - Yeni atama ekle
router.post('/', assignmentController.createAssignment);

// PUT /api/subject-assignments/:id - Atamayı güncelle
router.put('/:id', assignmentController.updateAssignment);

// DELETE /api/subject-assignments/:id - Atamayı sil
router.delete('/:id', assignmentController.deleteAssignment);

export default router;