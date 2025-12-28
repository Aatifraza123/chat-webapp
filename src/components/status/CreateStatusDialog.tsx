import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video, Type, Loader2 } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface CreateStatusDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (content: string, type: 'text' | 'image' | 'video') => Promise<void>;
}

export function CreateStatusDialog({ open, onClose, onCreate }: CreateStatusDialogProps) {
  const [text, setText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { uploadFile, isUploading, uploadProgress } = useFileUpload();

  const handleTextStatus = async () => {
    if (!text.trim()) return;
    
    setIsCreating(true);
    await onCreate(text, 'text');
    setIsCreating(false);
    setText('');
    onClose();
  };

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    setIsCreating(true);
    const url = await uploadFile(file, type === 'image' ? 'images' : 'videos');
    if (url) {
      await onCreate(url, type);
      onClose();
    }
    setIsCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Status</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">
              <Type className="w-4 h-4 mr-2" />
              Text
            </TabsTrigger>
            <TabsTrigger value="image">
              <Image className="w-4 h-4 mr-2" />
              Image
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="w-4 h-4 mr-2" />
              Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <Textarea
              placeholder="What's on your mind?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <Button
              onClick={handleTextStatus}
              disabled={!text.trim() || isCreating}
              className="w-full"
            >
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Share Status
            </Button>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'image');
                }}
                className="hidden"
                id="image-upload"
                disabled={isUploading || isCreating}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Image className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isUploading ? `Uploading... ${uploadProgress}%` : 'Click to upload image'}
                </p>
              </label>
            </div>
          </TabsContent>

          <TabsContent value="video" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'video');
                }}
                className="hidden"
                id="video-upload"
                disabled={isUploading || isCreating}
              />
              <label htmlFor="video-upload" className="cursor-pointer">
                <Video className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isUploading ? `Uploading... ${uploadProgress}%` : 'Click to upload video'}
                </p>
              </label>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
