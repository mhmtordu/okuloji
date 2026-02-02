import express from 'express';
import * as classroomController from '../controllers/classroomController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Tüm rotalar JWT ile korumalı
router.get('/', auth, classroomController.getClassrooms);
router.post('/', auth, classroomController.createClassroom);
router.put('/:id', auth, classroomController.updateClassroom);
router.delete('/:id', auth, classroomController.deleteClassroom);

export default router;