import express from 'express';
import { login, getMe } from '../controllers/authController.js';
import auth from '../middleware/auth.js';  // 👈 Değişti

const router = express.Router();

router.post('/login', login);
router.get('/me', auth, getMe);  // 👈 protect yerine auth

export default router;