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
    <div className="border-t border-border/30 bg-gradient-to-r from-card/98 to-card/95 backdrop-blur-2xl px-4 py-4 sm:px-6 shadow-premium">
      {/* File Preview */}
      {previewFile && (
        <div className="mb-4 relative inline-block animate-scale-in">
          <div className="relative rounded-3xl overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-muted/50 to-muted/30 p-3 hover-lift glass shadow-premium">
            {previewFile.type === 'image' && (
              <img src={previewFile.url} alt="Preview" className="max-h-40 rounded-2xl shadow-lg" />
            )}
            {previewFile.type === 'video' && (
              <video src={previewFile.url} className="max-h-40 rounded-2xl shadow-lg" controls />
            )}
            {previewFile.type === 'document' && (
              <div className="flex items-center gap-3 p-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Document attached</span>
              </div>
            )}
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full smooth-transition hover:scale-110 shadow-premium-lg hover-glow"
              onClick={() => setPreviewFile(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-4 flex items-center gap-3 animate-fade-in p-4 rounded-2xl glass border border-primary/20 shadow-premium">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm font-bold text-primary">{uploadProgress}%</span>
            </div>
            <div className="bg-muted/50 rounded-full h-2 overflow-hidden">
              <div
                className="gradient-primary h-full rounded-full smooth-transition shadow-glow"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Attachment Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={disabled || isUploading}
            className="h-11 w-11 rounded-2xl hover-lift hover:bg-primary/10 hover:text-primary transition-all duration-300 relative group"
          >
            <Paperclip className="w-5 h-5 transition-transform group-hover:rotate-45 group-hover:scale-110" />
            <span className="absolute inset-0 rounded-2xl bg-primary/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
          </Button>
          
          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-3 glass-card border-border/30 rounded-3xl shadow-premium-lg p-3 space-y-2 animate-scale-in min-w-[180px]">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start smooth-transition hover:bg-primary/10 rounded-2xl py-3 group"
                onClick={() => triggerFileInput('image/*', 'images')}
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                  <Image className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium">Image</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start smooth-transition hover:bg-primary/10 rounded-2xl py-3 group"
                onClick={() => triggerFileInput('video/*', 'videos')}
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                  <Video className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium">Video</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start smooth-transition hover:bg-primary/10 rounded-2xl py-3 group"
                onClick={() => triggerFileInput('.pdf,.doc,.docx,.txt,.zip', 'documents')}
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium">Document</span>
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
        <div className="flex-1 relative group">
          <Input
            value={message}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={disabled || isUploading}
            className="h-12 rounded-3xl glass border-border/30 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 px-5 text-base transition-all duration-300 shadow-sm hover:shadow-md"
          />
          <div className="absolute inset-0 rounded-3xl bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !previewFile) || disabled || isUploading}
          size="icon"
          className="h-12 w-12 flex-shrink-0 smooth-transition hover:scale-110 active:scale-95 rounded-2xl gradient-primary shadow-premium hover-glow relative group overflow-hidden"
        >
          <Send className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          <span className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
      </div>
    </div>
  );
}
