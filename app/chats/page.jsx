"use client";
import React, { useState } from "react";
import {
  Phone,
  Video,
  Pencil,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import Modal from "../components/Model";

const ChatSection = () => {
  const [isChannelsOpen, setIsChannelsOpen] = useState(true);
  const [isDmsOpen, setIsDmsOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex h-[calc(99vh-44px)] w-[1000px] bg-white overflow-hidden ml-60">
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

        <div className="px-1 space-y-4 text-sm">
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
                onClick={() => setIsModalOpen(true)}
              />
            </div>

            {isChannelsOpen && (
              <div className="mt-1 space-y-[2px]">
                <div className="px-6 py-1 rounded hover:bg-[#350d36] cursor-pointer text-gray-300 transition-colors">
                  # general
                </div>
                <div className="px-6 py-1 rounded hover:bg-[#350d36] cursor-pointer text-gray-300 transition-colors">
                  # announcements
                </div>
              </div>
            )}
          </div>

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
                  Direct messages
                </p>
              </div>
              {/* <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" /> */}
            </div>

            {isDmsOpen && (
              <div className="mt-1 space-y-[2px] px-2">
                <div className="px-2 py-1 bg-[#1264A3] rounded flex items-center gap-2 cursor-pointer transition-all">
                  <img
                    src="https://i.pravatar.cc/40?img=12"
                    alt="Jibran Nasir"
                    className="w-5 h-5 rounded-sm object-cover"
                  />
                  <span className="text-sm">Jibran Nasir</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        <div className="h-12 flex items-center justify-between px-4 border-b border-gray-300 bg-white w-full">
          <div className="flex items-center gap-3">
            <img
              src="https://i.pravatar.cc/40?img=12"
              alt="profile"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Jibran Nasir
              </h3>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-gray-500">
            <Phone
              size={18}
              className="cursor-pointer hover:text-gray-900 transition-colors"
            />
            <Video
              size={18}
              className="cursor-pointer hover:text-gray-900 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 bg-white">
          <div className="flex gap-3 group">
            <div className="w-9 h-9 bg-purple-700 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0">
              AU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold hover:underline cursor-pointer">
                  Admin User
                </span>
                <span className="text-[10px] text-gray-400">10:41 am</span>
              </div>
              <p className="text-sm text-gray-700 mt-1">bhai help me</p>
            </div>
          </div>
        </div>

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
              placeholder="Type a message..."
            />
            <div className="flex justify-between items-center px-3 py-2">
              <button className="text-gray-400 text-lg hover:text-gray-600">
                +
              </button>
              <button className="bg-[#007A5A] text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-[#006046] transition-colors shadow-sm">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
       <Modal isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}/>
    </div>
  );
};

export default ChatSection;
