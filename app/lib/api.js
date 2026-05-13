const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const getToken = () => localStorage.getItem('token');

const api = {
  // ─── Auth 
  register: (data) =>
    fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  login: (data) =>
    fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  getMe: () =>
    fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json()),

  getAllUsers: () =>
    fetch(`${BASE_URL}/api/auth/users`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json()),

  // ─── Channels ────────────────────────────────────────────────
  getChannels: () =>
    fetch(`${BASE_URL}/api/channels`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json()),

  createChannel: (data) =>
    fetch(`${BASE_URL}/api/channels`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  joinChannel: (channelId) =>
    fetch(`${BASE_URL}/api/channels/${channelId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json()),

  addMember: (channelId, userId) =>
    fetch(`${BASE_URL}/api/channels/${channelId}/members`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    }).then(r => r.json()),

  startDM: (targetUserId) =>
    fetch(`${BASE_URL}/api/channels/dm/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetUserId }),
    }).then(r => r.json()),

  // ─── Messages ────────────────────────────────────────────────
  getChannelMessages: (channelId) =>
    fetch(`${BASE_URL}/api/messages/channel/${channelId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json()),

  getDMMessages: (roomId) =>
    fetch(`${BASE_URL}/api/messages/dm/${roomId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json()),

  deleteMessage: (messageId) =>
    fetch(`${BASE_URL}/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json()),
};

export default api;