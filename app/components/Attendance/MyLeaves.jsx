'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const statusStyle = (status) => {
  switch (status) {
    case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Rejected': return 'bg-red-50 text-red-700 border-red-100';
    default: return 'bg-amber-50 text-amber-700 border-amber-100';
  }
};

const leaveTypes = ['Casual', 'Sick', 'Annual', 'Emergency', 'Unpaid'];

export default function MyLeaves() {
  const { collapsed } = useSidebar();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leave_type: 'Casual', from_date: '', to_date: '', reason: '',
  });

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/leave/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLeaves(data.leaves || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.from_date || !form.to_date || !form.reason) {
      alert('Sab fields zaroori hain!'); return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/leave/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setShowForm(false);
      setForm({ leave_type: 'Casual', from_date: '', to_date: '', reason: '' });
      fetchMyLeaves();
    } catch (err) { alert('Server error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen p-4 md:p-6 font-sans text-gray-800 space-y-6 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      {/* Breadcrumb */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
          <span>Dashboard</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-semibold">My Leaves</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-gray-900">My Leaves</h2>
          <p className="text-sm text-gray-400 mt-0.5">Track your leave requests</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Request Leave
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">New Leave Request</h3>
            <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Leave Type</label>
            <select value={form.leave_type} onChange={e => setForm(p => ({ ...p, leave_type: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500">
              {leaveTypes.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">From Date</label>
              <input type="date" value={form.from_date} onChange={e => setForm(p => ({ ...p, from_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">To Date</label>
              <input type="date" value={form.to_date} onChange={e => setForm(p => ({ ...p, to_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Reason</label>
            <textarea rows={3} value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
              placeholder="Leave ki wajah likhein..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 font-bold text-sm">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      )}

      {/* Leaves List */}
      {loading ? (
        <div className="text-center text-gray-400 py-10">Loading...</div>
      ) : leaves.length === 0 ? (
        <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-gray-100">
          No leave requests yet
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <div key={leave._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{leave.leave_type} Leave</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold border ${statusStyle(leave.status)}`}>
                      {leave.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{leave.from_date} → {leave.to_date} • {leave.total_days} day(s)</p>
                  <p className="text-sm text-gray-400">{leave.reason}</p>
                  {leave.reject_reason && (
                    <p className="text-sm text-red-500 font-medium">Reason: {leave.reject_reason}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(leave.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}