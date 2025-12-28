import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';

export function useTypingStatus() {
  const { user } = useAuth();
  const [typingInChats, setTypingInChats] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    if (!socket) return;

    const handleUserTyping = ({ userId, chatId, isTyping }: { userId: string; chatId: string; isTyping: boolean }) => {
      if (userId !== user.id) {
        setTypingInChats(prev => {
          const next = new Map(prev);
          if (isTyping) {
            next.set(chatId, userId);
          } else {
            next.delete(chatId);
          }
          return next;
        });
      }
    };

    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.off('user-typing', handleUserTyping);
    };
  }, [user]);

  const isTypingInChat = (chatId: string) => {
    return typingInChats.has(chatId);
  };

  return {
    isTypingInChat,
    typingInChats,
  };
}
