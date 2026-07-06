"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, FolderPlus } from "lucide-react";
import { useSidebar } from "../../../context/SidebarContext";
import StatusBadge from "../Components/StatusBadge";
import TimerWidget from "../Components/TimerWidget";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const priorityStyle = (priority) => {
  switch (priority) {
    case "Critical": return "bg-red-50 text-red-700 border-red-100";
    case "High": return "bg-orange-50 text-orange-700 border-orange-100";
    case "Medium": return "bg-yellow-50 text-yellow-700 border-yellow-100";
    case "Low": return "bg-green-50 text-green-700 border-green-100";
    default: return "bg-gray-50 text-gray-700 border-gray-100";
  }
};

const STATUS_OPTIONS = ["New", "Assigned", "In Progress", "Review", "Testing", "Blocked", "Completed", "Cancelled"];

export default function MyTasks() {
  const { collapsed } = useSidebar();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [activeTimer, setActiveTimer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false); 
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [projectSubmitting, setProjectSubmitting] = useState(false); 

  const [blockerModal, setBlockerModal] = useState(null);
  const [blockerReason, setBlockerReason] = useState("");

  //  Project form
  const [projectForm, setProjectForm] = useState({
    name: "", description: "", priority: "Medium",
    start_date: "", end_date: "", color: "#3B82F6"
  });

  const [form, setForm] = useState({
    title: "", description: "", project_id: "", milestone_id: "",
    priority: "Medium", type: "Feature", assignees: [],
    start_date: "", due_date: "", estimated_hours: "", labels: "",
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setIsAdmin(user.role === "admin");
  }, []);

  useEffect(() => {
    fetchMyTasks();
    fetchActiveTimer();
  }, [filter, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchProjects();
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = isAdmin
        ? filter === "all" ? `${BACKEND_URL}/tasks/team` : `${BACKEND_URL}/tasks/team?status=${filter}`
        : filter === "all" ? `${BACKEND_URL}/tasks/my` : `${BACKEND_URL}/tasks/my?status=${filter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchActiveTimer = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/tasks/active-timer`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setActiveTimer(data.timeLog);
    } catch (err) { console.error(err); }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/tasks/projects/list`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) { console.error(err); }
  };

  const fetchMilestones = async (project_id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/tasks/milestones/list?project_id=${project_id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMilestones(data.milestones || []);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/auth/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) { console.error(err); }
  };

  const handleTimer = async (action, task_id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/tasks/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      fetchActiveTimer();
      fetchMyTasks();
    } catch (err) { alert("Server error"); }
  };

  const handleStatusChange = async (task_id, status) => {
    if (status === "Blocked") { setBlockerModal(task_id); return; }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/tasks/change-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_id, status }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      fetchMyTasks();
    } catch (err) { alert("Server error"); }
  };

  const handleBlockedSubmit = async () => {
    if (!blockerReason) { alert("Blocker reason likhein!"); return; }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/tasks/change-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_id: blockerModal, status: "Blocked", blocker_reason: blockerReason }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setBlockerModal(null);
      setBlockerReason("");
      fetchMyTasks();
    } catch (err) { alert("Server error"); }
  };

  const handleDelete = async (task_id) => {
    if (!confirm("Task delete karna chahte ho?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/tasks/delete?id=${task_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      fetchMyTasks();
    } catch (err) { alert("Server error"); }
  };

  const handleSubmit = async () => {
    if (!form.title) { alert("Title zaroori hai!"); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: form.title,
        description: form.description || undefined,
        project_id: form.project_id || undefined,
        milestone_id: form.milestone_id || undefined,
        priority: form.priority,
        type: form.type,
        assignees: form.assignees,
        start_date: form.start_date || undefined,
        due_date: form.due_date || undefined,
        estimated_hours: Number(form.estimated_hours) || 0,
        labels: form.labels ? form.labels.split(",").map((l) => l.trim()) : [],
      };
      const res = await fetch(`${BACKEND_URL}/tasks/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setShowCreateForm(false);
      setForm({ title: "", description: "", project_id: "", milestone_id: "", priority: "Medium", type: "Feature", assignees: [], start_date: "", due_date: "", estimated_hours: "", labels: "" });
      fetchMyTasks();
    } catch (err) { alert("Server error"); }
    finally { setSubmitting(false); }
  };

  // ✅ Project Submit
  const handleProjectSubmit = async () => {
    if (!projectForm.name) { alert("Project name zaroori hai!"); return; }
    setProjectSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/tasks/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(projectForm),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setShowProjectForm(false);
      setProjectForm({ name: "", description: "", priority: "Medium", start_date: "", end_date: "", color: "#3B82F6" });
      fetchProjects(); // ✅ Projects refresh karo
    } catch (err) { alert("Server error"); }
    finally { setProjectSubmitting(false); }
  };

  const filters = ["all", "New", "Assigned", "In Progress", "Review", "Testing", "Blocked", "Completed"];

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen p-4 md:p-6 font-sans text-gray-800 space-y-6 transition-all duration-300 ${collapsed ? "md:pl-20" : "md:pl-64"}`}>

      {/* Breadcrumb */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
          <span>Dashboard</span><span className="text-gray-300">/</span>
          <span>Tasks</span><span className="text-gray-300">/</span>
          <span className="text-gray-600 font-semibold">{isAdmin ? "All Tasks" : "My Tasks"}</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-gray-900">{isAdmin ? "All Tasks" : "My Tasks"}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{isAdmin ? "Manage all team tasks" : "Track your assigned tasks"}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-500">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
          {isAdmin && (
            <>
              {/* ✅ Add Project Button */}
              <button
                onClick={() => setShowProjectForm(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
              >
                <FolderPlus className="w-4 h-4" /> Add Project
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Task
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active Timer Banner */}
      {activeTimer && (
        <TimerWidget
          activeTimer={activeTimer}
          onPause={() => handleTimer("pause-timer", activeTimer.task_id._id)}
          onStop={() => handleTimer("stop-timer", activeTimer.task_id._id)}
          onRefresh={fetchActiveTimer}
        />
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${filter === f ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* ✅ Add Project Form */}
      {showProjectForm && isAdmin && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">New Project</h3>
            <button onClick={() => setShowProjectForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Project Name *</label>
              <input type="text" value={projectForm.name}
                onChange={e => setProjectForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Project name"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea rows={2} value={projectForm.description}
                onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Project description"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Priority</label>
              <select value={projectForm.priority}
                onChange={e => setProjectForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                {["Low", "Medium", "High", "Critical"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Color</label>
              <input type="color" value={projectForm.color}
                onChange={e => setProjectForm(p => ({ ...p, color: e.target.value }))}
                className="w-full h-10 px-1 py-1 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Start Date</label>
              <input type="date" value={projectForm.start_date}
                onChange={e => setProjectForm(p => ({ ...p, start_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">End Date</label>
              <input type="date" value={projectForm.end_date}
                onChange={e => setProjectForm(p => ({ ...p, end_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowProjectForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleProjectSubmit} disabled={projectSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-60">
              {projectSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </div>
      )}

      {/* Create Task Form */}
      {showCreateForm && isAdmin && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">New Task</h3>
            <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Title *</label>
              <input type="text" value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Task title"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea rows={2} value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Task description"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Project</label>
              <select value={form.project_id}
                onChange={(e) => {
                  setForm((p) => ({ ...p, project_id: e.target.value, milestone_id: "" }));
                  if (e.target.value) fetchMilestones(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                <option value="">Select Project</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Milestone</label>
              <select value={form.milestone_id}
                onChange={(e) => setForm((p) => ({ ...p, milestone_id: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                <option value="">Select Milestone</option>
                {milestones.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Priority</label>
              <select value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                {["Low", "Medium", "High", "Critical"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Type</label>
              <select value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                {["Feature", "Bug", "Improvement", "Research", "Design", "Testing"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Assignees</label>
              <select multiple value={form.assignees}
                onChange={(e) => setForm((p) => ({ ...p, assignees: Array.from(e.target.selectedOptions, (o) => o.value) }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 h-20">
                {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
              <p className="text-xs text-gray-400">Ctrl+Click se multiple select karo</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Estimated Hours</label>
              <input type="number" value={form.estimated_hours}
                onChange={(e) => setForm((p) => ({ ...p, estimated_hours: e.target.value }))}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Start Date</label>
              <input type="date" value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Due Date</label>
              <input type="date" value={form.due_date}
                onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Labels (comma separated)</label>
              <input type="text" value={form.labels}
                onChange={(e) => setForm((p) => ({ ...p, labels: e.target.value }))}
                placeholder="UI, Frontend, Design"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCreateForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60">
              {submitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {loading ? (
        <div className="text-center text-gray-400 py-10">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-gray-100">No tasks found</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isTimerActive = activeTimer?.task_id?._id === task._id;
            const isTimerRunning = isTimerActive && activeTimer?.status === "active";
            return (
              <div key={task._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.project_id && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md text-white"
                          style={{ backgroundColor: task.project_id.color || "#3B82F6" }}>
                          {task.project_id.name}
                        </span>
                      )}
                      <h3 className="font-bold text-gray-800">{task.title}</h3>
                    </div>
                    {task.description && <p className="text-sm text-gray-400">{task.description}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={task.status} />
                      <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold border ${priorityStyle(task.priority)}`}>{task.priority}</span>
                      <span className="text-xs text-gray-400 font-medium">{task.type}</span>
                      {isAdmin && task.assignees?.map((a) => (
                        <span key={a._id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">👤 {a.name}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium flex-wrap">
                      {task.due_date && <span>📅 Due: {task.due_date}</span>}
                      <span>⏱ Est: {task.estimated_hours}h</span>
                      <span>Logged: {task.total_logged_hours}h</span>
                    </div>
                    {task.status === "Blocked" && task.blocker_reason && (
                      <p className="text-xs text-red-500 font-medium">🚫 Blocked: {task.blocker_reason}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <select value={task.status}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                      className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 cursor-pointer">
                      {STATUS_OPTIONS.filter((s) => isAdmin ? true : s !== "Blocked" && s !== "Cancelled")
                        .map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {isAdmin && (
                      <button onClick={() => handleDelete(task._id)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                    {!isAdmin && (
                      <>
                        {!isTimerActive && !activeTimer && (
                          <button onClick={() => handleTimer("start-timer", task._id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                            ▶ Start
                          </button>
                        )}
                        {isTimerRunning && (
                          <>
                            <button onClick={() => handleTimer("pause-timer", task._id)}
                              className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors">⏸ Pause</button>
                            <button onClick={() => handleTimer("stop-timer", task._id)}
                              className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors">⏹ Stop</button>
                          </>
                        )}
                        {isTimerActive && activeTimer?.status === "paused" && (
                          <>
                            <button onClick={() => handleTimer("resume-timer", task._id)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors">▶ Resume</button>
                            <button onClick={() => handleTimer("stop-timer", task._id)}
                              className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors">⏹ Stop</button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Blocker Modal */}
      {blockerModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Blocker Reason</h3>
              <button onClick={() => { setBlockerModal(null); setBlockerReason(""); }}>
                <span className="text-gray-400">✕</span>
              </button>
            </div>
            <textarea rows={3} value={blockerReason}
              onChange={(e) => setBlockerReason(e.target.value)}
              placeholder="Task block hone ki wajah likhein..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-red-400 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => { setBlockerModal(null); setBlockerReason(""); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleBlockedSubmit}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700">Mark Blocked</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}