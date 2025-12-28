import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';

interface PresenceContextType {
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
  onlineCount: number;
}

const defaultContext: PresenceContextType = {
  onlineUsers: new Set(),
  isUserOnline: () => false,
  onlineCount: 0,
};

const PresenceContext = createContext<PresenceContextType>(defaultContext);

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setOnlineUsers(new Set());
      return;
    }

    const socket = getSocket();
    if (!socket) return;

    const handleUserOnline = ({ userId, onlineUsers: users }: { userId: string; onlineUsers: string[] }) => {
      setOnlineUsers(new Set(users));
    };

    const handleUserOffline = ({ userId, onlineUsers: users }: { userId: string; onlineUsers: string[] }) => {
      setOnlineUsers(new Set(users));
    };

    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);

    return () => {
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
    };
  }, [user]);

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  const value: PresenceContextType = {
    onlineUsers,
    isUserOnline,
    onlineCount: onlineUsers.size,
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresenceContext() {
  const context = useContext(PresenceContext);
  return context;
}
