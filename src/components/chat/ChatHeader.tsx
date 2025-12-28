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
    <header className="flex items-center gap-3 px-4 sm:px-6 py-4 bg-gradient-to-r from-card/98 to-card/95 backdrop-blur-2xl border-b border-border/30 shadow-premium">
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="flex-shrink-0 -ml-2 lg:hidden rounded-2xl hover-lift hover:bg-accent/30 transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}
      
      <div className="relative group">
        <Avatar
          src={user.avatar}
          alt={user.name}
          size="md"
          isOnline={user.isOnline}
          showStatus
          className="cursor-pointer ring-2 ring-background hover-lift transition-all duration-300 group-hover:ring-primary/50"
          onClick={onProfileClick}
        />
      </div>
      
      <div className="flex-1 min-w-0 cursor-pointer group" onClick={onProfileClick}>
        <h2 className="font-bold text-base truncate group-hover:text-primary transition-colors duration-300 flex items-center gap-2">
          {user.name}
          {user.isOnline && (
            <span className="text-[10px] font-medium px-2 py-0.5 bg-status-online/10 text-status-online rounded-full animate-fade-in">
              Online
            </span>
          )}
        </h2>
        <p className={cn(
          'text-xs truncate flex items-center gap-1.5 transition-all duration-300',
          isTyping ? 'text-primary font-semibold' : 'text-muted-foreground'
        )}>
          {isTyping && (
            <span className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
          {getStatusText()}
        </p>
      </div>
      
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-2xl hover-lift transition-all duration-300 relative group"
          onClick={onVoiceCall}
          title="Voice Call"
        >
          <Phone className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="absolute inset-0 rounded-2xl bg-primary/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-2xl hover-lift transition-all duration-300 relative group"
          onClick={onVideoCall}
          title="Video Call"
        >
          <Video className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="absolute inset-0 rounded-2xl bg-primary/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-2xl hover-lift transition-all duration-300 hidden sm:flex relative group"
        >
          <Search className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="absolute inset-0 rounded-2xl bg-primary/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-2xl hover-lift transition-all duration-300">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 glass-card border-border/30 shadow-premium-lg animate-scale-in">
            <DropdownMenuItem onClick={onContactInfo} className="rounded-xl py-3 cursor-pointer hover:bg-primary/10 transition-colors">
              <Info className="w-4 h-4 mr-3 text-primary" />
              <span className="font-medium">Contact info</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSelectMessages} className="rounded-xl py-3 cursor-pointer hover:bg-primary/10 transition-colors">
              <CheckSquare className="w-4 h-4 mr-3 text-primary" />
              <span className="font-medium">Select messages</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMuteNotifications} className="rounded-xl py-3 cursor-pointer hover:bg-primary/10 transition-colors">
              <BellOff className="w-4 h-4 mr-3 text-primary" />
              <span className="font-medium">Mute notifications</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDisappearingMessages} className="rounded-xl py-3 cursor-pointer hover:bg-primary/10 transition-colors">
              <Timer className="w-4 h-4 mr-3 text-primary" />
              <span className="font-medium">Disappearing messages</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddToFavourites} className="rounded-xl py-3 cursor-pointer hover:bg-primary/10 transition-colors">
              <Heart className="w-4 h-4 mr-3 text-primary" />
              <span className="font-medium">Add to favourites</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCloseChat} className="rounded-xl py-3 cursor-pointer hover:bg-primary/10 transition-colors">
              <XCircle className="w-4 h-4 mr-3 text-primary" />
              <span className="font-medium">Close chat</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-2" />
            
            <DropdownMenuItem onClick={onSendCallLink} className="rounded-xl py-3 cursor-pointer hover:bg-primary/10 transition-colors">
              <Link2 className="w-4 h-4 mr-3 text-primary" />
              <span className="font-medium">Send call link</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onScheduleCall} className="rounded-xl py-3 cursor-pointer hover:bg-primary/10 transition-colors">
              <Calendar className="w-4 h-4 mr-3 text-primary" />
              <span className="font-medium">Schedule call</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewGroupCall} className="rounded-xl py-3 cursor-pointer hover:bg-primary/10 transition-colors">
              <Users className="w-4 h-4 mr-3 text-primary" />
              <span className="font-medium">New group call</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-2" />
            
            <DropdownMenuItem onClick={onWallpaper} className="rounded-xl py-3 cursor-pointer hover:bg-primary/10 transition-colors">
              <ImageIcon className="w-4 h-4 mr-3 text-primary" />
              <span className="font-medium">Wallpaper</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-2" />
            
            <DropdownMenuItem onClick={onReport} className="rounded-xl py-3 cursor-pointer hover:bg-destructive/10 transition-colors">
              <Flag className="w-4 h-4 mr-3 text-destructive" />
              <span className="font-medium text-destructive">Report</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBlock} className="rounded-xl py-3 cursor-pointer hover:bg-destructive/10 transition-colors">
              <Ban className="w-4 h-4 mr-3 text-destructive" />
              <span className="font-medium text-destructive">Block</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onClearChat} className="rounded-xl py-3 cursor-pointer hover:bg-destructive/10 transition-colors">
              <MinusCircle className="w-4 h-4 mr-3 text-destructive" />
              <span className="font-medium text-destructive">Clear chat</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDeleteChat} className="rounded-xl py-3 cursor-pointer hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-4 h-4 mr-3 text-destructive" />
              <span className="font-medium text-destructive">Delete chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
