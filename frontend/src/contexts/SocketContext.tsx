import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../config/backend';

// FIX: was `process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001'`.
// In Expo web this runs in the browser, so the socket tried to reach the
// *viewer's* machine and silently never connected — the live-monitoring
// screens just sat there with no realtime data and no error.
const API_URL = SOCKET_URL;

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const newSocket = io(API_URL, {
      // FIX: was websocket-only. Proxies that buffer or block the Upgrade
      // header (common in preview tunnels) made the socket fail permanently
      // with no fallback. Polling-first-upgrade matches the server config.
      transports: ['websocket', 'polling'],
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      timeout: 20000,
      auth: {
        token,
      },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    // FIX: socket.io-client does not emit an 'error' event — connection
    // failures arrive as 'connect_error', so this handler never ran and socket
    // problems were completely invisible.
    newSocket.on('connect_error', (error) => {
      console.warn('[socket] connect_error:', error.message);
      setConnected(false);
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      if (attempt % 5 === 0) console.warn(`[socket] reconnect attempt ${attempt}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
