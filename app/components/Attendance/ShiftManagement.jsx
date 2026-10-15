'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../context/SidebarContext';
import { Plus } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const shiftColors = ['border-blue-500', 'border-purple-500', 'border-emerald-500', 'border-amber-500', 'border-red-500', 'border-indigo-500'];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ShiftManagement() {
  const { collapsed } = useSidebar();
  const [shifts, setShifts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newShift, setNewShift] = useState({
    name: '', code: '', start_time: '09:00', end_time: '18:00',
    break_start: '13:00', break_end: '14:00',
    grace_minutes: 15, half_day_hours: 4, overtime_after: 9,
    weekly_off: ['Sun'], is_active: true,
    policies: { allow_remote: false, require_location: true, auto_mark_absent: true }
  });

  useEffect(() => { fetchShifts(); }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/attendance/shifts/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setShifts(data.shifts || []);
      if (data.shifts?.length > 0) setSelected(data.shifts[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/attendance/shifts/update?id=${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(selected)
      });
      fetchShifts();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/attendance/shift/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newShift)
      });
      setShowCreateForm(false);
      fetchShifts();
    } catch (err) { console.error(err); }
  };

  const toggleDay = (day) => {
    if (!selected) return;
    const off = selected.weekly_off || [];
    const updated = off.includes(day) ? off.filter(d => d !== day) : [...off, day];
    setSelected(prev => ({ ...prev, weekly_off: updated }));
  };

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Shift Management</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Import Shifts</button>
          <button onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            <Plus size={16} /> Create Shift
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Shift Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">Configure shift timings, break rules and attendance policies</p>
        </div>

        <div className="flex gap-6">
          {/* Left — Shift List */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Shift master</h3>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">{shifts.length} shifts</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold uppercase">
                  <th className="p-4 pl-6">Shift</th>
                  <th className="p-4">Timing</th>
                  <th className="p-4">Employees</th>
                  <th className="p-4 pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shifts.map((shift, idx) => (
                  <tr key={shift._id}
                    onClick={() => setSelected(shift)}
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${selected?._id === shift._id ? 'bg-blue-50' : ''}`}>
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-1 h-8 rounded-full border-l-4 ${shiftColors[idx % shiftColors.length]}`} />
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{shift.name}</p>
                          <p className="text-xs text-gray-400">{shift.code || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {shift.start_time} - {shift.end_time}
                    </td>
                    <td className="p-4 text-sm font-bold text-gray-700">
                      {shift.employee_count || 0}
                    </td>
                    <td className="p-4 pr-6">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                        shift.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {shift.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right — Shift Detail */}
          {selected && (
            <div className="w-96 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{selected.name}</h3>
                    <p className="text-xs text-gray-400">{selected.code} · {selected.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                  <button onClick={handleSave} disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Start time', key: 'start_time', type: 'time' },
                    { label: 'End time', key: 'end_time', type: 'time' },
                    { label: 'Break start', key: 'break_start', type: 'time' },
                    { label: 'Break end', key: 'break_end', type: 'time' },
                    { label: 'Grace minutes', key: 'grace_minutes', type: 'number' },
                    { label: 'Minimum full day', key: 'half_day_hours', type: 'number' },
                  ].map(({ label, key, type }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">{label}</label>
                      <input type={type} value={selected[key] || ''}
                        onChange={e => setSelected(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                  ))}
                </div>

                {/* Shift Timeline */}
                <div className="mt-4 flex gap-2">
                  <div className="flex-1 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-2 rounded-lg text-center">
                    Work {selected.start_time} - {selected.break_start || '13:00'}
                  </div>
                  <div className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-2 rounded-lg">
                    Break
                  </div>
                  <div className="flex-1 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-2 rounded-lg text-center">
                    Work {selected.break_end || '14:00'} - {selected.end_time}
                  </div>
                </div>

                {/* Weekly Off Days */}
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Weekly off days</p>
                  <div className="flex gap-2 flex-wrap">
                    {days.map(day => {
                      const isOff = (selected.weekly_off || []).includes(day);
                      return (
                        <button key={day} onClick={() => toggleDay(day)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            isOff ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Policies */}
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 mb-3">Policies</p>
                  <div className="space-y-3">
                    {[
                      { key: 'allow_remote', label: 'Allow remote clock-in' },
                      { key: 'require_location', label: 'Require location' },
                      { key: 'auto_mark_absent', label: 'Auto mark absent' },
                    ].map(({ key, label }) => {
                      const val = selected.policies?.[key] ?? false;
                      return (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{label}</span>
                          <button
                            onClick={() => setSelected(prev => ({
                              ...prev,
                              policies: { ...(prev.policies || {}), [key]: !val }
                            }))}
                            className={`w-11 h-6 rounded-full relative transition-colors ${val ? 'bg-blue-600' : 'bg-gray-200'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${val ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}