import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Chat, Message } from '@/types/chat';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatView } from '@/components/chat/ChatView';
import { mockChats, mockMessages, currentUser } from '@/data/mockData';

export default function ChatApp() {
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);

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
      senderId: currentUser.id,
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
  }, [activeChatId]);

  const handleBack = useCallback(() => {
    setIsMobileSidebarOpen(true);
    setActiveChatId(null);
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        'w-full lg:w-80 xl:w-96 flex-shrink-0',
        'absolute lg:relative inset-0 z-20 lg:z-0',
        'transition-transform duration-300 ease-in-out',
        !isMobileSidebarOpen && '-translate-x-full lg:translate-x-0'
      )}>
        <ChatSidebar
          chats={chats}
          currentUserId={currentUser.id}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          currentUserAvatar={currentUser.avatar}
          currentUserName={currentUser.name}
          className="h-full"
        />
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
          currentUserId={currentUser.id}
          onSendMessage={handleSendMessage}
          onBack={handleBack}
          showBackButton={true}
          className="h-full"
        />
      </div>
    </div>
  );
}
