import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) {
      setOnlineUsers(new Set());
      return;
    }

    // Create a global presence channel
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        
        Object.keys(state).forEach((odissey_id) => {
          online.add(odissey_id);
        });
        
        setOnlineUsers(online);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set(prev).add(key));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            user_id: user.id,
          });
        }
      });

    channelRef.current = channel;

    // Handle visibility change - update presence when tab becomes visible/hidden
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && channelRef.current) {
        await channelRef.current.track({
          online_at: new Date().toISOString(),
          user_id: user.id,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle beforeunload - try to untrack before leaving
    const handleBeforeUnload = () => {
      if (channelRef.current) {
        channelRef.current.untrack();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user]);

  const isUserOnline = useCallback((odissey_id: string) => {
    return onlineUsers.has(odissey_id);
  }, [onlineUsers]);

  return {
    onlineUsers,
    isUserOnline,
    onlineCount: onlineUsers.size,
  };
}
