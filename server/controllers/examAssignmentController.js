import { SEEDED_EXAMS, SEEDED_ASSIGNMENTS } from '../seed/practiceSeedData.js';
import { AssignmentSubmission } from '../models/AssignmentSubmission.js';
import { Assignment } from '../models/Assignment.js';
import { createUserNotification } from '../services/notificationService.js';

// Get Exams & Assignments Academic Dashboard
export const getExamsAndAssignments = async (req, res) => {
  try {
    let assignments = [...SEEDED_ASSIGNMENTS];

    if (req.isDbConnected && req.user?.id) {
      const submissions = await AssignmentSubmission.find({ studentId: req.user.id }).lean();
      const submissionByAssignment = new Map(submissions.map((s) => [s.assignmentId, s]));

      assignments = assignments.map((assignment) => {
        const sub = submissionByAssignment.get(assignment.assignmentId);
        if (sub) {
          return {
            ...assignment,
            submissionStatus: sub.status === 'evaluated' ? 'Evaluated' : 'Submitted',
            submissionId: sub.submissionId,
            submittedAt: sub.submittedAt,
            marks: sub.marksObtained,
            feedback: sub.feedback || 'Under evaluation by mentor.',
            content: sub.content,
            attachmentName: sub.attachmentName,
          };
        }
        return assignment;
      });
    }

    return res.json({
      success: true,
      data: {
        exams: SEEDED_EXAMS,
        assignments,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Submit Assignment
export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content, attachmentName } = req.body;

    const assignment = SEEDED_ASSIGNMENTS.find((a) => a.assignmentId === assignmentId) || SEEDED_ASSIGNMENTS[0];

    if (req.isDbConnected && req.user?.id) {
      let submission = await AssignmentSubmission.findOne({ assignmentId, studentId: req.user.id });
      if (submission) {
        submission.content = content || submission.content;
        submission.attachmentName = attachmentName || submission.attachmentName;
        submission.submittedAt = new Date();
        submission.status = 'submitted';
        await submission.save();
      } else {
        submission = await AssignmentSubmission.create({
          submissionId: `sub_${Date.now()}`,
          assignmentId,
          studentId: req.user.id,
          content: content || 'Assignment response content',
          attachmentName: attachmentName || 'solution_file.pdf',
          submittedAt: new Date(),
          status: 'submitted',
        });
      }

      await createUserNotification({
        userId: req.user.id,
        eventKey: `assignment:${submission.submissionId}:submitted`,
        title: 'Assignment Submitted',
        message: `Your assignment "${assignment.title}" has been successfully submitted for review.`,
        category: 'learning',
        type: 'success',
        link: '/student/exams',
      });

      return res.json({
        success: true,
        message: 'Assignment submitted successfully!',
        data: {
          submissionId: submission.submissionId,
          assignmentId,
          title: assignment.title,
          content: submission.content,
          attachmentName: submission.attachmentName,
          submittedAt: submission.submittedAt.toISOString(),
          submissionStatus: 'Submitted',
          marks: submission.marksObtained,
          feedback: submission.feedback || 'Under evaluation by mentor.',
        },
      });
    }

    return res.json({
      success: true,
      message: 'Assignment submitted successfully!',
      data: {
        submissionId: `sub_${Date.now()}`,
        assignmentId,
        title: assignment.title,
        content,
        attachmentName: attachmentName || 'solution_file.pdf',
        submittedAt: new Date().toISOString(),
        submissionStatus: 'Submitted',
        marks: null,
        feedback: 'Submission received. Under evaluation.',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
