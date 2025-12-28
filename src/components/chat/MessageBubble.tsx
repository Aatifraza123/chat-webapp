import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { Check, CheckCheck, FileText, Download, ExternalLink, Image as ImageIcon, Video as VideoIcon, File } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  const isImage = message.type === 'image';
  const isVideo = message.type === 'video';
  const isDocument = message.type === 'document';
  const isMedia = isImage || isVideo || isDocument;

  // Extract clean URL for media
  const getMediaUrl = (content: string) => {
    if (!isMedia) return content;
    
    console.log('🔍 Original content:', content);
    console.log('📝 Message type:', message.type);
    
    // Try to extract Cloudinary URL
    const urlMatch = content.match(/(https?:\/\/res\.cloudinary\.com\/[^\s]+)/i);
    if (urlMatch) {
      console.log('✅ Extracted URL:', urlMatch[0]);
      return urlMatch[0];
    }
    
    console.log('⚠️ No URL match, using original');
    // Fallback: return original content
    return content;
  };

  const mediaUrl = getMediaUrl(message.content);
  
  console.log('🖼️ Rendering message:', {
    type: message.type,
    isImage,
    isVideo,
    isDocument,
    mediaUrl: mediaUrl.substring(0, 80)
  });

  return (
    <div
      className={cn(
        'flex message-enter',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%] md:max-w-[65%] shadow-sm',
          isMedia ? 'rounded-2xl overflow-hidden' : 'rounded-2xl px-3 py-2 sm:px-4',
          isOwn
            ? isMedia 
              ? 'bg-chat-sent rounded-br-md' 
              : 'bg-chat-sent text-chat-sent-foreground rounded-br-md'
            : isMedia
              ? 'bg-chat-received rounded-bl-md'
              : 'bg-chat-received text-chat-received-foreground rounded-bl-md'
        )}
      >
        {isImage && (
          <div className="relative group">
            {!imageLoaded && !imageError && (
              <div className="w-64 h-64 flex items-center justify-center bg-muted animate-pulse">
                <ImageIcon className="w-12 h-12 text-muted-foreground opacity-50" />
              </div>
            )}
            {imageError ? (
              <div className="w-64 h-48 flex flex-col items-center justify-center bg-muted rounded">
                <ImageIcon className="w-12 h-12 text-muted-foreground opacity-50 mb-2" />
                <span className="text-xs text-muted-foreground">Failed to load image</span>
              </div>
            ) : (
              <>
                <img
                  src={mediaUrl}
                  alt="Shared image"
                  className={cn(
                    'max-w-full max-h-96 object-cover rounded cursor-pointer',
                    !imageLoaded && 'hidden'
                  )}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  onClick={() => handleOpen(mediaUrl)}
                />
                {imageLoaded && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 shadow-lg"
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
                      className="h-8 w-8 p-0 shadow-lg"
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
                'flex items-center gap-1 px-3 py-1.5',
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
          <div className="relative group">
            <div className="relative">
              <video
                src={mediaUrl}
                controls
                className="max-w-full max-h-96 rounded"
                preload="metadata"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 shadow-lg"
                  onClick={() => handleOpen(mediaUrl)}
                  title="Open"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 shadow-lg"
                  onClick={() => handleDownload(mediaUrl, getFileName(mediaUrl, 'video'))}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div
              className={cn(
                'flex items-center gap-1 px-3 py-1.5',
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
  );
}
