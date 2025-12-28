import { useState } from 'react';
import api from '@/lib/api';
import { useToast } from './use-toast';

export function useVoiceNote() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadVoiceNote = async (audioBlob: Blob, chatId: string): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', audioBlob, 'voice-note.webm');
      formData.append('chatId', chatId);
      formData.append('type', 'voice');

      const { data } = await api.post('/file-attachment/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      return data.url;
    } catch (error) {
      console.error('Voice note upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload voice note',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploadVoiceNote,
    isUploading,
    uploadProgress,
  };
}
