'use client';
import React, { useState, useEffect } from 'react';

const AddMemberModal = ({ isOpen, onClose, channel, token }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addingUserId, setAddingUserId] = useState(null);

  useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen]);

  if (!isOpen) return null;

  const fetchUsers = async () => {
    try {
      const savedToken = token || localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (data.success) {
        // Jo already member hai unhe filter karo
        const nonMembers = data.users.filter(
          u => !channel.members.includes(u._id) && 
               !channel.members.some(m => m === u._id || m?._id === u._id)
        );
        setUsers(nonMembers);
      }
    } catch (err) {
      setError('Users load nahi ho rahe');
    }
  };

  const handleAddMember = async (userId) => {
    setAddingUserId(userId);
    setError('');
    setSuccess('');

    try {
      const savedToken = token || localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:5000/api/channels/${channel._id}/members`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${savedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
      } else {
        setSuccess('Member add ho gaya!');
        // Us user ko list se hata do
        setUsers(prev => prev.filter(u => u._id !== userId));
      }
    } catch (err) {
      setError('Server se connection nahi ho raha');
    }

    setAddingUserId(null);
  };

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[450px] p-6 rounded-lg shadow-lg">

        <h2 className="text-lg font-semibold mb-1">Add Member</h2>
        <p className="text-xs text-gray-500 mb-4">
          🔒 <span className="font-semibold">{channel?.name}</span> — Private Channel
        </p>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-3 text-sm">{error}</div>
        )}
        {success && (
          <div className="bg-green-100 text-green-600 p-2 rounded mb-3 text-sm">{success}</div>
        )}

        {/* Users List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Sab users already members hain ✅
            </p>
          ) : (
            users.map(u => (
              <div
                key={u._id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(u.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAddMember(u._id)}
                  disabled={addingUserId === u._id}
                  className="bg-purple-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-purple-700 disabled:opacity-50"
                >
                  {addingUserId === u._id ? 'Adding...' : 'Add'}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={() => { setError(''); setSuccess(''); onClose(); }}
            className="px-4 py-2 rounded hover:bg-gray-100 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;