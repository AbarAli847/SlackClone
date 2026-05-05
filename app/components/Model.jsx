'use client';
import React, { useState, useEffect } from 'react';

const Modal = ({ isOpen, onClose, token }) => {
  const [channelName, setChannelName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') setIsAdmin(true);
  }, []);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!channelName.trim()) {
      setError('Channel name required');
      return;
    }

    // Private channel sirf admin bana sakta hai
    if (isPrivate && !isAdmin) {
      setError('Sirf Admin private channel bana sakta hai');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/channels', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: channelName.trim().toLowerCase().replace(/\s+/g, '-'),
          isPrivate,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        setLoading(false);
        return;
      }

      setChannelName('');
      setIsPrivate(false);
      setLoading(false);
      onClose();

    } catch (err) {
      setError('Server se connection nahi ho raha');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-40 pl-35">
      <div className="bg-white w-[450px] p-6 rounded-lg shadow-lg">

        <h2 className="text-lg font-semibold mb-3">Create Channel</h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Channel name"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-4 outline-none focus:ring-2 focus:ring-purple-500"
        />

        {/* Private toggle — sirf admin ko dikhe */}
        {isAdmin && (
          <div className="flex items-center gap-3 mb-4 bg-purple-50 p-3 rounded-lg border border-purple-200">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="isPrivate" className="text-sm text-gray-600 cursor-pointer">
              🔒 Private Channel <span className="text-purple-600 font-semibold">(Admin only)</span>
            </label>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={() => { setChannelName(''); setError(''); setIsPrivate(false); onClose(); }}
            className="px-3 py-1 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;