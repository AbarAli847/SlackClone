'use client';
import React from 'react';
import { Bell, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const getPageTitle = () => {
    if (pathname === '/chats') return 'CHAT';
    if (pathname === '/attendance') return 'ATTENDANCE';
    if (pathname === '/') return 'DASHBOARD';
    return 'CHAT';
  };

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 ml-60 w-[calc(100%-240px)]">

      <div className="flex items-center">
        <h1 className="text-sm font-bold text-gray-800 uppercase tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-1.5 hover:bg-gray-50 rounded-full transition-all relative">
          <Bell size={18} strokeWidth={2.5} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <button className="p-1.5 text-black hover:bg-gray-50 rounded-full transition-all">
          <Sun size={18} strokeWidth={2.5} />
        </button>
      </div>

    </header>
  );
};

export default Navbar;