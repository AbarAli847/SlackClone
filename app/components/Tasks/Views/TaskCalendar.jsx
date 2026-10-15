'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../../context/SidebarContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function TaskCalendar() {
  const { collapsed } = useSidebar();
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('Month');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [currentDate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const [tasksRes, milestonesRes, holidaysRes, leavesRes, sprintsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/tasks/team`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/tasks/milestones/list`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/holidays/list?year=${year}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/leave/all?status=Approved`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/tasks/sprints/list`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [tasksData, milestonesData, holidaysData, leavesData, sprintsData] = await Promise.all([
        tasksRes.json(), milestonesRes.json(), holidaysRes.json(), leavesRes.json(), sprintsRes.json()
      ]);

      setTasks(tasksData.tasks || []);
      setMilestones(milestonesData.milestones || []);
      setHolidays(holidaysData.holidays || []);
      setLeaves(leavesData.leaves || []);
      setSprints(sprintsData.sprints || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const formatDate = (d) => {
    const date = new Date(d);
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const events = [];

    // Tasks
    tasks.filter(t => t.due_date === dateStr).forEach(t => {
      const isOverdue = new Date(t.due_date) < new Date() && t.status !== 'Completed';
      events.push({
        type: isOverdue ? 'overdue' : 'task',
        label: `${isOverdue ? 'Overdue: ' : ''}${t.title}`,
        color: isOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
      });
    });

    // Milestones
    milestones.filter(m => m.due_date === dateStr).forEach(m => {
      events.push({ type: 'milestone', label: m.name, color: 'bg-emerald-100 text-emerald-700' });
    });

    // Holidays
    holidays.filter(h => h.date === dateStr).forEach(h => {
      events.push({ type: 'holiday', label: h.name, color: 'bg-amber-100 text-amber-700' });
    });

    // Leaves
    leaves.filter(l => l.from_date <= dateStr && l.to_date >= dateStr).forEach(l => {
      events.push({ type: 'leave', label: `${l.employee_id?.name || 'Leave'}`, color: 'bg-purple-100 text-purple-700' });
    });

    // Sprints
    sprints.filter(s => s.end_date === dateStr).forEach(s => {
      events.push({ type: 'sprint', label: `${s.name} ends`, color: 'bg-indigo-100 text-indigo-700' });
    });

    return events;
  };

  const totalCells = Math.ceil((adjustedFirstDay + daysInMonth) / 7) * 7;

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Task Calendar</span>
        </div>
        {/* View Toggle */}
        <div className="flex">
          {['Today', 'Week', 'Month'].map(v => (
            <button key={v} onClick={() => { setView(v); if (v === 'Today') goToday(); }}
              className={`px-5 py-2 text-sm font-bold transition-colors ${
                view === v ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              } ${v === 'Today' ? 'rounded-l-xl' : v === 'Month' ? 'rounded-r-xl' : ''}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-black text-gray-900">Task Calendar</h2>
          <p className="text-sm text-gray-400 mt-0.5">Deadlines, milestones, sprints, holidays and approved leave</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <h3 className="font-bold text-gray-800">{monthName}</h3>
            <button onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex gap-4 px-4 py-3 border-b border-gray-50 text-xs font-medium flex-wrap">
            {[
              { color: 'bg-blue-500', label: 'Task' },
              { color: 'bg-red-500', label: 'Overdue' },
              { color: 'bg-emerald-500', label: 'Milestone' },
              { color: 'bg-purple-500', label: 'Leave' },
              { color: 'bg-amber-500', label: 'Holiday' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-gray-500">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>
                {label}
              </span>
            ))}
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {dayNames.map(d => (
              <div key={d} className="p-3 text-xs font-bold text-gray-400 uppercase text-center">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: totalCells }).map((_, idx) => {
              const day = idx - adjustedFirstDay + 1;
              const isCurrentMonth = day > 0 && day <= daysInMonth;
              const today = new Date();
              const isToday = isCurrentMonth &&
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();
              const events = isCurrentMonth ? getEventsForDay(day) : [];

              return (
                <div key={idx}
                  className={`min-h-[100px] p-2 border-b border-r border-gray-50 ${
                    !isCurrentMonth ? 'bg-gray-50/30' : 'hover:bg-gray-50/50'
                  }`}>
                  {isCurrentMonth && (
                    <>
                      <div className={`text-sm font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-blue-600 text-white' : 'text-gray-600'
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {events.slice(0, 3).map((event, eIdx) => (
                          <div key={eIdx}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium truncate cursor-pointer ${event.color}`}>
                            {event.label}
                          </div>
                        ))}
                        {events.length > 3 && (
                          <div className="text-[10px] text-gray-400 font-medium px-1">
                            +{events.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}