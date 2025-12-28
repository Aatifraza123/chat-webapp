import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface StatusView {
  user_id: string;
  viewed_at: string;
}

export interface Status {
  id: string;
  content: string;
  type: 'text' | 'image' | 'video';
  created_at: string;
  expires_at: string;
  views: StatusView[];
}

export interface UserStatus {
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
  };
  statuses: Status[];
}

export function useStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<UserStatus[]>([]);
  const [myStatuses, setMyStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadStatuses = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await api.get('/status');
      setStatuses(data);
    } catch (error) {
      console.error('Error loading statuses:', error);
    }
  }, [user]);

  const loadMyStatuses = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await api.get('/status/my');
      setMyStatuses(data);
    } catch (error) {
      console.error('Error loading my statuses:', error);
    }
  }, [user]);

  const createStatus = useCallback(async (content: string, type: 'text' | 'image' | 'video' = 'text') => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data } = await api.post('/status', { content, type });
      setMyStatuses(prev => [data, ...prev]);
      toast({
        title: 'Status uploaded',
        description: 'Your status has been shared',
      });
      return data;
    } catch (error) {
      console.error('Error creating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const viewStatus = useCallback(async (statusId: string) => {
    if (!user) return;
    
    try {
      await api.post(`/status/${statusId}/view`);
    } catch (error) {
      console.error('Error viewing status:', error);
    }
  }, [user]);

  const deleteStatus = useCallback(async (statusId: string) => {
    if (!user) return;
    
    try {
      await api.delete(`/status/${statusId}`);
      setMyStatuses(prev => prev.filter(s => s.id !== statusId));
      toast({
        title: 'Status deleted',
        description: 'Your status has been removed',
      });
    } catch (error) {
      console.error('Error deleting status:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete status',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;
    
    loadStatuses();
    loadMyStatuses();
    
    const socket = getSocket();
    if (!socket) return;
    
    const handleNewStatus = () => {
      loadStatuses();
    };
    
    socket.on('new-status', handleNewStatus);
    
    return () => {
      socket.off('new-status', handleNewStatus);
    };
  }, [user, loadStatuses, loadMyStatuses]);

  return {
    statuses,
    myStatuses,
    isLoading,
    createStatus,
    viewStatus,
    deleteStatus,
    loadStatuses,
    loadMyStatuses,
  };
}
