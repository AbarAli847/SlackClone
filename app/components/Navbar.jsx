"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, Sun, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useSidebar } from "../context/SidebarContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const STORAGE_KEY = "navbarNotifications";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed } = useSidebar();
  const socketRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const hideNavbar = pathname === "/login" || pathname === "/register";

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();

      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        1320,
        audioCtx.currentTime + 0.08
      );

      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);

      oscillator.connect(gain);
      gain.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch {
      
    }
  };

  useEffect(() => {
    if (hideNavbar) return;

    const token = localStorage.getItem("token");
    if (!token || !BACKEND_URL) return;

    const socket = io(BACKEND_URL, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Navbar Socket Connected");
      socket.emit("user:joinAllDMs");
    });

    socket.on("notification:new", (notification) => {
      const normalizedNotification = {
        ...notification,
        id:
          notification.id ||
          `${notification.roomId}-${notification.senderId}-${Date.now()}`,
        read: false,
        createdAt: notification.createdAt || new Date().toISOString(),
      };

      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === normalizedNotification.id);
        if (exists) return prev;

        return [normalizedNotification, ...prev].slice(0, 50);
      });

      playNotificationSound();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [hideNavbar]);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const openNotification = (notification) => {
    markAsRead(notification.id);
    setShowDropdown(false);

    localStorage.setItem(
      "openRoom",
      JSON.stringify({
        roomId: notification.roomId,
        roomType: notification.roomType,
        roomName: notification.roomName,
      })
    );

    router.push("/chats");
  };

  const clearAll = () => {
    setNotifications([]);
    setShowDropdown(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (hideNavbar) return null;

  const getPageTitle = () => {
    if (pathname === "/chats") return "CHAT";
    if (pathname === "/attendance") return "ATTENDANCE";
    if (pathname === '/leaves') return "MY LEAVES";
    if (pathname === "/") return "DASHBOARD";
    return "CHAT";
  };

  return (
    <header
      className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 transition-all duration-300"
      style={{
        marginLeft: collapsed ? "4rem" : "15rem",
        width: `calc(100% - ${collapsed ? "4rem" : "15rem"})`,
      }}
    >
      <h1 className="text-sm sm:text-base font-bold text-gray-800 uppercase">
        {getPageTitle()}
      </h1>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="p-2 hover:bg-gray-100 rounded-full relative transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-semibold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full ring-2 ring-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-[360px] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-900">
                    Notifications
                  </p>
                  <p className="text-xs text-gray-400">
                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : "No unread notifications"}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={markAllAsRead}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-[#4A154B] transition-colors"
                        title="Mark all as read"
                      >
                        <CheckCheck size={16} />
                      </button>

                      <button
                        onClick={clearAll}
                        className="p-2 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                        title="Clear all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <p className="text-sm font-medium text-gray-700">
                      All caught up
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      New messages will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => openNotification(n)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 transition-colors ${
                        n.read ? "bg-white hover:bg-gray-50" : "bg-purple-50/70 hover:bg-purple-50"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 bg-[#4A154B] rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {n.senderName?.slice(0, 2).toUpperCase() || "?"}
                          </div>

                          {!n.read && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {n.senderName || "Unknown user"}
                            </p>

                            <span className="text-[10px] text-gray-400 shrink-0">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            <span className="font-medium text-[#4A154B]">
                              {n.roomType === "channel"
                                ? `#${n.roomName}`
                                : n.roomName}
                            </span>
                            <span className="mx-1 text-gray-300">•</span>
                            {n.content}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Sun size={20} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;