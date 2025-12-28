import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';

export function useTypingIndicator(activeChatId: string | null) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !activeChatId) {
      setTypingUsers(new Map());
      return;
    }

    const socket = getSocket();
    if (!socket) return;

    const handleUserTyping = ({ userId, chatId, isTyping }: { userId: string; chatId: string; isTyping: boolean }) => {
      if (chatId === activeChatId && userId !== user.id) {
        setTypingUsers(prev => {
          const next = new Map(prev);
          if (isTyping) {
            next.set(userId, true);
          } else {
            next.delete(userId);
          }
          return next;
        });
      }
    };

    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.off('user-typing', handleUserTyping);
    };
  }, [user, activeChatId]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!activeChatId) return;

    const socket = getSocket();
    if (!socket) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    socket.emit('typing', { chatId: activeChatId, isTyping });

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { chatId: activeChatId, isTyping: false });
      }, 3000);
    }
  }, [activeChatId]);

  const isOtherUserTyping = typingUsers.size > 0;

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isOtherUserTyping,
    typingUserIds: Array.from(typingUsers.keys()),
    setTyping,
  };
}
