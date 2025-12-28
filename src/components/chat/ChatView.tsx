import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { MessageSquare } from 'lucide-react';
import { ChatData, ChatMessage, ChatParticipant } from '@/hooks/useChat';

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
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUser = chat?.participants[0];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate other user typing occasionally
  useEffect(() => {
    if (!chat) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        setShowTypingIndicator(true);
        setTimeout(() => setShowTypingIndicator(false), 2000);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [chat]);

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

  // Convert ChatParticipant to User format for ChatHeader
  const userForHeader = {
    id: otherUser.id,
    name: otherUser.name,
    email: otherUser.email,
    avatar: otherUser.avatar_url,
    isOnline: otherUser.isOnline || false,
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
        isTyping={showTypingIndicator}
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
          
          {showTypingIndicator && (
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
        onSendMessage={onSendMessage}
        onTyping={setIsTyping}
      />
    </div>
  );
}
