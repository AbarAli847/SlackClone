"use client";

import React, { useState } from "react";
import {MessageSquare,CalendarCheck,LayoutDashboard,LogOut,Menu} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Asidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-screen flex flex-col fixed bg-[#1E1B2E] text-gray-400 border-r transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 text-white hover:bg-white/10 rounded"
        >
          <Menu size={18} />
        </button>

        {!collapsed && (
          <h1 className="text-white text-sm font-bold">Slack Clone</h1>
        )}
      </div>

      <div className="border mb-3 border-white/5"></div>

      <nav className="flex-1 px-2 space-y-1">
        <Link
          href="/"
          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${
            pathname === "/"
              ? "bg-blue-600/20 text-blue-400"
              : "hover:bg-white/5"
          }`}
        >
          <LayoutDashboard size={18} />
          {!collapsed && "Dashboard"}
        </Link>

        <Link
          href="/chats"
          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${
            pathname === "/chats"
              ? "bg-blue-600/20 text-blue-400"
              : "hover:bg-white/5"
          }`}
        >
          <MessageSquare size={18} />
          {!collapsed && "Chat"}
        </Link>

        <Link
          href="/attendance"
          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${
            pathname === "/attendance"
              ? "bg-blue-600/20 text-blue-400"
              : "hover:bg-white/5"
          }`}
        >
          <CalendarCheck size={18} />
          {!collapsed && "Attendance"}
        </Link>
      </nav>

      <div className="p-3 border-t border-white/10 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
          AU
        </div>

        {!collapsed && <span className="text-sm text-white">Admin</span>}

        <LogOut size={16} className="ml-auto text-gray-400" />
      </div>
    </aside>
  );
};

export default Asidebar;
