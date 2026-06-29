import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ManageHolidays({ isOpen, onClose, onHolidayAdded }) {
  const [selectedType, setSelectedType] = useState('Government');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalHolidays, setTotalHolidays] = useState(0);

  const [form, setForm] = useState({
    name: '',
    date: '2026-02-19',
    description: '',
    is_recurring: false,
  });

  const categories = [
    "Government", "Religious", "Company Off", "National Day",
    "Cultural", "Seasonal", "Memorial", "Educational"
  ];

  // Total holidays fetch karo
  useEffect(() => {
    if (!isOpen) return;
    const fetchTotal = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BACKEND_URL}/holidays/list?year=2026`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setTotalHolidays(data.total || 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTotal();
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    if (!form.name || !form.date) {
      alert('Name aur date zaroori hain!');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/holidays/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          date: form.date,
          category: selectedType,
          description: form.description,
          is_recurring: form.is_recurring,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Kuch error aaya');
        return;
      }

      // Reset form
      setForm({ name: '', date: '2026-02-19', description: '', is_recurring: false });
      setSelectedType('Government');
      setTotalHolidays(prev => prev + 1);

      if (onHolidayAdded) onHolidayAdded(data.holiday);
      onClose();
    } catch (err) {
      alert('Server error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 transition-opacity" />

      <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 transform translate-x-0">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span>📅</span> Manage Holidays
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{totalHolidays} holidays configured for 2026</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 flex-1 space-y-5 overflow-y-auto text-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Add Holiday</div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="font-semibold text-gray-700">Name Holiday</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter Holiday Name"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium transition-colors"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="font-semibold text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium transition-colors"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5 relative">
            <label className="font-semibold text-gray-700">Category Type</label>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer flex justify-between items-center font-medium text-gray-700"
            >
              <span>{selectedType}</span>
              <Search className="w-4 h-4 text-gray-400" />
            </div>

            {showDropdown && (
              <div className="absolute top-[72px] left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 py-1 divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {categories.map((cat, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setSelectedType(cat); setShowDropdown(false); }}
                    className={`px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-gray-700 font-medium transition-colors ${selectedType === cat ? 'bg-blue-50/60 text-blue-600' : ''}`}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-gray-700">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              rows={3}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Add brief note here..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium resize-none transition-colors"
            />
          </div>

          {/* Recurring */}
          <label className="flex items-center gap-2.5 cursor-pointer pt-2 select-none">
            <input
              type="checkbox"
              name="is_recurring"
              checked={form.is_recurring}
              onChange={handleChange}
              className="w-4.5 h-4.5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-50"
            />
            <span className="font-semibold text-gray-700">Repeats every year</span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50/30">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 font-bold transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-sm shadow-blue-100 disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Holiday'}
          </button>
        </div>

      </div>
    </>
  );
}