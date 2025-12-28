import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image, Video, FileText, Paperclip, X, Loader2 } from 'lucide-react';
import { useFileAttachment } from '@/hooks/useFileAttachment';
import { cn } from '@/lib/utils';

interface EnhancedMessageInputProps {
  onSendMessage: (content: string, type: 'text' | 'image' | 'video' | 'document') => void;
  disabled?: boolean;
  onTyping?: (isTyping: boolean) => void;
  chatId?: string;
}

export function EnhancedMessageInput({ onSendMessage, disabled, onTyping, chatId }: EnhancedMessageInputProps) {
  const [message, setMessage] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: string } | null>(null);
  const { uploadAttachment, isUploading, uploadProgress } = useFileAttachment();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSend = () => {
    if (message.trim() && !isUploading) {
      onSendMessage(message.trim(), 'text');
      setMessage('');
      setPreviewFile(null);
    } else if (previewFile) {
      // Clean URL - remove any trailing characters
      const cleanUrl = previewFile.url.trim();
      console.log('📤 Sending media:', { url: cleanUrl, type: previewFile.type });
      onSendMessage(cleanUrl, previewFile.type as any);
      setPreviewFile(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (value: string) => {
    setMessage(value);
    
    if (onTyping) {
      onTyping(value.length > 0);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
  };

  const handleFileSelect = async (file: File, type: 'images' | 'videos' | 'documents') => {
    if (!chatId) {
      console.error('No chat ID provided');
      return;
    }

    setShowAttachMenu(false);
    const attachment = await uploadAttachment(file, chatId);
    if (attachment) {
      const fileType = type === 'images' ? 'image' : type === 'videos' ? 'video' : 'document';
      setPreviewFile({ url: attachment.url, type: fileType });
    }
  };

  const triggerFileInput = (accept: string, type: 'images' | 'videos' | 'documents') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) handleFileSelect(file, type);
      };
      fileInputRef.current.click();
    }
  };

  return (
    <div className="border-t bg-background p-3 sm:p-4">
      {/* File Preview */}
      {previewFile && (
        <div className="mb-2 relative inline-block animate-scale-in">
          <div className="relative rounded-lg overflow-hidden border bg-muted p-2 hover-lift">
            {previewFile.type === 'image' && (
              <img src={previewFile.url} alt="Preview" className="max-h-32 rounded" />
            )}
            {previewFile.type === 'video' && (
              <video src={previewFile.url} className="max-h-32 rounded" controls />
            )}
            {previewFile.type === 'document' && (
              <div className="flex items-center gap-2 p-2">
                <FileText className="w-8 h-8" />
                <span className="text-sm">Document attached</span>
              </div>
            )}
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full smooth-transition hover:scale-110"
              onClick={() => setPreviewFile(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-2 flex items-center gap-2 animate-fade-in">
          <Loader2 className="w-4 h-4 animate-spin" />
          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full smooth-transition"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
        </div>
      )}

      <div className="flex items-end gap-1 sm:gap-2">
        {/* Attachment Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={disabled || isUploading}
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          
          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-popover border rounded-lg shadow-lg p-2 space-y-1 animate-scale-in">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start smooth-transition hover:bg-accent"
                onClick={() => triggerFileInput('image/*', 'images')}
              >
                <Image className="w-4 h-4 mr-2" />
                Image
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start smooth-transition hover:bg-accent"
                onClick={() => triggerFileInput('video/*', 'videos')}
              >
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start smooth-transition hover:bg-accent"
                onClick={() => triggerFileInput('.pdf,.doc,.docx,.txt,.zip', 'documents')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Document
              </Button>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
        />

        {/* Message Input */}
        <Input
          value={message}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={disabled || isUploading}
          className="flex-1"
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !previewFile) || disabled || isUploading}
          size="icon"
          className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 smooth-transition hover:scale-105 active:scale-95"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    </div>
  );
}
