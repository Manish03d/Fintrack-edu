import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Wrapper
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Landing Page
import LandingPage from '../pages/landing/LandingPage';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyOtp from '../pages/auth/VerifyOtp';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import OAuthCallback from '../pages/auth/OAuthCallback';
import Unauthorized from '../pages/auth/Unauthorized';
import NotFound from '../pages/auth/NotFound';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import CourseDiscoveryPage from '../pages/student/CourseDiscoveryPage';
import CourseDetailsPage from '../pages/student/CourseDetailsPage';
import StudentLearningPlayer from '../pages/student/StudentLearningPlayer';
import MyCoursesPage from '../pages/student/MyCoursesPage';
import StudentProgressPage from '../pages/student/StudentProgressPage';
import LearningPathPage from '../pages/student/LearningPathPage';
import PracticeZonePage from '../pages/student/PracticeZonePage';
import PracticeQuestionPage from '../pages/student/PracticeQuestionPage';
import PracticeResultPage from '../pages/student/PracticeResultPage';
import AssessmentCenterPage from '../pages/student/AssessmentCenterPage';
import AssessmentDetailsPage from '../pages/student/AssessmentDetailsPage';
import AssessmentExamPage from '../pages/student/AssessmentExamPage';
import AssessmentResultPage from '../pages/student/AssessmentResultPage';
import ExamsAndAssignmentsPage from '../pages/student/ExamsAndAssignmentsPage';
import StudentPerformancePage from '../pages/student/StudentPerformancePage';
import StudentLiveClassesPage from '../pages/student/StudentLiveClassesPage';
import LiveClassDetailsPage from '../pages/student/LiveClassDetailsPage';
import LiveClassRoomPage from '../pages/student/LiveClassRoomPage';
import StudentPlaceholder from '../pages/student/StudentPlaceholder';
import StudentCertificatesPage from '../pages/student/StudentCertificatesPage';
import StudentSkillsPage from '../pages/student/StudentSkillsPage';
import StudentLeaderboardPage from '../pages/student/StudentLeaderboardPage';
import CareerDashboardPage from '../pages/student/CareerDashboardPage';
import CareerJobsPage from '../pages/student/CareerJobsPage';
import CareerJobDetailsPage from '../pages/student/CareerJobDetailsPage';
import CareerApplicationsPage from '../pages/student/CareerApplicationsPage';
import CareerInterviewsPage from '../pages/student/CareerInterviewsPage';
import CareerProfilePage from '../pages/student/CareerProfilePage';
import NotificationCenterPage from '../pages/student/NotificationCenterPage';
import StudentSettingsPage from '../pages/student/StudentSettingsPage';
import StudentSupportPage from '../pages/student/StudentSupportPage';
import CertificateVerificationPage from '../pages/CertificateVerificationPage';
import StudentMentorConnectPage from '../pages/student/mentor/StudentMentorConnectPage';
import StudentMentorProfilePage from '../pages/student/mentor/StudentMentorProfilePage';
import StudentMentorBookingPage from '../pages/student/mentor/StudentMentorBookingPage';
import StudentMentorSessionsPage from '../pages/student/mentor/StudentMentorSessionsPage';
import StudentMentorSessionDetailsPage from '../pages/student/mentor/StudentMentorSessionDetailsPage';
import StudentMentorMessagesPage from '../pages/student/mentor/StudentMentorMessagesPage';
import StudentMentorFeedbackPage from '../pages/student/mentor/StudentMentorFeedbackPage';

// Mentor Pages
import MentorDashboard from '../pages/mentor/MentorDashboard';
import MentorStudentsPage from '../pages/mentor/MentorStudentsPage';
import StudentDetailPage from '../pages/mentor/StudentDetailPage';
import MentorSessionsPage from '../pages/mentor/MentorSessionsPage';
import SessionDetailPage from '../pages/mentor/SessionDetailPage';
import NewSessionPage from '../pages/mentor/NewSessionPage';
import MentorConnectPage from '../pages/mentor/MentorConnectPage';
import MentorMessagesPage from '../pages/mentor/MentorMessagesPage';
import MentorProfilePage from '../pages/mentor/MentorProfilePage';
import MentorAvailabilityPage from '../pages/mentor/MentorAvailabilityPage';
import MentorPlaceholder from '../pages/mentor/MentorPlaceholder';

