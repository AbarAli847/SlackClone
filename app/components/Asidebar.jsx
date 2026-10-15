 'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, CalendarCheck, LayoutDashboard, LogOut, Menu, FileText,
  CheckSquare, ChevronDown, ChevronRight, LayoutGrid, List, User, FolderOpen, Zap, Flag,
  CalendarDays, ClipboardList, BarChart2, FlaskConical, Clock, Users, Edit, CheckCircle,
  AlertTriangle, Bell, Shield, Settings
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '../context/SidebarContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const Asidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebar();

  const [user, setUser] = useState(null);
  const [showLogoutTab, setShowLogoutTab] = useState(false);
  const [leaveCount, setLeaveCount] = useState(0);
  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);
  const [attendanceDropdownOpen, setAttendanceDropdownOpen] = useState(false);
  const [summaryDropdownOpen, setSummaryDropdownOpen] = useState(false);
  const [controlDropdownOpen, setControlDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ Role flags
 const isAdmin = ['admin', 'super_admin', 'founder'].includes(user?.role);
const isSuperAdmin = ['super_admin', 'founder'].includes(user?.role);
const isHR = user?.role === 'hr';
const isQA = user?.role === 'qa';
const isPM = user?.role === 'project_manager';
const isTeamLead = user?.role === 'team_lead';
const isEmployee = user?.role === 'employee';
const isInternee = user?.role === 'internee';


// Super Admin sab kuch dekh sakta hai
const canManageProjects = isAdmin || isPM || isSuperAdmin;
const canManageAttendance = isAdmin || isHR || isSuperAdmin;
const canReviewTasks = isAdmin || isPM || isTeamLead || isSuperAdmin;
const canDoQA = isAdmin || isQA || isSuperAdmin;
const canViewReports = isAdmin || isHR || isSuperAdmin;
const canViewWorkload = isAdmin || isPM || isTeamLead || isSuperAdmin;
 

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchLeaveCount(parsedUser.role);
    }
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/tasks')) setTaskDropdownOpen(true);
    if (pathname.startsWith('/attendance') || pathname === '/leaves') setAttendanceDropdownOpen(true);
    if (pathname.startsWith('/daily-summaries')) setSummaryDropdownOpen(true);
    if (pathname.startsWith('/administration') || pathname.startsWith('/notifications')) setControlDropdownOpen(true);
  }, [pathname]);

  const fetchLeaveCount = async (role) => {
    try {
      const token = localStorage.getItem('token');
      if (['admin', 'super_admin', 'founder', 'hr'].includes(role)) {
        const res = await fetch(`${BACKEND_URL}/leave/all?status=Pending`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setLeaveCount(data.total || 0);
      } else {
        const res = await fetch(`${BACKEND_URL}/leave/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const approved = (data.leaves || []).filter(l => l.status === 'Approved').length;
        setLeaveCount(approved);
      }
    } catch (err) {
      console.error('Leave count fetch error:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLogoutTab(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('navbarNotifications');
    router.push('/login');
  };

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AU';

  //  Role ke hisaab se nav items
  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, show: true },
    { name: 'Chat', href: '/chats', icon: MessageSquare, show: true },
    { name: 'Founder Dashboard', href: '/founder-dashboard', icon: LayoutDashboard, show: isAdmin },
  ].filter(item => item.show);

  //  Attendance submenu — role ke hisaab se
  const attendanceItems = [
    { name: 'Daily View', href: '/attendance', icon: CalendarCheck, show: true },
    { name: 'Leaves', href: '/leaves', icon: FileText, badge: leaveCount, show: true },
    { name: 'Shifts', href: '/attendance/shifts', icon: Clock, show: canManageAttendance },
    { name: 'Shift Assignment', href: '/attendance/shift-assignment', icon: Users, show: canManageAttendance },
    { name: 'Corrections', href: '/attendance/corrections', icon: Edit, show: true },
    { name: 'Correction Approval', href: '/attendance/correction-approval', icon: CheckCircle, show: canManageAttendance },
    { name: 'Workload', href: '/attendance/workload', icon: BarChart2, show: canViewWorkload },
    { name: 'Reports', href: '/attendance/reports', icon: FileText, show: canViewReports },
  ].filter(item => item.show);

  //  Task submenu — role ke hisaab se
  const taskItems = [
    { name: 'Projects', href: '/tasks/projects', icon: FolderOpen, show: canManageProjects },
    { name: 'Kanban Board', href: '/tasks/kanban', icon: LayoutGrid, show: true },
    { name: 'List View', href: '/tasks/list', icon: List, show: true },
    { name: 'My Tasks', href: '/tasks/my', icon: User, show: true },
    { name: 'Sprints', href: '/tasks/sprints', icon: Zap, show: canManageProjects },
    { name: 'Workload', href: '/tasks/workload', icon: BarChart2, show: canViewWorkload },
    { name: 'Review Queue', href: '/tasks/review', icon: ClipboardList, show: canReviewTasks },
    { name: 'Calendar', href: '/tasks/calendar', icon: CalendarDays, show: true },
    { name: 'Milestones', href: '/tasks/milestones', icon: Flag, show: canManageProjects },
    { name: 'QA Testing', href: '/tasks/qa', icon: FlaskConical, show: canDoQA },
  ].filter(item => item.show);

  //  Daily Summary submenu — role ke hisaab se
  const dailySummaryItems = [
    { name: 'My Summary', href: '/daily-summaries', icon: FileText, show: true },
    { name: 'Team Review', href: '/daily-summaries/review', icon: ClipboardList, show: canReviewTasks },
    { name: 'Missing Summaries', href: '/daily-summaries/missing', icon: AlertTriangle, show: canManageAttendance || isAdmin },
  ].filter(item => item.show);

  //  Control submenu — sirf admin
  const controlItems = [
    { name: 'Notifications', href: '/notifications', icon: Bell, show: true },
    { name: 'Roles & Permissions', href: '/administration/roles', icon: Shield, show: isAdmin },
    { name: 'Audit Logs', href: '/administration/audit-logs', icon: FileText, show: isAdmin || isHR },
    { name: 'System Settings', href: '/administration/settings', icon: Settings, show: isAdmin },
  ].filter(item => item.show);

  const isTaskActive = pathname.startsWith('/tasks');
  const isAttendanceActive = pathname.startsWith('/attendance') || pathname === '/leaves';
  const isSummaryActive = pathname.startsWith('/daily-summaries');
  const isControlActive = pathname.startsWith('/administration') || pathname.startsWith('/notifications');

  if (pathname === '/login' || pathname === '/register') return null;

  const renderSubmenu = (items) => items.map((item) => {
    const isActive = pathname === item.href;
    return (
      <Link key={item.name} href={item.href}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          isActive ? 'bg-blue-600/80 text-white' : 'hover:bg-white/5 text-gray-400'
        }`}>
        <div className="relative">
          <item.icon size={16} />
          {item.badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </div>
        <span>{item.name}</span>
      </Link>
    );
  });

  return (
    <>
      <aside className={`hidden md:flex h-screen flex-col fixed top-0 left-0 bg-[#1E1B2E] text-gray-400 border-r border-white/10 transition-all duration-300 z-50 ${
        collapsed ? 'w-16' : 'w-60'
      }`}>

        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-6">
          <button onClick={() => setCollapsed(!collapsed)}
            className="p-2 text-white hover:bg-white/10 rounded-lg">
            <Menu size={20} />
          </button>
          {!collapsed && (
            <h1 className="text-white text-lg font-bold">NW Operations</h1>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">

          {/* Top Nav Items */}
          {navItems.map((item) => {
            const isActive = pathname.toLowerCase() === item.href.toLowerCase();
            return (
              <Link key={item.name} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'hover:bg-white/5'
                }`}>
                <item.icon size={20} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* ── Attendance Dropdown ── */}
          <div>
            <button
              onClick={() => !collapsed && setAttendanceDropdownOpen(!attendanceDropdownOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isAttendanceActive && collapsed ? 'bg-blue-600 text-white' : 'hover:bg-white/5'
              }`}>
              <div className="relative">
                <CalendarCheck size={20} />
                {leaveCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {leaveCount > 9 ? '9+' : leaveCount}
                  </span>
                )}
              </div>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Attendance</span>
                  {attendanceDropdownOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </>
              )}
            </button>
            {!collapsed && attendanceDropdownOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                {renderSubmenu(attendanceItems)}
              </div>
            )}
          </div>

          {/* ── Tasks Dropdown ── */}
          <div>
            <button
              onClick={() => !collapsed && setTaskDropdownOpen(!taskDropdownOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isTaskActive && collapsed ? 'bg-blue-600 text-white' : 'hover:bg-white/5'
              }`}>
              <CheckSquare size={20} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Tasks</span>
                  {taskDropdownOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </>
              )}
            </button>
            {!collapsed && taskDropdownOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                {renderSubmenu(taskItems)}
              </div>
            )}
          </div>

          {/* ── Daily Summaries Dropdown ── */}
          <div>
            <button
              onClick={() => !collapsed && setSummaryDropdownOpen(!summaryDropdownOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isSummaryActive && collapsed ? 'bg-blue-600 text-white' : 'hover:bg-white/5'
              }`}>
              <FileText size={20} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Daily Summaries</span>
                  {summaryDropdownOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </>
              )}
            </button>
            {!collapsed && summaryDropdownOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                {renderSubmenu(dailySummaryItems)}
              </div>
            )}
          </div>

          {/* ── Control Dropdown ── */}
          <div>
            <button
              onClick={() => !collapsed && setControlDropdownOpen(!controlDropdownOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isControlActive && collapsed ? 'bg-blue-600 text-white' : 'hover:bg-white/5'
              }`}>
              <Shield size={20} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Control</span>
                  {controlDropdownOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </>
              )}
            </button>
            {!collapsed && controlDropdownOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                {renderSubmenu(controlItems)}
              </div>
            )}
          </div>

        </nav>

        {/* User Info + Logout */}
        <div className="p-4 border-t border-white/10 relative" ref={dropdownRef}>
          <div onClick={() => setShowLogoutTab(!showLogoutTab)}
            className="flex items-center gap-3 cursor-pointer">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {getInitials(user?.name)}
            </div>
            {!collapsed && (
              <div>
                <p className="text-white text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ') || 'Online'}</p>
              </div>
            )}
          </div>

          {showLogoutTab && (
            <div className="absolute bottom-16 left-3 right-3 bg-[#2a2740] rounded-lg p-2">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 text-sm py-1">
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};

export default Asidebar;