'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '../../../context/SidebarContext';
import { Plus, Check, Paperclip, MessageSquare, Clock } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500'];
const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const statusStyle = (status) => {
  switch (status) {
    case 'In Progress': return 'bg-blue-100 text-blue-700';
    case 'Completed': return 'bg-emerald-100 text-emerald-700';
    case 'Blocked': return 'bg-red-100 text-red-700';
    case 'Review': return 'bg-purple-100 text-purple-700';
    case 'New': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const priorityStyle = (priority) => {
  switch (priority) {
    case 'Critical':
    case 'High': return 'bg-red-100 text-red-700';
    case 'Medium': return 'bg-amber-100 text-amber-700';
    case 'Low': return 'bg-green-100 text-green-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function TaskDetail({ taskId }) {
  const { collapsed } = useSidebar();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(u);
    setIsAdmin(u.role === 'admin');
    fetchTaskDetail();
  }, [taskId]);

  const fetchTaskDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/${taskId}/detail`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTask(data.task);
        setComments(data.comments || []);
        setAttachments(data.attachments || []);
        setSubtasks(data.subtasks || []);
        setDependencies(data.dependencies || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_id: taskId, content: newComment })
      });
      const data = await res.json();
      if (data.success) {
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
      }
    } catch (err) { console.error(err); }
    finally { setSubmittingComment(false); }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/${taskId}/subtask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newSubtask })
      });
      const data = await res.json();
      if (data.success) {
        setSubtasks(prev => [...prev, data.subtask]);
        setNewSubtask('');
      }
    } catch (err) { console.error(err); }
  };

  const toggleSubtask = async (subtaskId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'Done' ? 'Pending' : 'Done';
      const res = await fetch(`${BACKEND_URL}/tasks/subtask/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setSubtasks(prev => prev.map(s => s._id === subtaskId ? { ...s, status: newStatus } : s));
      }
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (status) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/tasks/change-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_id: taskId, status })
      });
      setTask(prev => ({ ...prev, status }));
    } catch (err) { console.error(err); }
  };

  const completedSubtasks = subtasks.filter(s => s.status === 'Done').length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;
  const remaining = (task?.estimated_hours || 0) - (task?.total_logged_hours || 0);
  const progress = task?.estimated_hours > 0
    ? Math.min(Math.round((task.total_logged_hours / task.estimated_hours) * 100), 100)
    : 0;

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  if (!task) return <div className="flex items-center justify-center min-h-screen text-gray-400">Task not found</div>;

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.back()}>NW Operations</span>
          <span>/</span>
          <span className="text-gray-600 font-semibold">Task Detail</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
            More
          </button>
          {isAdmin && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
              Edit Task
            </button>
          )}
        </div>
      </div>

      <div className="p-6 flex gap-6">

        {/* Left — Main Content */}
        <div className="flex-1 space-y-6">

          {/* Task Header */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-xl font-black text-gray-900 mb-3">{task.title}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Badge */}
                  <select
                    value={task.status}
                    onChange={e => handleStatusChange(e.target.value)}
                    className={`text-xs px-3 py-1 rounded-lg font-bold border-0 focus:outline-none cursor-pointer ${statusStyle(task.status)}`}
                  >
                    {['New', 'Assigned', 'In Progress', 'Review', 'Testing', 'Completed'].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <span className={`text-xs px-3 py-1 rounded-lg font-bold ${priorityStyle(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-lg font-bold bg-blue-50 text-blue-700">
                    {task.type}
                  </span>
                </div>
              </div>

              {/* Assignees */}
              <div className="flex -space-x-2">
                {task.assignees?.map((a, idx) => (
                  <div key={a._id}
                    className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
                    title={a.name}>
                    {getInitials(a.name)}
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div className="mb-4">
                <h3 className="font-bold text-gray-700 mb-2">Description</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{task.description}</p>
              </div>
            )}

            {/* Subtasks */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-700">
                  Subtasks · {completedSubtasks} of {subtasks.length} completed
                </h3>
              </div>

              {/* Progress Bar */}
              {subtasks.length > 0 && (
                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                  <div className="h-2 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${subtaskProgress}%` }} />
                </div>
              )}

              {/* Subtask List */}
              <div className="space-y-2">
                {subtasks.map(subtask => (
                  <div key={subtask._id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSubtask(subtask._id, subtask.status)}
                        className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                          subtask.status === 'Done'
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}>
                        {subtask.status === 'Done' && <Check size={12} className="text-white" />}
                      </button>
                      <span className={`text-sm ${subtask.status === 'Done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {subtask.title}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${subtask.status === 'Done' ? 'text-emerald-500' : 'text-gray-400'}`}>
                      {subtask.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Subtask */}
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Add subtask..."
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
                <button onClick={handleAddSubtask}
                  className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <h3 className="font-bold text-gray-700 mb-4">Attachments</h3>
            {attachments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No attachments yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {attachments.map(att => (
                  <div key={att._id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Paperclip size={14} className="text-gray-400" />
                      <p className="text-sm font-semibold text-gray-700 truncate">{att.file_name}</p>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      {att.file_size ? `${(att.file_size / 1024).toFixed(0)} KB` : ''} · {att.uploaded_by?.name}
                    </p>
                    <button
                      onClick={() => window.open(`${BACKEND_URL}${att.file_url}`, '_blank')}
                      className="w-full text-xs border border-gray-200 rounded-lg py-1.5 font-bold text-gray-600 hover:bg-gray-50">
                      {att.file_type?.startsWith('image/') ? 'Preview' : 'Download'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <h3 className="font-bold text-gray-700 mb-4">Comments</h3>
            <div className="space-y-4 mb-4">
              {comments.map((comment, idx) => (
                <div key={comment._id} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {getInitials(comment.user_id?.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-800">{comment.user_id?.name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="flex gap-3">
              <div className={`w-9 h-9 rounded-full ${avatarColors[0]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 flex gap-2">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
                <button
                  onClick={handleAddComment}
                  disabled={submittingComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 self-end">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Task Properties */}
        <div className="w-72 space-y-4">

          {/* Task Properties */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="font-bold text-gray-800 mb-4">Task properties</h3>
            <div className="space-y-3">
              {[
                { label: 'Project', value: task.project_id?.name || '—' },
                { label: 'Milestone', value: task.milestone_id?.name || '—' },
                { label: 'Manager', value: task.created_by?.name || '—' },
                { label: 'Assignee', value: task.assignees?.[0]?.name || '—' },
                { label: 'Start', value: task.start_date || '—' },
                { label: 'Due', value: task.due_date || '—', red: task.due_date && new Date(task.due_date) < new Date() },
                { label: 'Estimate', value: task.estimated_hours ? `${task.estimated_hours}h` : '—' },
                { label: 'Logged', value: task.total_logged_hours ? `${task.total_logged_hours}h` : '0h' },
                { label: 'Remaining', value: remaining > 0 ? `${remaining.toFixed(1)}h` : '0h' },
                { label: 'Progress', value: `${progress}%` },
              ].map(({ label, value, red }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-medium">{label}</span>
                  <span className={`text-sm font-bold ${red ? 'text-red-500' : 'text-gray-700'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dependencies */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Dependencies</h3>
              <button className="text-xs text-blue-600 font-bold">+ Add</button>
            </div>
            {dependencies.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">No dependencies</p>
            ) : (
              <div className="space-y-2">
                {dependencies.map(dep => (
                  <div key={dep._id} className="border border-gray-100 rounded-xl p-3">
                    <p className="text-sm font-bold text-gray-800">{dep.depends_on?.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold mt-1 inline-block ${
                      dep.depends_on?.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>{dep.depends_on?.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Watchers */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="font-bold text-gray-800 mb-4">Watchers</h3>
            {task.watchers?.length === 0 ? (
              <p className="text-xs text-gray-400">No watchers</p>
            ) : (
              <div className="flex -space-x-2">
                {task.watchers?.map((w, idx) => (
                  <div key={w._id}
                    className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
                    title={w.name}>
                    {getInitials(w.name)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}