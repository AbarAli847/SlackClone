'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useSidebar } from '../../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-indigo-500'];
const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const statusStyle = (status) => {
  switch (status) {
    case 'Completed': return 'bg-emerald-100 text-emerald-700';
    case 'In Progress': return 'bg-blue-100 text-blue-700';
    case 'At Risk': return 'bg-amber-100 text-amber-700';
    case 'Planned': return 'bg-gray-100 text-gray-600';
    case 'On Hold': return 'bg-gray-100 text-gray-500';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const approvalStyle = (status) => {
  switch (status) {
    case 'Approved': return 'bg-emerald-100 text-emerald-700';
    case 'Pending': return 'bg-amber-100 text-amber-700';
    case 'Rejected': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-500';
  }
};

export default function MilestoneList() {
  const { collapsed } = useSidebar();
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    project_id: '', name: '', description: '', owner_id: '',
    start_date: '', due_date: '', status: 'Planned', approval_status: 'Not Started'
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchMilestones();
  }, [selectedProject]);

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = selectedProject
        ? `${BACKEND_URL}/tasks/milestones/list?project_id=${selectedProject}`
        : `${BACKEND_URL}/tasks/milestones/list`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMilestones(data.milestones || []);
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

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.project_id) { alert('Name aur Project zaroori hain!'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/milestones/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setShowForm(false);
      setForm({ project_id: '', name: '', description: '', owner_id: '', start_date: '', due_date: '', status: 'Planned', approval_status: 'Not Started' });
      fetchMilestones();
    } catch (err) { alert('Server error'); }
    finally { setSubmitting(false); }
  };

  // Group milestones by project
  const grouped = milestones.reduce((acc, m) => {
    const key = m.project_id?._id || 'unknown';
    if (!acc[key]) acc[key] = { project: m.project_id, milestones: [] };
    acc[key].milestones.push(m);
    return acc;
  }, {});

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen p-4 md:p-6 font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-4 mb-6 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span>
          <span>/</span>
          <span className="text-gray-600 font-semibold">Milestones</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
            Timeline View
          </button>
          {isAdmin && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">
              <Plus size={16} /> Add Milestone
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Milestones</h2>
          <p className="text-sm text-gray-400 mt-0.5">Define delivery checkpoints, owners and approvals</p>
        </div>
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {/* Add Milestone Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">New Milestone</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
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
              <label className="text-sm font-semibold text-gray-700">Milestone Name *</label>
              <input type="text" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Foundation & RBAC"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <input type="text" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Security and company setup"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Owner</label>
              <select value={form.owner_id}
                onChange={e => setForm(p => ({ ...p, owner_id: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                <option value="">Select Owner</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Status</label>
              <select value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                {['Planned', 'In Progress', 'At Risk', 'Completed', 'On Hold'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Start Date</label>
              <input type="date" value={form.start_date}
                onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Due Date</label>
              <input type="date" value={form.due_date}
                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'Creating...' : 'Add Milestone'}
            </button>
          </div>
        </div>
      )}

      {/* Milestones Table */}
      {loading ? (
        <div className="text-center text-gray-400 py-20">Loading...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-2xl border border-gray-100">
          No milestones found
        </div>
      ) : (
        Object.values(grouped).map(({ project, milestones: pMilestones }) => (
          <div key={project?._id} className="bg-white rounded-2xl border border-gray-100 shadow-xs mb-6 overflow-hidden">
            {/* Project Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">{project?.name || 'Unknown Project'}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {project?.start_date} - {project?.end_date}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> On Track</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> At Risk</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> In Progress</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold tracking-wider uppercase">
                    <th className="p-4 pl-6">Milestone</th>
                    <th className="p-4">Owner</th>
                    <th className="p-4">Dates</th>
                    <th className="p-4">Tasks</th>
                    <th className="p-4">Progress</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6">Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pMilestones.map((milestone, idx) => (
                    <tr key={milestone._id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Milestone */}
                      <td className="p-4 pl-6">
                        <p className="font-bold text-gray-800">{milestone.name}</p>
                        {milestone.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{milestone.description}</p>
                        )}
                      </td>

                      {/* Owner */}
                      <td className="p-4">
                        {milestone.owner_id ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold`}>
                              {getInitials(milestone.owner_id.name)}
                            </div>
                            <span className="text-sm text-gray-700">{milestone.owner_id.name}</span>
                          </div>
                        ) : <span className="text-gray-300 text-sm">—</span>}
                      </td>

                      {/* Dates */}
                      <td className="p-4 text-sm text-gray-500">
                        {milestone.start_date && milestone.due_date
                          ? `${milestone.start_date} - ${milestone.due_date}`
                          : milestone.due_date || '—'}
                      </td>

                      {/* Tasks */}
                      <td className="p-4 text-sm font-bold text-gray-700">
                        {milestone.tasks_completed} / {milestone.tasks_total}
                      </td>

                      {/* Progress */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-100 rounded-full h-2">
                            <div className="h-2 rounded-full bg-blue-600 transition-all"
                              style={{ width: `${milestone.progress}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 font-medium">{milestone.progress}%</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {isAdmin ? (
                          <select
                            value={milestone.status}
                            onChange={async (e) => {
                              const token = localStorage.getItem('token');
                              await fetch(`${BACKEND_URL}/tasks/milestones/update?id=${milestone._id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ status: e.target.value })
                              });
                              fetchMilestones();
                            }}
                            className={`text-xs px-2.5 py-1 rounded-lg font-bold border-0 focus:outline-none cursor-pointer ${statusStyle(milestone.status)}`}>
                            {['Planned', 'In Progress', 'At Risk', 'Completed', 'On Hold'].map(s => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${statusStyle(milestone.status)}`}>
                            {milestone.status}
                          </span>
                        )}
                      </td>

                      {/* Approval */}
                      <td className="p-4 pr-6">
                        {isAdmin ? (
                          <select
                            value={milestone.approval_status}
                            onChange={async (e) => {
                              const token = localStorage.getItem('token');
                              await fetch(`${BACKEND_URL}/tasks/milestones/update?id=${milestone._id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ approval_status: e.target.value })
                              });
                              fetchMilestones();
                            }}
                            className={`text-xs px-2.5 py-1 rounded-lg font-bold border-0 focus:outline-none cursor-pointer ${approvalStyle(milestone.approval_status)}`}>
                            {['Not Started', 'Pending', 'Approved', 'Rejected'].map(s => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${approvalStyle(milestone.approval_status)}`}>
                            {milestone.approval_status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}