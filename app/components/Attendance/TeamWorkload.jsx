'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500'];
const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const statusStyle = (status) => {
  switch (status) {
    case 'Overloaded': return 'bg-red-100 text-red-700';
    case 'Busy': return 'bg-amber-100 text-amber-700';
    case 'Balanced': return 'bg-blue-100 text-blue-700';
    case 'Available': return 'bg-emerald-100 text-emerald-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const barColor = (pct) => {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
};

export default function TeamWorkload() {
  const { collapsed } = useSidebar();
  const [workload, setWorkload] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchWorkload(); }, []);

  const fetchWorkload = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/attendance/workload`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setWorkload(data.workload || []);
      setStats(data.stats || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Team Workload</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">This Week</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">Rebalance Work</button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Team Workload</h2>
          <p className="text-sm text-gray-400 mt-0.5">Balance capacity using assigned hours, leave and overdue work</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
          {[
            { label: 'Team Capacity', value: `${stats.totalCapacity || 0}h`, sub: 'This month', subColor: 'text-gray-400' },
            { label: 'Assigned', value: `${stats.totalAssigned || 0}h`, sub: '84% utilized', subColor: 'text-gray-400' },
            { label: 'Available', value: `${stats.available || 0}h`, sub: 'Across 7 people', subColor: 'text-gray-400' },
            { label: 'Overloaded', value: stats.overloaded || 0, sub: 'Requires action', subColor: 'text-red-500' },
            { label: 'On Leave', value: stats.onLeave || 0, sub: '18 hours impact', subColor: 'text-gray-400' },
            { label: 'Overdue Work', value: `${stats.overdueWork || 0}h`, sub: 'Across 11 tasks', subColor: 'text-red-500' },
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
              <p className="text-xs text-gray-400 font-medium">{card.label}</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
              <p className={`text-xs font-medium mt-1 ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Employee Capacity Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-800">Employee capacity</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} · Planned vs available hours
              </p>
            </div>
            <div className="flex gap-3">
              <select className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none">
                <option>All departments</option>
              </select>
              <select className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none">
                <option>All statuses</option>
                {['Overloaded', 'Busy', 'Balanced', 'Available'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold tracking-wider uppercase">
                  <th className="p-4 pl-6">Employee</th>
                  <th className="p-4">Capacity</th>
                  <th className="p-4">Active</th>
                  <th className="p-4">Overdue</th>
                  <th className="p-4">Blocked</th>
                  <th className="p-4 pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {workload.map((w, idx) => (
                  <tr key={w.user._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold`}>
                          {getInitials(w.user.name)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{w.user.name}</p>
                          <p className="text-xs text-gray-400">{w.user.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-700 w-10">{w.utilization}%</span>
                        <div className="flex-1">
                          <div className="w-48 bg-gray-100 rounded-full h-2">
                            <div className={`h-2 rounded-full ${barColor(w.utilization)} transition-all`}
                              style={{ width: `${w.utilization}%` }} />
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{w.logged_hours} / {w.capacity}h</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-gray-700">{w.active_tasks}</td>
                    <td className="p-4 font-bold text-gray-700">{w.overdue_tasks}</td>
                    <td className="p-4 font-bold text-gray-700">{w.blocked_tasks}</td>
                    <td className="p-4 pr-6">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${statusStyle(w.status)}`}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {workload.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-400">No data found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}