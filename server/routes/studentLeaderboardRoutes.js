import express from 'express';
import { getStudentLeaderboard } from '../controllers/studentLeaderboardController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('student'));

router.get('/', getStudentLeaderboard);

export default router;

