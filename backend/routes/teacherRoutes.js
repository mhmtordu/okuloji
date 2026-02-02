import express from 'express';
import * as teacherController from '../controllers/teacherController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Tüm route'lar için auth middleware kullan
router.use(authMiddleware);

// GET /api/teachers - Tüm öğretmenleri getir
router.get('/', teacherController.getAllTeachers);

// GET /api/teachers/:id - Tek öğretmen getir
router.get('/:id', teacherController.getTeacherById);

// POST /api/teachers - Yeni öğretmen ekle
router.post('/', teacherController.createTeacher);

// PUT /api/teachers/:id - Öğretmen güncelle
router.put('/:id', teacherController.updateTeacher);

// DELETE /api/teachers/:id - Öğretmen sil
router.delete('/:id', teacherController.deleteTeacher);

export default router;