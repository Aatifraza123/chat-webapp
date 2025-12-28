import { cn } from '@/lib/utils';
import { User } from '@/types/chat';
import { Avatar } from './Avatar';
import { 
  ArrowLeft, Phone, Video, MoreVertical, Search, Info, CheckSquare, 
  BellOff, Timer, Heart, XCircle, Link2, Calendar, Users, 
  Flag, Ban, Trash2, MinusCircle, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
  user: User;
  isTyping?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onContactInfo?: () => void;
  onProfileClick?: () => void;
  onSelectMessages?: () => void;
  onMuteNotifications?: () => void;
  onDisappearingMessages?: () => void;
  onAddToFavourites?: () => void;
  onCloseChat?: () => void;
  onSendCallLink?: () => void;
  onScheduleCall?: () => void;
  onNewGroupCall?: () => void;
  onWallpaper?: () => void;
  onReport?: () => void;
  onBlock?: () => void;
  onClearChat?: () => void;
  onDeleteChat?: () => void;
}

export function ChatHeader({ 
  user, 
  isTyping, 
  onBack, 
  showBackButton,
  onVoiceCall,
  onVideoCall,
  onContactInfo,
  onProfileClick,
  onSelectMessages,
  onMuteNotifications,
  onDisappearingMessages,
  onAddToFavourites,
  onCloseChat,
  onSendCallLink,
  onScheduleCall,
  onNewGroupCall,
  onWallpaper,
  onReport,
  onBlock,
  onClearChat,
  onDeleteChat
}: ChatHeaderProps) {
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
        className="cursor-pointer"
        onClick={onProfileClick}
      />
      
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onProfileClick}>
        <h2 className="font-semibold text-sm truncate hover:text-primary transition-colors">{user.name}</h2>
        <p className={cn(
          'text-xs truncate',
          isTyping ? 'text-status-typing font-medium' : 'text-muted-foreground'
        )}>
          {getStatusText()}
        </p>
      </div>
      
      <div className="flex items-center gap-0.5 sm:gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground"
          onClick={onVoiceCall}
          title="Voice Call"
        >
          <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground"
          onClick={onVideoCall}
          title="Video Call"
        >
          <Video className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground hidden sm:flex"
        >
          <Search className="w-5 h-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onContactInfo}>
              <Info className="w-4 h-4 mr-2" />
              Contact info
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSelectMessages}>
              <CheckSquare className="w-4 h-4 mr-2" />
              Select messages
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMuteNotifications}>
              <BellOff className="w-4 h-4 mr-2" />
              Mute notifications
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDisappearingMessages}>
              <Timer className="w-4 h-4 mr-2" />
              Disappearing messages
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddToFavourites}>
              <Heart className="w-4 h-4 mr-2" />
              Add to favourites
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCloseChat}>
              <XCircle className="w-4 h-4 mr-2" />
              Close chat
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={onSendCallLink}>
              <Link2 className="w-4 h-4 mr-2" />
              Send call link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onScheduleCall}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule call
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewGroupCall}>
              <Users className="w-4 h-4 mr-2" />
              New group call
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={onWallpaper}>
              <ImageIcon className="w-4 h-4 mr-2" />
              Wallpaper
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={onReport}>
              <Flag className="w-4 h-4 mr-2" />
              Report
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBlock} className="text-destructive focus:text-destructive">
              <Ban className="w-4 h-4 mr-2" />
              Block
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onClearChat}>
              <MinusCircle className="w-4 h-4 mr-2" />
              Clear chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDeleteChat} className="text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
