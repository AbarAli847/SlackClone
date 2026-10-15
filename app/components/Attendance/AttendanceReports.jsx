'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-indigo-500'];
const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const complianceColor = (pct) => {
  if (pct >= 95) return 'bg-emerald-100 text-emerald-700';
  if (pct >= 85) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

export default function AttendanceReports() {
  const { collapsed } = useSidebar();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => { fetchReports(); }, [month, year]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/attendance/team?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const allRecords = data.records || [];

      // Group by employee
      const grouped = {};
      allRecords.forEach(r => {
        const empId = r.employee_id?._id;
        if (!empId) return;
        if (!grouped[empId]) {
          grouped[empId] = {
            employee: r.employee_id,
            present: 0, late: 0, absent: 0, leave: 0,
            totalHours: 0, overtime: 0, days: 0
          };
        }
        grouped[empId].days++;
        if (r.status === 'Present') grouped[empId].present++;
        else if (r.status === 'Late') { grouped[empId].present++; grouped[empId].late++; }
        else if (r.status === 'Absent') grouped[empId].absent++;
        else if (r.status === 'Leave') grouped[empId].leave++;
        grouped[empId].totalHours += r.work_hours || 0;
        grouped[empId].overtime += r.overtime_hours || 0;
      });

      const summaryData = Object.values(grouped).map(emp => ({
        ...emp,
        avgHours: emp.days > 0 ? (emp.totalHours / emp.days).toFixed(1) : 0,
        compliance: emp.days > 0 ? Math.round(((emp.present) / emp.days) * 100) : 0,
      }));

      setRecords(summaryData);

      const totalPresent = summaryData.reduce((s, e) => s + e.present, 0);
      const totalDays = summaryData.reduce((s, e) => s + e.days, 0);
      const attendanceRate = totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(1) : 0;

      setStats({
        attendanceRate,
        lateArrivals: summaryData.reduce((s, e) => s + e.late, 0),
        absences: summaryData.reduce((s, e) => s + e.absent, 0),
        overtime: summaryData.reduce((s, e) => s + e.overtime, 0).toFixed(0),
        corrections: 0,
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
  const trendData = weeks.map((_, i) => Math.floor(Math.random() * 40) + 60);

  const statusDistribution = [
    { label: 'Present', pct: 93.8, color: 'bg-emerald-500' },
    { label: 'Late', pct: 8.4, color: 'bg-amber-500' },
    { label: 'Absent', pct: 2.2, color: 'bg-red-500' },
    { label: 'Leave', pct: 4.1, color: 'bg-purple-500' },
    { label: 'Half Day', pct: 1.3, color: 'bg-blue-300' },
  ];

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Attendance Reports</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Print</button>
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Export PDF</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">Export Excel</button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Attendance Reports</h2>
          <p className="text-sm text-gray-400 mt-0.5">Analyze attendance compliance, late arrivals and overtime</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <select value={`${year}-${month}`}
            onChange={e => { const [y, m] = e.target.value.split('-'); setYear(Number(y)); setMonth(Number(m)); }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none">
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date(year, i, 1);
              return (
                <option key={i} value={`${year}-${i + 1}`}>
                  {d.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </option>
              );
            })}
          </select>
          <select className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none">
            <option>All departments</option>
          </select>
          <select className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none">
            <option>All shifts</option>
          </select>
          <select className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none">
            <option>All locations</option>
          </select>
          <button onClick={fetchReports}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            Apply
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Attendance Rate', value: `${stats.attendanceRate || 0}%`, sub: 'vs previous month', subColor: 'text-emerald-500' },
            { label: 'Late Arrivals', value: stats.lateArrivals || 0, sub: 'vs previous month', subColor: 'text-red-500' },
            { label: 'Absences', value: stats.absences || 0, sub: 'vs previous month', subColor: 'text-red-500' },
            { label: 'Overtime', value: `${stats.overtime || 0}h`, sub: 'vs previous month', subColor: 'text-gray-400' },
            { label: 'Corrections', value: stats.corrections || 0, sub: 'vs previous month', subColor: 'text-gray-400' },
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
              <p className="text-xs text-gray-400 font-medium">{card.label}</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
              <p className={`text-xs font-medium mt-1 ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-6 mb-6">
          {/* Attendance Trend Chart */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Attendance trend</h3>
              <span className="text-xs text-gray-400">Last 12 weeks</span>
            </div>
            <div className="flex items-end gap-1 h-40">
              {trendData.map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-md transition-all ${idx >= 8 ? 'bg-emerald-400' : 'bg-blue-200'}`}
                    style={{ height: `${val}%` }}
                  />
                  <span className="text-[9px] text-gray-400">{weeks[idx]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="w-72 bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
            <h3 className="font-bold text-gray-800 mb-4">Status distribution</h3>
            <div className="space-y-3">
              {statusDistribution.map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 font-medium">{label}</span>
                    <span className="font-bold text-gray-800">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Employee Summary Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Employee attendance summary</h3>
            <button className="text-xs text-blue-600 font-bold hover:underline">View detailed logs</button>
          </div>
          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold uppercase">
                    <th className="p-4 pl-6">Employee</th>
                    <th className="p-4">Present</th>
                    <th className="p-4">Late</th>
                    <th className="p-4">Absent</th>
                    <th className="p-4">Leave</th>
                    <th className="p-4">Avg Hours</th>
                    <th className="p-4">Overtime</th>
                    <th className="p-4 pr-6">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map((rec, idx) => (
                    <tr key={rec.employee._id} className="hover:bg-gray-50/50">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold`}>
                            {getInitials(rec.employee.name)}
                          </div>
                          <p className="font-bold text-gray-800">{rec.employee.name}</p>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-gray-700">{rec.present}</td>
                      <td className="p-4 font-bold text-gray-700">{rec.late}</td>
                      <td className="p-4 font-bold text-gray-700">{rec.absent}</td>
                      <td className="p-4 font-bold text-gray-700">{rec.leave}</td>
                      <td className="p-4 text-gray-600">{rec.avgHours}h</td>
                      <td className="p-4 text-gray-600">{rec.overtime.toFixed(0)}h</td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${complianceColor(rec.compliance)}`}>
                            {rec.compliance}%
                          </span>
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${rec.compliance >= 95 ? 'bg-emerald-500' : rec.compliance >= 85 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${rec.compliance}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr><td colSpan={8} className="p-10 text-center text-gray-400">No data found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}