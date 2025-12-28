import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { MessageSquare } from 'lucide-react';
import { ChatData, ChatMessage } from '@/hooks/useChat';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { usePresenceContext } from '@/contexts/PresenceContext';

interface ChatViewProps {
  chat: ChatData | null;
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export function ChatView({
  chat,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  showBackButton,
  className,
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isOtherUserTyping, setTyping } = useTypingIndicator(chat?.id || null);
  const { isUserOnline } = usePresenceContext();

  const otherUser = chat?.participants[0];

  // Auto-scroll to bottom when new messages arrive or typing indicator appears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherUserTyping]);

  const handleTyping = useCallback((isTyping: boolean) => {
    setTyping(isTyping);
  }, [setTyping]);

  const handleSendMessage = useCallback((content: string) => {
    // Stop typing when sending
    setTyping(false);
    onSendMessage(content);
  }, [onSendMessage, setTyping]);

  if (!chat || !otherUser) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center h-full bg-background chat-pattern',
        className
      )}>
        <div className="text-center p-8 animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Welcome to ChatFlow</h2>
          <p className="text-muted-foreground max-w-sm">
            Select a conversation from the sidebar or start a new chat
          </p>
        </div>
      </div>
    );
  }

  const online = isUserOnline(otherUser.id);

  // Convert ChatParticipant to User format for ChatHeader
  const userForHeader = {
    id: otherUser.id,
    name: otherUser.name,
    email: otherUser.email,
    avatar: otherUser.avatar_url,
    isOnline: online,
    lastSeen: new Date(),
  };

  // Convert ChatMessage to Message format for MessageBubble
  const messagesForDisplay = messages.map(msg => ({
    id: msg.id,
    chatId: msg.chat_id,
    senderId: msg.sender_id,
    content: msg.content,
    type: msg.type as 'text' | 'image' | 'emoji',
    status: msg.status as 'sending' | 'sent' | 'delivered' | 'seen',
    createdAt: new Date(msg.created_at),
  }));

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <ChatHeader
        user={userForHeader}
        isTyping={isOtherUserTyping}
        onBack={onBack}
        showBackButton={showBackButton}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin chat-pattern p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {messagesForDisplay.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Send a message to start the conversation!</p>
            </div>
          ) : (
            messagesForDisplay.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
              />
            ))
          )}
          
          {isOtherUserTyping && (
            <div className="flex items-center gap-2 animate-fade-up">
              <div className="bg-chat-received rounded-2xl rounded-bl-md">
                <TypingIndicator />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
      />
    </div>
  );
}
