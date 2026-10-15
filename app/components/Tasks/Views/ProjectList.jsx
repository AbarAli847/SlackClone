'use client';

import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List, Search } from 'lucide-react';
import { useSidebar } from '../../../context/SidebarContext';
import { useRouter } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const statusStyle = (status) => {
  switch (status) {
    case 'Active': return 'bg-emerald-100 text-emerald-700';
    case 'At Risk': return 'bg-amber-100 text-amber-700';
    case 'On Track': return 'bg-blue-100 text-blue-700';
    case 'Overdue': return 'bg-red-100 text-red-700';
    case 'On Hold': return 'bg-gray-100 text-gray-600';
    case 'Completed': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const avatarColors = [
  'bg-blue-500', 'bg-purple-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-red-500', 'bg-indigo-500'
];

export default function ProjectList() {
  const { collapsed } = useSidebar();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, atRisk: 0, overdue: 0, totalLoggedHours: 0 });
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('cards');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterManager, setFilterManager] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', code: '', description: '', client: '',
    manager_id: '', priority: 'Medium', status: 'Active',
    start_date: '', end_date: '', estimated_hours: '',
    color: '#3B82F6', members: []
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [filterStatus, filterManager]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterManager) params.append('manager_id', filterManager);

      const res = await fetch(`${BACKEND_URL}/tasks/projects/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProjects(data.projects || []);
      setStats(data.stats || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
    if (!form.name) { alert('Project name zaroori hai!'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/projects/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          estimated_hours: Number(form.estimated_hours) || 0,
        })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setShowCreateForm(false);
      setForm({ name: '', code: '', description: '', client: '', manager_id: '', priority: 'Medium', status: 'Active', start_date: '', end_date: '', estimated_hours: '', color: '#3B82F6', members: [] });
      fetchProjects();
    } catch (err) { alert('Server error'); }
    finally { setSubmitting(false); }
  };

  const getCompletion = (project) => {
    if (!project.estimated_hours || !project.logged_hours) return 0;
    return Math.min(Math.round((project.logged_hours / project.estimated_hours) * 100), 100);
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.client?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen p-4 md:p-6 font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      {/* Breadcrumb */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-6">
        <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
          <span>NW Operations</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-semibold">Projects</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Projects</h2>
          <p className="text-sm text-gray-400 mt-0.5">Plan, monitor and control all client and internal projects</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Import</button>
              <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Export</button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">
                <Plus size={16} /> Create Project
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total Projects', value: stats.total, sub: '+3 this month', subColor: 'text-emerald-500' },
          { label: 'Active', value: stats.active, sub: '61% of portfolio', subColor: 'text-gray-400' },
          { label: 'At Risk', value: stats.atRisk, sub: 'Needs attention', subColor: 'text-amber-500' },
          { label: 'Overdue', value: stats.overdue, sub: '2 client projects', subColor: 'text-red-500' },
          { label: 'Logged Hours', value: `${stats.totalLoggedHours}h`, sub: 'This month', subColor: 'text-gray-400' },
          { label: 'Avg. Completion', value: '72%', sub: '+6% vs last month', subColor: 'text-emerald-500' },
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
            <p className="text-xs text-gray-400 font-medium">{card.label}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
            <p className={`text-xs font-medium mt-1 ${card.subColor}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-gray-400" />
          <input type="text" placeholder="Search projects..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-sm focus:outline-none bg-transparent flex-1" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none">
          <option value="">All statuses</option>
          {['Active', 'At Risk', 'On Track', 'Overdue', 'On Hold', 'Completed'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filterManager} onChange={e => setFilterManager(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none">
          <option value="">All managers</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
        </select>
        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={() => setView('table')}
            className={`px-3 py-2 flex items-center gap-1.5 text-sm font-bold transition-colors ${
              view === 'table' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-50'
            }`}>
            <List size={14} /> Table
          </button>
          <button onClick={() => setView('cards')}
            className={`px-3 py-2 flex items-center gap-1.5 text-sm font-bold transition-colors ${
              view === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'
            }`}>
            <LayoutGrid size={14} /> Cards
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && isAdmin && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">New Project</h3>
            <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Project Name *</label>
              <input type="text" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Project name"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Project Code</label>
              <input type="text" value={form.code}
                onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                placeholder="e.g. NW-001"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Client</label>
              <input type="text" value={form.client}
                onChange={e => setForm(p => ({ ...p, client: e.target.value }))}
                placeholder="Client name"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Project Manager</label>
              <select value={form.manager_id}
                onChange={e => setForm(p => ({ ...p, manager_id: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                <option value="">Select Manager</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Priority</label>
              <select value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Status</label>
              <select value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                {['Active', 'At Risk', 'On Track', 'Overdue', 'On Hold'].map(s => <option key={s}>{s}</option>)}
              </select>
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
              <label className="text-sm font-semibold text-gray-700">Estimated Hours</label>
              <input type="number" value={form.estimated_hours}
                onChange={e => setForm(p => ({ ...p, estimated_hours: e.target.value }))}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Color</label>
              <input type="color" value={form.color}
                onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                className="w-full h-10 px-1 py-1 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Team Members</label>
              <select multiple value={form.members}
                onChange={e => setForm(p => ({ ...p, members: Array.from(e.target.selectedOptions, o => o.value) }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 h-20">
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
              <p className="text-xs text-gray-400">Ctrl+Click se multiple select karo</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea rows={3} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Project description"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCreateForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      )}

      {/* Projects Grid / Table */}
      {loading ? (
        <div className="text-center text-gray-400 py-20">Loading...</div>
      ) : view === 'cards' ? (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const completion = getCompletion(project);
            return (
              //project detail on click 
              <div key={project._id}
                onClick={() => router.push(`/tasks/projects/${project._id}`)}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-12 rounded-full mt-0.5" style={{ backgroundColor: project.color || '#3B82F6' }} />
                    <div>
                      <h3 className="font-bold text-gray-900">{project.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {project.client || 'Internal Product'} · PM {project.manager_id?.name || '—'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${statusStyle(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{completion}% complete</span>
                    <span>{project.logged_hours || 0} / {project.estimated_hours || 0}h</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: `${completion}%`, backgroundColor: project.color || '#3B82F6' }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {project.members?.slice(0, 4).map((member, idx) => (
                      <div key={member._id}
                        className={`w-7 h-7 rounded-full ${avatarColors[idx % avatarColors.length]} border-2 border-white flex items-center justify-center text-white text-[9px] font-bold`}
                        title={member.name}>
                        {getInitials(member.name)}
                      </div>
                    ))}
                    {project.members?.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-500 text-[9px] font-bold">
                        +{project.members.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {project.status === 'Overdue' ? (
                      <span className="text-red-500 font-bold">Overdue</span>
                    ) : '0 overdue'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-400 font-bold tracking-wider uppercase">
                  <th className="p-4 pl-6">Project</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Manager</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Hours</th>
                  <th className="p-4 pr-6">Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredProjects.map((project) => {
                  const completion = getCompletion(project);
                  return (
                    // ✅ Click pe project detail page pe jao
                    <tr key={project._id}
                      onClick={() => router.push(`/tasks/projects/${project._id}`)}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-8 rounded-full" style={{ backgroundColor: project.color || '#3B82F6' }} />
                          <div>
                            <p className="font-bold text-gray-800">{project.name}</p>
                            <p className="text-xs text-gray-400">{project.code || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500 text-xs">{project.client || 'Internal'}</td>
                      <td className="p-4 text-gray-500 text-xs">{project.manager_id?.name || '—'}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${statusStyle(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-blue-500"
                              style={{ width: `${completion}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{completion}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {project.logged_hours || 0} / {project.estimated_hours || 0}h
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex -space-x-1.5">
                          {project.members?.slice(0, 3).map((member, idx) => (
                            <div key={member._id}
                              className={`w-6 h-6 rounded-full ${avatarColors[idx % avatarColors.length]} border-2 border-white flex items-center justify-center text-white text-[8px] font-bold`}
                              title={member.name}>
                              {getInitials(member.name)}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}