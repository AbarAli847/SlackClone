'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useSidebar } from '../../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const priorityStyle = (priority) => {
  switch (priority) {
    case 'Critical':
    case 'High': return 'bg-red-100 text-red-700';
    case 'Medium': return 'bg-amber-100 text-amber-700';
    case 'Low': return 'bg-green-100 text-green-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

export default function SprintBoard() {
  const { collapsed } = useSidebar();
  const [sprints, setSprints] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [projects, setProjects] = useState([]);
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    project_id: '', name: '', goal: '',
    start_date: '', end_date: '', capacity_hours: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');
    fetchSprints();
    fetchProjects();
    fetchBacklog();
  }, []);

  const fetchSprints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/sprints/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const sprintList = data.sprints || [];
      setSprints(sprintList);
      const active = sprintList.find(s => s.status === 'Active') || sprintList[0];
      setActiveSprint(active || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/projects/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) { console.error(err); }
  };

  const fetchBacklog = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/team?status=New`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBacklogTasks(data.tasks || []);
    } catch (err) { console.error(err); }
  };

  const handleCreateSprint = async () => {
    if (!form.name || !form.project_id) { alert('Name aur Project zaroori hain!'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/sprints/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, capacity_hours: Number(form.capacity_hours) || 0 })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setShowCreateForm(false);
      setForm({ project_id: '', name: '', goal: '', start_date: '', end_date: '', capacity_hours: '' });
      fetchSprints();
    } catch (err) { alert('Server error'); }
    finally { setSubmitting(false); }
  };

  const addTaskToSprint = async (taskId) => {
    if (!activeSprint) { alert('Koi active sprint nahi hai!'); return; }
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/tasks/sprints/add-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sprint_id: activeSprint._id, task_id: taskId })
      });
      fetchSprints();
      fetchBacklog();
    } catch (err) { console.error(err); }
  };

  // Sprint tasks by status
  const sprintTasks = activeSprint?.tasks || [];
  const todoTasks = sprintTasks.filter(t => t.status === 'New' || t.status === 'Assigned');
  const inProgressTasks = sprintTasks.filter(t => t.status === 'In Progress' || t.status === 'Review');
  const doneTasks = sprintTasks.filter(t => t.status === 'Completed');

  // Sprint stats
  const committedHours = sprintTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
  const completedHours = doneTasks.reduce((sum, t) => sum + (t.total_logged_hours || 0), 0);
  const capacity = activeSprint?.capacity_hours || 160;
  const remaining = capacity - committedHours;
  const teamCapacity = capacity > 0 ? Math.round((committedHours / capacity) * 100) : 0;
  const blockedCount = sprintTasks.filter(t => t.status === 'Blocked').length;

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span>
          <span>/</span>
          <span className="text-gray-600 font-semibold">Sprint Board</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
            Sprint Settings
          </button>
          {isAdmin && (
            <button onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">
              <Plus size={16} /> Create Sprint
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Sprint Board</h2>
          <p className="text-sm text-gray-400 mt-0.5">Plan backlog and monitor current sprint capacity</p>
        </div>

        {/* Create Sprint Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">New Sprint</h3>
              <button onClick={() => setShowCreateForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Project *</label>
                <select value={form.project_id}
                  onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Sprint Name *</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Sprint 06 · Client Portal Beta"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Goal</label>
                <input type="text" value={form.goal}
                  onChange={e => setForm(p => ({ ...p, goal: e.target.value }))}
                  placeholder="Sprint goal..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Start Date</label>
                <input type="date" value={form.start_date}
                  onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">End Date</label>
                <input type="date" value={form.end_date}
                  onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Capacity Hours</label>
                <input type="number" value={form.capacity_hours}
                  onChange={e => setForm(p => ({ ...p, capacity_hours: e.target.value }))}
                  placeholder="160"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreateForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm">Cancel</button>
              <button onClick={handleCreateSprint} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60">
                {submitting ? 'Creating...' : 'Create Sprint'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading...</div>
        ) : !activeSprint ? (
          <div className="text-center text-gray-400 py-20 bg-white rounded-2xl border border-gray-100">
            No sprints yet — Create one!
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Left — Sprint Board */}
            <div className="flex-1 space-y-4">

              {/* Sprint Header */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{activeSprint.name}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        activeSprint.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>{activeSprint.status}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {activeSprint.start_date} - {activeSprint.end_date}
                      {activeSprint.goal && ` · Goal: ${activeSprint.goal}`}
                    </p>
                  </div>

                  {/* Sprint Selector */}
                  {sprints.length > 1 && (
                    <select
                      value={activeSprint._id}
                      onChange={e => setActiveSprint(sprints.find(s => s._id === e.target.value))}
                      className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none">
                      {sprints.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Capacity', value: `${capacity}h`, sub: `${activeSprint.tasks?.length || 0} team members` },
                    { label: 'Committed', value: `${committedHours}h`, sub: `${teamCapacity}% capacity` },
                    { label: 'Completed', value: `${completedHours}h`, sub: `${doneTasks.length > 0 ? Math.round((doneTasks.length / sprintTasks.length) * 100) : 0}% of sprint` },
                    { label: 'Remaining', value: `${Math.max(remaining, 0)}h`, sub: 'working days left' },
                  ].map((stat, idx) => (
                    <div key={idx} className="text-center">
                      <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                      <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-400">{stat.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kanban Columns */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'To Do', tasks: todoTasks, color: 'text-gray-600' },
                  { label: 'In Progress', tasks: inProgressTasks, color: 'text-blue-600' },
                  { label: 'Done', tasks: doneTasks, color: 'text-emerald-600' },
                ].map((col) => (
                  <div key={col.label} className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <span className={`font-bold text-sm ${col.color}`}>{col.label}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">{col.tasks.length}</span>
                    </div>
                    <div className="p-3 space-y-3 min-h-[200px]">
                      {col.tasks.map(task => (
                        <div key={task._id} className="border border-gray-100 rounded-xl p-3 hover:shadow-sm transition-all">
                          <p className="font-bold text-gray-800 text-sm mb-1">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>
                          )}
                          {col.label === 'In Progress' && (
                            <div className="mb-2">
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-blue-500"
                                  style={{ width: `${Math.min(Math.round((task.total_logged_hours / task.estimated_hours) * 100) || 0, 100)}%` }} />
                              </div>
                            </div>
                          )}
                          {col.label === 'Done' && (
                            <div className="mb-2">
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Completed</span>
                            </div>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${priorityStyle(task.priority)}`}>
                            {task.priority}
                          </span>
                          <div className="flex justify-between items-center mt-2 text-[10px] text-gray-400">
                            <span>{task.assignees?.[0]?.name?.split(' ').map(n => n[0]).join('') || '—'} · {task.estimated_hours}h</span>
                            {task.due_date && <span>Due {task.due_date}</span>}
                          </div>
                        </div>
                      ))}
                      {col.tasks.length === 0 && (
                        <div className="text-center text-gray-300 text-xs py-8">Empty</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Sprint Health + Backlog */}
            <div className="w-72 space-y-4">

              {/* Sprint Health */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
                <h3 className="font-bold text-gray-800 mb-4">Sprint health</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Scope change</span>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-bold">+2 tasks</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Team capacity</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      teamCapacity >= 90 ? 'bg-red-100 text-red-700' :
                      teamCapacity >= 70 ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>{teamCapacity}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Blocked tasks</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      blockedCount > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                    }`}>{blockedCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Projected completion</span>
                    <span className="text-sm font-bold text-gray-700">{activeSprint.end_date || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Backlog */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">Backlog</h3>
                  <button className="text-xs text-blue-600 font-bold hover:underline">
                    View all {backlogTasks.length}
                  </button>
                </div>
                <div className="space-y-3">
                  {backlogTasks.slice(0, 5).map(task => (
                    <div key={task._id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{task.title}</p>
                        <p className="text-xs text-gray-400">{task.estimated_hours}h · {task.priority}</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => addTaskToSprint(task._id)}
                          className="text-xs text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg font-bold hover:bg-blue-50 shrink-0"
                        >
                          Add to sprint
                        </button>
                      )}
                    </div>
                  ))}
                  {backlogTasks.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No backlog tasks</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}