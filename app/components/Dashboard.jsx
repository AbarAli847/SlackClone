'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '../context/SidebarContext';
import { Users, CheckSquare, Calendar, FileText, Clock, AlertTriangle } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Dashboard() {
  const { collapsed } = useSidebar();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const [adminStats, setAdminStats] = useState({
    totalUsers: 0, pendingLeaves: 0, todayPresent: 0,
    todayAbsent: 0, todayLate: 0, totalTasks: 0,
    overdueTasks: 0, blockedTasks: 0,
  });

  const [userStats, setUserStats] = useState({
    myTasks: 0, completedTasks: 0, inProgressTasks: 0,
    pendingLeaves: 0, approvedLeaves: 0,
    todayStatus: null, activeTimer: null,
  });

  const [attendanceRecord, setAttendanceRecord] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (!savedUser?._id) { router.push('/login'); return; }
      setUser(savedUser);
      setIsAdmin(savedUser.role === 'admin');
    } catch (e) {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (isAdmin) {
      fetchAdminStats();
    } else {
      fetchUserStats();
    }
  }, [user, isAdmin]);

  // ✅ Live timer
  useEffect(() => {
    if (attendanceRecord?.clock_in && !attendanceRecord?.clock_out) {
      timerRef.current = setInterval(() => {
        const start = new Date(attendanceRecord.clock_in).getTime();
        const now = Date.now();
        setElapsed(Math.floor((now - start) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [attendanceRecord]);

  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];

      const [attendanceRes, leavesRes, usersRes, tasksRes, overdueRes, blockedRes] = await Promise.all([
        fetch(`${BACKEND_URL}/attendance/stats?date=${today}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/leave/all?status=Pending`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/auth/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/tasks/team`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/tasks/overdue`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/tasks/blocked`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [attendance, leaves, users, tasks, overdue, blocked] = await Promise.all([
        attendanceRes.json(), leavesRes.json(), usersRes.json(),
        tasksRes.json(), overdueRes.json(), blockedRes.json(),
      ]);

      setAdminStats({
        totalUsers: users.users?.length || 0,
        pendingLeaves: leaves.total || 0,
        todayPresent: attendance.stats?.present || 0,
        todayAbsent: attendance.stats?.absent || 0,
        todayLate: attendance.stats?.late || 0,
        totalTasks: tasks.tasks?.length || 0,
        overdueTasks: overdue.tasks?.length || 0,
        blockedTasks: blocked.tasks?.length || 0,
      });
    } catch (err) {
      console.error('Admin stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];

      const [leavesRes, attendanceRes, tasksRes, timerRes] = await Promise.all([
        fetch(`${BACKEND_URL}/leave/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/attendance/my?date=${today}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/tasks/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/tasks/active-timer`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [leaves, attendance, tasks, timer] = await Promise.all([
        leavesRes.json(), attendanceRes.json(),
        tasksRes.json(), timerRes.json(),
      ]);

      const allTasks = tasks.tasks || [];
      const allLeaves = leaves.leaves || [];
      const todayRecord = attendance.records?.[0] || null;
      setAttendanceRecord(todayRecord);

      setUserStats({
        myTasks: allTasks.length,
        completedTasks: allTasks.filter(t => t.status === 'Completed').length,
        inProgressTasks: allTasks.filter(t => t.status === 'In Progress').length,
        pendingLeaves: allLeaves.filter(l => l.status === 'Pending').length,
        approvedLeaves: allLeaves.filter(l => l.status === 'Approved').length,
        todayStatus: todayRecord?.status || null,
        activeTimer: timer.timeLog || null,
      });
    } catch (err) {
      console.error('User stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async (action) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/attendance/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      fetchUserStats();
    } catch (err) {
      alert('Server error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatElapsed = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getWorkHours = () => {
    if (!attendanceRecord?.clock_in) return '0 hrs 0 mins';
    const start = new Date(attendanceRecord.clock_in).getTime();
    const end = attendanceRecord.clock_out ? new Date(attendanceRecord.clock_out).getTime() : Date.now();
    const totalMins = Math.floor((end - start) / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h} hrs ${m} mins`;
  };

  // Circle progress
  const getProgress = () => {
    if (!attendanceRecord?.clock_in) return 0;
    const shiftHours = 8;
    const start = new Date(attendanceRecord.clock_in).getTime();
    const end = attendanceRecord.clock_out ? new Date(attendanceRecord.clock_out).getTime() : Date.now();
    const worked = (end - start) / 3600000;
    return Math.min((worked / shiftHours) * 100, 100);
  };

  const progress = getProgress();
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-400">Loading...</div>
    </div>
  );

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen p-4 md:p-6 font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="border-b border-gray-200 pb-3 mb-6">
        <span className="text-gray-600 font-semibold text-xs">Dashboard</span>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900">
          {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">Loading...</div>
      ) : isAdmin ? (

        // ── Admin Dashboard ──
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: adminStats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Pending Leaves', value: adminStats.pendingLeaves, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Total Tasks', value: adminStats.totalTasks, icon: CheckSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Overdue Tasks', value: adminStats.overdueTasks, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
            ].map((card, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4">
                <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="font-bold text-gray-800 mb-4">Today's Attendance</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Present', value: adminStats.todayPresent, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Late', value: adminStats.todayLate, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Absent', value: adminStats.todayAbsent, color: 'text-red-600', bg: 'bg-red-50' },
              ].map((item, idx) => (
                <div key={idx} className={`${item.bg} rounded-xl p-4 text-center`}>
                  <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="font-bold text-gray-800 mb-4">Task Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-black text-red-600">{adminStats.overdueTasks}</p>
                  <p className="text-xs text-gray-500 font-medium">Overdue Tasks</p>
                </div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-black text-orange-600">{adminStats.blockedTasks}</p>
                  <p className="text-xs text-gray-500 font-medium">Blocked Tasks</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      ) : (

        // ── User Dashboard ──
        <div className="space-y-6">

          {/* ✅ Attendance Widget */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <p className="text-xs text-gray-400 font-medium mb-1">Attendance</p>
            <p className="text-sm text-gray-500 mb-4">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}, {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>

            <div className="flex flex-col items-center gap-4">
              {/* Circle Progress */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="absolute top-0 left-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#f0fdf4" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke="#22c55e" strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="text-center z-10">
                  {attendanceRecord?.clock_in && !attendanceRecord?.clock_out ? (
                    <>
                      <p className="text-xs text-gray-400 font-medium">Live</p>
                      <p className="text-lg font-black text-gray-800 font-mono">{formatElapsed(elapsed)}</p>
                    </>
                  ) : attendanceRecord?.clock_out ? (
                    <>
                      <p className="text-xs text-gray-400 font-medium">Total</p>
                      <p className="text-sm font-black text-emerald-600">{getWorkHours()}</p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-gray-400">Not In</p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="text-center">
                {attendanceRecord?.clock_in && !attendanceRecord?.clock_out ? (
                  <p className="text-xl font-black text-gray-800">
                    {formatTime(attendanceRecord.clock_in)} : <span className="text-emerald-600">Clocked In ✅</span>
                  </p>
                ) : attendanceRecord?.clock_out ? (
                  <p className="text-xl font-black text-gray-800">
                    {formatTime(attendanceRecord.clock_out)} : <span className="text-blue-600">Clock-out ✅</span>
                  </p>
                ) : (
                  <p className="text-xl font-black text-gray-400">Not Clocked In</p>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col items-center gap-1 text-sm text-gray-500">
                <span className="bg-gray-100 px-4 py-1 rounded-full font-medium">
                  Production: {attendanceRecord?.clock_in ? getWorkHours() : 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  Clock In Time: {formatTime(attendanceRecord?.clock_in)}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                {!attendanceRecord?.clock_in && (
                  <button
                    onClick={() => handleAttendance('clock-in')}
                    disabled={actionLoading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors"
                  >
                    <Clock size={16} /> Clock In
                  </button>
                )}
                {attendanceRecord?.clock_in && !attendanceRecord?.clock_out && (
                  <>
                    <button
                      onClick={() => handleAttendance('break-in')}
                      disabled={actionLoading}
                      className="flex items-center gap-2 bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-600 disabled:opacity-60 transition-colors"
                    >
                      ⏸ Pause
                    </button>
                    <button
                      onClick={() => handleAttendance('clock-out')}
                      disabled={actionLoading}
                      className="flex items-center gap-2 bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-800 disabled:opacity-60 transition-colors"
                    >
                      🔄 Clock Out
                    </button>
                  </>
                )}
                {attendanceRecord?.clock_out && (
                  <div className="bg-emerald-50 text-emerald-700 px-6 py-2.5 rounded-xl font-bold text-sm border border-emerald-200">
                    ✅ Day Complete
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Timer */}
          {userStats.activeTimer && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-center gap-4">
              <Clock className="w-8 h-8 text-indigo-500 animate-pulse" />
              <div>
                <p className="text-xs text-indigo-400 font-medium">Task Timer Running</p>
                <p className="font-bold text-indigo-800">{userStats.activeTimer.task_id?.title || 'Task'}</p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'My Tasks', value: userStats.myTasks, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'In Progress', value: userStats.inProgressTasks, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Completed', value: userStats.completedTasks, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Pending Leaves', value: userStats.pendingLeaves, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Approved Leaves', value: userStats.approvedLeaves, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((card, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
                <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center font-black text-lg ${card.color} mb-2`}>
                  {card.value}
                </div>
                <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}