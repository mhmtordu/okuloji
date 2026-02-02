import express from 'express';
import * as subjectController from '../controllers/subjectController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, subjectController.getSubjects);
router.post('/', auth, subjectController.createSubject);
router.put('/:id', auth, subjectController.updateSubject);
router.delete('/:id', auth, subjectController.deleteSubject);

export default router;