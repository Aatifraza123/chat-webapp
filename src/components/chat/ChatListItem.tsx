import { cn } from '@/lib/utils';
import { Chat, User } from '@/types/chat';
import { Avatar } from './Avatar';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatListItemProps {
  chat: Chat;
  currentUserId: string;
  isActive: boolean;
  onClick: () => void;
}

function formatChatTime(date: Date): string {
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'dd/MM/yy');
}

export function ChatListItem({ chat, currentUserId, isActive, onClick }: ChatListItemProps) {
  const otherUser = chat.participants.find(p => p.id !== currentUserId) as User;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
        'hover:bg-sidebar-accent',
        isActive && 'bg-sidebar-accent'
      )}
    >
      <Avatar
        src={otherUser.avatar}
        alt={otherUser.name}
        size="lg"
        isOnline={otherUser.isOnline}
        showStatus
      />
      
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm truncate text-sidebar-foreground">
            {otherUser.name}
          </h3>
          {chat.lastMessage && (
            <span className="text-[11px] text-muted-foreground flex-shrink-0">
              {formatChatTime(chat.lastMessage.createdAt)}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-sm text-muted-foreground truncate">
            {chat.lastMessage?.content || 'No messages yet'}
          </p>
          {chat.unreadCount > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-5 flex items-center justify-center bg-primary text-primary-foreground text-[11px] font-medium rounded-full px-1.5">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
