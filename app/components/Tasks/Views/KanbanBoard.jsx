'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../../context/SidebarContext';
import StatusBadge from '../Components/StatusBadge';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const COLUMNS = [
  { key: 'New', color: 'bg-gray-100 border-gray-200', dot: 'bg-gray-400' },
  { key: 'Assigned', color: 'bg-blue-50 border-blue-100', dot: 'bg-blue-400' },
  { key: 'In Progress', color: 'bg-indigo-50 border-indigo-100', dot: 'bg-indigo-500' },
  { key: 'Review', color: 'bg-purple-50 border-purple-100', dot: 'bg-purple-500' },
  { key: 'Testing', color: 'bg-cyan-50 border-cyan-100', dot: 'bg-cyan-500' },
  { key: 'Blocked', color: 'bg-red-50 border-red-100', dot: 'bg-red-500' },
  { key: 'Completed', color: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500' },
  { key: 'Cancelled', color: 'bg-gray-50 border-gray-100', dot: 'bg-gray-300' },
];

const priorityStyle = (priority) => {
  switch (priority) {
    case 'Critical': return 'bg-red-50 text-red-700 border-red-100';
    case 'High': return 'bg-orange-50 text-orange-700 border-orange-100';
    case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    case 'Low': return 'bg-green-50 text-green-700 border-green-100';
    default: return 'bg-gray-50 text-gray-700 border-gray-100';
  }
};

export default function KanbanBoard() {
  const { collapsed } = useSidebar();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [blockerModal, setBlockerModal] = useState(null);
  const [blockerReason, setBlockerReason] = useState('');
  const [dragOverCol, setDragOverCol] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [isAdmin]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = isAdmin
        ? `${BACKEND_URL}/tasks/team`
        : `${BACKEND_URL}/tasks/my`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (task_id, status) => {
    if (status === 'Blocked' && isAdmin) {
      setBlockerModal(task_id);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/change-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_id, status })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      // Optimistic update
      setTasks(prev => prev.map(t => t._id === task_id ? { ...t, status } : t));
    } catch (err) {
      alert('Server error');
    }
  };

  const handleBlockedSubmit = async () => {
    if (!blockerReason) { alert('Blocker reason likhein!'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/change-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_id: blockerModal, status: 'Blocked', blocker_reason: blockerReason })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setTasks(prev => prev.map(t => t._id === blockerModal ? { ...t, status: 'Blocked', blocker_reason: blockerReason } : t));
      setBlockerModal(null);
      setBlockerReason('');
    } catch (err) {
      alert('Server error');
    }
  };

  const handleDelete = async (task_id) => {
    if (!confirm('Task delete karna chahte ho?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/tasks/delete?id=${task_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(prev => prev.filter(t => t._id !== task_id));
    } catch (err) {
      alert('Server error');
    }
  };

  // ── Drag & Drop ──────────────────────────────
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colKey);
  };

  const handleDrop = (e, colKey) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedTask || draggedTask.status === colKey) return;

    // User Blocked pe drop nahi kar sakta
    if (colKey === 'Blocked' && !isAdmin) return;

    handleStatusChange(draggedTask._id, colKey);
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverCol(null);
  };

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen p-4 md:p-6 font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      {/* Breadcrumb */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-6">
        <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
          <span>Dashboard</span>
          <span className="text-gray-300">/</span>
          <span>Tasks</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-semibold">Kanban Board</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-900">Kanban Board</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isAdmin ? 'Drag tasks to change status' : 'Your tasks board'}
          </p>
        </div>
        <span className="text-sm font-bold text-gray-500">{tasks.length} total tasks</span>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">Loading...</div>
      ) : (
        /* Kanban Columns */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = getTasksByStatus(col.key);
            const isDragOver = dragOverCol === col.key;

            return (
              <div
                key={col.key}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDrop={(e) => handleDrop(e, col.key)}
                onDragLeave={() => setDragOverCol(null)}
                className={`flex-shrink-0 w-72 rounded-2xl border-2 transition-all duration-200 ${col.color} ${
                  isDragOver ? 'border-blue-400 scale-[1.01] shadow-lg' : ''
                }`}
              >
                {/* Column Header */}
                <div className="p-3 flex items-center justify-between border-b border-white/50">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <span className="font-bold text-gray-700 text-sm">{col.key}</span>
                  </div>
                  <span className="text-xs font-bold bg-white/60 text-gray-500 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="p-2 space-y-2 min-h-[200px]">
                  {colTasks.map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white rounded-xl p-3 shadow-xs border border-gray-100 cursor-grab active:cursor-grabbing space-y-2 transition-all ${
                        draggedTask?._id === task._id ? 'opacity-50 scale-95' : 'hover:shadow-sm'
                      }`}
                    >
                      {/* Project Tag */}
                      {task.project_id && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white inline-block"
                          style={{ backgroundColor: task.project_id.color || '#3B82F6' }}>
                          {task.project_id.name}
                        </span>
                      )}

                      {/* Title */}
                      <p className="font-bold text-gray-800 text-sm leading-tight">{task.title}</p>

                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">{task.description}</p>
                      )}

                      {/* Priority + Type */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${priorityStyle(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">{task.type}</span>
                      </div>

                      {/* Blocker reason */}
                      {task.status === 'Blocked' && task.blocker_reason && (
                        <p className="text-[10px] text-red-500 font-medium">🚫 {task.blocker_reason}</p>
                      )}

                      {/* Assignees */}
                      {task.assignees?.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {task.assignees.map(a => (
                            <div key={a._id}
                              className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                              title={a.name}>
                              {a.name?.slice(0, 2).toUpperCase()}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                        <span className="text-[10px] text-gray-400">
                          {task.due_date ? `📅 ${task.due_date}` : '—'}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-400">⏱ {task.total_logged_hours}h</span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(task._id)}
                              className="text-[10px] text-red-400 hover:text-red-600 font-bold ml-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty state */}
                  {colTasks.length === 0 && (
                    <div className={`h-20 flex items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                      isDragOver ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200'
                    }`}>
                      <p className="text-xs text-gray-300 font-medium">Drop here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Blocker Modal */}
      {blockerModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Blocker Reason</h3>
              <button onClick={() => { setBlockerModal(null); setBlockerReason(''); }}>✕</button>
            </div>
            <textarea rows={3} value={blockerReason}
              onChange={e => setBlockerReason(e.target.value)}
              placeholder="Task block hone ki wajah likhein..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => { setBlockerModal(null); setBlockerReason(''); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm">
                Cancel
              </button>
              <button onClick={handleBlockedSubmit}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700">
                Mark Blocked
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}