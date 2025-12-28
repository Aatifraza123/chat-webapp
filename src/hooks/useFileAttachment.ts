import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface FileAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: 'images' | 'videos' | 'documents';
  uploaded_at: string;
  uploaded_by: string;
}

export function useFileAttachment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadAttachment = useCallback(async (
    file: File,
    chatId: string,
    messageId?: string
  ): Promise<FileAttachment | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload files',
        variant: 'destructive',
      });
      return null;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'File size must be less than 50MB',
        variant: 'destructive',
      });
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Determine file type
      let type: 'images' | 'videos' | 'documents' = 'documents';
      if (file.type.startsWith('image/')) {
        type = 'images';
      } else if (file.type.startsWith('video/')) {
        type = 'videos';
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', chatId);
      formData.append('type', type);
      if (messageId) {
        formData.append('messageId', messageId);
      }

      const { data } = await api.post('/file-attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      return {
        id: data.id,
        url: data.url,
        filename: data.filename,
        size: data.size,
        type: data.type,
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.id,
      };
    } catch (error: any) {
      console.error('File attachment upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.response?.data?.error || 'Failed to upload file',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [user, toast]);

  const getChatAttachments = useCallback(async (chatId: string): Promise<FileAttachment[]> => {
    if (!user) return [];

    try {
      const { data } = await api.get(`/file-attachment/chat/${chatId}`);
      return data;
    } catch (error) {
      console.error('Get chat attachments error:', error);
      return [];
    }
  }, [user]);

  const deleteAttachment = useCallback(async (attachmentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await api.delete(`/file-attachment/${attachmentId}`);
      
      toast({
        title: 'Success',
        description: 'File deleted successfully',
      });

      return true;
    } catch (error: any) {
      console.error('Delete attachment error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete file',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  const getStorageStats = useCallback(async () => {
    if (!user) return null;

    try {
      const { data } = await api.get('/file-attachment/stats/user');
      return data;
    } catch (error) {
      console.error('Get storage stats error:', error);
      return null;
    }
  }, [user]);

  return {
    uploadAttachment,
    getChatAttachments,
    deleteAttachment,
    getStorageStats,
    isUploading,
    uploadProgress,
  };
}
