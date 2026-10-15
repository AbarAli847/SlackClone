'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from '../../../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-indigo-500'];
const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

const healthStyle = (status) => {
  switch (status) {
    case 'Active': return 'text-emerald-600';
    case 'At Risk': return 'text-amber-600';
    case 'On Track': return 'text-blue-600';
    case 'Overdue': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const workloadColor = (pct) => {
  if (pct >= 85) return 'bg-red-500';
  if (pct >= 65) return 'bg-amber-500';
  return 'bg-emerald-500';
};

const workloadLabel = (pct) => {
  if (pct >= 85) return 'Overloaded';
  if (pct >= 65) return 'Busy';
  if (pct >= 40) return 'Balanced';
  return 'Available';
};

export default function ProjectOverview({ projectId }) {
  const { collapsed } = useSidebar();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = ['Overview', 'Tasks', 'Milestones', 'Sprints', 'Team', 'Files', 'Activity', 'Reports'];

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchTasks();
      fetchMilestones();
      fetchActivity();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setProject(data.project);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/team?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) { console.error(err); }
  };

  const fetchMilestones = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/milestones/list?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMilestones(data.milestones || []);
    } catch (err) { console.error(err); }
  };

  const fetchActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/tasks/activity?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setActivity(data.activity || []);
    } catch (err) { console.error(err); }
  };

  // Stats calculate
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const totalTasks = tasks.length;
  const completion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Completed').length;
  const blockedTasks = tasks.filter(t => t.status === 'Blocked').length;
  const loggedHours = project?.logged_hours || 0;
  const estimatedHours = project?.estimated_hours || 0;

  // Team workload
  const memberWorkload = (project?.members || []).map((member, idx) => {
    const memberTasks = tasks.filter(t => t.assignees?.some(a => a._id === member._id || a === member._id));
    const pct = Math.min(
  Math.round(
    (memberTasks.length / Math.max(totalTasks, 1)) * 100
  ),
  100
); 
    return { ...member, pct, tasks: memberTasks.length };
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  if (!project) return <div className="flex items-center justify-center min-h-screen text-gray-400">Project not found</div>;

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push('/tasks/projects')}>NW Operations</span>
            <span>/</span>
            <span className="text-gray-600 font-semibold">Project Overview</span>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
              Open Client Room
            </button>
            <button
              onClick={() => router.push(`/tasks/projects/${projectId}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"
            >
              Edit Project
            </button>
          </div>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{project.description || 'Project overview and operational health'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mt-4 border-b border-gray-100 -mb-4">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'Overview' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {[
                { label: 'Completion', value: `${completion}%`, sub: `${completedTasks} of ${totalTasks} tasks`, color: 'text-gray-900' },
                { label: 'Project Health', value: project.status, sub: blockedTasks > 0 ? `${blockedTasks} critical blockers` : 'On track', color: healthStyle(project.status) },
                { label: 'Logged Hours', value: `${loggedHours}h`, sub: `of ${estimatedHours} estimated`, color: 'text-gray-900' },
                { label: 'Overdue Tasks', value: overdueTasks, sub: overdueTasks > 0 ? 'Needs attention' : 'All on time', color: overdueTasks > 0 ? 'text-red-600' : 'text-emerald-600' },
                { label: 'Blocked Tasks', value: blockedTasks, sub: 'Waiting for client', color: blockedTasks > 0 ? 'text-amber-600' : 'text-gray-400' },
                { label: 'Next Milestone', value: milestones.length > 0 ? `${milestones.length} left` : '—', sub: milestones[0]?.name || 'No milestones', color: 'text-gray-900' },
              ].map((card, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
                  <p className="text-xs text-gray-400 font-medium mb-1">{card.label}</p>
                  <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-6">
              {/* Left Column */}
              <div className="flex-1 space-y-6">

                {/* Progress by Milestone */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Progress by milestone</h3>
                    <span className="text-xs text-gray-400">Updated just now</span>
                  </div>
                  {milestones.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No milestones yet</p>
                  ) : (
                    <div className="space-y-4">
                      {milestones.map((milestone) => {
                        const mTasks = tasks.filter(t => t.milestone_id === milestone._id || t.milestone_id?._id === milestone._id);
                        const mCompleted = mTasks.filter(t => t.status === 'Completed').length;
                        const mPct = mTasks.length > 0 ? Math.round((mCompleted / mTasks.length) * 100) : 0;
                        return (
                          <div key={milestone._id}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{milestone.name}</span>
                              <span className="text-gray-400 font-bold">{mPct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="h-2 rounded-full bg-blue-600 transition-all"
                                style={{ width: `${mPct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Recent activity</h3>
                    <button className="text-xs text-blue-600 font-bold hover:underline">View all</button>
                  </div>
                  {activity.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {activity.slice(0, 5).map((log, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          <div>
                            <p className="text-sm text-gray-700">{log.user_id?.name} — {log.action?.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="w-80 space-y-6">

                {/* Team Workload */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
                  <h3 className="font-bold text-gray-800 mb-4">Team workload</h3>
                  {memberWorkload.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No team members</p>
                  ) : (
                    <div className="space-y-4">
                      {memberWorkload.map((member, idx) => (
                        <div key={member._id} className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {getInitials(member.name)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-semibold text-gray-800">{member.name}</span>
                              <span className="text-sm font-bold text-gray-600">{member.pct}%</span>
                            </div>
                            <div className="text-xs text-gray-400 mb-1">{workloadLabel(member.pct)}</div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${workloadColor(member.pct)}`}
                                style={{ width: `${member.pct}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Project Risks */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">Project risks</h3>
                    <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg font-bold hover:bg-blue-700">
                      + Add
                    </button>
                  </div>
                  {blockedTasks > 0 ? (
                    <div className="space-y-3">
                      {tasks.filter(t => t.status === 'Blocked').map(t => (
                        <div key={t._id} className="border border-gray-100 rounded-xl p-3">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-gray-800">{t.title}</p>
                            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Critical</span>
                          </div>
                          {t.blocker_reason && (
                            <p className="text-xs text-gray-400 mt-1">{t.blocker_reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No risks identified</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tasks Tab */}
        {activeTab === 'Tasks' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="font-bold text-gray-800 mb-4">Tasks — {totalTasks} total</h3>
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No tasks yet</p>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{task.title}</p>
                      <p className="text-xs text-gray-400">{task.type} · Due: {task.due_date || '—'}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      task.status === 'Blocked' ? 'bg-red-100 text-red-700' :
                      task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{task.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'Milestones' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="font-bold text-gray-800 mb-4">Milestones</h3>
            {milestones.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No milestones yet</p>
            ) : (
              <div className="space-y-3">
                {milestones.map(m => (
                  <div key={m._id} className="p-4 border border-gray-100 rounded-xl">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-gray-800">{m.name}</p>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        m.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        m.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{m.status}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Due: {m.due_date || '—'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'Team' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <h3 className="font-bold text-gray-800 mb-4">Team Members</h3>
            {project.members?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No team members</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {project.members?.map((member, idx) => (
                  <div key={member._id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                    <div className={`w-10 h-10 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold`}>
                      {getInitials(member.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}