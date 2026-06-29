'use client';

import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const statusStyle = (status) => {
  switch (status) {
    case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Rejected': return 'bg-red-50 text-red-700 border-red-100';
    default: return 'bg-amber-50 text-amber-700 border-amber-100';
  }
};

export default function AdminLeaves() {
  const { collapsed } = useSidebar();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('Pending');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchLeaves(); }, [filter]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/leave/all?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('RESPONSE:', data);  // ← ADD KARO
      setLeaves(data.leaves || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleApprove = async (leave_id) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/leave/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leave_id })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      fetchLeaves();
    } catch (err) { alert('Server error'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason) { alert('Reject reason likhein!'); return; }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/leave/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leave_id: rejectModal, reject_reason: rejectReason })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setRejectModal(null);
      setRejectReason('');
      fetchLeaves();
    } catch (err) { alert('Server error'); }
    finally { setActionLoading(false); }
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
          <span className="text-gray-600 font-semibold">Leave Requests</span>
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-gray-900">Leave Requests</h2>
        <p className="text-sm text-gray-400 mt-0.5">Manage team leave requests</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['Pending', 'Approved', 'Rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >{s}</button>
        ))}
      </div>

      {/* Leaves List */}
      {loading ? (
        <div className="text-center text-gray-400 py-10">Loading...</div>
      ) : leaves.length === 0 ? (
        <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-gray-100">
          No {filter.toLowerCase()} leave requests
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <div key={leave._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {leave.employee_id?.name?.slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{leave.employee_id?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{leave.employee_id?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-gray-700">{leave.leave_type} Leave</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold border ${statusStyle(leave.status)}`}>
                      {leave.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{leave.from_date} → {leave.to_date} • {leave.total_days} day(s)</p>
                  <p className="text-sm text-gray-400">{leave.reason}</p>
                  {leave.reject_reason && (
                    <p className="text-sm text-red-500 font-medium">Reject reason: {leave.reject_reason}</p>
                  )}
                </div>
                {leave.status === 'Pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleApprove(leave._id)} disabled={actionLoading}
                      className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-60">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => setRejectModal(leave._id)}
                      className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Reject Reason</h3>
              <button onClick={() => setRejectModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Reject karne ki wajah likhein..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-red-400 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleReject} disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-60">
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}