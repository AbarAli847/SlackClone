'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!token) return;

    const s = getSocket();
    if (s) {
      setSocket(s);

      s.on('user:online', ({ userId }) => {
        setOnlineUsers(prev => [...new Set([...prev, userId])]);
      });

      s.on('user:offline', ({ userId }) => {
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });
    }
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);