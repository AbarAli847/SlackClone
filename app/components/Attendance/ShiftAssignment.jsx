'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../context/SidebarContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500'];
const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const shiftColors = {
  'Office': 'bg-blue-50 text-blue-700',
  'Remote': 'bg-teal-50 text-teal-700',
  'US Shift': 'bg-purple-50 text-purple-700',
  'Internship': 'bg-emerald-50 text-emerald-700',
  'Off': 'bg-gray-50 text-gray-400',
};

export default function ShiftAssignment() {
  const { collapsed } = useSidebar();
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));

  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }

  const getWeekDays = (start) => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
      };
    });
  };

  const weekDays = getWeekDays(weekStart);

  useEffect(() => {
    fetchAssignments();
    fetchUsers();
    fetchShifts();
  }, [weekStart]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/attendance/shifts/assignments?week_start=${weekStart}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAssignments(data.assignments || []);
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
      setUsers((data.users || []).filter(u => u.role !== 'admin'));
    } catch (err) { console.error(err); }
  };

  const fetchShifts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/attendance/shifts/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setShifts(data.shifts || []);
    } catch (err) { console.error(err); }
  };

  const handleAssign = async (employeeId, date, shiftId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/attendance/shifts/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ employee_id: employeeId, shift_id: shiftId, date, week_start: weekStart })
      });
      fetchAssignments();
    } catch (err) { console.error(err); }
  };

  const getAssignment = (userId, date) => {
    const emp = assignments.find(a => a.employee._id === userId);
    return emp?.assignments[date] || null;
  };

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Shift Assignment</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Copy Previous Week</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">Assign Shift</button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Shift Assignment</h2>
          <p className="text-sm text-gray-400 mt-0.5">Assign shifts by employee, department or date range</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 items-center">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <button onClick={prevWeek}><ChevronLeft size={16} className="text-gray-400" /></button>
            <span className="text-sm font-bold text-gray-700">
              Week of {new Date(weekStart).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <button onClick={nextWeek}><ChevronRight size={16} className="text-gray-400" /></button>
          </div>
          <select className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none">
            <option>All departments</option>
          </select>
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 ml-auto">
            Bulk Edit
          </button>
        </div>

        {/* Weekly Schedule Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Weekly shift schedule</h3>
            <span className="text-xs text-gray-400 font-medium">{users.length} employees</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold">
                    <th className="p-4 pl-6 w-56">Employee</th>
                    {weekDays.map(d => (
                      <th key={d.date} className="p-4 text-center">{d.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user, idx) => (
                    <tr key={user._id} className="hover:bg-gray-50/50">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold`}>
                            {getInitials(user.name)}
                          </div>
                          <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                        </div>
                      </td>
                      {weekDays.map(day => {
                        const assignment = getAssignment(user._id, day.date);
                        const isWeekend = new Date(day.date).getDay() === 0 || new Date(day.date).getDay() === 6;
                        return (
                          <td key={day.date} className="p-2 text-center">
                            {isWeekend && !assignment ? (
                              <span className="text-xs text-gray-300 font-medium">Off</span>
                            ) : (
                              <select
                                value={assignment?._id || ''}
                                onChange={e => handleAssign(user._id, day.date, e.target.value)}
                                className="text-xs border-0 bg-transparent font-bold focus:outline-none cursor-pointer w-full text-center">
                                <option value="">— Off —</option>
                                {shifts.map(s => (
                                  <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                              </select>
                            )}
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