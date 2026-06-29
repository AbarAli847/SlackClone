'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, CalendarCheck, LayoutDashboard, LogOut, Menu, FileText
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
  const dropdownRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchLeaveCount(parsedUser.role);
    }
  }, []);

  const fetchLeaveCount = async (role) => {
    try {
      const token = localStorage.getItem('token');

      if (role === 'admin') {
        // ✅ Admin ke liye pending leaves count
        const res = await fetch(`${BACKEND_URL}/leave/all?status=Pending`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setLeaveCount(data.total || 0);
      } else {
        // ✅ User ke liye apni approved leaves count
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

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Chat', href: '/chats', icon: MessageSquare },
    { name: 'Attendance', href: '/attendance', icon: CalendarCheck },
    { name: 'Leaves', href: '/leaves', icon: FileText, badge: leaveCount },
  ];

  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <>
      <aside
        className={`hidden md:flex h-screen flex-col fixed top-0 left-0 bg-[#1E1B2E] text-gray-400 border-r border-white/10 transition-all duration-300 z-50 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-6">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 text-white hover:bg-white/10 rounded-lg"
          >
            <Menu size={20} />
          </button>
          {!collapsed && (
            <h1 className="text-white text-lg font-bold">Slack Clone</h1>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.toLowerCase() === item.href.toLowerCase();
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'hover:bg-white/5'
                }`}
              >
                <div className="relative">
                  <item.icon size={20} />
                  {item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 relative" ref={dropdownRef}>
          <div
            onClick={() => setShowLogoutTab(!showLogoutTab)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
              {getInitials(user?.name)}
            </div>
            {!collapsed && (
              <div>
                <p className="text-white text-sm">{user?.name}</p>
                <p className="text-xs text-gray-400">Online</p>
              </div>
            )}
          </div>

          {showLogoutTab && (
            <div className="absolute bottom-16 left-3 right-3 bg-[#2a2740] rounded-lg p-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-red-400"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Asidebar;