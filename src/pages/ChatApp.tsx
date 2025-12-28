import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatView } from '@/components/chat/ChatView';
import { useAuth } from '@/contexts/AuthContext';
import { useChat, ChatData } from '@/hooks/useChat';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';

export default function ChatApp() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const {
    chats,
    messages,
    activeChatId,
    setActiveChatId,
    sendMessage,
    startChat,
    allUsers,
    isLoading: chatLoading,
  } = useChat();
  
  const [currentUserData, setCurrentUserData] = useState({
    id: '',
    name: 'You',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser',
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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
            avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          });
        } else {
          setCurrentUserData({
            id: user.id,
            name: user.email?.split('@')[0] || 'User',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          });
        }
      };

      loadProfile();
    }
  }, [user]);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
    setIsMobileSidebarOpen(false);
  }, [setActiveChatId]);

  const handleSendMessage = useCallback((content: string) => {
    sendMessage(content);
  }, [sendMessage]);

  const handleStartChat = useCallback(async (userId: string) => {
    const chatId = await startChat(userId);
    if (chatId) {
      setIsMobileSidebarOpen(false);
    }
  }, [startChat]);

  const handleBack = useCallback(() => {
    setIsMobileSidebarOpen(true);
    setActiveChatId(null);
  }, [setActiveChatId]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
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
            allUsers={allUsers}
            onStartChat={handleStartChat}
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
          messages={messages}
          currentUserId={currentUserData.id}
          onSendMessage={handleSendMessage}
          onBack={handleBack}
          showBackButton={true}
          className="h-full"
        />
      </div>

      {/* Loading Overlay */}
      {chatLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
