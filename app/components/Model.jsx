"use client";
import React from "react";

const Modal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-40 pl-35">      
      <div className="bg-white w-[450px] p-6 rounded-lg shadow-lg">        
        <h2 className="text-lg font-semibold mb-3">
          Create Channel
        </h2>
        <input
          type="text"
          placeholder="Channel name"
          className="w-full border px-3 py-2 rounded mb-4 outline-none focus:ring-2 focus:ring-purple-500"/>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded hover:bg-gray-100">
            Cancel
          </button>
          <button className="bg-purple-600 text-white px-4 py-1 rounded">
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;