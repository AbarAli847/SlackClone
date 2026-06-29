import React from 'react';
import { Star } from 'lucide-react';

const categoryStyle = (category) => {
  switch (category) {
    case 'Religious': return 'bg-amber-100 text-amber-800';
    case 'Government': return 'bg-blue-100 text-blue-800';
    case 'National Day': return 'bg-green-100 text-green-800';
    case 'Company Off': return 'bg-purple-100 text-purple-800';
    case 'Cultural': return 'bg-pink-100 text-pink-800';
    case 'Seasonal': return 'bg-teal-100 text-teal-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function HolidayAlert({ holiday }) {
  //  console.log('Holiday data:', holiday);
  return (
    <div className="space-y-4">
      {/* Main Holiday Banner */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-6 flex items-start gap-4 shadow-xs">
        <div className="w-12 h-12 bg-white rounded-xl shadow-xs border border-blue-100 flex items-center justify-center text-blue-600">
          <Star className="w-6 h-6 fill-current" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            {holiday?.name || 'Holiday'}
          </h2>
          {holiday?.description && (
            // console.log('Holiday data:', holiday),
            <p className="text-sm text-gray-500">{holiday.description}
            
            </p>
           
          )}
          <div className="flex flex-wrap gap-2 pt-0.5">
            {holiday?.category && (
              <span className={`font-bold text-[11px] px-2.5 py-0.5 rounded-md ${categoryStyle(holiday.category)}`}>
                ⭐ {holiday.category}
              </span>
            )}
            <span className="bg-blue-100 text-blue-800 font-medium text-[11px] px-2.5 py-0.5 rounded-md">
              Office Closed — No attendance required
            </span>
            {holiday?.is_recurring && (
              <span className="bg-gray-100 text-gray-600 font-medium text-[11px] px-2.5 py-0.5 rounded-md">
                🔁 Repeats every year
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Empty Table */}
      <div className="bg-white rounded-xl border border-gray-100 opacity-60 pointer-events-none p-6 text-center text-sm font-medium text-gray-400">
        System active holiday status parameters applied. No member records to pull for this segment.
      </div>
    </div>
  );
}