'use client';

import React, { useState, useEffect } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const tagColors = [
  'bg-indigo-600', 'bg-cyan-600', 'bg-emerald-600',
  'bg-amber-500', 'bg-red-600', 'bg-purple-600', 'bg-blue-600'
];

const formatTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatHours = (hours) => {
  if (!hours) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

const statusStyle = (status) => {
  switch (status) {
    case 'Present': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Late': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'Absent': return 'bg-red-50 text-red-700 border-red-100';
    case 'Half Day': return 'bg-orange-50 text-orange-700 border-orange-100';
    case 'Leave': return 'bg-purple-50 text-purple-700 border-purple-100';
    default: return 'bg-gray-50 text-gray-700 border-gray-100';
  }
};

// isHolidaySelected prop add kiya
export default function DailyTable({ selectedDate, isHolidaySelected = false }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);

  const user = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || '{}')
    : {};

  const isAdmin = user.role === 'admin';
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!selectedDate) return;
    fetchDailyData();
  }, [selectedDate]);

  const fetchDailyData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const url = isAdmin
        ? `${BACKEND_URL}/attendance/team?date=${selectedDate}`
        : `${BACKEND_URL}/attendance/my?date=${selectedDate}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        if (isAdmin) {
          setList(data.records || []);
        } else {
          const records = (data.records || []).map(r => ({
            ...r,
            employee_id: { name: user.name, role: user.role || '—' }
          }));
          setList(records);
          setTodayRecord(records[0] || null);
        }
      }
    } catch (err) {
      console.error('DailyTable fetch error:', err);
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      fetchDailyData();
    } catch (err) {
      alert('Server error');
    } finally {
      setActionLoading(false);
    }
  };

  const formattedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    : '—';

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
      <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex flex-wrap justify-between items-center text-xs text-gray-500 gap-2 font-medium">
        <div>{formattedDate} • Work: 10:00 AM - 6:00 PM • Break: 1:00 PM - 2:00 PM • Grace: 10 min</div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> On Time</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Late</span>

          {/* ✅ Holiday wale din buttons nahi dikhenge */}
          {!isAdmin && isToday && !isHolidaySelected && (
            <div className="flex gap-2 ml-4">
              {!todayRecord?.clock_in && (
                <button
                  onClick={() => handleAttendance('clock-in')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                >
                  {actionLoading ? '...' : '● Clock In'}
                </button>
              )}
              {todayRecord?.clock_in && !todayRecord?.clock_out && (
                <button
                  onClick={() => handleAttendance('clock-out')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  {actionLoading ? '...' : '■ Clock Out'}
                </button>
              )}
              {todayRecord?.clock_in && !todayRecord?.clock_out && !todayRecord?.break_in && (
                <button
                  onClick={() => handleAttendance('break-in')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 disabled:opacity-60 transition-colors"
                >
                  Break In
                </button>
              )}
              {todayRecord?.break_in && !todayRecord?.break_out && (
                <button
                  onClick={() => handleAttendance('break-out')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  Break Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm font-medium">Loading...</div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm font-medium">No attendance records found</div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30 text-xs text-gray-400 font-bold tracking-wider uppercase">
                <th className="p-4 pl-6">Team Member</th>
                <th className="p-4">Clock In</th>
                <th className="p-4">Break In</th>
                <th className="p-4">Break Out</th>
                <th className="p-4">Clock Out</th>
                <th className="p-4">Work Hours</th>
                <th className="p-4 pr-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {list.map((m, idx) => {
                const name = m.employee_id?.name || 'Unknown';
                const role = m.employee_id?.role || '—';
                const color = tagColors[idx % tagColors.length];

                return (
                  <tr key={m._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs`}>
                        {getInitials(name)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{name}</div>
                        <div className="text-xs text-gray-400 font-medium">{role}</div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-emerald-600">
                      {m.clock_in ? `● ${formatTime(m.clock_in)}` : '—'}
                    </td>
                    <td className="p-4 text-gray-500">{formatTime(m.break_in)}</td>
                    <td className="p-4 text-gray-500">{formatTime(m.break_out)}</td>
                    <td className={`p-4 font-semibold ${m.is_late ? 'text-amber-500' : 'text-emerald-600'}`}>
                      {formatTime(m.clock_out)}
                      {m.late_minutes > 0 && (
                        <span className="text-xs font-medium ml-1">(-{m.late_minutes}m)</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-gray-700">{formatHours(m.work_hours)}</td>
                    <td className="p-4 pr-6">
                      <span className={`text-xs px-2.5 py-1 rounded-md font-bold border ${statusStyle(m.status)}`}>
                        {m.status || 'Absent'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}