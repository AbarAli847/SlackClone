'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500'];
const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const statusStyle = (status) => {
  switch (status) {
    case 'Pending HR': return 'bg-amber-100 text-amber-700';
    case 'Pending Manager': return 'bg-blue-100 text-blue-700';
    case 'Approved': return 'bg-emerald-100 text-emerald-700';
    case 'Rejected': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-500';
  }
};

export default function CorrectionApproval() {
  const { collapsed } = useSidebar();
  const [corrections, setCorrections] = useState([]);
  const [stats, setStats] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');
    fetchCorrections();
  }, []);

  const fetchCorrections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/attendance/corrections/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCorrections(data.corrections || []);
      setStats(data.stats || {});
      if (data.corrections?.length > 0) setSelected(data.corrections[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleReview = async (status) => {
    if (!selected) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/attendance/corrections/review?id=${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status,
          manager_comment: comment,
          hr_comment: comment,
        })
      });
      setComment('');
      fetchCorrections();
    } catch (err) { console.error(err); }
  };

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Correction Approval</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Next Request</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">Open Oldest</button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Correction Approval</h2>
          <p className="text-sm text-gray-400 mt-0.5">Compare current and requested records before approval</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
          {[
            { label: 'Pending Manager', value: stats.pendingManager || 0, sub: 'Oldest 1d 4h', subColor: 'text-gray-400' },
            { label: 'Pending HR', value: stats.pendingHR || 0, sub: 'Ready for final decision', subColor: 'text-gray-400' },
            { label: 'Approved Today', value: stats.approvedToday || 0, sub: 'All audited', subColor: 'text-gray-400' },
            { label: 'Rejected Today', value: stats.rejectedToday || 0, sub: 'Reason provided', subColor: 'text-gray-400' },
            { label: 'Missing Evidence', value: 0, sub: 'Request information', subColor: 'text-gray-400' },
            { label: 'Avg. Resolution', value: '5h 12m', sub: '-1h 08m', subColor: 'text-emerald-500' },
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
              <p className="text-xs text-gray-400 font-medium">{card.label}</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
              <p className={`text-xs font-medium mt-1 ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Left — Detail */}
          <div className="flex-1 space-y-4">
            {selected ? (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {selected.employee_id?.name} · {selected.attendance_date}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {selected.correction_type} · {selected.manager_id?.name ? `${selected.manager_id.name} approved` : 'Pending manager'}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${statusStyle(selected.status)}`}>
                      {selected.status}
                    </span>
                  </div>

                  {/* Comparison */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="border border-gray-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-gray-500 mb-3">Current record</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Clock-in', value: '09:04' },
                          { label: 'Clock-out', value: 'Missing', red: true },
                          { label: 'Work hours', value: '—' },
                          { label: 'Status', badge: true, value: 'Incomplete', badgeColor: 'bg-red-100 text-red-700' },
                        ].map(({ label, value, red, badge, badgeColor }) => (
                          <div key={label} className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">{label}</span>
                            {badge ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badgeColor}`}>{value}</span>
                            ) : (
                              <span className={`text-sm font-bold ${red ? 'text-red-500' : 'text-gray-700'}`}>{value}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-4">
                      <p className="text-xs font-bold text-blue-600 mb-3">Requested record</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Clock-in', value: selected.requested_clock_in || '09:04' },
                          { label: 'Clock-out', value: selected.requested_clock_out || '18:12', green: true },
                          { label: 'Work hours', value: '8h 09m' },
                          { label: 'Status', badge: true, value: 'Present', badgeColor: 'bg-emerald-100 text-emerald-700' },
                        ].map(({ label, value, green, badge, badgeColor }) => (
                          <div key={label} className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">{label}</span>
                            {badge ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badgeColor}`}>{value}</span>
                            ) : (
                              <span className={`text-sm font-bold ${green ? 'text-emerald-600' : 'text-gray-700'}`}>{value}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Employee Reason */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 mb-2">Employee reason</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{selected.reason}</p>
                  </div>

                  {/* Manager Comment */}
                  {selected.manager_comment && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-500 mb-2">Manager comment</p>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {getInitials(selected.manager_id?.name)}
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 flex-1">
                          <p className="text-xs font-bold text-gray-700 mb-1">{selected.manager_id?.name}</p>
                          <p className="text-sm text-gray-600">{selected.manager_comment}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Comment */}
                  {isAdmin && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2">Add comment</p>
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Add review comment..."
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="flex gap-3">
                    <button onClick={() => handleReview('Rejected')}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">
                      Reject
                    </button>
                    {selected.status === 'Pending Manager' && (
                      <button onClick={() => handleReview('Pending HR')}
                        className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600">
                        Send to HR
                      </button>
                    )}
                    {selected.status === 'Pending HR' && (
                      <button onClick={() => handleReview('Approved')}
                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700">
                        Approve
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-10 text-center text-gray-400">
                No correction requests
              </div>
            )}
          </div>

          {/* Right — Pending List */}
          <div className="w-80">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Pending requests</h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">{corrections.length}</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {corrections.map((c, idx) => (
                  <div key={c._id}
                    onClick={() => setSelected(c)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selected?._id === c._id ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {getInitials(c.employee_id?.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm">{c.employee_id?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.correction_type}</p>
                        <p className="text-xs text-gray-400">{c.attendance_date}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${statusStyle(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
                {corrections.length === 0 && (
                  <div className="p-10 text-center text-gray-400 text-sm">No pending requests</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}