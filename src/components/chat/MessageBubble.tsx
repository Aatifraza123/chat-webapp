import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { Check, CheckCheck, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

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

  const isImage = message.type === 'image';
  const isVideo = message.type === 'video';
  const isDocument = message.type === 'document';
  const isMedia = isImage || isVideo || isDocument;

  return (
    <div
      className={cn(
        'flex message-enter',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[75%] sm:max-w-[65%] shadow-sm',
          isMedia ? 'rounded-2xl overflow-hidden' : 'rounded-2xl px-4 py-2',
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
          <div className="relative">
            {!imageLoaded && !imageError && (
              <div className="w-48 h-48 flex items-center justify-center bg-muted animate-pulse">
                <span className="text-xs text-muted-foreground">Loading...</span>
              </div>
            )}
            {imageError ? (
              <div className="w-48 h-32 flex items-center justify-center bg-muted">
                <span className="text-xs text-muted-foreground">Failed to load image</span>
              </div>
            ) : (
              <img
                src={message.content}
                alt="Shared image"
                className={cn(
                  'max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity',
                  !imageLoaded && 'hidden'
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                onClick={() => window.open(message.content, '_blank')}
              />
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
          <div className="relative">
            <video
              src={message.content}
              controls
              className="max-w-full max-h-64 rounded"
            />
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
          <div className="p-3">
            <a
              href={message.content}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="p-2 bg-muted rounded">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Document</p>
                <p className="text-xs text-muted-foreground">Click to download</p>
              </div>
              <Download className="w-4 h-4" />
            </a>
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
