'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function DailySummary() {
  const { collapsed } = useSidebar();
  const [summary, setSummary] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    work_completed: '',
    work_in_progress: '',
    blockers: '',
    tomorrow_plan: '',
  });

  const today = new Date().toISOString().split('T')[0];
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/daily-summary/my?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
        setForm({
          work_completed: data.summary.work_completed || '',
          work_in_progress: data.summary.work_in_progress || '',
          blockers: data.summary.blockers || '',
          tomorrow_plan: data.summary.tomorrow_plan || '',
        });
      }
      setAttendance(data.attendance);
      setTasks(data.tasks || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async (status) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/daily-summary/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, date: today, status, tasks: tasks.map(t => t._id) })
      });
      const data = await res.json();
      if (data.success) setSummary(data.summary);
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const formatHours = (hours) => {
    if (!hours) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const taskTime = tasks.reduce((sum, t) => sum + (t.total_logged_hours || 0), 0);
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const blockerTasks = tasks.filter(t => t.status === 'Blocked').length;
  const utilization = attendance?.work_hours > 0
    ? Math.min(Math.round((taskTime / attendance.work_hours) * 100), 100)
    : 0;
  const unallocated = Math.max((attendance?.work_hours || 0) - taskTime, 0);

  const checklist = [
    { label: 'All task timers stopped', done: true },
    { label: 'Completed work described', done: !!form.work_completed },
    { label: 'Blocker added', done: !!form.blockers },
    { label: 'Tomorrow plan added', done: !!form.tomorrow_plan },
  ];

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Daily Summary</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleSave('Draft')} disabled={submitting}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-60">
            Save Draft
          </button>
          <button onClick={() => handleSave('Submitted')} disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
            {submitting ? 'Submitting...' : 'Submit Summary'}
          </button>
        </div>
      </div>

      <div className="p-6 flex gap-6">

        {/* Left — Main */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">Daily Work Summary</h2>
                <p className="text-sm text-gray-400 mt-0.5">Submit structured daily progress using live task and attendance data</p>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-gray-800">{todayLabel}</h3>
                <p className="text-xs text-gray-400">One summary is required for each working day</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                summary?.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                summary?.status === 'Reviewed' ? 'bg-emerald-100 text-emerald-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {summary?.status || 'Draft'}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Attendance', value: formatHours(attendance?.work_hours), sub: attendance?.clock_in ? `${new Date(attendance.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${attendance?.clock_out ? new Date(attendance.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}` : 'Not clocked in' },
                { label: 'Task Time', value: formatHours(taskTime), sub: `${utilization}% of attendance` },
                { label: 'Tasks Worked', value: tasks.length, sub: `${completedTasks} completed` },
                { label: 'Blockers', value: blockerTasks, sub: blockerTasks > 0 ? 'Needs manager' : 'No blockers' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400">{stat.label}</p>
                  <p className="text-xl font-black text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Tasks Activity */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-700 mb-3">Today's task activity</h4>
              <div className="space-y-2">
                {tasks.slice(0, 5).map(task => (
                  <div key={task._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${
                        task.status === 'Completed' ? 'bg-blue-600' : 'bg-gray-200'
                      }`}>
                        {task.status === 'Completed' && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{task.title}</p>
                        <p className="text-xs text-gray-400">{task.status}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-600">{formatHours(task.total_logged_hours)}</span>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No tasks today</p>
                )}
              </div>
            </div>

            {/* Form Fields */}
            {[
              { label: 'Work completed today *', key: 'work_completed', placeholder: 'Describe what you completed today...' },
              { label: 'Work in progress', key: 'work_in_progress', placeholder: 'What is still in progress...' },
              { label: 'Blockers / help required', key: 'blockers', placeholder: 'Any blockers or help needed...' },
              { label: "Tomorrow's plan *", key: 'tomorrow_plan', placeholder: "What's your plan for tomorrow..." },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="mb-4">
                <label className="text-sm font-bold text-gray-700 mb-2 block">{label}</label>
                <textarea rows={3} value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="w-72 space-y-4">
          {/* Time Reconciliation */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
            <h3 className="font-bold text-gray-800 mb-4">Time reconciliation</h3>
            <div className="space-y-3">
              {[
                { label: 'Attendance hours', value: formatHours(attendance?.work_hours), color: 'text-gray-700' },
                { label: 'Recorded breaks', value: formatHours(attendance?.break_hours), color: 'text-gray-700' },
                { label: 'Task timer hours', value: formatHours(taskTime), color: 'text-gray-700' },
                { label: 'Unallocated time', value: formatHours(unallocated), color: unallocated > 0.5 ? 'text-amber-500' : 'text-gray-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-sm text-gray-400">{label}</span>
                  <span className={`text-sm font-bold ${color}`}>{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-400">Utilization</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">{utilization}%</span>
              </div>
            </div>
          </div>

          {/* Submission Checklist */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
            <h3 className="font-bold text-gray-800 mb-4">Submission checklist</h3>
            <div className="space-y-3">
              {checklist.map(({ label, done }) => (
                <div key={label} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                  <span className="text-sm text-gray-700">{label}</span>
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${done ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                    {done && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}