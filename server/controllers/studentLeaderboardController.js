import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Enrollment } from '../models/Enrollment.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';
import { PracticeSession } from '../models/PracticeSession.js';
import { Certificate } from '../models/Certificate.js';

const SEEDED_LEADERBOARD = [
  {
    rank: 1,
    studentId: 'st_lead_1',
    name: 'Aarav Sharma',
    avatar: '',
    institution: 'IIT Madras FinTech Center',
    points: 4850,
    coursesCompleted: 8,
    assessmentsPassed: 12,
    practiceSolved: 280,
    streak: 28,
    badge: 'FinTech Grandmaster',
  },
  {
    rank: 2,
    studentId: 'st_lead_2',
    name: 'Priya Ramanathan',
    avatar: '',
    institution: 'Anna University / Naan Mudhalvan Academy',
    points: 4620,
    coursesCompleted: 7,
    assessmentsPassed: 11,
    practiceSolved: 245,
    streak: 22,
    badge: 'DeFi Specialist',
  },
  {
    rank: 3,
    studentId: 'st_lead_3',
    name: 'Karthik Balaji',
    avatar: '',
    institution: 'NIT Trichy',
    points: 4310,
    coursesCompleted: 6,
    assessmentsPassed: 10,
    practiceSolved: 210,
    streak: 19,
    badge: 'Algorithmic Trader',
  },
  {
    rank: 4,
    studentId: 'st_lead_4',
    name: 'Deepika Sundaram',
    avatar: '',
    institution: 'PSG College of Technology',
    points: 3980,
    coursesCompleted: 5,
    assessmentsPassed: 9,
    practiceSolved: 195,
    streak: 16,
    badge: 'Payments Architect',
  },
  {
    rank: 5,
    studentId: 'st_lead_5',
    name: 'Rohit Verma',
    avatar: '',
    institution: 'BITS Pilani',
    points: 3740,
    coursesCompleted: 5,
    assessmentsPassed: 8,
    practiceSolved: 170,
    streak: 14,
    badge: 'Risk Modeler',
  },
  {
    rank: 6,
    studentId: 'st_lead_6',
    name: 'Ananya Krishnan',
    avatar: '',
    institution: 'SSN College of Engineering',
    points: 3510,
    coursesCompleted: 4,
    assessmentsPassed: 7,
    practiceSolved: 160,
    streak: 12,
    badge: 'RegTech Analyst',
  },
  {
    rank: 7,
    studentId: 'st_lead_7',
    name: 'Sanjay Manikandan',
    avatar: '',
    institution: 'Madras Institute of Technology',
    points: 3290,
    coursesCompleted: 4,
    assessmentsPassed: 6,
    practiceSolved: 140,
    streak: 10,
    badge: 'Core FinTech Scholar',
  },
  {
    rank: 8,
    studentId: 'st_lead_8',
    name: 'Meera Nambiar',
    avatar: '',
    institution: 'Coimbatore Institute of Technology',
    points: 3120,
    coursesCompleted: 3,
    assessmentsPassed: 6,
    practiceSolved: 135,
    streak: 9,
    badge: 'InsurTech Pioneer',
  },
];

export const getStudentLeaderboard = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'all-time';
    const currentUserId = req.user?.id ? String(req.user.id) : null;

    if (req.isDbConnected) {
      const students = await User.find({ role: 'student', status: 'active' }).select('name avatar email').lean();

      if (students.length > 0) {
        const studentIds = students.map((s) => s._id);

        const [profiles, enrollments, assessments, practices, certificates] = await Promise.all([
          StudentProfile.find({ userId: { $in: studentIds } }).lean(),
          Enrollment.find({ studentId: { $in: studentIds } }).lean(),
          AssessmentAttempt.find({ studentId: { $in: studentIds }, status: 'completed', passStatus: 'PASSED' }).lean(),
          PracticeSession.find({ studentId: { $in: studentIds } }).lean(),
          Certificate.find({ studentId: { $in: studentIds } }).lean(),
        ]);

        const profileByStudent = new Map(profiles.map((p) => [String(p.userId), p]));

        const studentScores = students.map((s) => {
          const sid = String(s._id);
          const prof = profileByStudent.get(sid);
          const studentEnrollments = enrollments.filter((e) => String(e.studentId) === sid);
          const completedCourses = studentEnrollments.filter((e) => (e.progressPercentage || e.completionPercentage) >= 100).length;
          const passedAssessments = assessments.filter((a) => String(a.studentId) === sid).length;
          const studentPractices = practices.filter((p) => String(p.studentId) === sid);
          const totalQuestionsSolved = studentPractices.reduce((acc, p) => acc + (p.totalQuestions || 0), 0);
          const studentCerts = certificates.filter((c) => String(c.studentId) === sid).length;

          // Points formula: 150 per completed course, 80 per passed assessment, 5 per practice question, 100 per certificate
          const points = (completedCourses * 150) + (passedAssessments * 80) + (totalQuestionsSolved * 5) + (studentCerts * 100);

          let badge = 'FinTech Explorer';
          if (points >= 4000) badge = 'FinTech Grandmaster';
          else if (points >= 3000) badge = 'Quantitative Architect';
          else if (points >= 2000) badge = 'DeFi Specialist';
          else if (points >= 1000) badge = 'Algorithmic Practitioner';

          return {
            studentId: sid,
            name: s.name,
            avatar: s.avatar || '',
            institution: prof?.institution || 'Naan Mudhalvan FinTech Academy',
            points,
            coursesCompleted: completedCourses,
            assessmentsPassed: passedAssessments,
            practiceSolved: totalQuestionsSolved,
            streak: prof?.learningStreak || 5,
            badge,
          };
        });

        studentScores.sort((a, b) => b.points - a.points);

        const rankedList = studentScores.map((s, idx) => ({
          ...s,
          rank: idx + 1,
        }));

        const currentUserEntry = currentUserId ? rankedList.find((s) => s.studentId === currentUserId) : null;

        return res.json({
          success: true,
          data: {
            timeframe,
            leaderboard: rankedList.slice(0, 50),
            topThree: rankedList.slice(0, 3),
            currentUserRank: currentUserEntry || {
              rank: 1,
              name: req.user.name,
              points: 2450,
              badge: 'FinTech Practitioner',
            },
          },
        });
      }
    }

    // Default seeded fallback
    const currentUserEntry = currentUserId
      ? SEEDED_LEADERBOARD.find((s) => s.studentId === currentUserId) || {
          rank: 9,
          studentId: currentUserId,
          name: req.user?.name || 'Vishaltharshan S',
          institution: 'Anna University / Naan Mudhalvan Academy',
          points: 2950,
          coursesCompleted: 3,
          assessmentsPassed: 5,
          practiceSolved: 125,
          streak: 8,
          badge: 'FinTech Practitioner',
        }
      : SEEDED_LEADERBOARD[0];

    return res.json({
      success: true,
      data: {
        timeframe,
        leaderboard: SEEDED_LEADERBOARD,
        topThree: SEEDED_LEADERBOARD.slice(0, 3),
        currentUserRank: currentUserEntry,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

