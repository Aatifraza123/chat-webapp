import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import { Search, Settings, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatData, ChatParticipant } from '@/hooks/useChat';
import { usePresenceContext } from '@/contexts/PresenceContext';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ChatSidebarProps {
  chats: ChatData[];
  currentUserId: string;
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUserAvatar: string;
  currentUserName: string;
  allUsers: ChatParticipant[];
  onStartChat: (userId: string) => void;
  className?: string;
}

function formatChatTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'dd/MM/yy');
}

export function ChatSidebar({
  chats,
  currentUserId,
  activeChatId,
  onSelectChat,
  currentUserAvatar,
  currentUserName,
  allUsers,
  onStartChat,
  className,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const { isUserOnline, onlineCount } = usePresenceContext();

  const filteredChats = chats.filter(chat => {
    const otherUser = chat.participants[0];
    return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Sort users by online status
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aOnline = isUserOnline(a.id);
    const bOnline = isUserOnline(b.id);
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleStartChat = (userId: string) => {
    onStartChat(userId);
    setIsNewChatOpen(false);
    setUserSearchQuery('');
  };

  return (
    <aside className={cn(
      'flex flex-col h-full bg-sidebar border-r border-sidebar-border',
      className
    )}>
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar
            src={currentUserAvatar}
            alt={currentUserName}
            size="md"
            isOnline
            showStatus
          />
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">Chats</h1>
            <p className="text-xs text-muted-foreground">
              {onlineCount} {onlineCount === 1 ? 'user' : 'users'} online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <MessageSquarePlus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Start New Chat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {sortedUsers.length > 0 ? (
                    sortedUsers.map((user) => {
                      const online = isUserOnline(user.id);
                      return (
                        <button
                          key={user.id}
                          onClick={() => handleStartChat(user.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                        >
                          <Avatar
                            src={user.avatar_url}
                            alt={user.name}
                            size="md"
                            isOnline={online}
                            showStatus
                          />
                          <div className="text-left flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{user.name}</p>
                              {online && (
                                <span className="text-[10px] text-status-online font-medium">
                                  Online
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No users found</p>
                      <p className="text-xs mt-1">Invite friends to start chatting!</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-sidebar-accent border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-4">
        <div className="space-y-1">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const otherUser = chat.participants[0];
              if (!otherUser) return null;
              
              const online = isUserOnline(otherUser.id);
              
              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
                    'hover:bg-sidebar-accent',
                    activeChatId === chat.id && 'bg-sidebar-accent'
                  )}
                >
                  <Avatar
                    src={otherUser.avatar_url}
                    alt={otherUser.name}
                    size="lg"
                    isOnline={online}
                    showStatus
                  />
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-semibold text-sm truncate text-sidebar-foreground">
                          {otherUser.name}
                        </h3>
                        {online && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-status-online" />
                        )}
                      </div>
                      {chat.lastMessage && (
                        <span className="text-[11px] text-muted-foreground flex-shrink-0">
                          {formatChatTime(chat.lastMessage.created_at)}
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
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquarePlus className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs mt-1">Start a new conversation!</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
