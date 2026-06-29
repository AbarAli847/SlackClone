import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarStrip({ viewType, setViewType, selectedDate, onDateSelect, onOpenDrawer, holidays = [], onMonthChange }) {

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  const getDayName = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    return weekdays[date.getDay()];
  };

  const isHolidayDate = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.some(h => h.date === dateStr);
  };

  const isWeekend = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    const d = date.getDay();
    return d === 0 || d === 6;
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();
  };

  //  Prev month
  const prevMonth = () => {
    let newMonth, newYear;
    if (currentMonth === 0) {
      newMonth = 11; newYear = currentYear - 1;
    } else {
      newMonth = currentMonth - 1; newYear = currentYear;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    if (onMonthChange) onMonthChange(newMonth, newYear);
  };

  //  Next month
  const nextMonth = () => {
    let newMonth, newYear;
    if (currentMonth === 11) {
      newMonth = 0; newYear = currentYear + 1;
    } else {
      newMonth = currentMonth + 1; newYear = currentYear;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    if (onMonthChange) onMonthChange(newMonth, newYear);
  };

  // ✅ Today button
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    if (onMonthChange) onMonthChange(today.getMonth(), today.getFullYear());
    onDateSelect(today.getDate());
  };

  const holidayCount = holidays.filter(h => {
    const d = new Date(h.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-xs border border-gray-100">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-gray-800 px-2 text-base">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button onClick={nextMonth} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={goToToday} className="ml-2 text-sm text-blue-600 font-semibold hover:underline">
            Today
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button onClick={onOpenDrawer}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3.5 py-2 rounded-xl text-sm font-semibold border border-blue-100 hover:bg-blue-100/70 transition-colors">
            <span>📅</span> Holidays
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold ml-0.5">
              {holidayCount}
            </span>
          </button>

          <div className="bg-gray-100 p-1 rounded-xl flex border border-gray-200">
            <button onClick={() => setViewType('daily')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${viewType === 'daily' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
              Daily
            </button>
            <button onClick={() => setViewType('monthly')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${viewType === 'monthly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
              Monthly
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 overflow-x-auto flex gap-2.5 scrollbar-thin scrollbar-thumb-gray-200">
        {daysArray.map((day) => {
          const isSelected = selectedDate === day;
          const holiday = isHolidayDate(day);
          const weekend = isWeekend(day);
          const today = isToday(day);

          return (
            <button key={day} onClick={() => onDateSelect(day)}
              className={`flex flex-col items-center min-w-[56px] p-2.5 rounded-xl border transition-all ${
                isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                : today ? 'bg-blue-50 border-blue-200 text-blue-700'
                : weekend ? 'bg-gray-50 border-gray-100 text-gray-400'
                : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-600'
              }`}>
              <span className="text-[10px] uppercase font-semibold tracking-wider opacity-60">
                {getDayName(day)}
              </span>
              <span className="text-base font-extrabold mt-1">{day}</span>
              <span className={`w-3.5 h-1 rounded-full mt-2 ${
                isSelected ? 'bg-white' :
                holiday ? 'bg-blue-500' :
                weekend ? 'bg-gray-300' :
                'bg-emerald-500'
              }`}></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}