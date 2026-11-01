import {
  SEEDED_RECRUITER_PROFILE,
  SEEDED_RECRUITER_MESSAGES,
} from '../seed/recruiterSeedData.js';
import mongoose from 'mongoose';
import { Interview } from '../models/Interview.js';
import { Job } from '../models/Job.js';
import { JobApplication } from '../models/JobApplication.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { SkillPassport } from '../models/SkillPassport.js';
import { Certificate } from '../models/Certificate.js';
import { User } from '../models/User.js';
import { RecruiterProfile } from '../models/RecruiterProfile.js';
import { RecruiterMessage } from '../models/RecruiterMessage.js';
import { getCareerProfileForRecruiter } from './studentCareerController.js';
import { createUserNotification } from '../services/notificationService.js';

// Recruiter Dashboard Data
export const getRecruiterDashboard = async (req, res) => {
  try {
    if (!req.isDbConnected) return res.status(503).json({ success: false, message: 'Recruiter dashboard requires a connected database.' });
    const jobs = await Job.find({ recruiterId: req.user.id }).sort({ postedAt: -1 }).lean();
    const jobIds = jobs.map((job) => job.jobId);
    const [applications, interviews] = await Promise.all([
      JobApplication.find({ jobId: { $in: jobIds } }).sort({ appliedDate: -1 }).lean(),
      Interview.find({ recruiterId: String(req.user.id), status: 'SCHEDULED', date: { $gte: new Date() } })
        .sort({ date: 1 })
        .limit(10)
        .lean(),
    ]);
    const candidateIds = [...new Set(applications.map((application) => application.candidateId))]
      .filter((id) => mongoose.isValidObjectId(id));
    const [profiles, users] = await Promise.all([
      CandidateProfile.find({ studentId: { $in: candidateIds } }).lean(),
      User.find({ _id: { $in: candidateIds }, role: 'student', status: 'active' }).select('name avatar').lean(),
    ]);
    const profilesById = new Map(profiles.map((profile) => [profile.studentId, profile]));
    const usersById = new Map(users.map((user) => [String(user._id), user]));
    const candidates = await Promise.all(candidateIds.map(async (candidateId) => {
      const user = usersById.get(candidateId);
      const profile = profilesById.get(candidateId);
      if (!user || !profile) return null;
      const [careerProfile, passport] = await Promise.all([
        getCareerProfileForRecruiter(candidateId),
        SkillPassport.findOne({ studentId: candidateId }).select('badges').lean(),
      ]);
      const candidateSkills = new Set((careerProfile?.skills || []).map((skill) => skill.toLowerCase().replace(/[^a-z0-9]/g, '')));
      const matches = jobs
        .filter((job) => job.status === 'ACTIVE')
        .map((job) => {
          const requirements = [...new Set((job.requiredSkills || []).map((skill) => skill.toLowerCase().replace(/[^a-z0-9]/g, '')))];
          const matchedCount = requirements.filter((skill) => candidateSkills.has(skill)).length;
          return {
            jobTitle: job.title,
            matchPercentage: requirements.length ? Math.round((matchedCount / requirements.length) * 100) : null,
            requiredSkillCount: requirements.length,
          };
        })
        .filter((match) => match.matchPercentage !== null)
        .sort((left, right) => right.matchPercentage - left.matchPercentage);
      return {
        id: candidateId,
        candidateId,
        name: user.name,
        role: profile.preferredRoles?.[0] || 'Role not specified',
        skillScore: careerProfile?.overallSkillScore == null ? 'Not assessed' : `${careerProfile.overallSkillScore}%`,
        verifiedBadge: passport?.badges?.[0] || 'Not verified',
        match: matches[0] ? `${matches[0].matchPercentage}% required-skill match` : 'Not available',
      };
    }));
    const shortlisted = applications.filter((application) => ['SHORTLISTED', 'INTERVIEW'].includes(application.status)).length;
    return res.json({
      success: true,
      data: {
        stats: {
          availableCandidates: candidates.filter(Boolean).length,
          activeJobs: jobs.filter((job) => job.status === 'ACTIVE').length,
          applications: applications.length,
          shortlistedCandidates: shortlisted,
        },
        recentApplications: applications.slice(0, 5),
        candidatePipeline: {
          applied: applications.filter((application) => application.status === 'APPLIED').length,
          screening: applications.filter((application) => application.status === 'SCREENING').length,
          shortlisted: applications.filter((application) => application.status === 'SHORTLISTED').length,
          interview: applications.filter((application) => application.status === 'INTERVIEW').length,
          hired: applications.filter((application) => application.status === 'SELECTED').length,
        },
        activeJobs: jobs.filter((job) => job.status === 'ACTIVE').slice(0, 10).map((job) => ({
          ...job,
          id: job.jobId,
          applicants: job.applicantsCount,
          posted: new Date(job.postedAt).toLocaleDateString(),
        })),
        upcomingInterviews: interviews,
        recommendedCandidates: candidates.filter(Boolean).slice(0, 5),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Candidate Discovery Roster
export const getCandidates = async (req, res) => {
  try {
    if (!req.isDbConnected) return res.status(503).json({ success: false, message: 'Candidate discovery requires a connected database.' });
      const ownedJobs = await Job.find({ recruiterId: req.user.id }).select('jobId').lean();
      const applications = await JobApplication.find({ jobId: { $in: ownedJobs.map((job) => job.jobId) } })
        .select('candidateId')
        .lean();
      const candidateIds = [...new Set(applications.map((application) => application.candidateId))]
        .filter((id) => mongoose.isValidObjectId(id));
      const [profiles, users] = await Promise.all([
        CandidateProfile.find({ studentId: { $in: candidateIds } }).lean(),
        User.find({ _id: { $in: candidateIds }, role: 'student', status: 'active' })
          .select('name email avatar')
          .lean(),
      ]);
      const usersById = new Map(users.map((user) => [String(user._id), user]));
      const candidateData = await Promise.all(profiles.map(async (profile) => {
        const user = usersById.get(profile.studentId);
        if (!user) return null;
        const careerProfile = await getCareerProfileForRecruiter(profile.studentId);
        const passport = await SkillPassport.findOne({ studentId: profile.studentId }).select('verifiedSkills projects').lean();
        const applicationHistory = await JobApplication.find({
          candidateId: profile.studentId,
          jobId: { $in: ownedJobs.map((job) => job.jobId) },
        }).select('applicationId jobId jobTitle company status appliedDate').lean();
        return {
          candidateId: profile.studentId,
          studentId: profile.studentId,
          name: user.name,
          email: user.email,
          avatar: user.avatar || '',
          education: profile.education || '',
          experience: profile.experience || '',
          location: profile.location || '',
          careerObjective: profile.careerObjective || '',
          availability: profile.availability || '',
          verifiedBadge: '',
          ...careerProfile,
          preferredRoles: profile.preferredRoles || [],
          resumeUrl: profile.resumeUrl || '',
          applicationHistory,
          skillPassport: {
            verifiedSkills: passport?.verifiedSkills || [],
            projects: careerProfile?.projects || [],
            certifications: careerProfile?.certificates || [],
          },
        };
      }));
      return res.json({ success: true, data: candidateData.filter(Boolean) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Single Candidate 360° Profile Details for Recruiter
export const getCandidateDetails = async (req, res) => {
  try {
    const { candidateId } = req.params;
    if (!req.isDbConnected) return res.status(503).json({ success: false, message: 'Candidate profiles require a connected database.' });
      if (!mongoose.isValidObjectId(candidateId)) {
        return res.status(404).json({ success: false, message: 'Candidate not found.' });
      }
      const ownedJobs = await Job.find({ recruiterId: req.user.id }).select('jobId').lean();
      const applicationHistory = await JobApplication.find({
        candidateId,
        jobId: { $in: ownedJobs.map((job) => job.jobId) },
      }).select('applicationId jobId jobTitle company status appliedDate').lean();
      if (!applicationHistory.length) {
        return res.status(404).json({ success: false, message: 'Candidate not found.' });
      }
      const [user, profile, careerProfile, passport] = await Promise.all([
        User.findOne({ _id: candidateId, role: 'student', status: 'active' }).select('name email avatar').lean(),
        CandidateProfile.findOne({ studentId: candidateId }).lean(),
        getCareerProfileForRecruiter(candidateId),
        SkillPassport.findOne({ studentId: candidateId }).select('verifiedSkills projects badges').lean(),
      ]);
      if (!user || !profile) return res.status(404).json({ success: false, message: 'Candidate not found.' });
      const verifiedSkills = passport?.verifiedSkills || [];
      return res.json({
        success: true,
        data: {
          candidateId,
          studentId: candidateId,
          name: user.name,
          email: user.email,
          avatar: user.avatar || '',
          education: profile.education || '',

          location: profile.location || '',
          preferredRoles: profile.preferredRoles || [],
          skills: careerProfile?.skills || [],
          resumeUrl: profile.resumeUrl || '',
          applicationHistory,
          overallSkillScore: careerProfile?.overallSkillScore ?? null,
          practiceAccuracy: careerProfile?.practiceAccuracy ?? null,
          assessmentScore: careerProfile?.assessmentScore ?? null,
          careerReadinessScore: null,
          careerObjective: profile.careerObjective || '',
          availability: profile.availability || '',
          verifiedBadge: passport?.badges?.[0] || '',
          strengths: careerProfile?.strengths || [],
          weakAreas: careerProfile?.weakAreas || [],
          skillPassport: {
            verifiedSkills,
            certifications: careerProfile?.certificates || [],
            projects: careerProfile?.projects || [],
            badges: passport?.badges || [],
          },
        },
      });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Recruiter Profile
export const getRecruiterProfile = async (req, res) => {
  try {
    if (req.isDbConnected && req.user?.id) {
      let profile = await RecruiterProfile.findOne({ userId: req.user.id });
      if (!profile) {
        profile = await RecruiterProfile.create({
          userId: req.user.id,
          companyName: SEEDED_RECRUITER_PROFILE.companyName,
          industry: SEEDED_RECRUITER_PROFILE.industry,
          companySize: SEEDED_RECRUITER_PROFILE.companySize,
          designation: SEEDED_RECRUITER_PROFILE.designation,
          website: SEEDED_RECRUITER_PROFILE.website,
        });
      }
      const user = await User.findById(req.user.id).select('name email phone avatar');
      return res.json({
        success: true,
        data: {
          ...profile.toObject(),
          id: profile._id,
          name: user?.name || req.user.name,
          email: user?.email || req.user.email,
          phone: user?.phone || '',
          avatar: user?.avatar || '',
        },
      });
    }

    return res.json({
      success: true,
      data: SEEDED_RECRUITER_PROFILE,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Recruiter Profile
export const updateRecruiterProfile = async (req, res) => {
  try {
    const payload = req.body;
    if (req.isDbConnected && req.user?.id) {
      let profile = await RecruiterProfile.findOne({ userId: req.user.id });
      if (!profile) {
        profile = new RecruiterProfile({ userId: req.user.id });
      }
      if (payload.companyName) profile.companyName = payload.companyName;
      if (payload.industry) profile.industry = payload.industry;
      if (payload.companySize) profile.companySize = payload.companySize;
      if (payload.designation) profile.designation = payload.designation;
      if (payload.website) profile.website = payload.website;
      await profile.save();

      if (payload.name || payload.phone || payload.avatar) {
        const userUpdates = {};
        if (payload.name) userUpdates.name = payload.name;
        if (payload.phone) userUpdates.phone = payload.phone;
        if (payload.avatar) userUpdates.avatar = payload.avatar;
        await User.findByIdAndUpdate(req.user.id, userUpdates);
      }

      const user = await User.findById(req.user.id).select('name email phone avatar');
      return res.json({
        success: true,
        message: 'Recruiter profile updated successfully!',
        data: {
          ...profile.toObject(),
          id: profile._id,
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          avatar: user?.avatar,
        },
      });
    }

    Object.assign(SEEDED_RECRUITER_PROFILE, payload);
    return res.json({
      success: true,
      message: 'Recruiter profile updated successfully!',
      data: SEEDED_RECRUITER_PROFILE,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Interview scheduling and status management
export const getInterviews = async (req, res) => {
  try {
    if (!req.isDbConnected) return res.status(503).json({ success: false, message: 'Interview management requires a connected database.' });
    const interviews = await Interview.find({ recruiterId: String(req.user.id) }).sort({ date: 1 }).lean();
    return res.json({ success: true, data: interviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getInterviewDetails = async (req, res) => {
  try {
    if (!req.isDbConnected) return res.status(503).json({ success: false, message: 'Interview management requires a connected database.' });
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      recruiterId: String(req.user.id),
    }).lean();
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found.' });
    return res.json({ success: true, data: interview });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createInterview = async (req, res) => {
  try {
    if (!req.isDbConnected) return res.status(503).json({ success: false, message: 'Interview management requires a connected database.' });
      const { applicationId, date, timeSlot, interviewType = 'Technical Screening', durationMinutes = 45, meetingLink = '', notes = '' } = req.body;
      if (
        typeof applicationId !== 'string' ||
        !applicationId.trim() ||
        typeof date !== 'string' ||
        Number.isNaN(new Date(date).getTime()) ||
        new Date(date) <= new Date() ||
        typeof timeSlot !== 'string' ||
        !timeSlot.trim() ||
        timeSlot.length > 100 ||
        typeof notes !== 'string' ||
        notes.length > 2000 ||
        typeof meetingLink !== 'string' ||
        !Number.isInteger(Number(durationMinutes)) ||
        Number(durationMinutes) < 15 ||
        Number(durationMinutes) > 240 ||
        (meetingLink && !/^https?:\/\/\S+$/i.test(meetingLink))
      ) {
        return res.status(400).json({ success: false, message: 'Provide a valid application, future date, time slot, duration, and optional meeting URL.' });
      }
      const application = await JobApplication.findOne({ applicationId });
      if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
      const job = await Job.findOne({ jobId: application.jobId, recruiterId: req.user.id });
      if (!job) return res.status(404).json({ success: false, message: 'Application not found.' });
      if (!['SHORTLISTED', 'INTERVIEW'].includes(application.status)) {
        return res.status(409).json({ success: false, message: 'Only shortlisted candidates can be scheduled for an interview.' });
      }
      const allowedTypes = ['Technical Screening', 'Coding Assessment Review', 'System Design Round', 'HR Final Round'];
      if (!allowedTypes.includes(interviewType)) {
        return res.status(400).json({ success: false, message: 'Invalid interview type.' });
      }
      const meetingDate = new Date(date);
      const interviewQuery = {
        applicationId,
        date: meetingDate,
        timeSlot: timeSlot.trim(),
        recruiterId: String(req.user.id),
      };
      let interview = await Interview.findOne(interviewQuery);
      const isNewInterview = !interview;
      if (!interview) {
        try {
          interview = await Interview.create({
            interviewId: `int_${new mongoose.Types.ObjectId().toString()}`,
            ...interviewQuery,
            jobId: job.jobId,
            jobTitle: job.title,
            company: job.company,
            candidateId: application.candidateId,
            candidateName: application.candidateName,
            recruiterName: req.user.name,
            interviewType,
            durationMinutes: Number(durationMinutes),
            meetingLink: meetingLink.trim(),
            notes: notes.trim(),
          });
        } catch (error) {
          if (error?.code !== 11000) throw error;
          interview = await Interview.findOne(interviewQuery);
          if (!interview) throw error;
        }
      }
      if (application.status !== 'INTERVIEW') {
        application.status = 'INTERVIEW';
        await application.save();
      }
      await createUserNotification({
        userId: application.candidateId,
        eventKey: `application:${application.applicationId}:status:INTERVIEW`,
        title: 'Application status updated',
        message: `Your application for ${job.title} is now at the interview stage.`,
        category: 'career',
        type: 'success',
        link: '/student/career/applications',
      });
      await createUserNotification({
        userId: application.candidateId,
        eventKey: `interview:${interview.interviewId}:scheduled`,
        title: 'Interview scheduled',
        message: `${job.title} interview is scheduled for ${new Date(date).toLocaleString()}.`,
        category: 'career',
        type: 'success',
        link: '/student/career/interviews',
      });
      if (isNewInterview) await Job.updateOne({ _id: job._id }, { $inc: { interviewCount: 1 } });
      return res.status(isNewInterview ? 201 : 200).json({ success: true, message: 'Interview scheduled successfully.', data: interview });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInterview = async (req, res) => {
  try {
    if (!req.isDbConnected) return res.status(503).json({ success: false, message: 'Interview management requires a connected database.' });
      const allowedFields = ['date', 'timeSlot', 'durationMinutes', 'meetingLink', 'notes', 'status', 'interviewType'];
      const entries = Object.entries(req.body || {});
      if (!entries.length || entries.some(([key]) => !allowedFields.includes(key))) {
        return res.status(400).json({ success: false, message: 'Provide valid interview update fields.' });
      }
      const interview = await Interview.findOne({
        interviewId: req.params.interviewId,
        recruiterId: String(req.user.id),
      });
      if (!interview) return res.status(404).json({ success: false, message: 'Interview not found.' });
      const before = `${interview.date.toISOString()}|${interview.timeSlot}|${interview.status}`;
      const updates = { ...req.body };
      if (updates.date !== undefined) {
        if (typeof updates.date !== 'string' || Number.isNaN(new Date(updates.date).getTime()) || new Date(updates.date) <= new Date()) {
          return res.status(400).json({ success: false, message: 'A future interview date is required.' });
        }
        updates.date = new Date(updates.date);
      }
      if (updates.status !== undefined && !['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(updates.status)) {
        return res.status(400).json({ success: false, message: 'Invalid interview status.' });
      }
      if (updates.timeSlot !== undefined && (typeof updates.timeSlot !== 'string' || !updates.timeSlot.trim())) {
        return res.status(400).json({ success: false, message: 'A valid interview time slot is required.' });
      }
      if (updates.timeSlot !== undefined && updates.timeSlot.length > 100) {
        return res.status(400).json({ success: false, message: 'Interview time slot must be 100 characters or fewer.' });
      }
      if (updates.durationMinutes !== undefined && (!Number.isInteger(Number(updates.durationMinutes)) || Number(updates.durationMinutes) < 15 || Number(updates.durationMinutes) > 240)) {
        return res.status(400).json({ success: false, message: 'Interview duration must be from 15 to 240 minutes.' });
      }
      if (updates.notes !== undefined && (typeof updates.notes !== 'string' || updates.notes.length > 2000)) {
        return res.status(400).json({ success: false, message: 'Interview notes must be 2000 characters or fewer.' });
      }
      if (updates.interviewType !== undefined && !['Technical Screening', 'Coding Assessment Review', 'System Design Round', 'HR Final Round'].includes(updates.interviewType)) {
        return res.status(400).json({ success: false, message: 'Invalid interview type.' });
      }
      if (updates.meetingLink !== undefined && (typeof updates.meetingLink !== 'string' || (updates.meetingLink && !/^https?:\/\/\S+$/i.test(updates.meetingLink)))) {
        return res.status(400).json({ success: false, message: 'Meeting link must be a valid HTTP or HTTPS URL.' });
      }
      Object.assign(interview, updates);
      await interview.save();
      const after = `${interview.date.toISOString()}|${interview.timeSlot}|${interview.status}`;
      if (before !== after) {
        await createUserNotification({
          userId: interview.candidateId,
          eventKey: `interview:${interview.interviewId}:updated:${after}`,
          title: interview.status === 'CANCELLED' ? 'Interview cancelled' : 'Interview updated',
          message: `${interview.jobTitle} interview details have changed.`,
          category: 'career',
          type: interview.status === 'CANCELLED' ? 'warning' : 'info',
          link: '/student/career/interviews',
        });
      }
      return res.json({ success: true, message: 'Interview updated successfully.', data: interview });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Recruiter messaging workspace
export const getRecruiterConversations = async (req, res) => {
  try {
    if (req.isDbConnected && req.user?.id) {
      const recruiterId = String(req.user.id);
      const jobs = await Job.find({ recruiterId }).select('jobId').lean();
      const applications = await JobApplication.find({ jobId: { $in: jobs.map((j) => j.jobId) } }).select('candidateId').lean();
      
      const sentOrReceived = await RecruiterMessage.find({
        $or: [{ senderId: recruiterId }, { receiverId: recruiterId }],
      }).lean();
      
      const candidateIdSet = new Set([
        ...applications.map((a) => String(a.candidateId)),
        ...sentOrReceived.map((m) => (m.senderId === recruiterId ? m.receiverId : m.senderId)),
      ]);

      const candidateIds = [...candidateIdSet].filter((id) => mongoose.isValidObjectId(id));
      const users = await User.find({ _id: { $in: candidateIds } }).select('name email avatar').lean();
      const usersById = new Map(users.map((u) => [String(u._id), u]));

      const conversations = await Promise.all(
        candidateIds.map(async (candidateId) => {
          const user = usersById.get(candidateId);
          if (!user) return null;

          const latestMessage = await RecruiterMessage.findOne({
            $or: [
              { senderId: recruiterId, receiverId: candidateId },
              { senderId: candidateId, receiverId: recruiterId },
            ],
          }).sort({ timestamp: -1 }).lean();

          const unreadCount = await RecruiterMessage.countDocuments({
            senderId: candidateId,
            receiverId: recruiterId,
            isRead: false,
          });

          return {
            conversationId: `${recruiterId}_${candidateId}`,
            candidateId,
            candidateName: user.name,
            candidateAvatar: user.avatar || '',
            unreadCount,
            lastMessageTime: latestMessage ? latestMessage.timestamp : null,
            lastMessage: latestMessage ? latestMessage.content : 'No messages yet',
          };
        })
      );

      return res.json({
        success: true,
        data: conversations.filter(Boolean),
      });
    }

    const conversations = SEEDED_RECRUITER_MESSAGES.map(({ messages, ...conversation }) => ({
      ...conversation,
      lastMessage: messages[messages.length - 1]?.text || '',
    }));
    return res.json({ success: true, data: conversations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecruiterMessageHistory = async (req, res) => {
  try {
    const { candidateId } = req.params;
    if (req.isDbConnected && req.user?.id) {
      const recruiterId = String(req.user.id);
      const user = await User.findById(candidateId).select('name email avatar').lean();
      if (!user) {
        return res.status(404).json({ success: false, message: 'Candidate not found' });
      }

      await RecruiterMessage.updateMany(
        { senderId: candidateId, receiverId: recruiterId, isRead: false },
        { $set: { isRead: true } }
      );

      const dbMessages = await RecruiterMessage.find({
        $or: [
          { senderId: recruiterId, receiverId: candidateId },
          { senderId: candidateId, receiverId: recruiterId },
        ],
      }).sort({ timestamp: 1 }).lean();

      return res.json({
        success: true,
        data: {
          conversationId: `${recruiterId}_${candidateId}`,
          candidateId,
          candidateName: user.name,
          candidateAvatar: user.avatar || '',
          unreadCount: 0,
          messages: dbMessages.map((m) => ({
            id: m.messageId,
            senderId: m.senderId,
            text: m.content,
            timestamp: m.timestamp,
          })),
        },
      });
    }

    const conversation = SEEDED_RECRUITER_MESSAGES.find(
      (item) => item.candidateId === req.params.candidateId
    );
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    conversation.unreadCount = 0;
    return res.json({ success: true, data: conversation });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendRecruiterMessage = async (req, res) => {
  try {
    const { candidateId, text } = req.body;
    if (!candidateId || !text) {
      return res.status(400).json({ success: false, message: 'candidateId and text are required' });
    }

    if (req.isDbConnected && req.user?.id) {
      const recruiterId = String(req.user.id);
      const candidate = await User.findById(candidateId).select('name');
      if (!candidate) {
        return res.status(404).json({ success: false, message: 'Candidate not found' });
      }

      const message = await RecruiterMessage.create({
        messageId: `rm_${Date.now()}`,
        senderId: recruiterId,
        receiverId: candidateId,
        candidateName: candidate.name,
        content: text.trim(),
        timestamp: new Date(),
        isRead: false,
      });

      await createUserNotification({
        userId: candidateId,
        eventKey: `message:recruiter:${message.messageId}`,
        title: 'New message from Recruiter',
        message: `${req.user.name || 'A recruiter'} sent you a message: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`,
        category: 'career',
        type: 'info',
        link: '/student/career',
      });

      return res.status(201).json({
        success: true,
        data: {
          id: message.messageId,
          senderId: message.senderId,
          text: message.content,
          timestamp: message.timestamp.toISOString(),
        },
      });
    }

    const conversation = SEEDED_RECRUITER_MESSAGES.find((item) => item.candidateId === candidateId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    const message = {
      id: `rm_${Date.now()}`,
      senderId: req.user?.id || 'rec_101',
      text,
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(message);
    conversation.lastMessageTime = 'Just now';
    return res.status(201).json({ success: true, data: message });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
