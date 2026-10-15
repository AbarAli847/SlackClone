'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-indigo-500'];
const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const statusStyle = (status) => {
  switch (status) {
    case 'Submitted': return 'bg-blue-100 text-blue-700';
    case 'Reviewed': return 'bg-emerald-100 text-emerald-700';
    case 'Changes Requested': return 'bg-red-100 text-red-700';
    case 'Pending': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-500';
  }
};

export default function SummaryReview() {
  const { collapsed } = useSidebar();
  const [summaries, setSummaries] = useState([]);
  const [stats, setStats] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => { fetchSummaries(); }, []);

  const fetchSummaries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${BACKEND_URL}/daily-summary/team?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSummaries(data.summaries || []);
      setStats(data.stats || {});
      if (data.summaries?.length > 0) setSelected(data.summaries[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleReview = async (status) => {
    if (!selected?.summary?._id) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/daily-summary/review?id=${selected.summary._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, reviewer_note: reviewNote })
      });
      setReviewNote('');
      fetchSummaries();
    } catch (err) { console.error(err); }
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
          <span className="text-gray-600 font-semibold">Summary Review</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Send Reminder</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">Review Oldest</button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Daily Summary Review</h2>
          <p className="text-sm text-gray-400 mt-0.5">Review daily output, time use and blockers by employee</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
          {[
            { label: 'Submitted', value: stats.submitted || 0, sub: `of ${stats.total || 0} required`, subColor: 'text-gray-400' },
            { label: 'Pending', value: stats.pending || 0, sub: 'Reminder due', subColor: 'text-red-500' },
            { label: 'Reviewed', value: stats.reviewed || 0, sub: '9 waiting', subColor: 'text-gray-400' },
            { label: 'Changes Requested', value: stats.changesRequested || 0, sub: 'Awaiting resubmission', subColor: 'text-gray-400' },
            { label: 'Blockers Raised', value: stats.blockers || 0, sub: '3 critical', subColor: 'text-red-500' },
            { label: 'Avg. Utilization', value: '79%', sub: '+4%', subColor: 'text-emerald-500' },
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
              <p className="text-xs text-gray-400 font-medium">{card.label}</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
              <p className={`text-xs font-medium mt-1 ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Left — Team List */}
          <div className="w-96 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Team summaries · {today}</h3>
              <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                <option>All departments</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                    <th className="p-3 pl-4">Employee</th>
                    <th className="p-3">Att.</th>
                    <th className="p-3">Task</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {summaries.map((s, idx) => (
                    <tr key={s.employee._id}
                      onClick={() => setSelected(s)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${selected?.employee._id === s.employee._id ? 'bg-blue-50' : ''}`}>
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold`}>
                            {getInitials(s.employee.name)}
                          </div>
                          <p className="font-bold text-gray-800 text-xs">{s.employee.name}</p>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-gray-600">{formatHours(s.attendance?.work_hours)}</td>
                      <td className="p-3 text-xs text-gray-600">{formatHours(s.task_time)}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          s.summary?.status ? statusStyle(s.summary.status) : 'bg-amber-100 text-amber-700'
                        }`}>
                          {s.summary?.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right — Detail */}
          {selected ? (
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{selected.employee.name}</h3>
                  <p className="text-xs text-gray-400">
                    {selected.summary ? `Submitted · ${utilization || 82}% utilization` : 'Not submitted yet'}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${statusStyle(selected.summary?.status || 'Pending')}`}>
                  {selected.summary?.status || 'Pending'}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Attendance', value: formatHours(selected.attendance?.work_hours) },
                  { label: 'Task time', value: formatHours(selected.task_time) },
                  { label: 'Completed tasks', value: selected.completed_tasks },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-bold text-gray-800 mt-1">{value}</p>
                  </div>
                ))}
              </div>

              {selected.summary && (
                <>
                  {/* Completed Work */}
                  {selected.summary.work_completed && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2">Completed work</p>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{selected.summary.work_completed}</p>
                    </div>
                  )}

                  {/* Blocker */}
                  {selected.summary.blockers && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2">Blocker</p>
                      <div className="border border-gray-100 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-bold text-gray-800">{selected.summary.blockers}</p>
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Needs Manager</span>
                        </div>
                        <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700">
                          Create Task from Blocker
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tomorrow Plan */}
                  {selected.summary.tomorrow_plan && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2">Tomorrow's plan</p>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{selected.summary.tomorrow_plan}</p>
                    </div>
                  )}
                </>
              )}

              {/* Reviewer Note */}
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">Add reviewer note</p>
                <textarea value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Add review note..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none resize-none" />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => handleReview('Changes Requested')}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700">
                  Request Changes
                </button>
                <button className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50">
                  Escalate Blocker
                </button>
                <button onClick={() => handleReview('Reviewed')}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700">
                  Mark Reviewed
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-xs flex items-center justify-center text-gray-400">
              Select an employee to review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}