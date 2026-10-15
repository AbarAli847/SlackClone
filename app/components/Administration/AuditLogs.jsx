'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const avatarColors = ['bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-red-500', 'bg-indigo-500'];
const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const moduleStyle = (module) => {
  switch (module) {
    case 'Tasks': return 'bg-blue-100 text-blue-700';
    case 'Attendance': return 'bg-emerald-100 text-emerald-700';
    case 'Roles': return 'bg-purple-100 text-purple-700';
    case 'Files': return 'bg-teal-100 text-teal-700';
    case 'Authentication': return 'bg-red-100 text-red-700';
    case 'Projects': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const resultStyle = (result) => {
  switch (result) {
    case 'Success': return 'bg-emerald-100 text-emerald-700';
    case 'Failed': return 'bg-red-100 text-red-700';
    case 'Denied': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const mockLogs = [
  { _id: '1', time: '11:42:18', user: 'Fatima Noor', module: 'Tasks', action: 'STATUS_CHANGE', entity: 'NW-146 · Client dashboard UI', ip: '192.168.10.24', result: 'Success' },
  { _id: '2', time: '11:39:02', user: 'Ahmed Khan', module: 'Attendance', action: 'CORRECTION_SUBMIT', entity: '27 Jul attendance', ip: '192.168.10.31', result: 'Success' },
  { _id: '3', time: '11:32:44', user: 'Atif Zaheer', module: 'Roles', action: 'PERMISSION_UPDATE', entity: 'Project Manager role', ip: '192.168.10.5', result: 'Success' },
  { _id: '4', time: '11:28:16', user: 'Sara Ali', module: 'Files', action: 'FILE_UPLOAD', entity: 'dashboard-v3.fig', ip: '192.168.10.18', result: 'Success' },
  { _id: '5', time: '11:18:55', user: 'Unknown', module: 'Authentication', action: 'LOGIN_FAILED', entity: 'admin@nw.com', ip: '103.42.18.12', result: 'Denied' },
  { _id: '6', time: '11:05:10', user: 'Ahmed Khan', module: 'Tasks', action: 'REVIEW_SUBMIT', entity: 'NW-138 · Client Login API', ip: '192.168.10.31', result: 'Success' },
];

export default function AuditLogs() {
  const { collapsed } = useSidebar();
  const [logs, setLogs] = useState(mockLogs);
  const [total, setTotal] = useState(2481);
  const [loading, setLoading] = useState(false);
  const [filterModule, setFilterModule] = useState('All modules');
  const [filterAction, setFilterAction] = useState('All actions');
  const [filterDate, setFilterDate] = useState('Today');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterModule !== 'All modules') params.append('module', filterModule);
      if (filterAction !== 'All actions') params.append('action', filterAction);
      params.append('date', filterDate);

      const res = await fetch(`${BACKEND_URL}/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (log) => {
    if (log.createdAt) {
      return new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return log.time || '—';
  };

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Audit Logs</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
            Retention Settings
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            Export Logs
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Audit Logs</h2>
          <p className="text-sm text-gray-400 mt-0.5">Trace security, operational and administrative changes</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <input type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search user, entity..."
            className="flex-1 min-w-[200px] px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
          <select value={filterModule} onChange={e => setFilterModule(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none">
            {['All modules', 'Tasks', 'Attendance', 'Projects', 'Roles', 'Files', 'Authentication'].map(m => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none">
            {['All actions', 'STATUS_CHANGE', 'CORRECTION_SUBMIT', 'PERMISSION_UPDATE', 'FILE_UPLOAD', 'LOGIN_FAILED', 'REVIEW_SUBMIT'].map(a => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <select value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none">
            {['Today', 'Last 7 days', 'Last 30 days', 'All time'].map(d => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <button onClick={fetchLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            Apply
          </button>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">System activity</h3>
            <span className="text-xs text-gray-400 font-medium">{total.toLocaleString()} records today</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1000px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold uppercase">
                    <th className="p-4 pl-6">Time</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Module</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Entity</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4">Result</th>
                    <th className="p-4 pr-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.filter(log => {
                    if (!search) return true;
                    const q = search.toLowerCase();
                    return (log.user?.toLowerCase().includes(q) ||
                      log.user_id?.name?.toLowerCase().includes(q) ||
                      log.entity?.toLowerCase().includes(q) ||
                      log.action?.toLowerCase().includes(q));
                  }).map((log, idx) => (
                    <tr key={log._id} className="hover:bg-gray-50/50">
                      <td className="p-4 pl-6 text-sm font-mono text-gray-600">{formatTime(log)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold`}>
                            {getInitials(log.user || log.user_id?.name)}
                          </div>
                          <span className="font-bold text-gray-800 text-sm">{log.user || log.user_id?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${moduleStyle(log.module)}`}>
                          {log.module}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-mono text-gray-600">{log.action}</td>
                      <td className="p-4 text-sm text-gray-600 max-w-xs truncate">{log.entity}</td>
                      <td className="p-4 text-sm font-mono text-gray-500">{log.ip || log.ip_address}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${resultStyle(log.result)}`}>
                          {log.result}
                        </span>
                      </td>
                      <td className="p-4 pr-6">
                        <button className="text-xs text-blue-600 font-bold hover:underline">Details</button>
                      </td>
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