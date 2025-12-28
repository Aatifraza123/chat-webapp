import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Chat } from '@/types/chat';
import { ChatListItem } from './ChatListItem';
import { Avatar } from './Avatar';
import { Search, Settings, MessageSquarePlus, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatSidebarProps {
  chats: Chat[];
  currentUserId: string;
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUserAvatar: string;
  currentUserName: string;
  className?: string;
}

export function ChatSidebar({
  chats,
  currentUserId,
  activeChatId,
  onSelectChat,
  currentUserAvatar,
  currentUserName,
  className,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat => {
    const otherUser = chat.participants.find(p => p.id !== currentUserId);
    return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <MessageSquarePlus className="w-5 h-5" />
          </Button>
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
            filteredChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                currentUserId={currentUserId}
                isActive={chat.id === activeChatId}
                onClick={() => onSelectChat(chat.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No chats found</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
