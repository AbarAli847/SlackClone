"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const Asidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <aside
      className={`h-screen flex flex-col fixed top-0 left-0 bg-[#1E1B2E] text-gray-400 border-r border-white/10 transition-all duration-300 z-50 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Top Logo Section */}
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

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-2">
        <Link
          href="/"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            pathname === "/"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <LayoutDashboard size={20} />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        <Link
          href="/chats"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            pathname === "/chats"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <MessageSquare size={20} />
          {!collapsed && <span>Chat</span>}
        </Link>

        <Link
          href="/attendance"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            pathname === "/attendance"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "hover:bg-white/5 hover:text-white"
          }`}
        >
          <CalendarCheck size={20} />
          {!collapsed && <span>Attendance</span>}
        </Link>
      </nav>

      {/* Footer User Section */}
      <div className="p-4 border-t border-white/10 bg-[#1a1829]">
        <div className="flex items-center gap-3">
          <div className="min-w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-inner">
            AU
          </div>
          
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">Admin</p>
              <p className="text-[10px] text-gray-500 truncate">Online</p>
            </div>
          )}

          <button 
            onClick={handleLogout}
            className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-all ml-auto"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Asidebar;