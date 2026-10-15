'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const barColor = (pct) => {
  if (pct >= 85) return 'bg-red-500';
  if (pct >= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
};

export default function FounderDashboard() {
  const { collapsed } = useSidebar();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    activeProjects: 0, overdueTasks: 0, blockedTasks: 0,
    presentToday: 0, totalEmployees: 0, taskUtilization: 0, pendingDecisions: 0
  });
  const [blockers, setBlockers] = useState([]);
  const [attendance, setAttendance] = useState({ onTime: 0, late: 0, absent: 0, onLeave: 0, avgHours: 0 });
  const [pendingActions, setPendingActions] = useState({
    taskReviews: 0, corrections: 0, leaveRequests: 0, missingSummaries: 0, atRiskProjects: 0
  });
  const [deptWorkload, setDeptWorkload] = useState([
    { dept: 'Engineering', pct: 91 },
    { dept: 'Design', pct: 76 },
    { dept: 'QA', pct: 64 },
    { dept: 'Marketing', pct: 83 },
    { dept: 'Operations', pct: 58 },
  ]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];

      const [projectsRes, tasksRes, attendanceRes, leavesRes, reviewsRes, correctionsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/tasks/projects/list`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/tasks/team`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/attendance/stats?date=${today}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/leave/all?status=Pending`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/tasks/review/list`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/attendance/corrections/all`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [projects, tasks, attendanceData, leaves, reviews, corrections] = await Promise.all([
        projectsRes.json(), tasksRes.json(), attendanceRes.json(),
        leavesRes.json(), reviewsRes.json(), correctionsRes.json(),
      ]);

      const allProjects = projects.projects || [];
      const allTasks = tasks.tasks || [];

      setStats({
        activeProjects: allProjects.filter(p => p.status === 'Active').length,
        overdueTasks: allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Completed').length,
        blockedTasks: allTasks.filter(t => t.status === 'Blocked').length,
        presentToday: attendanceData.stats?.present || 0,
        totalEmployees: (attendanceData.stats?.total) || 0,
        taskUtilization: 79,
        pendingDecisions: (reviews.stats?.pending || 0) + (leaves.total || 0),
      });

      setAttendance({
        onTime: attendanceData.stats?.present || 0,
        late: attendanceData.stats?.late || 0,
        absent: attendanceData.stats?.absent || 0,
        onLeave: attendanceData.stats?.on_leave || 0,
        avgHours: '7h 46m',
      });

      setPendingActions({
        taskReviews: reviews.stats?.pending || 0,
        corrections: corrections.stats?.pendingManager || 0,
        leaveRequests: leaves.total || 0,
        missingSummaries: 7,
        atRiskProjects: allProjects.filter(p => p.status === 'At Risk').length,
      });

      setBlockers(allTasks.filter(t => t.status === 'Blocked').slice(0, 3));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  const completedTrend = [12, 18, 15, 22, 20, 25, 28, 30];
  const plannedTrend = [20, 22, 24, 26, 25, 28, 30, 32];

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Founder Dashboard</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Daily Brief</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">Customize Dashboard</button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Founder Dashboard</h2>
          <p className="text-sm text-gray-400 mt-0.5">Company-wide operational health and action priorities</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
          {[
            { label: 'Active Projects', value: stats.activeProjects, sub: '4 at risk', subColor: 'text-red-500' },
            { label: 'Overdue Tasks', value: stats.overdueTasks, sub: '8 high priority', subColor: 'text-red-500' },
            { label: 'Blocked Tasks', value: stats.blockedTasks, sub: '3 critical', subColor: 'text-red-500' },
            { label: 'Present Today', value: `${stats.presentToday} / ${stats.totalEmployees}`, sub: `${stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}%`, subColor: 'text-gray-400' },
            { label: 'Task Utilization', value: `${stats.taskUtilization}%`, sub: '+4% this week', subColor: 'text-emerald-500' },
            { label: 'Pending Decisions', value: stats.pendingDecisions, sub: 'Reviews, leave, corrections', subColor: 'text-gray-400' },
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
              <p className="text-xs text-gray-400 font-medium">{card.label}</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
              <p className={`text-xs font-medium mt-1 ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Task Completion Trend */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Task completion trend</h3>
              <span className="text-xs text-gray-400">Last 8 weeks</span>
            </div>
            <div className="flex items-end gap-2 h-36 mb-2">
              {completedTrend.map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5 items-end" style={{ height: '100%' }}>
                    <div className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(val / 35) * 100}%` }} />
                    <div className="flex-1 bg-blue-200 rounded-t" style={{ height: `${(plannedTrend[idx] / 35) * 100}%` }} />
                  </div>
                  <span className="text-[9px] text-gray-400">{weeks[idx]}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Completed</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-200"></span> Planned</span>
            </div>
          </div>

          {/* Department Workload */}
          <div className="w-80 bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Department workload</h3>
              <span className="text-xs text-gray-400">Assigned capacity</span>
            </div>
            <div className="space-y-3">
              {deptWorkload.map(({ dept, pct }) => (
                <div key={dept}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{dept}</span>
                    <span className="font-bold text-gray-600">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Critical Blockers */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Critical blockers</h3>
              <button className="text-xs text-blue-600 font-bold hover:underline">View all {stats.blockedTasks}</button>
            </div>
            <div className="space-y-3">
              {blockers.length > 0 ? blockers.map(task => (
                <div key={task._id} className="border border-gray-100 rounded-xl p-3">
                  <p className="font-bold text-gray-800 text-sm">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{task.project_id?.name || 'No project'} · {task.assignees?.length || 0} tasks blocked</p>
                  {task.blocker_reason && (
                    <div className="mt-2 text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg font-medium">
                      {task.blocker_reason}
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-4">No critical blockers ✅</p>
              )}
            </div>
          </div>

          {/* Pending Management Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
            <h3 className="font-bold text-gray-800 mb-4">Pending management actions</h3>
            <div className="space-y-3">
              {[
                { label: 'Task reviews', value: pendingActions.taskReviews, href: '/tasks/review' },
                { label: 'Attendance corrections', value: pendingActions.corrections, href: '/attendance/correction-approval' },
                { label: 'Leave requests', value: pendingActions.leaveRequests, href: '/leaves' },
                { label: 'Missing summaries', value: pendingActions.missingSummaries, href: '/daily-summaries/missing' },
                { label: 'At-risk projects', value: pendingActions.atRiskProjects, href: '/tasks/projects' },
              ].map(({ label, value, href }) => (
                <div key={label}
                  onClick={() => router.push(href)}
                  className="flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded-lg p-1 transition-colors">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="font-bold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Today */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
            <h3 className="font-bold text-gray-800 mb-4">Attendance today</h3>
            <div className="space-y-3">
              {[
                { label: 'On time', value: attendance.onTime, color: 'bg-emerald-100 text-emerald-700' },
                { label: 'Late', value: attendance.late, color: 'bg-amber-100 text-amber-700' },
                { label: 'Absent', value: attendance.absent, color: 'bg-red-100 text-red-700' },
                { label: 'On leave', value: attendance.onLeave, color: 'bg-purple-100 text-purple-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${color}`}>{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Avg. hours</span>
                <span className="font-bold text-gray-800">{attendance.avgHours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Requiring Attention */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Projects requiring attention</h3>
            <button onClick={() => router.push('/tasks/projects')}
              className="text-xs text-blue-600 font-bold hover:underline">
              Open Project Portfolio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}