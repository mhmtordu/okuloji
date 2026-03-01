import express from 'express';
import { getSchoolInfo, updateSchoolInfo } from '../controllers/schoolController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/school - Okul bilgisini getir
router.get('/', auth, getSchoolInfo);

// PUT /api/school - Okul bilgisini güncelle
router.put('/', auth, updateSchoolInfo);

export default router;