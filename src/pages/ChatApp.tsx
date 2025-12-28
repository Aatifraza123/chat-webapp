import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Chat, Message, User } from '@/types/chat';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatView } from '@/components/chat/ChatView';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

// Mock data for demo - will be replaced with real data
const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    id: 'user-2',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: 'user-3',
    name: 'Jordan Taylor',
    email: 'jordan@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    isOnline: true,
    lastSeen: new Date(),
  },
];

export default function ChatApp() {
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();
  
  const [currentUserData, setCurrentUserData] = useState<User>({
    id: 'current-user',
    name: 'You',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser',
    isOnline: true,
    lastSeen: new Date(),
  });

  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  // Load user profile
  useEffect(() => {
    if (user) {
      const loadProfile = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile) {
          setCurrentUserData({
            id: profile.id,
            name: profile.name || user.email?.split('@')[0] || 'User',
            email: profile.email || user.email || '',
            avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
            isOnline: true,
            lastSeen: new Date(),
          });
        }

        // Initialize demo chats
        const demoChats: Chat[] = mockUsers.map((mockUser, index) => ({
          id: `chat-${index + 1}`,
          participants: [currentUserData, mockUser],
          lastMessage: null,
          unreadCount: index === 0 ? 2 : 0,
          updatedAt: new Date(Date.now() - 1000 * 60 * (index + 1) * 30),
        }));
        setChats(demoChats);
        
        // Add some demo messages
        const demoMessages: Message[] = [
          {
            id: 'msg-1',
            chatId: 'chat-1',
            senderId: 'user-1',
            content: 'Hey! Welcome to ChatFlow! 👋',
            type: 'text',
            status: 'seen',
            createdAt: new Date(Date.now() - 1000 * 60 * 60),
          },
          {
            id: 'msg-2',
            chatId: 'chat-1',
            senderId: 'user-1',
            content: "This is a demo chat. Real-time messaging will be enabled soon!",
            type: 'text',
            status: 'delivered',
            createdAt: new Date(Date.now() - 1000 * 60 * 55),
          },
        ];
        setMessages(demoMessages);
        
        // Update first chat with last message
        setChats(prev => prev.map((chat, index) => 
          index === 0 ? { ...chat, lastMessage: demoMessages[1] } : chat
        ));
      };

      loadProfile();
    }
  }, [user]);

  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const activeMessages = messages.filter(m => m.chatId === activeChatId);

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
    setIsMobileSidebarOpen(false);
    
    // Mark messages as read
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
    ));
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    if (!activeChatId) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId: activeChatId,
      senderId: currentUserData.id,
      content,
      type: 'text',
      status: 'sending',
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);

    // Update chat's last message
    setChats(prev => prev.map(chat =>
      chat.id === activeChatId
        ? { ...chat, lastMessage: newMessage, updatedAt: new Date() }
        : chat
    ));

    // Simulate message being sent
    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
      ));
    }, 500);

    // Simulate message being delivered
    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 1000);
  }, [activeChatId, currentUserData.id]);

  const handleBack = useCallback(() => {
    setIsMobileSidebarOpen(true);
    setActiveChatId(null);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        'w-full lg:w-80 xl:w-96 flex-shrink-0',
        'absolute lg:relative inset-0 z-20 lg:z-0',
        'transition-transform duration-300 ease-in-out',
        !isMobileSidebarOpen && '-translate-x-full lg:translate-x-0'
      )}>
        <div className="h-full flex flex-col">
          <ChatSidebar
            chats={chats}
            currentUserId={currentUserData.id}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            currentUserAvatar={currentUserData.avatar}
            currentUserName={currentUserData.name}
            className="flex-1"
          />
          
          {/* Sign Out Button */}
          <div className="p-3 border-t border-sidebar-border bg-sidebar">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Chat View */}
      <div className={cn(
        'flex-1 min-w-0',
        'absolute lg:relative inset-0 z-10',
        'transition-transform duration-300 ease-in-out',
        isMobileSidebarOpen && 'translate-x-full lg:translate-x-0'
      )}>
        <ChatView
          chat={activeChat}
          messages={activeMessages}
          currentUserId={currentUserData.id}
          onSendMessage={handleSendMessage}
          onBack={handleBack}
          showBackButton={true}
          className="h-full"
        />
      </div>
    </div>
  );
}
