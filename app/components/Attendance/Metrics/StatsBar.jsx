import React from 'react';

export default function StatsBar({ stats }) {
  const cards = [
    { label: "Total Team", value: stats.totalTeam, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Present", value: stats.present, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Late", value: stats.late, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Absent", value: stats.absent, color: "text-red-600", bg: "bg-red-50" },
    { label: "On Leave", value: stats.onLeave, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Avg Hours", value: stats.avgHours, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className={`w-11 h-11 ${card.bg} rounded-xl flex items-center justify-center font-bold text-lg ${card.color}`}>
            {card.value}
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium tracking-wide">{card.label}</div>
            <div className="text-lg font-bold text-gray-800 mt-0.5">{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}