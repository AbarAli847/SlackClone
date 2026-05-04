"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  Video,
  Pencil,
  ChevronDown,
  ChevronRight,
  Plus,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import Modal from "../components/Model";
import AddMemberModal from "../components/AddMemberModal";

const BACKEND_URL = "http://localhost:5000";
let socket;

const ChatSection = () => {
  const router = useRouter();
  const messagesEndRef = useRef(null);

  // Auth
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // UI State
  const [isChannelsOpen, setIsChannelsOpen] = useState(true);
  const [isDmsOpen, setIsDmsOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Data
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  // Active room
  const [activeRoom, setActiveRoom] = useState(null);  

  // Message input
  const [messageText, setMessageText] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  //private chennel
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);

  // ─── Auth Check ──────────────────────────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!savedToken || !savedUser) {
      router.push("/login");
      return;
    }

    setToken(savedToken);
    setUser(JSON.parse(savedUser));
  }, []);

  // ─── Socket.io Connect ───────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    socket = io(BACKEND_URL, {
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("Socket connected!");
    });

    socket.on("message:new", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("typing:start", ({ userId, name }) => {
      if (userId !== user?._id) {
        setTypingUsers((prev) => [...new Set([...prev, name])]);
      }
    });

    socket.on("typing:stop", ({ userId }) => {
      setTypingUsers((prev) => prev.filter((_, i) => i !== 0));
    });

    socket.on("error", ({ message }) => {
      console.error("Socket error:", message);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // ─── Fetch Channels ──────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetchChannels();
    fetchUsers();
  }, [token]);

  const fetchChannels = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/channels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setChannels(data.channels);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.users.filter((u) => u._id !== user?._id));
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Join Room & Fetch Messages ──────────────────────────────
  const joinChannel = async (channel) => {
    setActiveRoom({ type: "channel", id: channel._id, name: channel.name });
    setMessages([]);

    socket.emit("join:channel", { channelId: channel._id });

    const res = await fetch(
      `${BACKEND_URL}/api/messages/channel/${channel._id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await res.json();
    if (data.success) setMessages(data.messages);
  };

  const joinDM = async (targetUser) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/channels/dm/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId: targetUser._id }),
      });
      const data = await res.json();

      if (data.success) {
        const roomId = data.roomId;
        setActiveRoom({ type: "dm", id: roomId, name: targetUser.name });
        setMessages([]);

        socket.emit("join:dm", { roomId });

        const msgRes = await fetch(`${BACKEND_URL}/api/messages/dm/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const msgData = await msgRes.json();
        if (msgData.success) setMessages(msgData.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Send Message ────────────────────────────────────────────
  const sendMessage = () => {
    if (!messageText.trim() || !activeRoom) return;

    socket.emit("message:send", {
      roomId: activeRoom.id,
      roomType: activeRoom.type,
      content: messageText.trim(),
    });

    setMessageText("");
    socket.emit("typing:stop", { roomId: activeRoom.id });
  };

  // ─── Typing Indicator ────────────────────────────────────────
  const handleTyping = (e) => {
    setMessageText(e.target.value);

    if (!activeRoom) return;
    socket.emit("typing:start", { roomId: activeRoom.id });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { roomId: activeRoom.id });
    }, 1500);
  };

  // ─── Enter key send ──────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Auto Scroll ─────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Logout ──────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // ─── Time Format ─────────────────────────────────────────────
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // ─── Avatar ──────────────────────────────────────────────────
  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-[calc(99vh-44px)] w-[1000px] bg-white overflow-hidden ml-60">
      {/* ── Sidebar ── */}
      <div className="w-64 bg-[#4A154B] text-white flex flex-col shrink-0">
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
          <h2 className="text-sm font-bold">Workspace</h2>
          <Pencil
            size={14}
            className="text-gray-300 hover:text-white cursor-pointer"
          />
        </div>

        <div className="p-3">
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-[#350d36] text-xs px-3 py-2 rounded outline-none placeholder-gray-400"
          />
        </div>

        <div className="px-1 space-y-4 text-sm flex-1 overflow-y-auto">
          {/* Channels */}
          <div>
            <div
              onClick={() => setIsChannelsOpen(!isChannelsOpen)}
              className="flex items-center justify-between px-2 py-1 cursor-pointer group text-gray-400 hover:text-white"
            >
              <div className="flex items-center gap-1">
                {isChannelsOpen ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
                <p className="text-[10px] uppercase font-bold tracking-wider">
                  Channels
                </p>
              </div>
              <Plus
                size={14}
                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
              />
            </div>

            {isChannelsOpen && (
              <div className="mt-1 space-y-[2px]">
                {channels.map((channel) => (
                  <div
                    key={channel._id}
                    className={`px-4 py-1 rounded cursor-pointer transition-colors flex items-center justify-between group ${
                      activeRoom?.id === channel._id
                        ? "bg-[#1264A3] text-white"
                        : "text-gray-300 hover:bg-[#350d36]"
                    }`}
                  >
                    <span onClick={() => joinChannel(channel)}>
                      {channel.isPrivate ? "🔒" : "#"} {channel.name}
                    </span>

                    {channel.isPrivate && user?.role === "admin" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChannel(channel);
                          setIsAddMemberOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-xs bg-purple-600 px-1.5 py-0.5 rounded transition-opacity"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct Messages */}
          <div>
            <div
              onClick={() => setIsDmsOpen(!isDmsOpen)}
              className="flex items-center justify-between px-2 py-1 cursor-pointer group text-gray-400 hover:text-white"
            >
              <div className="flex items-center gap-1">
                {isDmsOpen ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
                <p className="text-[10px] uppercase font-bold tracking-wider">
                  Direct Messages
                </p>
              </div>
            </div>

            {isDmsOpen && (
              <div className="mt-1 space-y-[2px] px-2">
                {users.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => joinDM(u)}
                    className={`px-2 py-1 rounded flex items-center gap-2 cursor-pointer transition-all ${
                      activeRoom?.name === u.name
                        ? "bg-[#1264A3]"
                        : "hover:bg-[#350d36]"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-sm bg-purple-600 flex items-center justify-center text-[8px] font-bold">
                      {getInitials(u.name)}
                    </div>
                    <span className="text-sm text-gray-300">{u.name}</span>
                    {u.isOnline && (
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full ml-auto"></span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User info + Logout */}
        <div className="p-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-600 rounded-md flex items-center justify-center text-xs font-bold">
              {getInitials(user?.name)}
            </div>
            <div>
              <p className="text-xs font-semibold">{user?.name}</p>
              <p className="text-[10px] text-green-400">Online</p>
            </div>
          </div>
          
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-gray-300 bg-white">
          {activeRoom ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {activeRoom.type === "channel"
                  ? "#"
                  : getInitials(activeRoom.name)}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {activeRoom.type === "channel"
                    ? `# ${activeRoom.name}`
                    : activeRoom.name}
                </h3>
                <p className="text-[10px] text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Online
                </p>
              </div>
            </div>
          ) : (
            <h3 className="text-sm font-semibold text-gray-400">
              Select a channel or DM
            </h3>
          )}
          <div className="flex items-center gap-5 text-gray-500">
            <Phone size={18} className="cursor-pointer hover:text-gray-900" />
            <Video size={18} className="cursor-pointer hover:text-gray-900" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 bg-white">
          {!activeRoom && (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              👈 Please Select Any Chennel or DM
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg._id} className="flex gap-3 group">
              <div className="w-9 h-9 bg-purple-700 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(msg.sender?.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold hover:underline cursor-pointer">
                    {msg.sender?.name}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <p className="text-xs text-gray-400 italic">
              {typingUsers.join(", ")} is typing...
            </p>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-300 bg-white px-6 py-3">
          <div className="border rounded-lg overflow-hidden focus-within:border-gray-400 shadow-sm transition-all">
            <div className="flex gap-4 text-xs text-gray-500 px-3 py-2 border-b bg-gray-50">
              <span className="font-bold cursor-pointer hover:text-black">
                B
              </span>
              <span className="italic cursor-pointer hover:text-black">I</span>
              <span className="line-through cursor-pointer hover:text-black">
                S
              </span>
              <span className="font-mono cursor-pointer hover:text-black">
                {"</>"}
              </span>
            </div>
            <textarea
              className="w-full px-3 py-2 text-sm outline-none h-16 resize-none"
              placeholder={
                activeRoom
                  ? `Message ${activeRoom.type === "channel" ? "#" : ""}${activeRoom.name}`
                  : "Select a room first..."
              }
              value={messageText}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              disabled={!activeRoom}
            />
            <div className="flex justify-between items-center px-3 py-2">
              <button className="text-gray-400 text-lg hover:text-gray-600">
                +
              </button>
              <button
                onClick={sendMessage}
                disabled={!activeRoom || !messageText.trim()}
                className="bg-[#007A5A] text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-[#006046] transition-colors shadow-sm disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchChannels();
        }}
        token={token}
      />
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => {
          setIsAddMemberOpen(false);
          setSelectedChannel(null);
        }}
        channel={selectedChannel}
        token={token}
      />
    </div>
  );
};

export default ChatSection;
