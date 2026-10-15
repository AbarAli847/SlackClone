'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500'];
const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const priorityStyle = (p) => {
  switch(p) {
    case 'High': case 'Critical': return 'bg-red-100 text-red-700';
    case 'Medium': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function ReviewQueue() {
  const { collapsed } = useSidebar();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reviewerNote, setReviewerNote] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/review/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReviews(data.reviews || []);
      setStats(data.stats || {});
      if (data.reviews?.length > 0) setSelected(data.reviews[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleReview = async (status) => {
    if (!selected) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/tasks/review/update?id=${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, reviewer_note: reviewerNote })
      });
      fetchReviews();
      setReviewerNote('');
    } catch (err) { console.error(err); }
  };

  const toggleChecklist = async (idx) => {
    if (!selected) return;
    const updated = [...(selected.checklist || [])];
    updated[idx] = { ...updated[idx], checked: !updated[idx].checked };
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/tasks/review/update?id=${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ checklist: updated })
      });
      setSelected(prev => ({ ...prev, checklist: updated }));
    } catch (err) { console.error(err); }
  };

  const waitingTime = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Review Queue</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Review Settings</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">Review Oldest</button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Task Review Queue</h2>
          <p className="text-sm text-gray-400 mt-0.5">Review employee submissions, request changes or move work to QA</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
          {[
            { label: 'Pending Review', value: stats.pending || 0, sub: '3 older than 24h', subColor: 'text-red-500' },
            { label: 'Submitted Today', value: stats.submittedToday || 0, sub: 'Across 5 projects', subColor: 'text-gray-400' },
            { label: 'Avg. Review Time', value: '3h 18m', sub: '-42 min', subColor: 'text-emerald-500' },
            { label: 'Changes Requested', value: stats.changesRequested || 0, sub: 'This week', subColor: 'text-gray-400' },
            { label: 'Ready for QA', value: stats.readyForQA || 0, sub: 'Awaiting tester', subColor: 'text-gray-400' },
            { label: 'Critical Priority', value: reviews.filter(r => r.priority === 'Critical' || r.priority === 'High').length, sub: 'Review first', subColor: 'text-red-500' },
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
              <p className="text-xs text-gray-400 font-medium">{card.label}</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
              <p className={`text-xs font-medium mt-1 ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Split View */}
        <div className="flex gap-4">
          {/* Left — List */}
          <div className="w-96 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Pending submissions</h3>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">{reviews.length} tasks</span>
            </div>

            {/* Filters */}
            <div className="p-3 border-b border-gray-50 flex gap-2">
              <select className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                <option>All projects</option>
              </select>
              <select className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                <option>All employees</option>
              </select>
            </div>

            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {reviews.map((review, idx) => (
                <div key={review._id}
                  onClick={() => setSelected(review)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selected?._id === review._id ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {getInitials(review.submitted_by?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{review.task_id?.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${priorityStyle(review.priority)}`}>
                          {review.priority}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                        <span>{review.submitted_by?.name} · {review.project_id?.name}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1 text-xs">
                        <span className="text-gray-400">
                          Est: {review.task_id?.estimated_hours}h / Logged: {review.task_id?.total_logged_hours}h
                        </span>
                        <span className="text-amber-500 font-medium">{waitingTime(review.createdAt)}</span>
                      </div>
                    </div>
                    <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg font-bold shrink-0">
                      Review
                    </button>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="p-10 text-center text-gray-400 text-sm">No pending reviews</div>
              )}
            </div>
          </div>

          {/* Right — Detail */}
          {selected ? (
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{selected.task_id?.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submitted by {selected.submitted_by?.name} · {new Date(selected.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${priorityStyle(selected.priority)}`}>
                  {selected.priority}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Estimate</p>
                  <p className="font-bold text-gray-800">{selected.task_id?.estimated_hours}h</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Logged</p>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                    <div className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${Math.min((selected.task_id?.total_logged_hours / selected.task_id?.estimated_hours) * 100 || 0, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Checklist</p>
                  <p className="font-bold text-gray-800">
                    {selected.checklist?.filter(c => c.checked).length || 0} / {selected.checklist?.length || 0}
                  </p>
                </div>
              </div>

              {/* Submission Note */}
              {selected.submission_note && (
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2">Submission note</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{selected.submission_note}</p>
                </div>
              )}

              {/* Review Checklist */}
              {selected.checklist?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-3">Review checklist</p>
                  <div className="space-y-2">
                    {selected.checklist.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                        <span className="text-sm text-gray-700">{item.item}</span>
                        <button
                          onClick={() => toggleChecklist(idx)}
                          className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${
                            item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'
                          }`}>
                          {item.checked && <span className="text-xs">✓</span>}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviewer Note */}
              {isAdmin && (
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2">Reviewer note</p>
                  <textarea
                    value={reviewerNote}
                    onChange={e => setReviewerNote(e.target.value)}
                    placeholder="Add review feedback..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              )}

              {/* Actions */}
              {isAdmin && (
                <div className="flex gap-3">
                  <button onClick={() => handleReview('Changes Requested')}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700">
                    Request Changes
                  </button>
                  <button onClick={() => handleReview('Ready for QA')}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700">
                    Move to QA
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-xs flex items-center justify-center text-gray-400">
              Select a review to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}