// Recruiter Pages
import RecruiterDashboard from '../pages/recruiter/RecruiterDashboard';
import RecruiterPlaceholder from '../pages/recruiter/RecruiterPlaceholder';
import RecruiterCandidatesPage from '../pages/recruiter/RecruiterCandidatesPage';
import RecruiterCandidateProfilePage from '../pages/recruiter/RecruiterCandidateProfilePage';
import RecruiterJobsPage from '../pages/recruiter/RecruiterJobsPage';
import RecruiterJobFormPage from '../pages/recruiter/RecruiterJobFormPage';
import RecruiterJobDetailsPage from '../pages/recruiter/RecruiterJobDetailsPage';
import RecruiterApplicationsPage from '../pages/recruiter/RecruiterApplicationsPage';
import RecruiterInterviewsPage from '../pages/recruiter/RecruiterInterviewsPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/verify/:verificationId" element={<CertificateVerificationPage />} />

      {/* PROTECTED STUDENT ROUTES */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['student']} />}>
          <Route path="/student" element={<AppLayout />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="courses" element={<CourseDiscoveryPage />} />
            <Route path="courses/:courseId" element={<CourseDetailsPage />} />
            <Route path="learn/:courseId/:lessonId" element={<StudentLearningPlayer />} />
            <Route path="my-courses" element={<MyCoursesPage />} />
            <Route path="learning-path" element={<LearningPathPage />} />
            <Route path="progress" element={<StudentProgressPage />} />
            <Route path="performance" element={<StudentPerformancePage />} />
            <Route path="practice" element={<PracticeZonePage />} />
            <Route path="practice/:practiceId" element={<PracticeQuestionPage />} />
            <Route path="practice/:practiceId/result" element={<PracticeResultPage />} />
            <Route path="assessments" element={<AssessmentCenterPage />} />
            <Route path="assessments/:assessmentId" element={<AssessmentDetailsPage />} />
            <Route path="assessments/:assessmentId/start" element={<AssessmentExamPage />} />
            <Route path="assessments/:assessmentId/result" element={<AssessmentResultPage />} />
            <Route path="exams" element={<ExamsAndAssignmentsPage />} />
            <Route path="assignments" element={<ExamsAndAssignmentsPage />} />
            <Route path="live-classes" element={<StudentLiveClassesPage />} />
            <Route path="live-classes/:classId" element={<LiveClassDetailsPage />} />
            <Route path="live-classes/:classId/room" element={<LiveClassRoomPage />} />
            <Route path="mentors" element={<StudentMentorConnectPage />} />
            <Route path="mentors/:mentorId/book" element={<StudentMentorBookingPage />} />
            <Route path="mentors/:mentorId" element={<StudentMentorProfilePage />} />
            <Route path="mentor-sessions" element={<StudentMentorSessionsPage />} />
            <Route path="mentor-sessions/:sessionId" element={<StudentMentorSessionDetailsPage />} />
            <Route path="mentor-sessions/:sessionId/feedback" element={<StudentMentorFeedbackPage />} />
            <Route path="mentor-messages" element={<StudentMentorMessagesPage />} />
            <Route path="mentor-messages/:mentorId" element={<StudentMentorMessagesPage />} />
            <Route path="certificates" element={<StudentCertificatesPage />} />
            <Route path="skills" element={<StudentSkillsPage />} />
            <Route path="leaderboard" element={<StudentLeaderboardPage />} />
            <Route path="career" element={<CareerDashboardPage />} />
            <Route path="career/jobs" element={<CareerJobsPage />} />
            <Route path="career/jobs/:jobId" element={<CareerJobDetailsPage />} />
            <Route path="career/applications" element={<CareerApplicationsPage />} />
            <Route path="career/interviews" element={<CareerInterviewsPage />} />
            <Route path="career/profile" element={<CareerProfilePage />} />
            <Route path="notifications" element={<NotificationCenterPage />} />
            <Route path="settings" element={<StudentSettingsPage />} />
            <Route path="support" element={<StudentSupportPage />} />
          </Route>
        </Route>
      </Route>

      {/* PROTECTED MENTOR ROUTES */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['mentor']} />}>
          <Route path="/mentor" element={<AppLayout />}>
            <Route index element={<Navigate to="/mentor/dashboard" replace />} />
            <Route path="dashboard" element={<MentorDashboard />} />
            <Route path="students" element={<MentorStudentsPage />} />
            <Route path="students/:studentId" element={<StudentDetailPage />} />
            <Route path="sessions" element={<MentorSessionsPage />} />
            <Route path="sessions/new" element={<NewSessionPage />} />
            <Route path="sessions/:sessionId" element={<SessionDetailPage />} />
            <Route path="connect" element={<MentorConnectPage />} />
            <Route path="messages" element={<MentorMessagesPage />} />
            <Route path="profile" element={<MentorProfilePage />} />
            <Route path="availability" element={<MentorAvailabilityPage />} />
            <Route path="live-classes" element={<MentorPlaceholder />} />
            <Route path="assessments" element={<MentorPlaceholder />} />
            <Route path="progress" element={<MentorPlaceholder />} />
            <Route path="notifications" element={<NotificationCenterPage />} />
            <Route path="settings" element={<MentorPlaceholder />} />
            <Route path="support" element={<MentorPlaceholder />} />
          </Route>
        </Route>
      </Route>

      {/* PROTECTED RECRUITER ROUTES */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['recruiter']} />}>
          <Route path="/recruiter" element={<AppLayout />}>
            <Route index element={<Navigate to="/recruiter/dashboard" replace />} />
            <Route path="dashboard" element={<RecruiterDashboard />} />
            <Route path="students" element={<RecruiterPlaceholder />} />
            <Route path="skill-profiles" element={<RecruiterPlaceholder />} />
            <Route path="candidates" element={<RecruiterCandidatesPage />} />
            <Route path="candidates/:candidateId" element={<RecruiterCandidateProfilePage />} />
            <Route path="jobs" element={<RecruiterJobsPage />} />
            <Route path="jobs/new" element={<RecruiterJobFormPage />} />
            <Route path="jobs/:jobId/edit" element={<RecruiterJobFormPage />} />
            <Route path="jobs/:jobId" element={<RecruiterJobDetailsPage />} />
            <Route path="applications" element={<RecruiterApplicationsPage />} />
            <Route path="interviews" element={<RecruiterInterviewsPage />} />
            <Route path="internships" element={<RecruiterPlaceholder />} />
            <Route path="placement" element={<RecruiterPlaceholder />} />
            <Route path="messages" element={<RecruiterPlaceholder />} />
            <Route path="notifications" element={<NotificationCenterPage />} />
            <Route path="settings" element={<RecruiterPlaceholder />} />
            <Route path="support" element={<RecruiterPlaceholder />} />
          </Route>
        </Route>
      </Route>

      {/* 404 CATCH-ALL */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
