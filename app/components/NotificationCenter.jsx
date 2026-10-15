'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const typeIcon = (type) => {
  switch (type) {
    case 'Tasks': return '☑';
    case 'Attendance': return '⏰';
    case 'Mentions': return '@';
    case 'Projects': return '!';
    case 'System': return '☰';
    case 'Leave': return '⏰';
    default: return '●';
  }
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 60) return `${mins} min`;
  if (hours < 24) return `${hours}h`;
  return 'Yesterday';
};

const mockNotifications = [
  { _id: '1', title: 'Task review requested', message: 'Ahmed submitted Client Login API for your review.', type: 'Tasks', is_read: false, requires_action: true, createdAt: new Date(Date.now() - 12 * 60000) },
  { _id: '2', title: 'Attendance correction pending', message: "Ahmed's missing clock-out request requires HR decision.", type: 'Attendance', is_read: false, requires_action: true, createdAt: new Date(Date.now() - 28 * 60000) },
  { _id: '3', title: 'You were mentioned', message: 'Fatima mentioned you in NW Client Portal.', type: 'Mentions', is_read: false, requires_action: false, createdAt: new Date(Date.now() - 44 * 60000) },
  { _id: '4', title: 'Project health changed', message: 'Bebop Digital Launch is now marked At Risk.', type: 'Projects', is_read: false, requires_action: false, createdAt: new Date(Date.now() - 3600000) },
  { _id: '5', title: 'Daily summaries missing', message: '7 employees have not submitted their daily summary.', type: 'System', is_read: false, requires_action: true, createdAt: new Date(Date.now() - 2 * 3600000) },
  { _id: '6', title: 'Task overdue', message: 'Invoice mapping task is now 2 days overdue.', type: 'Tasks', is_read: true, requires_action: false, createdAt: new Date(Date.now() - 3 * 3600000) },
  { _id: '7', title: 'Leave approved', message: 'Your leave request for 14 August was approved.', type: 'Leave', is_read: true, requires_action: false, createdAt: new Date(Date.now() - 86400000) },
];

export default function NotificationCenter() {
  const { collapsed } = useSidebar();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeTab, setActiveTab] = useState('All');
  const [summary, setSummary] = useState({ unread: 7, requiresAction: 4, mentions: 2, today: 18 });
  const [preferences, setPreferences] = useState({
    task_assignments: true,
    review_requests: true,
    email_reminders: true,
    chat_mentions: true,
    daily_digest: false,
  });

  const tabs = ['All', 'Tasks', 'Attendance', 'Projects', 'Mentions'];

  const filtered = activeTab === 'All'
    ? notifications
    : notifications.filter(n => n.type === activeTab);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setSummary(prev => ({ ...prev, unread: 0 }));
    } catch (err) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const handleMarkRead = (id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
  };

  return (
    <div className={`w-full bg-[#f8f9fa] min-h-screen font-sans text-gray-800 transition-all duration-300 ${
      collapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>NW Operations</span><span>/</span>
          <span className="text-gray-600 font-semibold">Notification Center</span>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
            Preferences
          </button>
          <button onClick={handleMarkAllRead}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            Mark All Read
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Notification Center</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage operational alerts, mentions and approval reminders</p>
        </div>

        <div className="flex gap-6">
          {/* Left — Notifications */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-4">
              {tabs.map(tab => {
                const count = tab === 'All' ? summary.unread : notifications.filter(n => n.type === tab && !n.is_read).length;
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                      activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}>
                    {tab} {tab === 'All' ? `· ${summary.unread}` : count > 0 ? `· ${count}` : ''}
                  </button>
                );
              })}
            </div>

            {/* Notification List */}
            <div className="divide-y divide-gray-50">
              {filtered.map(notification => (
                <div key={notification._id}
                  className={`p-5 hover:bg-gray-50/50 transition-colors ${!notification.is_read ? 'bg-blue-50/20' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                      !notification.is_read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {typeIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm font-bold ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-400 shrink-0 ml-4">{timeAgo(notification.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                      <button
                        onClick={() => handleMarkRead(notification._id)}
                        className="mt-2 text-xs border border-gray-200 px-4 py-1.5 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-10 text-center text-gray-400">No notifications</div>
              )}
            </div>
          </div>

          {/* Right — Summary + Preferences */}
          <div className="w-72 space-y-4">
            {/* Notification Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
              <h3 className="font-bold text-gray-800 mb-4">Notification summary</h3>
              <div className="space-y-3">
                {[
                  { label: 'Unread', value: summary.unread },
                  { label: 'Requires action', value: summary.requiresAction },
                  { label: 'Mentions', value: summary.mentions },
                  { label: 'Today', value: summary.today },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className="font-bold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Preferences */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
              <h3 className="font-bold text-gray-800 mb-4">Quick preferences</h3>
              <div className="space-y-3">
                {[
                  { key: 'task_assignments', label: 'Task assignments' },
                  { key: 'review_requests', label: 'Review requests' },
                  { key: 'email_reminders', label: 'Email reminders' },
                  { key: 'chat_mentions', label: 'Chat mentions' },
                  { key: 'daily_digest', label: 'Daily digest' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{label}</span>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={`w-11 h-6 rounded-full relative transition-colors ${preferences[key] ? 'bg-blue-600' : 'bg-gray-200'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${preferences[key] ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}