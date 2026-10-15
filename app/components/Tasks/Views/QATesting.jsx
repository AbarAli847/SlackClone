'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../../context/SidebarContext';
import { Plus, X } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const severityStyle = (s) => {
  switch(s) {
    case 'Critical': case 'High': return 'bg-red-100 text-red-700';
    case 'Medium': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function QATesting() {
  const { collapsed } = useSidebar();
  const [tests, setTests] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newDefect, setNewDefect] = useState({ title: '', description: '', severity: 'Medium' });
  const [showDefectForm, setShowDefectForm] = useState(false);

  const [form, setForm] = useState({
    task_id: '', project_id: '', test_environment: '',
    test_summary: '', total_cases: 0, passed: 0, failed: 0,
    test_cases: [], defects: [], overall_result: 'Draft'
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');
    fetchTests();
    fetchTasks();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/qa/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTests(data.tests || []);
      if (data.tests?.length > 0) setSelected(data.tests[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/team?status=Testing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async () => {
    if (!form.task_id) { alert('Task select karo!'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/qa/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setShowCreateForm(false);
      fetchTests();
    } catch (err) { alert('Server error'); }
    finally { setSubmitting(false); }
  };

  const handleFinalAction = async (result) => {
    if (!selected) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/tasks/qa/update?id=${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ overall_result: result, status: result === 'Pass' ? 'Passed' : result === 'Fail' ? 'Failed' : 'Blocked' })
      });
      fetchTests();
    } catch (err) { console.error(err); }
  };

  const addDefect = async () => {
    if (!newDefect.title || !selected) return;
    try {
      const token = localStorage.getItem('token');
      const updated = [...(selected.defects || []), newDefect];
      await fetch(`${BACKEND_URL}/tasks/qa/update?id=${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ defects: updated })
      });
      setSelected(prev => ({ ...prev, defects: updated }));
      setNewDefect({ title: '', description: '', severity: 'Medium' });
      setShowDefectForm(false);
    } catch (err) { console.error(err); }
  };

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">QA Testing</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Save Draft</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">Submit Result</button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">QA Testing</h2>
            <p className="text-sm text-gray-400 mt-0.5">Record structured test results and defect evidence</p>
          </div>
          <button onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">
            <Plus size={16} /> New Test
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">New QA Test</h3>
              <button onClick={() => setShowCreateForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Task *</label>
                <select value={form.task_id}
                  onChange={e => setForm(p => ({ ...p, task_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none">
                  <option value="">Select Task</option>
                  {tasks.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Test Environment</label>
                <input type="text" value={form.test_environment}
                  onChange={e => setForm(p => ({ ...p, test_environment: e.target.value }))}
                  placeholder="Staging · build 0.9.6"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Total Cases</label>
                <input type="number" value={form.total_cases}
                  onChange={e => setForm(p => ({ ...p, total_cases: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Passed / Failed</label>
                <div className="flex gap-2">
                  <input type="number" value={form.passed} placeholder="Passed"
                    onChange={e => setForm(p => ({ ...p, passed: Number(e.target.value) }))}
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                  <input type="number" value={form.failed} placeholder="Failed"
                    onChange={e => setForm(p => ({ ...p, failed: Number(e.target.value) }))}
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Test Summary</label>
                <textarea rows={3} value={form.test_summary}
                  onChange={e => setForm(p => ({ ...p, test_summary: e.target.value }))}
                  placeholder="Test summary..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreateForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm">Cancel</button>
              <button onClick={handleCreate} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm disabled:opacity-60">
                {submitting ? 'Creating...' : 'Create Test'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading...</div>
        ) : selected ? (
          <div className="flex gap-6">
            {/* Left */}
            <div className="flex-1 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{selected.task_id?.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selected.project_id?.name} · Submitted by {selected.submitted_by?.name}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                    selected.status === 'Passed' ? 'bg-emerald-100 text-emerald-700' :
                    selected.status === 'Failed' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{selected.status}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {[
                    { label: 'Test cases executed', value: selected.total_cases },
                    { label: 'Passed / Failed', value: `${selected.passed} passed · ${selected.failed} fa` },
                    { label: 'Test environment', value: selected.test_environment || '—' },
                    { label: 'Overall result', value: selected.overall_result },
                  ].map((s, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400">{s.label}</p>
                      <p className="font-bold text-gray-800 text-sm mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Test Summary */}
                {selected.test_summary && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 mb-2">Test summary</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{selected.test_summary}</p>
                  </div>
                )}

                {/* Test Cases */}
                {selected.test_cases?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-3">Test cases</p>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                          <th className="pb-2">Case</th>
                          <th className="pb-2">Expected</th>
                          <th className="pb-2">Result</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selected.test_cases.map((tc, idx) => (
                          <tr key={idx} className="text-sm">
                            <td className="py-2 font-medium text-gray-700">{tc.case_name}</td>
                            <td className="py-2 text-gray-500">{tc.expected}</td>
                            <td className="py-2 text-gray-500">{tc.result}</td>
                            <td className="py-2">
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                tc.status === 'Passed' ? 'bg-emerald-100 text-emerald-700' :
                                tc.status === 'Failed' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-500'
                              }`}>{tc.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="w-80 space-y-4">
              {/* Defects */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">Defects</h3>
                  <button onClick={() => setShowDefectForm(true)}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg font-bold hover:bg-blue-700">
                    + Add Defect
                  </button>
                </div>

                {showDefectForm && (
                  <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-xl">
                    <input type="text" value={newDefect.title}
                      onChange={e => setNewDefect(p => ({ ...p, title: e.target.value }))}
                      placeholder="Defect title"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none" />
                    <input type="text" value={newDefect.description}
                      onChange={e => setNewDefect(p => ({ ...p, description: e.target.value }))}
                      placeholder="Description"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none" />
                    <select value={newDefect.severity}
                      onChange={e => setNewDefect(p => ({ ...p, severity: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none">
                      {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s}>{s}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDefectForm(false)}
                        className="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500">Cancel</button>
                      <button onClick={addDefect}
                        className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">Add</button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {selected.defects?.map((defect, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-xl p-3">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-gray-800">{defect.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${severityStyle(defect.severity)}`}>
                          {defect.severity}
                        </span>
                      </div>
                      {defect.description && <p className="text-xs text-gray-400 mt-1">{defect.description}</p>}
                    </div>
                  ))}
                  {!selected.defects?.length && <p className="text-xs text-gray-400 text-center py-2">No defects</p>}
                </div>
              </div>

              {/* Final Action */}
              {isAdmin && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
                  <h3 className="font-bold text-gray-800 mb-4">Final action</h3>
                  <div className="space-y-3">
                    <button onClick={() => handleFinalAction('Pass')}
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700">
                      Pass Testing
                    </button>
                    <button onClick={() => handleFinalAction('Fail')}
                      className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">
                      Fail and Return
                    </button>
                    <button onClick={() => handleFinalAction('Blocked')}
                      className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50">
                      Mark Blocked
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-20 bg-white rounded-2xl border border-gray-100">
            No QA tests yet — Create one!
          </div>
        )}
      </div>
    </div>
  );
}