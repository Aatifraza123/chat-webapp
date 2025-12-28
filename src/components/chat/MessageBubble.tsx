import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { Check, CheckCheck, FileText, Download, ExternalLink, Image as ImageIcon, Video as VideoIcon, File, Trash2, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onDelete?: (messageId: string) => void;
}

export function MessageBubble({ message, isOwn, onDelete }: MessageBubbleProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const StatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />;
      case 'sent':
        return <Check className="w-3.5 h-3.5" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5" />;
      case 'seen':
        return <CheckCheck className="w-3.5 h-3.5 text-primary" />;
      default:
        return null;
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const handleOpen = (url: string) => {
    window.open(url, '_blank');
  };

  const getFileName = (url: string, type: string) => {
    const timestamp = new Date().getTime();
    const extension = type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'pdf';
    return `${type}_${timestamp}.${extension}`;
  };

  // Extract clean URL for media
  const getMediaUrl = (content: string) => {
    // Check if content is a Cloudinary URL
    const isCloudinaryUrl = content.includes('res.cloudinary.com');
    
    if (isCloudinaryUrl) {
      // Extract clean URL
      const urlMatch = content.match(/(https?:\/\/res\.cloudinary\.com\/[^\s]+)/i);
      if (urlMatch) {
        return urlMatch[0];
      }
    }
    
    return content;
  };

  // Auto-detect media type if not set
  const detectMediaType = () => {
    if (message.type && message.type !== 'text') {
      return message.type;
    }
    
    // Check if content is a Cloudinary URL
    if (message.content.includes('res.cloudinary.com')) {
      if (message.content.includes('/chat-images/') || message.content.includes('/image/')) {
        return 'image';
      }
      if (message.content.includes('/chat-videos/') || message.content.includes('/video/')) {
        return 'video';
      }
      if (message.content.includes('/chat-documents/') || message.content.includes('/raw/')) {
        return 'document';
      }
    }
    
    return 'text';
  };

  const detectedType = detectMediaType();
  const isImage = detectedType === 'image';
  const isVideo = detectedType === 'video';
  const isDocument = detectedType === 'document';
  const isVoice = detectedType === 'voice';
  const isMedia = isImage || isVideo || isDocument || isVoice;

  const mediaUrl = getMediaUrl(message.content);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'flex animate-message-in group',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div className="relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%]">
        {/* Message Menu */}
        <div className={cn(
          'absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10',
          isOwn ? '-left-10' : '-right-10'
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-card/95 backdrop-blur-sm border border-border/50 hover:bg-accent shadow-md"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwn ? "end" : "start"} className="glass-card border-border/30">
              {onDelete && isOwn && (
                <DropdownMenuItem 
                  onClick={() => onDelete(message.id)}
                  className="text-destructive focus:text-destructive cursor-pointer rounded-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete message
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className={cn(
            'shadow-premium',
            isMedia ? 'rounded-2xl overflow-hidden' : 'rounded-2xl px-4 py-2.5',
            isOwn
              ? isMedia 
                ? 'bg-chat-sent rounded-br-md shadow-glow' 
                : 'bg-chat-sent text-chat-sent-foreground rounded-br-md'
              : isMedia
                ? 'bg-chat-received rounded-bl-md'
                : 'bg-chat-received text-chat-received-foreground rounded-bl-md',
            'hover-lift smooth-transition'
          )}
        >
        {isImage && (
          <div className="relative group/media">
            {!imageLoaded && !imageError && (
              <div className="w-full max-w-sm aspect-video flex items-center justify-center bg-muted/50 animate-pulse rounded-xl">
                <ImageIcon className="w-12 h-12 text-muted-foreground opacity-50" />
              </div>
            )}
            {imageError ? (
              <div className="w-full max-w-sm aspect-video flex flex-col items-center justify-center bg-muted/50 rounded-xl">
                <ImageIcon className="w-12 h-12 text-muted-foreground opacity-50 mb-2" />
                <span className="text-xs text-muted-foreground">Failed to load image</span>
              </div>
            ) : (
              <>
                <img
                  src={mediaUrl}
                  alt="Shared image"
                  className={cn(
                    'w-full max-w-sm h-auto object-cover rounded-xl cursor-pointer transition-transform hover:scale-[1.02]',
                    !imageLoaded && 'hidden'
                  )}
                  style={{ maxHeight: '400px' }}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  onClick={() => handleOpen(mediaUrl)}
                />
                {imageLoaded && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover/media:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 shadow-premium rounded-xl backdrop-blur-sm bg-card/95"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpen(mediaUrl);
                      }}
                      title="Open"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 shadow-premium rounded-xl backdrop-blur-sm bg-card/95"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(mediaUrl, getFileName(mediaUrl, 'image'));
                      }}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
            <div
              className={cn(
                'flex items-center gap-1 px-3 py-2',
                isOwn ? 'justify-end' : 'justify-start'
              )}
            >
              <span className={cn(
                'text-[10px]',
                isOwn ? 'text-chat-sent-foreground/70' : 'text-muted-foreground'
              )}>
                {format(message.createdAt, 'HH:mm')}
              </span>
              {isOwn && (
                <span className="text-chat-sent-foreground/70">
                  <StatusIcon />
                </span>
              )}
            </div>
          </div>
        )}
        
        {isVideo && (
          <div className="relative group/media">
            <div className="relative rounded-xl overflow-hidden">
              <video
                src={mediaUrl}
                controls
                className="w-full max-w-sm h-auto rounded-xl"
                style={{ maxHeight: '400px' }}
                preload="metadata"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover/media:opacity-100 transition-opacity flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 shadow-premium rounded-xl backdrop-blur-sm bg-card/95"
                  onClick={() => handleOpen(mediaUrl)}
                  title="Open"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 shadow-premium rounded-xl backdrop-blur-sm bg-card/95"
                  onClick={() => handleDownload(mediaUrl, getFileName(mediaUrl, 'video'))}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div
              className={cn(
                'flex items-center gap-1 px-3 py-2',
                isOwn ? 'justify-end' : 'justify-start'
              )}
            >
              <span className={cn(
                'text-[10px]',
                isOwn ? 'text-chat-sent-foreground/70' : 'text-muted-foreground'
              )}>
                {format(message.createdAt, 'HH:mm')}
              </span>
              {isOwn && (
                <span className="text-chat-sent-foreground/70">
                  <StatusIcon />
                </span>
              )}
            </div>
          </div>
        )}
        
        {isDocument && (
          <div className="p-2 sm:p-3 min-w-[200px] sm:min-w-[250px]">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "p-3 rounded-lg",
                isOwn ? "bg-chat-sent-foreground/10" : "bg-muted"
              )}>
                <File className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Document</p>
                <p className="text-xs text-muted-foreground">Click to view or download</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs sm:text-sm"
                onClick={() => handleOpen(mediaUrl)}
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Open
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs sm:text-sm"
                onClick={() => handleDownload(mediaUrl, getFileName(mediaUrl, 'document'))}
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Download
              </Button>
            </div>
            
            <div
              className={cn(
                'flex items-center gap-1 mt-2',
                isOwn ? 'justify-end' : 'justify-start'
              )}
            >
              <span className={cn(
                'text-[10px]',
                isOwn ? 'text-chat-sent-foreground/70' : 'text-muted-foreground'
              )}>
                {format(message.createdAt, 'HH:mm')}
              </span>
              {isOwn && (
                <span className="text-chat-sent-foreground/70">
                  <StatusIcon />
                </span>
              )}
            </div>
          </div>
        )}
        
        {isVoice && (
          <div className="p-2 sm:p-3 min-w-[200px] sm:min-w-[280px]">
            <div className="flex items-center gap-3">
              <audio src={mediaUrl} controls className="flex-1" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {formatDuration(message.duration)}
              </span>
              <div
                className={cn(
                  'flex items-center gap-1',
                  isOwn ? 'justify-end' : 'justify-start'
                )}
              >
                <span className={cn(
                  'text-[10px]',
                  isOwn ? 'text-chat-sent-foreground/70' : 'text-muted-foreground'
                )}>
                  {format(message.createdAt, 'HH:mm')}
                </span>
                {isOwn && (
                  <span className="text-chat-sent-foreground/70">
                    <StatusIcon />
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        
        {!isMedia && (
          <>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
            <div
              className={cn(
                'flex items-center gap-1 mt-1',
                isOwn ? 'justify-end' : 'justify-start'
              )}
            >
              <span className={cn(
                'text-[10px]',
                isOwn ? 'text-chat-sent-foreground/70' : 'text-muted-foreground'
              )}>
                {format(message.createdAt, 'HH:mm')}
              </span>
              {isOwn && (
                <span className="text-chat-sent-foreground/70">
                  <StatusIcon />
                </span>
              )}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
