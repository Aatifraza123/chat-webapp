import { cn } from '@/lib/utils';
import { User } from '@/types/chat';
import { Avatar } from './Avatar';
import { ArrowLeft, Phone, Video, MoreVertical, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface ChatHeaderProps {
  user: User;
  isTyping?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatHeader({ user, isTyping, onBack, showBackButton }: ChatHeaderProps) {
  const getStatusText = () => {
    if (isTyping) return 'typing...';
    if (user.isOnline) return 'online';
    return `last seen ${formatDistanceToNow(user.lastSeen, { addSuffix: true })}`;
  };

  return (
    <header className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-card border-b border-border">
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="flex-shrink-0 -ml-2 lg:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}
      
      <Avatar
        src={user.avatar}
        alt={user.name}
        size="md"
        isOnline={user.isOnline}
        showStatus
      />
      
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-sm truncate">{user.name}</h2>
        <p className={cn(
          'text-xs truncate',
          isTyping ? 'text-status-typing font-medium' : 'text-muted-foreground'
        )}>
          {getStatusText()}
        </p>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Search className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:flex">
          <Phone className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:flex">
          <Video className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
