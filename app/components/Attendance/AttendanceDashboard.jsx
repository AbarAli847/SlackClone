'use client';

import React, { useState } from 'react';
 
import StatsBar from './Metrics/StatsBar';
import CalendarStrip from './Metrics/CalendarStrip';
import DailyTable from './Views/DailyTable';
import MonthlyGrid from './Views/MonthlyGrid';
import HolidayAlert from './Views/HolidayAlert';
import ManageHolidays from './Drawer/ManageHolidays';

 
import { useSidebar } from '../../context/SidebarContext'; 

export default function AttendanceDashboard() {
  const [viewType, setViewType] = useState('daily');  
  const [selectedDate, setSelectedDate] = useState(20); 
  const [isHolidaySelected, setIsHolidaySelected] = useState(false);  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Sidebar ki collapsed condition nikal rahe hain
  const { collapsed } = useSidebar();

  // Stats Data
  const statsData = {
    totalTeam: 10,
    present: isHolidaySelected ? 0 : 10,
    late: isHolidaySelected ? 0 : 1,
    absent: 0,
    onLeave: 0,
    avgHours: isHolidaySelected ? "0h" : "8.0h"
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day);
    if (day === 3) {
      setIsHolidaySelected(true);
    } else {
      setIsHolidaySelected(false);
    }
  };

  return (
    
    <div 
      className={`w-full bg-[#f8f9fa] min-h-screen p-4 md:p-6 font-sans text-gray-800 space-y-6 relative overflow-x-hidden transition-all duration-300 ${
        collapsed ? 'md:pl-20' : 'md:pl-64'
      }`}
    >
      
      {/* Top Header Row */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
          <span>Dashboard</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-semibold">Attendance</span>
        </div>
      </div>

      {/* Calendar Strip & Controls */}
      <CalendarStrip 
        viewType={viewType} 
        setViewType={setViewType} 
        selectedDate={selectedDate} 
        onDateSelect={handleDateSelect}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Numerical Metrics Grid */}
      <StatsBar stats={statsData} />

      {/* Dynamic Views Base Logic */}
      {isHolidaySelected ? (
        <HolidayAlert />
      ) : viewType === 'daily' ? (
        <DailyTable />
      ) : (
        <MonthlyGrid selectedDate={selectedDate} />
      )}

      {/* Side Slide Drawer for Form */}
      <ManageHolidays isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}