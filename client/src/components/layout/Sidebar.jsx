import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  Video,
  Users,
  Code2,
  Award,
  LineChart,
  BarChart3,
  Trophy,
  Briefcase,
  Bell,
  Settings,
  HelpCircle,
  MessageSquare,
  FileCheck,
  Building2,
  GraduationCap,
  Sparkles,
  X,
  ShieldCheck,
  FileText,
  UserCheck,
  Sliders,
  User,
  Calendar,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const role = user?.role || 'student';

  const navConfigs = {
    student: [
      { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { name: 'Courses', path: '/student/courses', icon: BookOpen },
      { name: 'My Learning / My Courses', path: '/student/my-courses', icon: GraduationCap },
      { name: 'Learning Path', path: '/student/learning-path', icon: Compass },
      { name: 'Practice Zone', path: '/student/practice', icon: Code2 },
      { name: 'Assessment Center', path: '/student/assessments', icon: FileCheck },
      { name: 'Exams & Assignments', path: '/student/exams', icon: FileText },
      { name: 'Student Performance', path: '/student/performance', icon: BarChart3 },
      { name: 'Leaderboard', path: '/student/leaderboard', icon: Trophy },
      { name: 'Live Classes', path: '/student/live-classes', icon: Video },
      { name: 'Mentor Connect', path: '/student/mentors', icon: Users },
      { name: 'My Messages', path: '/student/mentor-messages', icon: MessageSquare },
      { name: 'Certificates', path: '/student/certificates', icon: Award },
      { name: 'Skill Tracker', path: '/student/skills', icon: LineChart },
      { name: 'Career & Jobs', path: '/student/career', icon: Briefcase },
      { name: 'Notifications', path: '/student/notifications', icon: Bell },
      { name: 'Settings', path: '/student/settings', icon: Settings },
      { name: 'Help & Support', path: '/student/support', icon: HelpCircle },
    ],
    mentor: [
      { name: 'Dashboard', path: '/mentor/dashboard', icon: LayoutDashboard },
      { name: 'My Students', path: '/mentor/students', icon: GraduationCap },
      { name: 'Mentor Sessions', path: '/mentor/sessions', icon: Calendar },
      { name: 'Mentor Connect', path: '/mentor/connect', icon: UserCheck },
      { name: 'Messages', path: '/mentor/messages', icon: MessageSquare },
      { name: 'Mentor Profile', path: '/mentor/profile', icon: User },
      { name: 'Availability', path: '/mentor/availability', icon: Sliders },
      { name: 'Live Classes', path: '/mentor/live-classes', icon: Video },
      { name: 'Notifications', path: '/mentor/notifications', icon: Bell },
      { name: 'Settings', path: '/mentor/settings', icon: Settings },
      { name: 'Help & Support', path: '/mentor/support', icon: HelpCircle },
    ],
    recruiter: [
      { name: 'Dashboard', path: '/recruiter/dashboard', icon: LayoutDashboard },
      { name: 'Students', path: '/recruiter/students', icon: GraduationCap },
      { name: 'Skill Profiles', path: '/recruiter/skill-profiles', icon: ShieldCheck },
      { name: 'Candidates', path: '/recruiter/candidates', icon: Users },
      { name: 'Jobs', path: '/recruiter/jobs', icon: Briefcase },
      { name: 'Applications', path: '/recruiter/applications', icon: FileCheck },
      { name: 'Interviews', path: '/recruiter/interviews', icon: Calendar },
      { name: 'Internships', path: '/recruiter/internships', icon: Building2 },
      { name: 'Placement', path: '/recruiter/placement', icon: Award },
      { name: 'Messages', path: '/recruiter/messages', icon: MessageSquare },
      { name: 'Notifications', path: '/recruiter/notifications', icon: Bell },
      { name: 'Settings', path: '/recruiter/settings', icon: Settings },
      { name: 'Help & Support', path: '/recruiter/support', icon: HelpCircle },
    ],
  };

  const navItems = navConfigs[role] || navConfigs.student;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col justify-between border-r border-slate-200 bg-[#F0EEEA] text-slate-700 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        {/* TOP BRAND HEADER */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D2E0D3] text-[#405853] ring-1 ring-[#97B3AE]/40">
                <Sparkles className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div>
                <h1 className="flex items-center gap-1.5 text-lg font-bold tracking-wide text-slate-900">
                  FinTrack<span className="font-medium text-brand-700">Edu</span>
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                  {role} portal
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* NAVIGATION LINKS */}
          <div className="px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)] no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors duration-150 ${
                    isActive
                      ? 'bg-brand-100 font-semibold text-brand-950 ring-1 ring-inset ring-brand-200'
                      : 'font-medium text-slate-600 hover:bg-white/80 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isActive
                        ? 'text-brand-800'
                        : 'text-slate-500 group-hover:text-brand-800'
                    }`}
                  />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* BOTTOM USER ROLE & VERIFIED FOOTER */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/70 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-emerald-600" />
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Naan Mudhalvan</span> aligned platform
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
