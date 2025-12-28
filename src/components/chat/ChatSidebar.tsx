import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import { FriendRequestsDialog } from './FriendRequestsDialog';
import { StatusViewer } from './StatusViewer';
import { Search, Settings, MessageSquarePlus, UserPlus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatData, ChatParticipant } from '@/hooks/useChat';
import { usePresenceContext } from '@/contexts/PresenceContext';
import { useTypingStatus } from '@/hooks/useTypingStatus';
import { useFriendRequests } from '@/hooks/useFriendRequests';
import { useStatus } from '@/hooks/useStatus';
import { useFileUpload } from '@/hooks/useFileUpload';
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
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isFriendRequestsOpen, setIsFriendRequestsOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const { isUserOnline, onlineCount } = usePresenceContext();
  const { isTypingInChat } = useTypingStatus();
  const { pendingRequests, sendFriendRequest, checkFriendStatus } = useFriendRequests();
  const [friendStatuses, setFriendStatuses] = useState<Map<string, string>>(new Map());

  const filteredChats = chats.filter(chat => {
    const otherUser = chat.participants[0];
    return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredUsers = allUsers.filter(user =>
    (user.username?.toLowerCase() || '').includes(userSearchQuery.toLowerCase()) ||
    (user.name?.toLowerCase() || '').includes(userSearchQuery.toLowerCase())
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

  const handleSendFriendRequest = async (username: string) => {
    if (!username) return;
    await sendFriendRequest(username);
    // Refresh friend status
    const status = await checkFriendStatus(username);
    setFriendStatuses(prev => new Map(prev).set(username, status));
  };

  const getFriendStatus = async (username: string) => {
    if (!username) return 'none';
    if (!friendStatuses.has(username)) {
      const status = await checkFriendStatus(username);
      setFriendStatuses(prev => new Map(prev).set(username, status));
      return status;
    }
    return friendStatuses.get(username);
  };

  // Load friend statuses when dialog opens
  useEffect(() => {
    if (isNewChatOpen && sortedUsers.length > 0) {
      sortedUsers.forEach(user => {
        if (user.username && !friendStatuses.has(user.username)) {
          getFriendStatus(user.username);
        }
      });
    }
  }, [isNewChatOpen, sortedUsers.length]);

  return (
    <aside className={cn(
      'flex flex-col h-full bg-sidebar border-r border-sidebar-border animate-fade-in',
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
            className="hover-lift"
          />
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">Chats</h1>
            <p className="text-xs text-muted-foreground smooth-transition">
              {onlineCount} {onlineCount === 1 ? 'user' : 'users'} online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground relative smooth-transition hover-lift"
            onClick={() => setIsFriendRequestsOpen(true)}
            title="Friend Requests"
          >
            <UserPlus className="w-5 h-5" />
            {pendingRequests.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                {pendingRequests.length}
              </span>
            )}
          </Button>
          <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground smooth-transition hover-lift">
                <MessageSquarePlus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Search Users</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by username..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {sortedUsers.length > 0 ? (
                    sortedUsers.map((user) => {
                      const online = isUserOnline(user.id);
                      const status = friendStatuses.get(user.username);
                      
                      return (
                        <div
                          key={user.id}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                        >
                          <Avatar
                            src={user.avatar_url}
                            alt={user.name}
                            size="md"
                            isOnline={online}
                            showStatus
                          />
                          <div className="text-left flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{user.name}</p>
                              {online && (
                                <span className="text-[10px] text-status-online font-medium">
                                  Online
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                          </div>
                          {status === 'friends' ? (
                            <Button
                              size="sm"
                              onClick={() => handleStartChat(user.id)}
                            >
                              Chat
                            </Button>
                          ) : status === 'sent' ? (
                            <Button size="sm" variant="outline" disabled>
                              Pending
                            </Button>
                          ) : status === 'received' ? (
                            <Button
                              size="sm"
                              onClick={() => setIsFriendRequestsOpen(true)}
                            >
                              Accept
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendFriendRequest(user.username)}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No users found</p>
                      <p className="text-xs mt-1">Try searching by username</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/settings')}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <FriendRequestsDialog
        open={isFriendRequestsOpen}
        onOpenChange={setIsFriendRequestsOpen}
      />

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
            filteredChats.map((chat, index) => {
              const otherUser = chat.participants[0];
              if (!otherUser) return null;
              
              const online = isUserOnline(otherUser.id);
              const isTyping = isTypingInChat(chat.id);
              
              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl smooth-transition chat-item-hover',
                    'hover:bg-sidebar-accent hover:shadow-sm',
                    activeChatId === chat.id && 'bg-sidebar-accent shadow-sm',
                    'animate-fade-in'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
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
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-status-online pulse-online" />
                        )}
                      </div>
                      {chat.lastMessage && (
                        <span className="text-[11px] text-muted-foreground flex-shrink-0">
                          {formatChatTime(chat.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      {isTyping ? (
                        <div className="flex items-center gap-1.5 animate-fade-in">
                          <div className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-typing animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-status-typing animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-status-typing animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-sm text-status-typing font-medium">typing...</span>
                        </div>
                      ) : (
                        <p className={cn(
                          "text-sm truncate smooth-transition",
                          chat.unreadCount > 0 
                            ? "text-foreground font-semibold" 
                            : "text-muted-foreground"
                        )}>
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                      )}
                      {chat.unreadCount > 0 && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 flex items-center justify-center bg-primary text-primary-foreground text-[11px] font-medium rounded-full px-1.5 animate-scale-in">
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
