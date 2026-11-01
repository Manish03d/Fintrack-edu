import { SEEDED_PERFORMANCE_STATS } from '../seed/practiceSeedData.js';
import { PracticeSession } from '../models/PracticeSession.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';
import { Enrollment } from '../models/Enrollment.js';

// Get Student Performance Dashboard Data
export const getStudentPerformance = async (req, res) => {
  try {
    if (req.isDbConnected && req.user?.id) {
      const studentId = req.user.id;

      const [practiceSessions, assessmentAttempts, enrollments] = await Promise.all([
        PracticeSession.find({ studentId }).sort({ createdAt: -1 }).lean(),
        AssessmentAttempt.find({ studentId, status: 'completed' }).lean(),
        Enrollment.find({ studentId }).lean(),
      ]);

      if (practiceSessions.length > 0 || assessmentAttempts.length > 0) {
        // Calculate Practice Accuracy & Questions Solved
        const totalPracticeQuestions = practiceSessions.reduce((acc, s) => acc + (s.totalQuestions || 0), 0);
        const totalPracticeCorrect = practiceSessions.reduce((acc, s) => acc + (s.correctAnswersCount || 0), 0);
        const practiceAccuracy = totalPracticeQuestions > 0 ? Math.round((totalPracticeCorrect / totalPracticeQuestions) * 100) : 0;

        // Calculate Assessment Score
        const assessmentScore = assessmentAttempts.length > 0
          ? Math.round(assessmentAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / assessmentAttempts.length)
          : practiceAccuracy;

        // Calculate Course Completion
        const avgCourseProgress = enrollments.length > 0
          ? Math.round(enrollments.reduce((acc, e) => acc + (e.progressPercentage || e.completionPercentage || 0), 0) / enrollments.length)
          : 0;

        // Overall Score
        const overallPerformanceScore = Math.round(
          practiceAccuracy * 0.4 + assessmentScore * 0.4 + avgCourseProgress * 0.2
        );

        // Group practice sessions by topic
        const topicMap = new Map();
        for (const s of practiceSessions) {
          const t = s.topic || 'General FinTech';
          if (!topicMap.has(t)) {
            topicMap.set(t, { total: 0, correct: 0 });
          }
          const item = topicMap.get(t);
          item.total += (s.totalQuestions || 0);
          item.correct += (s.correctAnswersCount || 0);
        }

        const topicPerformance = [];
        const strengthAreas = [];
        const weakAreas = [];

        for (const [topic, data] of topicMap.entries()) {
          const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
          let status = 'Good';
          if (acc >= 80) {
            status = 'Strong';
            strengthAreas.push(topic);
          } else if (acc < 70) {
            status = 'Weak';
            weakAreas.push(topic);
          }
          topicPerformance.push({
            topic,
            accuracy: acc,
            status,
            solved: data.total,
          });
        }

        // If not enough topics, backfill default categories from seed
        if (topicPerformance.length === 0) {
          topicPerformance.push(...SEEDED_PERFORMANCE_STATS.topicPerformance);
          strengthAreas.push(...SEEDED_PERFORMANCE_STATS.strengthAreas);
          weakAreas.push(...SEEDED_PERFORMANCE_STATS.weakAreas);
        }

        // Weekly Activity breakdown (last 7 days)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekActivityMap = new Map(days.map((d) => [d, { solved: 0, correct: 0 }]));
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        for (const s of practiceSessions) {
          const created = new Date(s.createdAt);
          if (created >= oneWeekAgo) {
            const dayName = days[created.getDay()];
            const entry = weekActivityMap.get(dayName);
            if (entry) {
              entry.solved += (s.totalQuestions || 0);
              entry.correct += (s.correctAnswersCount || 0);
            }
          }
        }

        const weeklyActivity = days.map((day) => {
          const e = weekActivityMap.get(day);
          const acc = e.solved > 0 ? Math.round((e.correct / e.solved) * 100) : 0;
          return {
            day,
            solved: e.solved,
            accuracy: acc,
          };
        });

        // Recommendations based on weak areas
        const smartRecommendations = (weakAreas.length > 0 ? weakAreas : ['Cybersecurity']).map((topic, idx) => ({
          id: `rec_dyn_${idx + 1}`,
          weakTopic: topic,
          title: `Strengthen ${topic} Skills`,
          description: `Your accuracy in ${topic} indicates room for improvement. Take a targeted practice set.`,
          recommendedCourse: `${topic} Foundations & Architecture`,
          practiceTopic: topic,
          actionText: `Start ${topic} Practice`,
        }));

        return res.json({
          success: true,
          data: {
            overallPerformanceScore,
            practiceAccuracy,
            assessmentScore,
            questionsSolved: totalPracticeQuestions,
            learningToPracticeConversion: `${avgCourseProgress}%`,
            weeklyActivity,
            topicPerformance,
            strengthAreas: strengthAreas.length ? strengthAreas : ['FinTech Basics'],
            weakAreas: weakAreas.length ? weakAreas : ['Advanced Models'],
            improvementTrend: `${practiceAccuracy >= 75 ? '+' : ''}${practiceAccuracy - 70}% performance trend`,
            smartRecommendations,
          },
        });
      }
    }

    return res.json({
      success: true,
      data: SEEDED_PERFORMANCE_STATS,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
