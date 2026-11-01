import React, { useEffect, useState } from 'react';
import {
  Video,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  Plus,
  Play,
  CheckCircle,
  XCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Toast from '../../components/common/Toast';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import {
  fetchMentorLiveClasses,
  createMentorLiveClassApi,
  updateMentorLiveClassStatusApi,
} from '../../services/mentorAcademicService';

const MentorLiveClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    durationMinutes: 60,
    meetingLink: '',
    agenda: '',
  });

  const loadClasses = () => {
    setLoading(true);
    fetchMentorLiveClasses()
      .then((data) => setClasses(data || []))
      .catch(() => setToast({ type: 'error', message: 'Failed to load mentor live classes.' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleStatusChange = async (classId, newStatus) => {
    try {
      await updateMentorLiveClassStatusApi(classId, newStatus);
      setToast({ type: 'success', message: `Class status updated to ${newStatus}.` });
      loadClasses();
    } catch {
      setToast({ type: 'error', message: 'Failed to update class status.' });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.scheduledAt) {
      setToast({ type: 'error', message: 'Please provide title and scheduled date/time.' });
      return;
    }

    setSubmitting(true);
    try {
      await createMentorLiveClassApi(formData);
      setToast({ type: 'success', message: 'Live class scheduled successfully!' });
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        scheduledAt: '',
        durationMinutes: 60,
        meetingLink: '',
        agenda: '',
      });
      loadClasses();
    } catch {
      setToast({ type: 'error', message: 'Failed to schedule live class.' });
    } finally {
      setSubmitting(false);
    }
  };

  const scheduledCount = classes.filter((c) => c.status === 'scheduled').length;
  const liveCount = classes.filter((c) => c.status === 'live').length;
  const completedCount = classes.filter((c) => c.status === 'completed').length;
  const totalAttendees = classes.reduce((acc, c) => acc + (c.attendeesCount || 0), 0);

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
            Live Classes Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Host live interactive lectures, technical Q&A sessions, and trading floor simulations.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Schedule Live Class
        </Button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Scheduled</span>
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">{scheduledCount}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Currently Live</span>
            <Video className="h-5 w-5 text-red-500 animate-pulse" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">{liveCount}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">{completedCount}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Attendees</span>
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">{totalAttendees}</p>
        </div>
      </div>

      {/* CLASS ROSTER */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Live Class Sessions</h2>

        {loading ? (
          <LoadingSkeleton className="h-96 rounded-3xl" />
        ) : classes.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No Live Classes Scheduled"
            description="Schedule your first live video session with students."
            actionLabel="Schedule Now"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {classes.map((cls) => {
              const isLive = cls.status === 'live';
              const isScheduled = cls.status === 'scheduled';
              const isCompleted = cls.status === 'completed';

              return (
                <div
                  key={cls.id || cls._id}
                  className={`flex flex-col justify-between rounded-3xl border p-6 transition-all ${
                    isLive
                      ? 'border-red-300 bg-gradient-to-br from-red-50/40 via-white to-white shadow-md ring-2 ring-red-400/30'
                      : 'border-slate-200 bg-white shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={isLive ? 'error' : isCompleted ? 'success' : isScheduled ? 'brand' : 'neutral'}
                      >
                        {isLive && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-red-500 animate-ping" />}
                        {cls.status.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Users className="h-4 w-4" />
                        <span>{cls.attendeesCount || 0} students</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{cls.title}</h3>
                    <p className="text-xs text-brand-700 font-semibold">{cls.course?.title || 'General FinTech Session'}</p>
                    <p className="text-sm text-slate-500 line-clamp-2">{cls.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(cls.scheduledAt).toLocaleDateString()} at {new Date(cls.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {cls.durationMinutes} mins
                      </span>
                    </div>

                    {cls.agenda?.length > 0 && (
                      <div className="rounded-2xl bg-slate-50 p-3 text-xs space-y-1">
                        <span className="font-bold text-slate-700">Agenda Topics:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                          {cls.agenda.slice(0, 3).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <a
                      href={cls.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open Room
                    </a>

                    <div className="flex items-center gap-2">
                      {isScheduled && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={Play}
                            onClick={() => handleStatusChange(cls.id || cls._id, 'live')}
                          >
                            Go Live
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatusChange(cls.id || cls._id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {isLive && (
                        <Button
                          size="sm"
                          variant="danger"
                          icon={CheckCircle}
                          onClick={() => handleStatusChange(cls.id || cls._id, 'completed')}
                        >
                          End Session
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SCHEDULE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Live Class"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Session Title"
            placeholder="e.g. Algorithmic Order Execution Strategies"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="Session scope and key takeaways..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Date & Time
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-slate-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                required
              />
            </div>

            <Input
              label="Duration (Minutes)"
              type="number"
              min="15"
              max="240"
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
              required
            />
          </div>

          <Input
            label="Meeting URL (Google Meet / Zoom / WebRTC)"
            placeholder="https://meet.google.com/xyz-abc-def"
            value={formData.meetingLink}
            onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Agenda Topics (one per line)
            </label>
            <textarea
              rows={3}
              className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="Order book mechanisms&#10;Latency considerations&#10;Live backtesting demonstration"
              value={formData.agenda}
              onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting}>
              Schedule Class
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MentorLiveClassesPage;

