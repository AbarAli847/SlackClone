
'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../context/SidebarContext';
import { Plus, X } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const permissionLabels = {
  view_founder_dashboard: 'View founder dashboard',
  create_project: 'Create project',
  edit_project: 'Edit project settings',
  create_task: 'Create and assign tasks',
  submit_task_review: 'Submit task for review',
  approve_task_review: 'Approve task review',
  record_qa_result: 'Record QA result',
  manage_shifts: 'Manage shifts',
  approve_correction: 'Approve correction',
  review_daily_summary: 'Review daily summaries',
  view_audit_logs: 'View audit logs',
  manage_roles: 'Manage roles',
};

export default function RolesPermissions() {
  const { collapsed } = useSidebar();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCloneForm, setShowCloneForm] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', display_name: '', description: '' });
  const [cloneFrom, setCloneFrom] = useState('');

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/admin/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const togglePermission = async (roleId, permKey, currentVal) => {
    // Optimistic update
    setRoles(prev => prev.map(r => {
      if (r._id !== roleId) return r;
      return { ...r, permissions: { ...r.permissions, [permKey]: !currentVal } };
    }));

    try {
      const token = localStorage.getItem('token');
      const role = roles.find(r => r._id === roleId);
      const updatedPermissions = { ...role.permissions, [permKey]: !currentVal };

      await fetch(`${BACKEND_URL}/admin/roles/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role_id: roleId, permissions: updatedPermissions })
      });
    } catch (err) {
      console.error(err);
      fetchRoles(); // Revert on error
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.display_name) { alert('Name zaroori hai!'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/admin/roles/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newRole)
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateForm(false);
        setNewRole({ name: '', display_name: '', description: '' });
        fetchRoles();
      }
    } catch (err) { console.error(err); }
  };

  const handleCloneRole = async () => {
    if (!cloneFrom || !newRole.display_name) { alert('Role select karo!'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/admin/roles/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          role_id: cloneFrom,
          new_name: newRole.name,
          new_display_name: newRole.display_name
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowCloneForm(false);
        setCloneFrom('');
        setNewRole({ name: '', display_name: '', description: '' });
        fetchRoles();
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Roles & Permissions</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCloneForm(true)}
            className="px-4 py-2 border border-gray-200 8-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
            Clone Role
          </button>
          <button onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            <Plus size={16} /> Create Role
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Roles & Permissions</h2>
          <p className="text-sm text-gray-400 mt-0.5">Configure granular access for each operational role</p>
        </div>

        {/* Create Role Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">New Role</h3>
              <button onClick={() => setShowCreateForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Role Name (slug)</label>
                <input type="text" value={newRole.name}
                  onChange={e => setNewRole(p => ({ ...p, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  placeholder="e.g. senior_developer"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Display Name</label>
                <input type="text" value={newRole.display_name}
                  onChange={e => setNewRole(p => ({ ...p, display_name: e.target.value }))}
                  placeholder="e.g. Senior Developer"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Description</label>
                <input type="text" value={newRole.description}
                  onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))}
                  placeholder="Role description"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreateForm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500">Cancel</button>
              <button onClick={handleCreateRole}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
                Create Role
              </button>
            </div>
          </div>
        )}

        {/* Clone Role Form */}
        {showCloneForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Clone Role</h3>
              <button onClick={() => setShowCloneForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Clone From</label>
                <select value={cloneFrom}
                  onChange={e => setCloneFrom(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select Role</option>
                  {roles.map(r => <option key={r._id} value={r._id}>{r.display_name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">New Role Name (slug)</label>
                <input type="text" value={newRole.name}
                  onChange={e => setNewRole(p => ({ ...p, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  placeholder="e.g. senior_qa"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Display Name</label>
                <input type="text" value={newRole.display_name}
                  onChange={e => setNewRole(p => ({ ...p, display_name: e.target.value }))}
                  placeholder="e.g. Senior QA"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCloneForm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500">Cancel</button>
              <button onClick={handleCloneRole}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
                Clone Role
              </button>
            </div>
          </div>
        )}

        {/* Permission Matrix */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Permission matrix</h3>
            <p className="text-xs text-gray-400 mt-0.5">Backend and frontend enforcement required</p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold uppercase">
                    <th className="p-4 pl-6 w-64">Permission</th>
                    {roles.map(role => (
                      <th key={role._id} className="p-4 text-center whitespace-nowrap">
                        {role.display_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Object.entries(permissionLabels).map(([permKey, label]) => (
                    <tr key={permKey} className="hover:bg-gray-50/50">
                      <td className="p-4 pl-6 font-medium text-gray-700 text-sm">{label}</td>
                      {roles.map(role => {
                        const val = role.permissions?.[permKey] || false;
                        return (
                          <td key={role._id} className="p-4 text-center">
                            <button
                              onClick={() => togglePermission(role._id, permKey, val)}
                              className={`w-11 h-6 rounded-full relative transition-colors inline-block ${
                                val ? 'bg-blue-600' : 'bg-gray-200'
                              } ${role.is_system && role.name === 'founder' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              disabled={role.is_system && role.name === 'founder'}>
                              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${val ? 'left-6' : 'left-1'}`} />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

