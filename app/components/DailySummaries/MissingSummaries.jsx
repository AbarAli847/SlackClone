'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-indigo-500'];
const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const statusStyle = (status) => {
  switch (status) {
    case 'Pending': return 'bg-red-100 text-red-700';
    case 'Late': return 'bg-amber-100 text-amber-700';
    case 'Not Due': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-500';
  }
};

export default function MissingSummaries() {
  const { collapsed } = useSidebar();
  const [missing, setMissing] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchMissing(); }, []);

  const fetchMissing = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${BACKEND_URL}/daily-summary/missing?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMissing(data.missing || []);
      setStats(data.stats || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleNotify = async (employeeId) => {
    alert(`Reminder sent to employee!`);
  };

  const formatHours = (hours) => {
    if (!hours) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' });

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Missing Summaries</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Notify Department</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">Send All Reminders</button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Missing Daily Summaries</h2>
          <p className="text-sm text-gray-400 mt-0.5">Identify pending, late, leave and exempt employees</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
          {[
            { label: 'Required', value: stats.required || 0, sub: 'Working employees', subColor: 'text-gray-400' },
            { label: 'Submitted', value: stats.submitted || 0, sub: `${stats.required > 0 ? Math.round((stats.submitted / stats.required) * 100) : 0}%`, subColor: 'text-gray-400' },
            { label: 'Pending', value: stats.pending || 0, sub: 'Needs reminder', subColor: 'text-red-500' },
            { label: 'Late Submission', value: stats.late || 0, sub: 'After shift end', subColor: 'text-gray-400' },
            { label: 'On Leave', value: stats.on_leave || 0, sub: 'Exempt', subColor: 'text-gray-400' },
            { label: 'Holiday / Off', value: stats.holiday || 0, sub: 'Exempt', subColor: 'text-gray-400' },
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
              <p className="text-xs text-gray-400 font-medium">{card.label}</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
              <p className={`text-xs font-medium mt-1 ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-800">Pending summaries · {today}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Reminder sent automatically 30 minutes before shift end</p>
            </div>
            <div className="flex gap-3">
              <select className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none">
                <option>All departments</option>
              </select>
              <select className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none">
                <option>Pending only</option>
                <option>All statuses</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold uppercase">
                    <th className="p-4 pl-6">Employee</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Shift End</th>
                    <th className="p-4">Attendance</th>
                    <th className="p-4">Task Time</th>
                    <th className="p-4">Last Reminder</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {missing.map((m, idx) => (
                    <tr key={m.employee._id} className="hover:bg-gray-50/50">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold`}>
                            {getInitials(m.employee.name)}
                          </div>
                          <p className="font-bold text-gray-800">{m.employee.name}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{m.employee.department || 'General'}</td>
                      <td className="p-4 text-sm text-gray-600">{m.shift_end || '6:00 PM'}</td>
                      <td className="p-4 text-sm text-gray-600">{formatHours(m.attendance?.work_hours)}</td>
                      <td className="p-4 text-sm text-gray-600">{formatHours(m.task_time)}</td>
                      <td className="p-4 text-sm text-gray-400">{m.last_reminder || 'Not sent'}</td>
                      <td className="p-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${statusStyle(m.status)}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6">
                        <button onClick={() => handleNotify(m.employee._id)}
                          className="text-xs text-blue-600 font-bold hover:underline">
                          Notify
                        </button>
                      </td>
                    </tr>
                  ))}
                  {missing.length === 0 && (
                    <tr><td colSpan={8} className="p-10 text-center text-gray-400">All summaries submitted! ✅</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}