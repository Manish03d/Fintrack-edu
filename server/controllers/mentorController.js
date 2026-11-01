import {
  SEEDED_MENTOR_STATS,
  SEEDED_MENTOR_STUDENTS,
  SEEDED_MENTOR_SESSIONS,
  SEEDED_CONNECT_REQUESTS,
  SEEDED_MENTOR_PROFILE,
} from '../seed/mentorSeedData.js';
import { MentorAvailability } from '../models/MentorAvailability.js';
import { LiveClass } from '../models/LiveClass.js';
import { LiveClassAttendance } from '../models/LiveClassAttendance.js';
import { AssignmentSubmission } from '../models/AssignmentSubmission.js';
import { Assignment } from '../models/Assignment.js';
import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { createUserNotification } from '../services/notificationService.js';
import { SEEDED_ASSIGNMENTS } from '../seed/practiceSeedData.js';

const supportedSessionDurations = [30, 45, 60];
const validDays = new Set(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
const timePattern = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

const emptyAvailability = () => ({
  sessionDurationMinutes: 45,
  maxSessionsPerDay: 4,
  weeklySchedule: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => ({
    day,
    isEnabled: false,
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    slots: [],
  })),
});

const timeToMinutes = (value) => {
  const match = value?.trim().match(timePattern);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 1 || hours > 12 || minutes > 59) return null;
  if (match[3].toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (match[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const validateAvailability = (payload) => {
  const sessionDurationMinutes = Number(payload?.sessionDurationMinutes);
  const maxSessionsPerDay = Number(payload?.maxSessionsPerDay);
  const weeklySchedule = payload?.weeklySchedule;

  if (!supportedSessionDurations.includes(sessionDurationMinutes)) {
    return 'Session duration must be 30, 45, or 60 minutes.';
  }
  if (!Number.isInteger(maxSessionsPerDay) || maxSessionsPerDay <= 0) {
    return 'Maximum sessions per day must be a positive integer.';
  }
  if (!Array.isArray(weeklySchedule) || weeklySchedule.length === 0) {
    return 'Weekly schedule is required.';
  }

  const seenDays = new Set();
  for (const dayItem of weeklySchedule) {
    if (!validDays.has(dayItem?.day) || seenDays.has(dayItem.day)) return 'Weekly schedule contains an invalid or duplicate day.';
    seenDays.add(dayItem.day);
    if (typeof dayItem.isEnabled !== 'boolean') return `Availability state is invalid for ${dayItem.day}.`;
    if (!Array.isArray(dayItem.slots)) return `Slots must be an array for ${dayItem.day}.`;

    const startMinutes = timeToMinutes(dayItem.startTime);
    const endMinutes = timeToMinutes(dayItem.endTime);
    if (dayItem.isEnabled && (startMinutes === null || endMinutes === null || startMinutes >= endMinutes)) {
      return `Working hours are invalid for ${dayItem.day}.`;
    }

    const seenSlots = new Set();
    for (const slot of dayItem.slots) {
      if (!slot?.slotId || typeof slot.slotId !== 'string' || !slot.time || seenSlots.has(slot.time)) {
        return `A slot is invalid or duplicated for ${dayItem.day}.`;
      }
      seenSlots.add(slot.time);
      const slotParts = slot.time.split(' - ');
      const slotStart = timeToMinutes(slotParts[0]);
      const slotEnd = timeToMinutes(slotParts[1]);
      if (slotStart === null || slotEnd === null || slotStart >= slotEnd) return `A slot time is invalid for ${dayItem.day}.`;
      if (dayItem.isEnabled && (slotStart < startMinutes || slotEnd > endMinutes)) {
        return `A slot falls outside working hours for ${dayItem.day}.`;
      }
    }
  }

  return null;
};

const normalizeAvailability = (payload) => ({
  sessionDurationMinutes: Number(payload.sessionDurationMinutes),
  maxSessionsPerDay: Number(payload.maxSessionsPerDay),
  weeklySchedule: payload.weeklySchedule.map((dayItem) => ({
    day: dayItem.day,
    isEnabled: dayItem.isEnabled,
    startTime: dayItem.startTime,
    endTime: dayItem.endTime,
    // isBooked is recurring template metadata, never date-specific occupancy.
    slots: dayItem.slots.map((slot) => ({ slotId: slot.slotId, time: slot.time, isBooked: false })),
  })),
});

// Get Mentor Dashboard Data
export const getMentorDashboard = async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        stats: SEEDED_MENTOR_STATS,
        upcomingSessions: SEEDED_MENTOR_SESSIONS.filter((s) => s.status === 'Upcoming'),
        recentStudents: SEEDED_MENTOR_STUDENTS,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Mentor Students List
export const getMentorStudents = async (req, res) => {
  try {
    return res.json({
      success: true,
      data: SEEDED_MENTOR_STUDENTS,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Student 360 Performance Details
export const getStudent360Details = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student =
      SEEDED_MENTOR_STUDENTS.find((s) => s.studentId === studentId) || SEEDED_MENTOR_STUDENTS[0];

    return res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Mentor Connect Workspace Data
export const getMentorConnectWorkspace = async (req, res) => {
  try {
    const pendingRequests = SEEDED_CONNECT_REQUESTS.filter((r) => r.status === 'pending');
    const activeMentorships = SEEDED_MENTOR_STUDENTS.filter((s) => s.mentorshipStatus === 'Active');
    const recommendedStudents = [
      {
        studentId: 'st_rec_1',
        name: 'Karthik Raja',
        course: 'DeFi Protocols & Smart Contract Auditing',
        skillScore: '89%',
        reason: 'Top 5% performer in Smart Contract Auditing seeking HFT mentor.',
      },
      {
        studentId: 'st_rec_2',
        name: 'Divya Nair',
        course: 'RegTech Compliance & AML',
        skillScore: '85%',
        reason: 'Consistently high assessment scores in ISO 20022 messaging.',
      },
    ];

    return res.json({
      success: true,
      data: {
        pendingRequests,
        activeMentorships,
        recommendedStudents,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Mentorship Request (Accept/Decline)
export const updateMentorshipRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    const reqItem = SEEDED_CONNECT_REQUESTS.find((r) => r.requestId === requestId);
    if (reqItem) {
      reqItem.status = action === 'accept' ? 'accepted' : 'declined';
    }

    return res.json({
      success: true,
      message: `Mentorship request ${action === 'accept' ? 'accepted' : 'declined'} successfully.`,
      data: reqItem || { requestId, status: action === 'accept' ? 'accepted' : 'declined' },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Mentor Profile
export const getMentorProfile = async (req, res) => {
  try {
    return res.json({
      success: true,
      data: SEEDED_MENTOR_PROFILE,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Mentor Profile
export const updateMentorProfile = async (req, res) => {
  try {
    const profileData = req.body;
    Object.assign(SEEDED_MENTOR_PROFILE, profileData);

    return res.json({
      success: true,
      message: 'Mentor profile updated successfully!',
      data: SEEDED_MENTOR_PROFILE,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Mentor Availability
export const getMentorAvailability = async (req, res) => {
  try {
    if (!req.isDbConnected) {
      return res.status(503).json({ success: false, message: 'Mentor availability requires a connected database.' });
    }
    const availability = await MentorAvailability.findOne({ mentorId: req.user.id }).lean();
    return res.json({
      success: true,
      data: availability || emptyAvailability(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load mentor availability.' });
  }
};

// Update Mentor Availability
export const updateMentorAvailability = async (req, res) => {
  try {
    if (!req.isDbConnected) {
      return res.status(503).json({ success: false, message: 'Mentor availability requires a connected database.' });
    }
    const validationError = validateAvailability(req.body);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const availability = await MentorAvailability.findOneAndUpdate(
      { mentorId: req.user.id },
      { $set: { mentorId: req.user.id, ...normalizeAvailability(req.body) } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      success: true,
      message: 'Availability schedule saved successfully.',
      data: availability,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to save mentor availability.' });
  }
};

// ==========================================
// MENTOR LIVE CLASSES
// ==========================================

export const getMentorLiveClasses = async (req, res) => {
  try {
    if (!req.isDbConnected) {
      return res.json({
        success: true,
        data: [
          {
            id: 'lc_demo_1',
            title: 'HFT Trading Systems & Market Data Feeds',
            description: 'Advanced live walkthrough on low-latency market feeds and order book construction.',
            scheduledAt: new Date(Date.now() + 86400000),
            durationMinutes: 60,
            status: 'scheduled',
            meetingLink: 'https://meet.google.com/fintrack-live-hft',
            course: { title: 'Algorithmic Trading & HFT Strategies' },
            attendeesCount: 38,
          },
          {
            id: 'lc_demo_2',
            title: 'Financial Machine Learning Case Studies',
            description: 'Live code review and risk classification pipeline evaluation.',
            scheduledAt: new Date(Date.now() - 3600000 * 2),
            durationMinutes: 75,
            status: 'completed',
            meetingLink: 'https://meet.google.com/fintrack-finml-live',
            course: { title: 'Financial Machine Learning & Risk Modeling' },
            attendeesCount: 52,
          },
        ],
      });
    }

    const mentorId = req.user.id;
    const liveClasses = await LiveClass.find({ mentorId })
      .populate('courseId', 'title slug thumbnail')
      .sort({ scheduledAt: -1 })
      .lean();

    const classIds = liveClasses.map((lc) => lc._id);
    const attendances = await LiveClassAttendance.find({ liveClassId: { $in: classIds } }).lean();

    const data = liveClasses.map((lc) => {
      const attendees = attendances.filter((a) => String(a.liveClassId) === String(lc._id)).length;
      return {
        id: lc._id,
        _id: lc._id,
        title: lc.title,
        description: lc.description,
        scheduledAt: lc.scheduledAt,
        durationMinutes: lc.durationMinutes,
        status: lc.status,
        meetingLink: lc.meetingLink,
        course: lc.courseId ? { title: lc.courseId.title, slug: lc.courseId.slug } : { title: 'General FinTech' },
        agenda: lc.agenda || [],
        materials: lc.materials || [],
        maxParticipants: lc.maxParticipants,
        attendeesCount: attendees,
      };
    });

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createMentorLiveClass = async (req, res) => {
  try {
    const { title, description, courseId, scheduledAt, durationMinutes, meetingLink, agenda, materials } = req.body;

    if (!title || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'Class title and scheduled time are required.' });
    }

    if (!req.isDbConnected) {
      return res.status(201).json({
        success: true,
        message: 'Live class scheduled successfully!',
        data: {
          id: `lc_${Date.now()}`,
          title,
          description,
          scheduledAt,
          durationMinutes: Number(durationMinutes) || 60,
          meetingLink: meetingLink || 'https://meet.google.com/fintrack-live',
          status: 'scheduled',
          attendeesCount: 0,
        },
      });
    }

    // Resolve course
    let resolvedCourseId = courseId;
    if (!resolvedCourseId) {
      const defaultCourse = await Course.findOne();
      resolvedCourseId = defaultCourse?._id;
    }

    const liveClass = await LiveClass.create({
      title,
      description: description || '',
      mentorId: req.user.id,
      courseId: resolvedCourseId,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: Number(durationMinutes) || 60,
      meetingLink: meetingLink || 'https://meet.google.com/fintrack-live',
      agenda: Array.isArray(agenda) ? agenda : (agenda ? agenda.split('\n').filter(Boolean) : []),
      materials: Array.isArray(materials) ? materials : [],
      status: 'scheduled',
    });

    return res.status(201).json({
      success: true,
      message: 'Live class scheduled successfully!',
      data: liveClass,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMentorLiveClassStatus = async (req, res) => {
  try {
    const { classId } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'live', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid live class status.' });
    }

    if (!req.isDbConnected) {
      return res.json({ success: true, message: `Class status updated to ${status}.` });
    }

    const liveClass = await LiveClass.findOneAndUpdate(
      { _id: classId, mentorId: req.user.id },
      { $set: { status } },
      { new: true }
    );

    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Live class not found or unauthorized.' });
    }

    return res.json({
      success: true,
      message: `Live class status updated to ${status}.`,
      data: liveClass,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// MENTOR ASSIGNMENT & ASSESSMENT EVALUATION
// ==========================================

export const getMentorSubmissions = async (req, res) => {
  try {
    if (!req.isDbConnected) {
      return res.json({
        success: true,
        data: [
          {
            submissionId: 'sub_demo_1',
            assignmentId: 'asg_101',
            assignmentTitle: 'Building an Algorithmic Backtester in Python',
            studentName: 'Vishaltharshan S',
            studentEmail: 'student@fintrack.edu',
            submittedAt: new Date(Date.now() - 3600000 * 5),
            status: 'submitted',
            marksObtained: null,
            content: 'Implemented vector backtester with transaction costs, slippage, and Sharpe ratio calculations.',
            attachmentName: 'backtester_submission.py',
            feedback: '',
          },
          {
            submissionId: 'sub_demo_2',
            assignmentId: 'asg_102',
            assignmentTitle: 'DeFi Smart Contract Security Audit',
            studentName: 'Priya Ramanathan',
            studentEmail: 'priya@fintrack.edu',
            submittedAt: new Date(Date.now() - 86400000),
            status: 'evaluated',
            marksObtained: 94,
            content: 'Identified reentrancy vulnerabilities and proposed CEI pattern with automated Slither checks.',
            attachmentName: 'defi_security_audit.pdf',
            feedback: 'Exceptional depth in vulnerability analysis and clean remediation code.',
          },
        ],
      });
    }

    const submissions = await AssignmentSubmission.find()
      .populate('studentId', 'name email avatar')
      .sort({ submittedAt: -1 })
      .lean();

    const data = submissions.map((sub) => {
      const seeded = SEEDED_ASSIGNMENTS.find((a) => a.assignmentId === sub.assignmentId);
      return {
        submissionId: sub.submissionId,
        assignmentId: sub.assignmentId,
        assignmentTitle: seeded ? seeded.title : 'FinTech Practical Assignment',
        studentId: sub.studentId?._id,
        studentName: sub.studentId?.name || 'Student',
        studentEmail: sub.studentId?.email || '',
        studentAvatar: sub.studentId?.avatar || '',
        submittedAt: sub.submittedAt,
        status: sub.status,
        marksObtained: sub.marksObtained,
        content: sub.content,
        attachmentName: sub.attachmentName,
        feedback: sub.feedback || '',
      };
    });

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const gradeMentorSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marksObtained, feedback } = req.body;

    const marks = Number(marksObtained);
    if (Number.isNaN(marks) || marks < 0 || marks > 100) {
      return res.status(400).json({ success: false, message: 'Marks must be a number between 0 and 100.' });
    }

    if (!req.isDbConnected) {
      return res.json({
        success: true,
        message: 'Assignment graded successfully!',
        data: { submissionId, marksObtained: marks, feedback, status: 'evaluated' },
      });
    }

    const submission = await AssignmentSubmission.findOne({ submissionId });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    submission.marksObtained = marks;
    submission.feedback = feedback || 'Evaluated by mentor.';
    submission.status = 'evaluated';
    await submission.save();

    await createUserNotification({
      userId: submission.studentId,
      eventKey: `assignment:graded:${submissionId}:${Date.now()}`,
      title: 'Assignment Evaluated',
      message: `Your assignment submission has been graded: ${marks}/100. Feedback: "${(feedback || '').slice(0, 80)}"`,
      category: 'learning',
      type: 'success',
      link: '/student/exams',
    });

    return res.json({
      success: true,
      message: 'Assignment graded and student notified successfully!',
      data: submission,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
