import express from 'express';
import {
  createStudentSupportTicket,
  getStudentSupportTicket,
  getStudentSupportTickets,
  reopenStudentSupportTicket,
  replyToStudentSupportTicket,
} from '../controllers/studentSupportController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';
import { uploadSupportTicketAttachment } from '../middleware/supportTicketUpload.js';

const router = express.Router();

router.use(protect, authorizeRoles('student', 'mentor', 'recruiter'));
router.get('/tickets', getStudentSupportTickets);
router.post('/tickets', uploadSupportTicketAttachment, createStudentSupportTicket);
router.get('/tickets/:ticketId', getStudentSupportTicket);
router.post('/tickets/:ticketId/replies', replyToStudentSupportTicket);
router.post('/tickets/:ticketId/reopen', reopenStudentSupportTicket);

export default router;
