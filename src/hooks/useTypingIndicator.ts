import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TypingUser {
  odissey_id: string;
  is_typing: boolean;
  chat_id: string;
}

export function useTypingIndicator(activeChatId: string | null) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up presence channel for the active chat
  useEffect(() => {
    if (!user || !activeChatId) {
      setTypingUsers(new Map());
      return;
    }

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`typing:${activeChatId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newTypingUsers = new Map<string, boolean>();
        
        Object.entries(state).forEach(([odissey_id, presences]) => {
          if (odissey_id !== user.id && Array.isArray(presences)) {
            const latestPresence = presences[presences.length - 1] as any;
            if (latestPresence?.is_typing) {
              newTypingUsers.set(odissey_id, true);
            }
          }
        });
        
        setTypingUsers(newTypingUsers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== user.id) {
          const latestPresence = newPresences[newPresences.length - 1] as any;
          if (latestPresence?.is_typing) {
            setTypingUsers(prev => new Map(prev).set(key, true));
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key !== user.id) {
          setTypingUsers(prev => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            is_typing: false,
            chat_id: activeChatId,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, activeChatId]);

  // Broadcast typing state
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!channelRef.current || !activeChatId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    await channelRef.current.track({
      is_typing: isTyping,
      chat_id: activeChatId,
      online_at: new Date().toISOString(),
    });

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(async () => {
        if (channelRef.current) {
          await channelRef.current.track({
            is_typing: false,
            chat_id: activeChatId,
            online_at: new Date().toISOString(),
          });
        }
      }, 3000);
    }
  }, [activeChatId]);

  // Check if any user is typing
  const isOtherUserTyping = typingUsers.size > 0;

  // Cleanup on unmount
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
