'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '../../../context/SidebarContext';
import { X } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function CreateProject() {
  const { collapsed } = useSidebar();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('Draft');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const [form, setForm] = useState({
    name: '', code: '', description: '', client: '',
    manager_id: '', department: '', tags: '', internal_notes: '',
    priority: 'High', start_date: '', end_date: '',
    estimated_hours: '', color: '#2563EB', icon: 'Application',
    health_rules: {
      deadline_variance_days: 7,
      logged_hours_threshold: 85,
      require_milestone_approval: true,
      allow_client_visibility: false,
      archive_on_completion: true,
    }
  });

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const addMember = (user) => {
    if (!selectedMembers.find(m => m._id === user._id)) {
      setSelectedMembers(prev => [...prev, user]);
    }
    setShowMemberDropdown(false);
  };

  const removeMember = (userId) => {
    setSelectedMembers(prev => prev.filter(m => m._id !== userId));
  };

  const handleSubmit = async (submitStatus) => {
    if (!form.name) { alert('Project name zaroori hai!'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        status: submitStatus,
        members: selectedMembers.map(m => m._id),
        estimated_hours: Number(form.estimated_hours) || 0,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      };
      const res = await fetch(`${BACKEND_URL}/tasks/projects/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      router.push('/tasks/projects');
    } catch (err) { alert('Server error'); }
    finally { setSubmitting(false); }
  };

  const availableUsers = users.filter(u => !selectedMembers.find(m => m._id === u._id));

  const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500'];
  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push('/tasks/projects/create')}>NW Operations</span>
          <span>/</span>
          <span className="text-gray-600 font-semibold">Create Project</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleSubmit('Draft')}
            disabled={submitting}
            className="px-5 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit('Active')}
            disabled={submitting}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>

      <div className="p-6 flex gap-6">

        {/* Left — Project Information */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Project information</h2>
              <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">Draft</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Project Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Project name *</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="NW Client Operations Portal"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>

              {/* Project Code */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Project code *</label>
                <input type="text" value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                  placeholder="NW-001"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>

              {/* Client */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Client</label>
                <input type="text" value={form.client}
                  onChange={e => setForm(p => ({ ...p, client: e.target.value }))}
                  placeholder="National Wireless (Pvt.) Ltd."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>

              {/* Project Manager */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Project manager *</label>
                <select value={form.manager_id}
                  onChange={e => setForm(p => ({ ...p, manager_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select Manager</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>

              {/* Description */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Description</label>
                <textarea rows={3} value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Project description..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Start date</label>
                <input type="date" value={form.start_date}
                  onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Target end date</label>
                <input type="date" value={form.end_date}
                  onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Priority</label>
                <select value={form.priority}
                  onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                  {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Status</label>
                <select value={form.status || 'Active'}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                  {['Active', 'At Risk', 'On Track', 'On Hold'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Estimated Hours */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Estimated hours</label>
                <input type="number" value={form.estimated_hours}
                  onChange={e => setForm(p => ({ ...p, estimated_hours: e.target.value }))}
                  placeholder="420"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Department</label>
                <input type="text" value={form.department}
                  onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  placeholder="Engineering"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>

              {/* Team Members */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Team members</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {selectedMembers.map((member, idx) => (
                    <div key={member._id}
                      className={`flex items-center gap-1.5 ${avatarColors[idx % avatarColors.length]} text-white text-xs font-bold px-3 py-1.5 rounded-full`}>
                      {member.name}
                      <button onClick={() => removeMember(member._id)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <div className="relative">
                    <button
                      onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                      className="flex items-center gap-1 text-xs text-blue-600 font-bold px-3 py-1.5 border border-blue-200 rounded-full hover:bg-blue-50"
                    >
                      + Add member
                    </button>
                    {showMemberDropdown && availableUsers.length > 0 && (
                      <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-48 max-h-48 overflow-y-auto">
                        {availableUsers.map(u => (
                          <div key={u._id}
                            onClick={() => addMember(u)}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                            {u.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Tags</label>
                <input type="text" value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>

              {/* Internal Notes */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Internal notes</label>
                <textarea rows={3} value={form.internal_notes}
                  onChange={e => setForm(p => ({ ...p, internal_notes: e.target.value }))}
                  placeholder="Internal notes..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Right — Health Rules + Branding */}
        <div className="w-80 space-y-4">

          {/* Project Health Rules */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
            <h3 className="font-bold text-gray-800 mb-4">Project health rules</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Warn when deadline variance</span>
                <div className="flex items-center gap-2">
                  <input type="number" value={form.health_rules.deadline_variance_days}
                    onChange={e => setForm(p => ({ ...p, health_rules: { ...p.health_rules, deadline_variance_days: Number(e.target.value) } }))}
                    className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right focus:outline-none" />
                  <span className="text-xs text-gray-400">days</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Warn when logged hours exceed</span>
                <div className="flex items-center gap-2">
                  <input type="number" value={form.health_rules.logged_hours_threshold}
                    onChange={e => setForm(p => ({ ...p, health_rules: { ...p.health_rules, logged_hours_threshold: Number(e.target.value) } }))}
                    className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right focus:outline-none" />
                  <span className="text-xs text-gray-400">%</span>
                </div>
              </div>
              {[
                { key: 'require_milestone_approval', label: 'Require milestone approval' },
                { key: 'allow_client_visibility', label: 'Allow client visibility' },
                { key: 'archive_on_completion', label: 'Archive on completion' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{label}</span>
                  <button
                    onClick={() => setForm(p => ({ ...p, health_rules: { ...p.health_rules, [key]: !p.health_rules[key] } }))}
                    className={`w-11 h-6 rounded-full transition-colors relative ${form.health_rules[key] ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.health_rules[key] ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Branding */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
            <h3 className="font-bold text-gray-800 mb-4">Branding</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Project color</label>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <input type="color" value={form.color}
                    onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0" />
                  <span className="text-sm font-mono text-gray-600">{form.color.toUpperCase()}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Project icon</label>
                <select value={form.icon}
                  onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                  {['Application', 'Web', 'Mobile', 'Design', 'Data', 'DevOps'].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}