import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

export default function ManageHolidays({ isOpen, onClose }) {
  const [selectedType, setSelectedType] = useState('Government');
  const [showDropdown, setShowDropdown] = useState(false);

  const categories = [
    "Government", "Religious", "Company Off", "National Day", 
    "Cultural", "Seasonal", "Memorial", "Educational"
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div onClick={onClose} className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 transition-opacity" />

      {/* Drawer Body Sliding Container */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 transform translate-x-0">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span>📅</span> Manage Holidays
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">0 holidays configured for 2026</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Form Body Content */}
        <div className="p-6 flex-1 space-y-5 overflow-y-auto text-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Add Holiday</div>
          
          {/* Input Name */}
          <div className="space-y-1.5">
            <label className="font-semibold text-gray-700">Name Holiday</label>
            <input type="text" placeholder="Enter Holiday Name" className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium transition-colors" />
          </div>

          {/* Input Date */}
          <div className="space-y-1.5">
            <label className="font-semibold text-gray-700">Date</label>
            <input type="date" defaultValue="2026-02-19" className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium transition-colors" />
          </div>

          {/* Dropdown Input Trigger Category */}
          <div className="space-y-1.5 relative">
            <label className="font-semibold text-gray-700">Category Type</label>
            <div 
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer flex justify-between items-center font-medium text-gray-700"
            >
              <span>{selectedType}</span>
              <Search className="w-4 h-4 text-gray-400" />
            </div>

            {/* Custom Interactive Dropdown Floating List */}
            {showDropdown && (
              <div className="absolute top-[72px] left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 py-1 divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {categories.map((cat, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setSelectedType(cat);
                      setShowDropdown(false);
                    }}
                    className={`px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-gray-700 font-medium transition-colors ${selectedType === cat ? 'bg-blue-50/60 text-blue-600' : ''}`}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description Optional TextArea */}
          <div className="space-y-1.5">
            <label className="font-semibold text-gray-700">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea rows={3} placeholder="Add brief note here..." className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium resize-none transition-colors" />
          </div>

          {/* Repeats Switch Option Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer pt-2 select-none">
            <input type="checkbox" className="w-4.5 h-4.5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-50" />
            <span className="font-semibold text-gray-700">Repeats every year</span>
          </label>
        </div>

        {/* Drawer Action Footer Buttons */}
        <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50/30">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 font-bold transition-colors">
            Cancel
          </button>
          <button className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-sm shadow-blue-100">
            Save Holiday
          </button>
        </div>

      </div>
    </>
  );
}