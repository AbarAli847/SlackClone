"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  Video,
  Pencil,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import Modal from "../components/Model";
import AddMemberModal from "../components/AddMemberModal";
import EmojiPicker from "emoji-picker-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
let socket;

const ChatSection = () => {
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isChannelsOpen, setIsChannelsOpen] = useState(true);
  const [isDmsOpen, setIsDmsOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const activeRoomRef = useRef(null);
  const [messageText, setMessageText] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [unreadDMs, setUnreadDMs] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

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

  // ─── Active Room Ref sync ────────────────────────────────────
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // ─── Socket.io Connect ───────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    socket = io(BACKEND_URL, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected!");
      socket.emit("user:joinAllDMs");
    });

    socket.on("message:new", (message) => {
      const currentRoom = activeRoomRef.current;
      if (currentRoom && message.roomId === currentRoom.id) {
        setMessages((prev) => [...prev, message]);
      } else {
        setUnreadDMs((prev) => ({
          ...prev,
          [message.roomId]: (prev[message.roomId] || 0) + 1,
        }));
        if (!currentRoom && message.roomType === "dm") {
          const ids = message.roomId.split("_");
          const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
          const otherUserId = ids.find((id) => id !== savedUser._id);
          setUsers((prev) => {
            const targetUser = prev.find((u) => u._id === otherUserId);
            if (targetUser) {
              setActiveRoom({
                type: "dm",
                id: message.roomId,
                name: targetUser.name,
              });
              setMessages([message]);
              if (socket) socket.emit("join:dm", { roomId: message.roomId });
            }
            return prev;
          });
        }
      }
    });

    socket.on("typing:start", ({ userId, name }) => {
      if (userId !== user?._id)
        setTypingUsers((prev) => [...new Set([...prev, name])]);
    });

    socket.on("typing:stop", () => setTypingUsers([]));
    socket.on("connect_error", (err) =>
      console.error("Socket error:", err.message),
    );

    return () => socket.disconnect();
  }, [token]);

  // ─── Fetch ───────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetchChannels();
    fetchUsers();
  }, [token]);

  const fetchChannels = async () => {
    try {
      const savedToken = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/channels`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (data.success) setChannels(data.channels);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch(`${BACKEND_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (data.success)
        setUsers(data.users.filter((u) => u._id !== savedUser?._id));
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Join Channel ────────────────────────────────────────────
  const joinChannel = async (channel) => {
    setActiveRoom({ type: "channel", id: channel._id, name: channel.name });
    setMessages([]);
    setUnreadDMs((prev) => ({ ...prev, [channel._id]: 0 }));
    if (socket) socket.emit("join:channel", { channelId: channel._id });
    const savedToken = localStorage.getItem("token");
    const res = await fetch(
      `${BACKEND_URL}/api/messages/channel/${channel._id}`,
      {
        headers: { Authorization: `Bearer ${savedToken}` },
      },
    );
    const data = await res.json();
    if (data.success) setMessages(data.messages);
  };

  // ─── Join DM ─────────────────────────────────────────────────
  const joinDM = async (targetUser) => {
    try {
      const savedToken = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/channels/dm/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${savedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId: targetUser._id }),
      });
      const data = await res.json();
      if (data.success) {
        const roomId = data.roomId;
        setActiveRoom({ type: "dm", id: roomId, name: targetUser.name });
        setMessages([]);
        setUnreadDMs((prev) => ({ ...prev, [roomId]: 0 }));
        if (socket) socket.emit("join:dm", { roomId });
        const msgRes = await fetch(`${BACKEND_URL}/api/messages/dm/${roomId}`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        const msgData = await msgRes.json();
        if (msgData.success) setMessages(msgData.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Send Text Message ───────────────────────────────────────
  const sendMessage = () => {
    if (!messageText.trim() || !activeRoom || !socket) return;
    socket.emit("message:send", {
      roomId: activeRoom.id,
      roomType: activeRoom.type,
      content: messageText.trim(),
    });
    setMessageText("");
    socket.emit("typing:stop", { roomId: activeRoom.id });
  };

  // ─── File Select ─────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // ─── Send File ───────────────────────────────────────────────
  const sendFileMessage = async () => {
    if (!selectedFile || !activeRoom) return;
    setUploading(true);
    const savedToken = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("roomId", activeRoom.id);
    formData.append("roomType", activeRoom.type);
    formData.append("content", messageText || "");
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${savedToken}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        // Local mein add karo
        setMessages((prev) => [...prev, data.message]);
        // Dusron ko socket se bhejo
        if (socket) {
          socket.emit("file:new", {
            roomId: activeRoom.id,
            roomType: activeRoom.type,
            fileUrl: data.message.fileUrl,
            content: messageText || "",
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
    setSelectedFile(null);
    setFilePreview(null);
    setMessageText("");
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Typing ──────────────────────────────────────────────────
  const handleTyping = (e) => {
    setMessageText(e.target.value);
    if (!activeRoom || !socket) return;
    socket.emit("typing:start", { roomId: activeRoom.id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { roomId: activeRoom.id });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      selectedFile ? sendFileMessage() : sendMessage();
    }
  };

  // ─── Auto Scroll ─────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Helpers ─────────────────────────────────────────────────
  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getDMRoomId = (targetUserId) => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return [savedUser._id, targetUserId].sort().join("_");
  };

  const isMyMessage = (msg) => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return msg.sender?._id === savedUser._id || msg.sender === savedUser._id;
  };

  // ─── Render Image or File ─────────────────────────────────────
  const renderFile = (msg, mine) => {
    if (!msg.fileUrl) return null;
    const isImage =
      /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(msg.fileUrl) ||
      msg.fileUrl.includes("/uploads/");

    return (
      <div
        className={`mt-1 flex flex-col ${mine ? "items-end" : "items-start"}`}
      >
        {isImage ? (
          <img
            src={`${BACKEND_URL}${msg.fileUrl}`}
            alt="attachment"
            className="max-w-[250px] max-h-[300px] rounded-2xl border cursor-pointer hover:opacity-90 shadow-sm object-cover"
            onClick={() =>
              window.open(`${BACKEND_URL}${msg.fileUrl}`, "_blank")
            }
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <a
            href={`${BACKEND_URL}${msg.fileUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              mine ? "bg-[#4A154B] text-white" : "bg-gray-100 text-blue-600"
            }`}
          >
            📎 {msg.fileUrl.split("/").pop()}
          </a>
        )}
      </div>
    );
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
                    <span
                      onClick={() => joinChannel(channel)}
                      className="flex-1 flex items-center gap-1"
                    >
                      {channel.isPrivate ? "🔒" : "#"} {channel.name}
                      {unreadDMs[channel._id] > 0 && (
                        <span className="ml-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                          {unreadDMs[channel._id]}
                        </span>
                      )}
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
                {users.map((u) => {
                  const dmRoomId = getDMRoomId(u._id);
                  const unreadCount = unreadDMs[dmRoomId] || 0;
                  return (
                    <div
                      key={u._id}
                      onClick={() => joinDM(u)}
                      className={`px-2 py-1 rounded flex items-center gap-2 cursor-pointer transition-all ${
                        activeRoom?.name === u.name
                          ? "bg-[#1264A3]"
                          : "hover:bg-[#350d36]"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-sm bg-purple-600 flex items-center justify-center text-[8px] font-bold shrink-0">
                        {getInitials(u.name)}
                      </div>
                      <span className="text-sm text-gray-300 flex-1">
                        {u.name}
                      </span>
                      {unreadCount > 0 ? (
                        <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                          {unreadCount}
                        </span>
                      ) : (
                        u.isOnline && (
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* User info */}
        <div className="p-3 border-t border-white/10 flex items-center">
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
                {typingUsers.length > 0 ? (
                  <p className="text-[10px] text-blue-500 italic">
                    {typingUsers.join(", ")} typing...
                  </p>
                ) : (
                  <p className="text-[10px] text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Online
                  </p>
                )}
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
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-white">
          {!activeRoom && (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              👈 Please Select Any Channel or DM
            </div>
          )}

          <div className="space-y-3">
            {messages.map((msg) => {
              const mine = isMyMessage(msg);
              return (
                <div
                  key={msg._id}
                  className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Dusre ka avatar */}
                  {!mine && (
                    <div className="w-8 h-8 bg-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {getInitials(msg.sender?.name)}
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[65%] flex flex-col ${mine ? "items-end" : "items-start"}`}
                  >
                    {/* Name + Time */}
                    <div
                      className={`flex items-center gap-2 mb-1 ${mine ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <span className="text-xs font-semibold text-gray-600">
                        {mine ? "You" : msg.sender?.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>

                    {/* Text */}
                    {msg.content && (
                      <div
                        className={`px-4 py-2 rounded-2xl text-sm break-words ${
                          mine
                            ? "bg-[#4A154B] text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}

                    {/* File/Image */}
                    {renderFile(msg, mine)}
                  </div>

                  {/* Mera avatar */}
                  {mine && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {getInitials(user?.name)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing dots */}
            {typingUsers.length > 0 && (
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 bg-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {getInitials(typingUsers[0])}
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center">
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {showEmoji && (
          <div className="absolute bottom-27 left-180 z-50">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setMessageText((prev) => prev + emojiData.emoji);
                setShowEmoji(false);
              }}
              height={350}
              width={300}
            />
          </div>
        )}
        <div className="border-t border-gray-300 bg-white px-6 py-3 relative">
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
              <span
                className="cursor-pointer hover:text-black "
                onClick={() => setShowEmoji(!showEmoji)}
              >
                😊
              </span>
            </div>

            {/* Image Preview */}
            {filePreview && (
              <div className="px-3 pt-2 relative inline-block">
                <img
                  src={filePreview}
                  alt="preview"
                  className="h-20 rounded-lg object-cover border"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Non-image file */}
            {selectedFile && !filePreview && (
              <div className="px-3 pt-2 flex items-center gap-2 text-xs text-gray-600">
                <span>📎 {selectedFile.name}</span>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            )}

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
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!activeRoom}
                className="text-gray-400 text-lg hover:text-gray-600 disabled:opacity-50"
              >
                +
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                type="button"
                onClick={selectedFile ? sendFileMessage : sendMessage}
                disabled={
                  !activeRoom ||
                  (!messageText.trim() && !selectedFile) ||
                  uploading
                }
                className="bg-[#007A5A] text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-[#006046] transition-colors shadow-sm disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Send"}
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
