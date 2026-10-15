'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function AttendanceCorrections() {
  const { collapsed } = useSidebar();
  const [myCorrections, setMyCorrections] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState('new'); // new | my
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({
    requested_clock_in: '',
    requested_clock_out: '',
    correction_type: 'Missing clock-out',
    attendance_date: new Date().toISOString().split('T')[0],
    reason: '',
    manager_id: '',
    work_location: 'Office',
  });

  useEffect(() => {
    fetchTodayRecord();
    fetchMyCorrections();
    fetchManagers();
  }, []);

  const fetchTodayRecord = async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${BACKEND_URL}/attendance/my?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTodayRecord(data.records?.[0] || null);
    } catch (err) { console.error(err); }
  };

  const fetchMyCorrections = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/attendance/corrections/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMyCorrections(data.corrections || []);
    } catch (err) { console.error(err); }
  };

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setManagers((data.users || []).filter(u => u.role === 'admin'));
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (status) => {
    if (!form.reason) { alert('Reason zaroori hai!'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/attendance/corrections/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, status })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setForm({
        requested_clock_in: '', requested_clock_out: '',
        correction_type: 'Missing clock-out',
        attendance_date: new Date().toISOString().split('T')[0],
        reason: '', manager_id: '', work_location: 'Office',
      });
      fetchMyCorrections();
      setView('my');
    } catch (err) { alert('Server error'); }
    finally { setSubmitting(false); }
  };

  const formatTime = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const statusStyle = (status) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'Pending Manager': return 'bg-amber-100 text-amber-700';
      case 'Pending HR': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Attendance Correction</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setView('my')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${view === 'my' ? 'bg-gray-100 text-gray-800' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            My Requests
          </button>
          <button onClick={() => setView('new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            New Correction
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Attendance Corrections</h2>
          <p className="text-sm text-gray-400 mt-0.5">Request correction for missing or incorrect attendance records</p>
        </div>

        {view === 'new' ? (
          <div className="flex gap-6">
            {/* Left — Form */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800">New correction request</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">Draft</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Requested clock-in</label>
                    <input type="time" value={form.requested_clock_in}
                      onChange={e => setForm(p => ({ ...p, requested_clock_in: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Requested clock-out</label>
                    <input type="time" value={form.requested_clock_out}
                      onChange={e => setForm(p => ({ ...p, requested_clock_out: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Correction type</label>
                    <select value={form.correction_type}
                      onChange={e => setForm(p => ({ ...p, correction_type: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                      {['Missing clock-in', 'Missing clock-out', 'Wrong time', 'Wrong break', 'Other'].map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Attendance date</label>
                    <input type="date" value={form.attendance_date}
                      onChange={e => setForm(p => ({ ...p, attendance_date: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Reason *</label>
                    <textarea rows={3} value={form.reason}
                      onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                      placeholder="Explain the reason for correction..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Manager</label>
                    <select value={form.manager_id}
                      onChange={e => setForm(p => ({ ...p, manager_id: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                      <option value="">Select Manager</option>
                      {managers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Work location</label>
                    <select value={form.work_location}
                      onChange={e => setForm(p => ({ ...p, work_location: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                      {['Office', 'Remote', 'Home'].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Supporting evidence</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
                      <p className="text-sm text-gray-400">+ Upload screenshot, email or supporting file</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={() => handleSubmit('Draft')} disabled={submitting}
                    className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-60">
                    Save Draft
                  </button>
                  <button onClick={() => handleSubmit('Pending Manager')} disabled={submitting}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right — Current Record + Approval Flow */}
            <div className="w-80 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
                <h3 className="font-bold text-gray-800 mb-4">Current attendance record</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Shift', value: '09:00 - 18:00', color: 'text-gray-700' },
                    { label: 'Clock-in', value: todayRecord?.clock_in ? formatTime(todayRecord.clock_in) : 'Not clocked in', color: 'text-emerald-600' },
                    { label: 'Break', value: todayRecord?.break_in ? `${formatTime(todayRecord.break_in)} - ${formatTime(todayRecord.break_out) || '—'}` : '—', color: 'text-gray-700' },
                    { label: 'Clock-out', value: todayRecord?.clock_out ? formatTime(todayRecord.clock_out) : 'Missing', color: todayRecord?.clock_out ? 'text-gray-700' : 'text-red-500' },
                    { label: 'Status', value: todayRecord?.status || 'No Record' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">{label}</span>
                      {label === 'Status' ? (
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                          todayRecord?.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                          !todayRecord?.clock_out ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {value}
                        </span>
                      ) : (
                        <span className={`text-sm font-bold ${color}`}>{value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
                <h3 className="font-bold text-gray-800 mb-4">Approval flow</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Employee submits correction', status: 'Pending' },
                    { label: 'Manager verifies request', status: 'Not started' },
                    { label: 'HR approves and updates record', status: 'Not started' },
                  ].map(({ label, status }, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${
                        status === 'Pending' ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{label}</p>
                        <p className="text-xs text-gray-400">{status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* My Corrections List */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">My Correction Requests</h3>
            </div>
            {myCorrections.length === 0 ? (
              <div className="p-10 text-center text-gray-400">No correction requests yet</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold uppercase">
                    <th className="p-4 pl-6">Date</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Requested</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4 pr-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {myCorrections.map(c => (
                    <tr key={c._id} className="hover:bg-gray-50/50">
                      <td className="p-4 pl-6 font-bold text-gray-800 text-sm">{c.attendance_date}</td>
                      <td className="p-4 text-sm text-gray-600">{c.correction_type}</td>
                      <td className="p-4 text-sm text-gray-600">
                        {c.requested_clock_in && `In: ${c.requested_clock_in}`}
                        {c.requested_clock_out && ` Out: ${c.requested_clock_out}`}
                      </td>
                      <td className="p-4 text-sm text-gray-500 max-w-xs truncate">{c.reason}</td>
                      <td className="p-4 pr-6">
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${statusStyle(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}