'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Menu,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const Asidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogoutTab, setShowLogoutTab] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLogoutTab(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AU';
  };

  return (
    <aside
      className={`h-screen flex flex-col fixed top-0 left-0 bg-[#1E1B2E] text-gray-400 border-r border-white/10 transition-all duration-300 z-50 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-6">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        {!collapsed && (
          <h1 className="text-white text-lg font-bold tracking-tight">Slack Clone</h1>
        )}
      </div>

      <div className="mx-4 border-b border-white/5 mb-4"></div>

      <nav className="flex-1 px-3 space-y-2">
        <Link
          href="/"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            pathname === '/'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'hover:bg-white/5 hover:text-white'
          }`}
        >
          <LayoutDashboard size={20} />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        <Link
          href="/chats"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            pathname === '/chats'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'hover:bg-white/5 hover:text-white'
          }`}
        >
          <MessageSquare size={20} />
          {!collapsed && <span>Chat</span>}
        </Link>

        <Link
          href="/attendance"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            pathname === '/attendance'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'hover:bg-white/5 hover:text-white'
          }`}
        >
          <CalendarCheck size={20} />
          {!collapsed && <span>Attendance</span>}
        </Link>
      </nav>

      {/* User info + Logout Dropdown */}
      <div className="p-4 border-t border-white/10 bg-[#1a1829] relative" ref={dropdownRef}>

        {/* Logout Dropdown Tab */}
        {showLogoutTab && (
          <div className="absolute bottom-20 left-3 right-3 bg-[#2a2740] border border-white/10 rounded-lg shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* User Avatar + Info */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setShowLogoutTab(!showLogoutTab)}
        >
          <div className="min-w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-inner">
            {getInitials(user?.name)}
          </div>

          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] truncate">
                <span className="text-green-400">● </span>
                <span className="text-gray-500">
                  {user?.role === 'admin' ? 'Admin' : 'Online'}
                </span>
              </p>
            </div>
          )}

          {!collapsed && (
            <LogOut
              size={14}
              className="text-gray-400 hover:text-white transition-colors"
            />
          )}
        </div>
      </div>
    </aside>
  );
};

export default Asidebar;