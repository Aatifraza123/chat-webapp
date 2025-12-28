import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import { FriendRequestsDialog } from './FriendRequestsDialog';
import { StatusViewer } from './StatusViewer';
import { Search, Settings, MessageSquarePlus, UserPlus, Plus, MessageSquare } from 'lucide-react';
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

function getMessagePreview(message: any): string {
  if (!message) return 'No messages yet';
  
  // Check if it's a media message (contains Cloudinary URL)
  const isCloudinaryUrl = message.content?.includes('res.cloudinary.com');
  
  if (isCloudinaryUrl) {
    // Determine media type from URL or type field
    const content = message.content || '';
    
    if (message.type === 'image' || content.includes('/chat-images/') || content.includes('/image/upload/')) {
      return '📷 Photo';
    }
    if (message.type === 'video' || content.includes('/chat-videos/') || content.includes('/video/upload/')) {
      return '🎥 Video';
    }
    if (message.type === 'document' || content.includes('/chat-documents/') || content.includes('/raw/upload/')) {
      return '📄 Document';
    }
  }
  
  // Check by type field
  if (message.type === 'image') {
    return '📷 Photo';
  }
  if (message.type === 'video') {
    return '🎥 Video';
  }
  if (message.type === 'document') {
    return '📄 Document';
  }
  if (message.type === 'voice') {
    return '🎤 Voice message';
  }
  
  // Return text message (truncate if too long)
  const text = message.content || 'No messages yet';
  return text.length > 50 ? text.substring(0, 50) + '...' : text;
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
      'flex flex-col h-full bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border/50 animate-fade-in',
      className
    )}>
      {/* Header with Logo */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">Connect</h1>
            <p className="text-xs text-muted-foreground">
              {onlineCount} online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground relative smooth-transition hover-lift rounded-xl"
            onClick={() => setIsFriendRequestsOpen(true)}
            title="Friend Requests"
          >
            <UserPlus className="w-5 h-5" />
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in shadow-glow">
                {pendingRequests.length}
              </span>
            )}
          </Button>
          <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground smooth-transition hover-lift rounded-xl">
                <MessageSquarePlus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md glass-card border-sidebar-border/50">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">New Chat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by username..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-9 glass border-sidebar-border/50 rounded-xl"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin">
                  {sortedUsers.length > 0 ? (
                    sortedUsers.map((user) => {
                      const online = isUserOnline(user.id);
                      const status = friendStatuses.get(user.username);
                      
                      return (
                        <div
                          key={user.id}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent/10 transition-all smooth-transition hover-lift"
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
                              <p className="font-semibold text-sm truncate">{user.name}</p>
                              {online && (
                                <span className="text-[10px] text-status-online font-medium px-2 py-0.5 bg-status-online/10 rounded-full">
                                  Online
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                          </div>
                          {status === 'friends' ? (
                            <Button
                              size="sm"
                              className="gradient-primary hover-glow rounded-xl"
                              onClick={() => handleStartChat(user.id)}
                            >
                              Chat
                            </Button>
                          ) : status === 'sent' ? (
                            <Button size="sm" variant="outline" disabled className="rounded-xl">
                              Pending
                            </Button>
                          ) : status === 'received' ? (
                            <Button
                              size="sm"
                              className="gradient-primary rounded-xl"
                              onClick={() => setIsFriendRequestsOpen(true)}
                            >
                              Accept
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl hover-lift"
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
            className="text-muted-foreground hover:text-foreground rounded-xl hover-lift"
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

      {/* Search with Glassmorphism */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 glass border-sidebar-border/50 focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2">
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
                    'w-full flex items-center gap-3 p-3 rounded-2xl smooth-transition',
                    'hover:bg-sidebar-accent/50 hover:shadow-md hover-lift',
                    activeChatId === chat.id && 'bg-sidebar-accent shadow-md ring-2 ring-primary/20',
                    'animate-fade-in'
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="relative">
                    <Avatar
                      src={otherUser.avatar_url}
                      alt={otherUser.name}
                      size="lg"
                      isOnline={online}
                      showStatus
                      className="ring-2 ring-background"
                    />
                    {chat.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in shadow-glow">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate text-sidebar-foreground">
                        {otherUser.name}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {formatChatTime(chat.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isTyping ? (
                        <div className="flex items-center gap-1.5 animate-fade-in">
                          <div className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-xs text-primary font-medium">typing...</span>
                        </div>
                      ) : (
                        <p className={cn(
                          "text-xs truncate smooth-transition flex-1",
                          chat.unreadCount > 0 
                            ? "text-foreground font-semibold" 
                            : "text-muted-foreground"
                        )}>
                          {getMessagePreview(chat.lastMessage)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground animate-fade-up">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquarePlus className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm font-medium">No chats yet</p>
              <p className="text-xs mt-1">Start a new conversation!</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
