import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

export interface FriendRequest {
  id: string;
  from?: {
    id: string;
    username: string;
    name: string;
    avatar_url: string;
  };
  to?: {
    id: string;
    username: string;
    name: string;
    avatar_url: string;
  };
  created_at: string;
}

export function useFriendRequests() {
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPendingRequests = async () => {
    try {
      const { data } = await api.get('/friend-requests/pending');
      setPendingRequests(data);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const { data } = await api.get('/friend-requests/sent');
      setSentRequests(data);
    } catch (error) {
      console.error('Error fetching sent requests:', error);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchSentRequests();

    const socket = getSocket();
    if (!socket) return;

    socket.on('friend:request-received', () => {
      fetchPendingRequests();
      toast({
        title: 'New friend request',
        description: 'You have received a new friend request',
      });
    });

    socket.on('friend:request-accepted', () => {
      fetchSentRequests();
      toast({
        title: 'Friend request accepted',
        description: 'Your friend request has been accepted',
      });
    });

    socket.on('friend:request-rejected', () => {
      fetchSentRequests();
    });

    return () => {
      socket.off('friend:request-received');
      socket.off('friend:request-accepted');
      socket.off('friend:request-rejected');
    };
  }, []);

  const sendFriendRequest = async (username: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/friend-requests/send', { toUsername: username });
      
      toast({
        title: 'Friend request sent',
        description: 'Your friend request has been sent',
      });

      await fetchSentRequests();
      return { success: true, data };
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to send friend request';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/friend-requests/accept/${requestId}`);
      
      toast({
        title: 'Friend request accepted',
        description: 'You are now friends',
      });

      await fetchPendingRequests();
      return { success: true, chatId: data.chatId };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to accept friend request',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    setLoading(true);
    try {
      await api.post(`/friend-requests/reject/${requestId}`);
      
      toast({
        title: 'Friend request rejected',
      });

      await fetchPendingRequests();
      return { success: true };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to reject friend request',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const cancelFriendRequest = async (requestId: string) => {
    setLoading(true);
    try {
      await api.delete(`/friend-requests/cancel/${requestId}`);
      
      toast({
        title: 'Friend request cancelled',
      });

      await fetchSentRequests();
      return { success: true };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to cancel friend request',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const checkFriendStatus = async (username: string) => {
    try {
      const { data } = await api.get(`/friend-requests/status/${username}`);
      return data.status; // 'friends' | 'sent' | 'received' | 'none'
    } catch (error) {
      return 'none';
    }
  };

  return {
    pendingRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    checkFriendStatus,
    refreshRequests: () => {
      fetchPendingRequests();
      fetchSentRequests();
    },
  };
}
