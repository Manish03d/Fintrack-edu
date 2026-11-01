import express from 'express';
import {
  getMentorDashboard,
  getMentorStudents,
  getStudent360Details,
  getMentorConnectWorkspace,
  updateMentorshipRequest,
  getMentorProfile,
  updateMentorProfile,
  getMentorAvailability,
  updateMentorAvailability,
  getMentorLiveClasses,
  createMentorLiveClass,
  updateMentorLiveClassStatus,
  getMentorSubmissions,
  gradeMentorSubmission,
} from '../controllers/mentorController.js';
import {
  getMentorSessions,
  getSessionDetails,
  createSession,
  updateSessionStatus,
} from '../controllers/mentorSessionController.js';
import {
  getConversations,
  getMessageHistory,
  sendMessage,
} from '../controllers/mentorMessageController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { getMentorFeedback } from '../controllers/mentorFeedbackController.js';
import { sendMentorStudentFile } from '../controllers/mentorMessageFileController.js';
import { uploadMentorChatFile } from '../middleware/mentorChatUpload.js';

const router = express.Router();

// Guard all mentor API routes with student-protected RBAC
router.use(protect);
router.use(authorizeRoles('mentor'));

// Dashboard & Students
router.get('/dashboard', getMentorDashboard);
router.get('/students', getMentorStudents);
router.get('/students/:studentId', getStudent360Details);

// Connect Workspace
router.get('/connect', getMentorConnectWorkspace);
router.post('/connect/requests/:requestId', updateMentorshipRequest);

// Sessions
router.get('/sessions', getMentorSessions);
router.post('/sessions/new', createSession);
router.get('/sessions/:sessionId', getSessionDetails);
router.put('/sessions/:sessionId', updateSessionStatus);

// Messages
router.get('/messages/conversations', getConversations);
router.get('/messages/thread/:studentId', getMessageHistory);
router.post('/messages/send', sendMessage);
router.post('/messages/file', uploadMentorChatFile, sendMentorStudentFile);
router.get('/feedback', getMentorFeedback);

// Profile & Availability
router.get('/profile', getMentorProfile);
router.put('/profile', updateMentorProfile);
router.get('/availability', getMentorAvailability);
router.put('/availability', updateMentorAvailability);

// Live Classes
router.get('/live-classes', getMentorLiveClasses);
router.post('/live-classes', createMentorLiveClass);
router.put('/live-classes/:classId/status', updateMentorLiveClassStatus);

// Assignments & Assessments
router.get('/assignments/submissions', getMentorSubmissions);
router.put('/assignments/submissions/:submissionId/grade', gradeMentorSubmission);

export default router;
