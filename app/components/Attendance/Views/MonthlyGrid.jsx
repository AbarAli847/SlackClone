'use client';

import React, { useState, useEffect } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const tagColors = [
  'bg-indigo-600', 'bg-cyan-600', 'bg-emerald-600',
  'bg-amber-500', 'bg-red-600', 'bg-purple-600', 'bg-blue-600'
];

const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const getDotColor = (status, isFuture) => {
  if (isFuture) return 'bg-gray-100';
  switch (status) {
    case 'Present': return 'bg-emerald-500';
    case 'Late': return 'bg-amber-500';
    case 'Absent': return 'bg-red-500';
    case 'Half Day': return 'bg-orange-400';
    case 'Leave': return 'bg-purple-500';
    case 'Holiday': return 'bg-blue-500';
    case 'Weekend': return 'bg-gray-300';
    default: return 'bg-gray-200';
  }
};

export default function MonthlyGrid({ selectedDate }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const now = selectedDate ? new Date(selectedDate) : new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const totalDays = new Date(year, month, 0).getDate();
  const today = new Date();
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedDate]);

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const url = user.role === 'admin'
        ? `${BACKEND_URL}/attendance/team?date=all&month=${month}&year=${year}`
        : `${BACKEND_URL}/attendance/my?month=${month}&year=${year}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        if (user.role === 'admin') {
          const grouped = {};
          (data.records || []).forEach((record) => {
            const emp = record.employee_id;
            if (!emp) return;
            const id = emp._id;
            if (!grouped[id]) {
              grouped[id] = { id, name: emp.name, role: emp.role || '—', records: {} };
            }
            const day = new Date(record.date).getDate();
            grouped[id].records[day] = record.status;
          });
          setMembers(Object.values(grouped));
        } else {
          // ✅ User ke liye localStorage se name/role lo
          const userRecords = {};
          (data.records || []).forEach((record) => {
            const day = new Date(record.date).getDate();
            userRecords[day] = record.status;
          });
          setMembers([{
            id: user._id,
            name: user.name,       // ✅ localStorage se
            role: user.role || '—', // ✅ localStorage se
            records: userRecords
          }]);
        }
      }
    } catch (err) {
      console.error('MonthlyGrid fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
      <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex flex-wrap gap-3 text-xs font-medium text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Late</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Absent</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Leave</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Holiday</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> Half Day</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span> Weekend</span>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm font-medium">Loading...</div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm font-medium">No records found</div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] text-gray-400 font-extrabold tracking-wider uppercase">
                <th className="p-4 pl-6 w-56">Team Member</th>
                <th className="p-4">
                  <div className="flex gap-2">
                    {daysArray.map(d => (
                      <div key={d} className="w-6 text-center text-xs font-bold">{d}</div>
                    ))}
                  </div>
                </th>
                <th className="p-4 pr-6 text-center w-24">Present</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {members.map((m, idx) => {
                const presentCount = Object.values(m.records)
                  .filter(s => s === 'Present' || s === 'Late').length;

                return (
                  <tr key={m.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <div className={`w-9 h-9 ${tagColors[idx % tagColors.length]} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs`}>
                        {getInitials(m.name)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 leading-tight">{m.name}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{m.role}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {daysArray.map((day) => {
                          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isFuture = new Date(dateStr) > today;
                          const status = m.records[day];
                          return (
                            <div key={day} className="w-6 flex justify-center items-center" title={status || 'No record'}>
                              <span className={`w-2.5 h-2.5 rounded-full ${getDotColor(status, isFuture)} transition-transform hover:scale-125 cursor-pointer`}></span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-center font-bold text-gray-700">{presentCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}