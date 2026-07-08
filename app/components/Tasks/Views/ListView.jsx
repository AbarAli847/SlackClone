"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { useSidebar } from "../../../context/SidebarContext";
import StatusBadge from "../Components/StatusBadge";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const priorityStyle = (priority) => {
  switch (priority) {
    case "Critical":
      return "bg-red-50 text-red-700 border-red-100";
    case "High":
      return "bg-orange-50 text-orange-700 border-orange-100";
    case "Medium":
      return "bg-yellow-50 text-yellow-700 border-yellow-100";
    case "Low":
      return "bg-green-50 text-green-700 border-green-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
};

const STATUS_OPTIONS = [
  "New",
  "Assigned",
  "In Progress",
  "Review",
  "Testing",
  "Blocked",
  "Completed",
  "Cancelled",
];

export default function ListView() {
  const { collapsed } = useSidebar();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [projects, setProjects] = useState([]);
  const [blockerModal, setBlockerModal] = useState(null);
  const [blockerReason, setBlockerReason] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setIsAdmin(user.role === "admin");
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [isAdmin, filterStatus, filterPriority, filterProject]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterPriority) params.append("priority", filterPriority);
      if (filterProject) params.append("project_id", filterProject);

      const url = isAdmin
        ? `${BACKEND_URL}/tasks/team?${params.toString()}`
        : `${BACKEND_URL}/tasks/my?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/tasks/projects/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (task_id, status) => {
    if (status === "Blocked" && isAdmin) {
      setBlockerModal(task_id);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/tasks/change-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ task_id, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message);
        return;
      }
      fetchTasks();
    } catch (err) {
      alert("Server error");
    }
  };

  const handleBlockedSubmit = async () => {
    if (!blockerReason) {
      alert("Blocker reason likhein!");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/tasks/change-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_id: blockerModal,
          status: "Blocked",
          blocker_reason: blockerReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message);
        return;
      }
      setBlockerModal(null);
      setBlockerReason("");
      fetchTasks();
    } catch (err) {
      alert("Server error");
    }
  };

  const handleDelete = async (task_id) => {
    if (!confirm("Task delete karna chahte ho?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/tasks/delete?id=${task_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        alert("Delete failed");
        return;
      }
      fetchTasks();
    } catch (err) {
      alert("Server error");
    }
  };

  // Search filter frontend pe
  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className={`w-full bg-[#f8f9fa] min-h-screen p-4 md:p-6 font-sans text-gray-800 space-y-6 transition-all duration-300 ${
        collapsed ? "md:pl-20" : "md:pl-64"
      }`}
    >
      {/* Breadcrumb */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
          <span>Dashboard</span>
          <span className="text-gray-300">/</span>
          <span>Tasks</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-semibold">List View</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-gray-900">List View</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {filteredTasks.length} tasks
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm focus:outline-none bg-transparent flex-1"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none"
        >
          <option value="">All Priority</option>
          {["Low", "Medium", "High", "Critical"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Project Filter */}
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No tasks found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-400 font-bold tracking-wider uppercase">
                  <th className="p-4 pl-6">Task</th>
                  <th className="p-4">Project</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Assignees</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Hours</th>
                  {isAdmin && <th className="p-4 pr-6">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredTasks.map((task) => (
                  <tr
                    key={task._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Task Title */}
                    <td className="p-4 pl-6">
                      <div>
                        <p className="font-bold text-gray-800">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                            {task.description}
                          </p>
                        )}
                        {task.status === "Blocked" && task.blocker_reason && (
                          <p className="text-xs text-red-500 mt-0.5">
                            🚫 {task.blocker_reason}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Project */}
                    <td className="p-4">
                      {task.project_id ? (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-md text-white"
                          style={{
                            backgroundColor: task.project_id.color || "#3B82F6",
                          }}
                        >
                          {task.project_id.name}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="p-4">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task._id, e.target.value)
                        }
                        className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:outline-none cursor-pointer"
                      >
                        {STATUS_OPTIONS.filter((s) =>
                          isAdmin ? true : s !== "Blocked" && s !== "Cancelled",
                        ).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Priority */}
                    <td className="p-4">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-md font-bold border ${priorityStyle(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    {/* Assignees */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {task.assignees?.map((a) => (
                          <span
                            key={a._id}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
                          >
                            {a.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="p-4">
                      {task.due_date ? (
                        <span
                          className={`text-xs font-medium ${
                            new Date(task.due_date) < new Date() &&
                            task.status !== "Completed"
                              ? "text-red-500"
                              : "text-gray-500"
                          }`}
                        >
                          {task.due_date}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Hours */}
                    <td className="p-4">
                      <div className="text-xs text-gray-500">
                        <div>Est: {task.estimated_hours}h</div>
                        <div>Logged: {task.total_logged_hours}h</div>
                      </div>
                    </td>

                    {/* Actions — Admin only */}
                    {isAdmin && (
                      <td className="p-4 pr-6">
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Blocker Modal */}
      {blockerModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Blocker Reason</h3>
              <button
                onClick={() => {
                  setBlockerModal(null);
                  setBlockerReason("");
                }}
              >
                ✕
              </button>
            </div>
            <textarea
              rows={3}
              value={blockerReason}
              onChange={(e) => setBlockerReason(e.target.value)}
              placeholder="Task block hone ki wajah likhein..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setBlockerModal(null);
                  setBlockerReason("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockedSubmit}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700"
              >
                Mark Blocked
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
