import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Send, Smile, Paperclip, Mic, X, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImageUpload } from '@/hooks/useImageUpload';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image') => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

const quickEmojis = ['😊', '😂', '❤️', '👍', '🔥', '🎉', '👋', '💯'];

export function MessageInput({ onSendMessage, onTyping, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ file: File; url: string } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { uploadImage, isUploading } = useImageUpload();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Cleanup preview URL
      if (previewImage?.url) {
        URL.revokeObjectURL(previewImage.url);
      }
    };
  }, [previewImage]);

  const handleInputChange = (value: string) => {
    setMessage(value);
    
    if (onTyping) {
      if (value.length > 0) {
        onTyping(true);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (disabled || isUploading) return;

    // Handle image upload
    if (previewImage) {
      const imageUrl = await uploadImage(previewImage.file);
      if (imageUrl) {
        onSendMessage(imageUrl, 'image');
      }
      URL.revokeObjectURL(previewImage.url);
      setPreviewImage(null);
      return;
    }

    // Handle text message
    if (message.trim()) {
      onSendMessage(message.trim(), 'text');
      setMessage('');
      setShowEmojiPicker(false);
      if (onTyping) onTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewImage({ file, url });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelImagePreview = () => {
    if (previewImage?.url) {
      URL.revokeObjectURL(previewImage.url);
    }
    setPreviewImage(null);
  };

  const canSend = message.trim() || previewImage;

  return (
    <div className="border-t border-border bg-card p-3 sm:p-4">
      {/* Image Preview */}
      {previewImage && (
        <div className="mb-3 animate-fade-up">
          <div className="relative inline-block">
            <img
              src={previewImage.url}
              alt="Preview"
              className="max-h-32 rounded-lg object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={cancelImagePreview}
              disabled={isUploading}
            >
              <X className="w-3 h-3" />
            </Button>
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Emoji Picker */}
      {showEmojiPicker && !previewImage && (
        <div className="mb-3 animate-fade-up">
          <div className="flex gap-2 flex-wrap">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-muted-foreground hover:text-foreground h-10 w-10"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <Image className="w-5 h-5" />
        </Button>

        {/* Input Container */}
        {!previewImage && (
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={disabled || isUploading}
              rows={1}
              className={cn(
                'w-full resize-none bg-secondary rounded-2xl px-4 py-2.5 pr-12',
                'text-sm placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'max-h-32 scrollbar-thin'
              )}
              style={{
                minHeight: '42px',
                height: message.split('\n').length > 1 ? 'auto' : '42px',
              }}
            />
            
            {/* Emoji Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 bottom-1 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled || isUploading}
            >
              <Smile className="w-5 h-5" />
            </Button>
          </div>
        )}

        {previewImage && (
          <div className="flex-1 text-sm text-muted-foreground">
            Ready to send image
          </div>
        )}

        {/* Send / Voice Button */}
        {canSend ? (
          <Button
            onClick={handleSend}
            size="icon"
            className="flex-shrink-0 h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground"
            disabled={disabled}
          >
            <Mic className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
