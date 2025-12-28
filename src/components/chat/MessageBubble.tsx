import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
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

  return (
    <div
      className={cn(
        'flex message-enter',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2 shadow-sm',
          isOwn
            ? 'bg-chat-sent text-chat-sent-foreground rounded-br-md'
            : 'bg-chat-received text-chat-received-foreground rounded-bl-md'
        )}
      >
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
      </div>
    </div>
  );
}
