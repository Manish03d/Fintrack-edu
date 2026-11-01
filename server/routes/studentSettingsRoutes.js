import express from 'express';
import {
  getStudentSettingsProfile,
  getStudentTheme,
  updateStudentPassword,
  updateStudentSettingsProfile,
  updateStudentTheme,
} from '../controllers/studentSettingsController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('student', 'mentor', 'recruiter'));
router.get('/profile', getStudentSettingsProfile);
router.put('/profile', updateStudentSettingsProfile);
router.post('/password', updateStudentPassword);
router.get('/theme', getStudentTheme);
router.put('/theme', updateStudentTheme);

export default router;
