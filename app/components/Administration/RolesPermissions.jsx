'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../context/SidebarContext';
import { Plus, X } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const rolesList = ['Founder', 'Super Admin', 'HR', 'Project Manager', 'Team Lead', 'QA', 'Employee', 'Internee'];
const roleKeys = ['founder', 'super_admin', 'hr', 'project_manager', 'team_lead', 'qa', 'employee', 'internee'];

const defaultMatrix = {
  'View founder dashboard':  [1,1,0,0,0,0,0,0],
  'Create project':          [1,1,0,1,0,0,0,0],
  'Edit project settings':   [1,1,0,1,0,0,0,0],
  'Create and assign tasks': [1,1,0,1,1,0,0,0],
  'Submit task for review':  [1,1,0,1,1,1,1,1],
  'Approve task review':     [1,1,0,1,1,0,0,0],
  'Record QA result':        [1,1,0,0,0,1,0,0],
  'Manage shifts':           [1,1,1,0,0,0,0,0],
  'Approve correction':      [1,1,1,0,0,0,0,0],
  'Review daily summaries':  [1,1,0,1,1,0,0,0],
  'View audit logs':         [1,1,1,0,0,0,0,0],
  'Manage roles':            [1,1,0,0,0,0,0,0],
};

export default function RolesPermissions() {
  const { collapsed } = useSidebar();
  const [matrix, setMatrix] = useState(defaultMatrix);
  const [filterModule, setFilterModule] = useState('All modules');
  const [saving, setSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCloneForm, setShowCloneForm] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', display_name: '', cloneFrom: '' });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUserRole(user.role);
    setIsSuperAdmin(['super_admin', 'founder'].includes(user.role));
  }, []);

  const togglePermission = (permission, roleIdx) => {
    //  Founder column lock — sirf super_admin change kar sakta hai
    if (roleIdx === 0 && !isSuperAdmin) return;

    //  Super Admin column — sirf founder change kar sakta hai
    if (roleIdx === 1 && currentUserRole !== 'founder') return;

    //  Manage roles — sirf super_admin/founder change kar sakta hai
    if (permission === 'Manage roles' && !isSuperAdmin) return;

    setMatrix(prev => ({
      ...prev,
      [permission]: prev[permission].map((val, idx) =>
        idx === roleIdx ? (val ? 0 : 1) : val
      )
    }));
  };

  const isLocked = (permission, roleIdx) => {
    if (roleIdx === 0 && !isSuperAdmin) return true;
    if (roleIdx === 1 && currentUserRole !== 'founder') return true;
    if (permission === 'Manage roles' && !isSuperAdmin) return true;
    return false;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/admin/roles/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matrix })
      });
      const data = await res.json();
      if (data.success || res.ok) {
        alert('✅ Permissions saved successfully!');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Server error!');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = () => {
    if (!newRole.name || !newRole.display_name) {
      alert('Name zaroori hai!');
      return;
    }
    // New role with all 0 permissions
    const newPermissions = Object.fromEntries(
      Object.keys(defaultMatrix).map(key => [key, 0])
    );
    setMatrix(prev => {
      const updated = {};
      Object.entries(prev).forEach(([perm, vals]) => {
        updated[perm] = [...vals, 0];
      });
      return updated;
    });
    alert(`Role "${newRole.display_name}" added! Save karo permissions update karne ke liye.`);
    setShowCreateForm(false);
    setNewRole({ name: '', display_name: '', cloneFrom: '' });
  };

  const handleCloneRole = () => {
    if (!newRole.cloneFrom || !newRole.display_name) {
      alert('Clone karne ke liye role select karo!');
      return;
    }
    const cloneIdx = rolesList.findIndex(r => r === newRole.cloneFrom);
    if (cloneIdx === -1) return;

    setMatrix(prev => {
      const updated = {};
      Object.entries(prev).forEach(([perm, vals]) => {
        updated[perm] = [...vals, vals[cloneIdx]];
      });
      return updated;
    });
    alert(`Role "${newRole.display_name}" cloned from ${newRole.cloneFrom}!`);
    setShowCloneForm(false);
    setNewRole({ name: '', display_name: '', cloneFrom: '' });
  };

  //  Filter by module
  const getFilteredPermissions = () => {
    if (filterModule === 'All modules') return Object.entries(matrix);
    const moduleMap = {
      'Projects': ['Create project', 'Edit project settings', 'View founder dashboard'],
      'Tasks': ['Create and assign tasks', 'Submit task for review', 'Approve task review', 'Record QA result', 'Review daily summaries'],
      'Attendance': ['Manage shifts', 'Approve correction'],
      'Administration': ['View audit logs', 'Manage roles'],
    };
    const keys = moduleMap[filterModule] || [];
    return Object.entries(matrix).filter(([perm]) => keys.includes(perm));
  };

  const currentRoles = rolesList;

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Roles & Permissions</span>
        </div>
        <div className="flex gap-3">
          {isSuperAdmin && (
            <button onClick={() => { setShowCloneForm(true); setShowCreateForm(false); }}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
              Clone Role
            </button>
          )}
          {isSuperAdmin && (
            <button onClick={() => { setShowCreateForm(true); setShowCloneForm(false); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
              <Plus size={16} /> Create Role
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Roles & Permissions</h2>
            <p className="text-sm text-gray-400 mt-0.5">Configure granular access for each operational role</p>
          </div>
          {/* ✅ Super Admin badge */}
          {isSuperAdmin && (
            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold">
              🔑 Super Admin — Full Access
            </span>
          )}
        </div>

        {/* ✅ Create Role Form */}
        {showCreateForm && isSuperAdmin && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">New Role</h3>
              <button onClick={() => setShowCreateForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
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

        {/* ✅ Clone Role Form */}
        {showCloneForm && isSuperAdmin && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Clone Role</h3>
              <button onClick={() => setShowCloneForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Clone From</label>
                <select value={newRole.cloneFrom}
                  onChange={e => setNewRole(p => ({ ...p, cloneFrom: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select Role</option>
                  {currentRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">New Display Name</label>
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
          <div className="p-5 border-b border-gray-100 flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-800">Permission matrix</h3>
              <p className="text-xs text-gray-400 mt-0.5">Backend and frontend enforcement required</p>
            </div>
            <div className="flex gap-3 items-center">
              <select value={filterModule} onChange={e => setFilterModule(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none">
                <option>All modules</option>
                <option>Projects</option>
                <option>Tasks</option>
                <option>Attendance</option>
                <option>Administration</option>
              </select>
              {isSuperAdmin && (
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold uppercase">
                  <th className="p-4 pl-6 w-64">Permission</th>
                  {currentRoles.map((role, idx) => (
                    <th key={role} className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span>{role}</span>
                        {/* ✅ Lock icon for protected roles */}
                        {(idx === 0 || idx === 1) && (
                          <span className="text-[10px] text-amber-500">🔒 Protected</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {getFilteredPermissions().map(([permission, values]) => (
                  <tr key={permission} className="hover:bg-gray-50/50">
                    <td className="p-4 pl-6 font-medium text-gray-700 text-sm">{permission}</td>
                    {values.map((val, roleIdx) => {
                      const locked = isLocked(permission, roleIdx);
                      return (
                        <td key={roleIdx} className="p-4 text-center">
                          <button
                            onClick={() => togglePermission(permission, roleIdx)}
                            disabled={locked}
                            title={locked ? 'Super Admin only can change this' : ''}
                            className={`w-11 h-6 rounded-full relative transition-colors inline-block ${
                              val ? 'bg-blue-600' : 'bg-gray-200'
                            } ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}>
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

          {/* ✅ Legend */}
          <div className="p-4 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-8 h-4 bg-blue-600 rounded-full inline-block"></span> Enabled
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-8 h-4 bg-gray-200 rounded-full inline-block"></span> Disabled
            </span>
            <span className="flex items-center gap-1.5">
              🔒 Protected — Super Admin / Founder only
            </span>
            {!isSuperAdmin && (
              <span className="text-amber-500 font-medium">
                ⚠️ Read-only — Contact Super Admin to change permissions
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}