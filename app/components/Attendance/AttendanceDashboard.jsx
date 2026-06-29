'use client';

import React, { useState, useEffect } from 'react';

import StatsBar from './Metrics/StatsBar';
import CalendarStrip from './Metrics/CalendarStrip';
import DailyTable from './Views/DailyTable';
import MonthlyGrid from './Views/MonthlyGrid';
import HolidayAlert from './Views/HolidayAlert';
import ManageHolidays from './Drawer/ManageHolidays';

import { useSidebar } from '../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function AttendanceDashboard() {
  const [viewType, setViewType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHolidaySelected, setIsHolidaySelected] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [statsData, setStatsData] = useState({
    totalTeam: 0, present: 0, late: 0, absent: 0, onLeave: 0, avgHours: '0h'
  });
  const [userStats, setUserStats] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [currentDate, setCurrentDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isAdmin, setIsAdmin] = useState(false);

  const { collapsed } = useSidebar();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');
  }, []);

  useEffect(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setCurrentDate(dateStr);
    setSelectedDate(today.getDate());
  }, []);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const token = localStorage.getItem('token');
        const year = new Date().getFullYear();
        const res = await fetch(`${BACKEND_URL}/holidays/list?year=${year}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setHolidays(data.holidays || []);
      } catch (err) {
        console.error('Holidays fetch error:', err);
      }
    };
    fetchHolidays();
  }, []);

  // ✅ ANDAR HAI AB
  useEffect(() => {
    const checkHoliday = async () => {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/attendance/check-holiday`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    };
    checkHoliday();
  }, []);

  useEffect(() => {
    if (!currentDate) return;
    if (isAdmin) {
      fetchStats(currentDate);
    } else {
      fetchUserStats();
    }
  }, [currentDate, viewType, currentMonth, currentYear, isAdmin]);

  const fetchStats = async (date) => {
    try {
      const token = localStorage.getItem('token');
      const url = viewType === 'monthly'
        ? `${BACKEND_URL}/attendance/stats?month=${currentMonth + 1}&year=${currentYear}`
        : `${BACKEND_URL}/attendance/stats?date=${date}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();

      if (res.ok) {
        const s = data.stats;
        setStatsData({
          totalTeam: s.total, present: s.present, late: s.late,
          absent: s.absent, onLeave: s.on_leave, avgHours: '—'
        });
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${BACKEND_URL}/attendance/my-stats?month=${currentMonth + 1}&year=${currentYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) setUserStats(data.stats);
    } catch (err) {
      console.error('User stats fetch error:', err);
    }
  };

  const handleMonthChange = (month, year) => {
    setCurrentMonth(month);
    setCurrentYear(year);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    setCurrentDate(dateStr);
    setIsHolidaySelected(false);
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setCurrentDate(dateStr);
    const isHoliday = holidays.some(h => h.date === dateStr);
    setIsHolidaySelected(isHoliday);
    if (!isHoliday && isAdmin) fetchStats(dateStr);
  };

  const selectedHoliday = holidays.find(h => h.date === currentDate);

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen p-4 md:p-6 font-sans text-gray-800 space-y-6 relative overflow-x-hidden transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
          <span>Dashboard</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-semibold">Attendance</span>
        </div>
      </div>

      <CalendarStrip
        viewType={viewType}
        setViewType={setViewType}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        holidays={holidays}
        onMonthChange={handleMonthChange}
      />

      {isAdmin ? (
        <StatsBar stats={statsData} />
      ) : userStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Present', value: userStats.total_present, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Late', value: userStats.total_late, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Absent', value: userStats.total_absent, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Half Day', value: userStats.total_half_day, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'On Leave', value: userStats.total_leave, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Work Hrs', value: userStats.total_work_hours ? `${userStats.total_work_hours}h` : '0h', color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map((card, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center font-bold text-sm ${card.color}`}>
                {card.value}
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">{card.label}</div>
                <div className="text-base font-bold text-gray-800">{card.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isHolidaySelected ? (
        <HolidayAlert holiday={selectedHoliday} />
      ) : viewType === 'daily' ? (
        <DailyTable selectedDate={currentDate} isHolidaySelected={isHolidaySelected} />
      ) : (
        <MonthlyGrid selectedDate={currentDate} />
      )}

      <ManageHolidays
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onHolidayAdded={(newHoliday) => setHolidays(prev => [...prev, newHoliday])}
      />
    </div>
  );
}