import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useProfilePicture() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadProfilePicture = useCallback(async (file: File): Promise<string | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload profile picture',
        variant: 'destructive',
      });
      return null;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return null;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Profile picture must be less than 10MB',
        variant: 'destructive',
      });
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/profile-picture', formData, {
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

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      });

      return data.url;
    } catch (error: any) {
      console.error('Profile picture upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.response?.data?.error || 'Failed to upload profile picture',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [user, toast]);

  const deleteProfilePicture = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      await api.delete('/profile-picture');
      
      toast({
        title: 'Success',
        description: 'Profile picture removed',
      });

      return true;
    } catch (error: any) {
      console.error('Delete profile picture error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete profile picture',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  return {
    uploadProfilePicture,
    deleteProfilePicture,
    isUploading,
    uploadProgress,
  };
}
