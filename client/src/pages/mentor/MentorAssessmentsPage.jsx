import React, { useEffect, useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  User,
  ExternalLink,
  Award,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Toast from '../../components/common/Toast';
import Avatar from '../../components/common/Avatar';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import {
  fetchMentorSubmissions,
  gradeMentorSubmissionApi,
} from '../../services/mentorAcademicService';

const MentorAssessmentsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });

  const loadSubmissions = () => {
    setLoading(true);
    fetchMentorSubmissions()
      .then((data) => setSubmissions(data || []))
      .catch(() => setToast({ type: 'error', message: 'Failed to load assignment submissions.' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const openGradeModal = (sub) => {
    setSelectedSub(sub);
    setGradeForm({
      marks: sub.marksObtained != null ? String(sub.marksObtained) : '',
      feedback: sub.feedback || '',
    });
    setIsModalOpen(true);
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;

    const marksNum = Number(gradeForm.marks);
    if (Number.isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      setToast({ type: 'error', message: 'Please enter valid marks from 0 to 100.' });
      return;
    }

    setSubmitting(true);
    try {
      await gradeMentorSubmissionApi(selectedSub.submissionId, {
        marksObtained: marksNum,
        feedback: gradeForm.feedback,
      });
      setToast({ type: 'success', message: 'Assignment graded successfully!' });
      setIsModalOpen(false);
      loadSubmissions();
    } catch {
      setToast({ type: 'error', message: 'Failed to grade submission.' });
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === 'submitted').length;
  const gradedCount = submissions.filter((s) => s.status === 'evaluated').length;

  return (
    <div className="space-y-8 pb-12">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast {...toast} onClose={() => setToast(null)} />
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Student Assignment Reviews
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review student code submissions, verify algorithmic solutions, and assign accredited grades.
          </p>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Submissions</span>
            <FileCheck className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">{submissions.length}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Awaiting Evaluation</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-amber-600">{pendingCount}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Graded & Completed</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-600">{gradedCount}</p>
        </div>
      </div>

      {/* SUBMISSIONS LIST */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">Submitted Assignments</h2>
          <p className="text-xs text-slate-500">Student answers, code implementations, and evaluation feedback</p>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingSkeleton className="h-64" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={FileCheck}
              title="No Submissions Yet"
              description="Student assignment submissions will appear here for your review and grading."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {submissions.map((sub) => {
              const isGraded = sub.status === 'evaluated';

              return (
                <div key={sub.submissionId} className="p-6 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar name={sub.studentName} size="sm" />
                        <div>
                          <p className="font-bold text-slate-900">{sub.studentName}</p>
                          <p className="text-xs text-slate-400">{sub.studentEmail}</p>
                        </div>
                        <Badge variant={isGraded ? 'success' : 'warning'}>
                          {isGraded ? 'EVALUATED' : 'NEEDS REVIEW'}
                        </Badge>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900">
                        {sub.assignmentTitle}
                      </h3>

                      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-700 max-w-2xl font-mono">
                        <span className="font-bold text-slate-400 font-sans block mb-1">Student Answer:</span>
                        {sub.content || 'No text content provided.'}
                        {sub.attachmentName && (
                          <div className="mt-2 text-brand-700 font-semibold flex items-center gap-1.5">
                            Attachment: {sub.attachmentName}
                          </div>
                        )}
                      </div>

                      {isGraded && (
                        <div className="flex items-center gap-3 text-xs pt-1">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                            Marks: {sub.marksObtained}/100
                          </span>
                          <span className="text-slate-500 italic">
                            Feedback: "{sub.feedback}"
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 self-end lg:self-center">
                      <Button
                        size="sm"
                        variant={isGraded ? 'outline' : 'primary'}
                        icon={Award}
                        onClick={() => openGradeModal(sub)}
                      >
                        {isGraded ? 'Update Grade' : 'Grade Submission'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GRADING MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Grade Assignment Submission"
      >
        {selectedSub && (
          <form onSubmit={handleGradeSubmit} className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-3 text-xs space-y-1">
              <p className="font-bold text-slate-800">{selectedSub.assignmentTitle}</p>
              <p className="text-slate-500">Student: {selectedSub.studentName} ({selectedSub.studentEmail})</p>
            </div>

            <Input
              label="Marks Obtained (0 to 100)"
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 95"
              value={gradeForm.marks}
              onChange={(e) => setGradeForm({ ...gradeForm, marks: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Evaluation Feedback & Recommendations
              </label>
              <textarea
                rows={4}
                className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-brand-500 focus:outline-none"
                placeholder="Constructive feedback on code structure, algorithmic efficiency, and edge case handling..."
                value={gradeForm.feedback}
                onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={submitting}>
                Save & Notify Student
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default MentorAssessmentsPage;

