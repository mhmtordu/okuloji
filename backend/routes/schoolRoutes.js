import express from 'express';
import { getSchoolInfo, updateSchoolInfo } from '../controllers/schoolController.js';
import auth from '../middleware/auth.js';  // 👈 Değişti

const router = express.Router();

router.get('/', auth, getSchoolInfo);  // 👈 protect yerine auth
router.put('/', auth, updateSchoolInfo);  // 👈 protect yerine auth

export default router;