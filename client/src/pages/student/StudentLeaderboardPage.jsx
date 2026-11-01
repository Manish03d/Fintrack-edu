import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Flame,
  BookOpen,
  CheckCircle2,
  Code2,
  Sparkles,
  ChevronUp,
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import { fetchStudentLeaderboard } from '../../services/leaderboardService';

const StudentLeaderboardPage = () => {
  const [timeframe, setTimeframe] = useState('all-time');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchStudentLeaderboard(timeframe)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setError('');
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.response?.data?.message || 'Failed to load leaderboard');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [timeframe]);

  if (loading) return <LoadingSkeleton className="h-[600px] rounded-3xl" />;
  if (error) return <ErrorState description={error} onRetry={() => window.location.reload()} />;

  const topThree = data?.topThree || [];
  const leaderboard = data?.leaderboard || [];
  const currentUserRank = data?.currentUserRank;

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-slate-900 to-brand-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-300 ring-1 ring-inset ring-brand-400/30">
              <Sparkles className="h-3.5 w-3.5" /> Naan Mudhalvan FinTech Honor Roll
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Student Leaderboard
            </h1>
            <p className="max-w-xl text-sm text-slate-300 leading-relaxed">
              Recognizing outstanding FinTech problem solvers, top assessment performers, and course completion pacesetters.
            </p>
          </div>

          {/* TIMEFRAME SELECTOR */}
          <div className="flex items-center gap-1 rounded-2xl bg-white/10 p-1.5 backdrop-blur-md self-start md:self-auto">
            {['all-time', 'monthly', 'weekly'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition-all ${
                  timeframe === tf
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tf.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* CURRENT USER STATUS HIGHLIGHT */}
        {currentUserRank && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/10 border border-white/10 px-5 py-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-400 font-extrabold text-navy-950 shadow-sm">
                #{currentUserRank.rank}
              </div>
              <div>
                <p className="text-xs text-slate-300">Your Current Standing</p>
                <p className="text-sm font-bold text-white">{currentUserRank.name} · <span className="text-brand-300">{currentUserRank.badge}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Trophy className="h-4 w-4" />
                <span>{currentUserRank.points?.toLocaleString()} XP</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-emerald-400">
                <ChevronUp className="h-4 w-4" /> Top Tier Contender
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PODIUM TOP 3 */}
      {topThree.length >= 3 && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* #2 SILVER */}
          <div className="relative order-2 md:order-1 flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-sm">
                #2
              </div>
              <Medal className="h-6 w-6 text-slate-400" />
            </div>
            <div className="my-5 text-center space-y-2">
              <Avatar name={topThree[1].name} size="lg" className="mx-auto ring-4 ring-slate-100" />
              <h3 className="font-bold text-slate-900 text-base">{topThree[1].name}</h3>
              <p className="text-xs text-slate-500 line-clamp-1">{topThree[1].institution}</p>
              <Badge variant="neutral" className="mt-1">{topThree[1].badge}</Badge>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-center">
              <span className="text-xl font-extrabold text-slate-900">{topThree[1].points.toLocaleString()}</span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">XP</span>
            </div>
          </div>

          {/* #1 GOLD */}
          <div className="relative order-1 md:order-2 flex flex-col justify-between rounded-3xl border-2 border-amber-300 bg-gradient-to-b from-amber-50/50 via-white to-white p-6 shadow-lg hover:shadow-xl transition-shadow scale-100 md:-translate-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-amber-950 font-black text-base shadow-sm">
                #1
              </div>
              <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                <Trophy className="h-4 w-4 text-amber-600" /> Leader
              </div>
            </div>
            <div className="my-5 text-center space-y-2">
              <Avatar name={topThree[0].name} size="xl" className="mx-auto ring-4 ring-amber-300" />
              <h3 className="font-extrabold text-slate-900 text-lg">{topThree[0].name}</h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">{topThree[0].institution}</p>
              <Badge variant="warning" className="mt-1">{topThree[0].badge}</Badge>
            </div>
            <div className="rounded-2xl bg-amber-100/60 p-3.5 text-center">
              <span className="text-2xl font-black text-amber-950">{topThree[0].points.toLocaleString()}</span>
              <span className="text-xs text-amber-800 ml-1.5 font-bold">XP</span>
            </div>
          </div>

          {/* #3 BRONZE */}
          <div className="relative order-3 flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold text-sm">
                #3
              </div>
              <Medal className="h-6 w-6 text-amber-700" />
            </div>
            <div className="my-5 text-center space-y-2">
              <Avatar name={topThree[2].name} size="lg" className="mx-auto ring-4 ring-amber-100" />
              <h3 className="font-bold text-slate-900 text-base">{topThree[2].name}</h3>
              <p className="text-xs text-slate-500 line-clamp-1">{topThree[2].institution}</p>
              <Badge variant="neutral" className="mt-1">{topThree[2].badge}</Badge>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-center">
              <span className="text-xl font-extrabold text-slate-900">{topThree[2].points.toLocaleString()}</span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">XP</span>
            </div>
          </div>
        </div>
      )}

      {/* FULL RANKINGS TABLE */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">Rankings Directory</h2>
          <p className="text-xs text-slate-500">Updated continuously based on student learning activity</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Rank</th>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Institution</th>
                <th className="px-6 py-3.5 text-center">Courses</th>
                <th className="px-6 py-3.5 text-center">Assessments</th>
                <th className="px-6 py-3.5 text-center">Practice</th>
                <th className="px-6 py-3.5 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.map((student) => {
                const isCurrent = currentUserRank && (student.studentId === currentUserRank.studentId || student.name === currentUserRank.name);
                return (
                  <tr
                    key={student.studentId || student.rank}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isCurrent ? 'bg-brand-50/60 font-semibold' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-extrabold text-slate-900">
                      {student.rank === 1 && <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-amber-950 text-xs">1</span>}
                      {student.rank === 2 && <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-slate-800 text-xs">2</span>}
                      {student.rank === 3 && <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-900 text-xs">3</span>}
                      {student.rank > 3 && <span className="text-slate-500 font-bold ml-1.5">#{student.rank}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {student.name}
                            {isCurrent && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] text-brand-800 font-bold">You</span>}
                          </div>
                          <span className="text-xs text-brand-700">{student.badge}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-[220px] truncate">
                      {student.institution}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        <BookOpen className="h-3 w-3" /> {student.coursesCompleted}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-xl bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700">
                        <CheckCircle2 className="h-3 w-3" /> {student.assessmentsPassed}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        <Code2 className="h-3 w-3" /> {student.practiceSolved}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-extrabold text-slate-900 text-base">
                        {student.points.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1">XP</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentLeaderboardPage;

