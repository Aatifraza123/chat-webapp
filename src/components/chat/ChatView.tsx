import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { EnhancedMessageInput } from './EnhancedMessageInput';
import { TypingIndicator } from './TypingIndicator';
import { SelectMessagesMode } from './SelectMessagesMode';
import { ContactInfoDialog } from './ContactInfoDialog';
import { DisappearingMessagesDialog } from './DisappearingMessagesDialog';
import { ScheduleCallDialog } from './ScheduleCallDialog';
import { WallpaperDialog } from './WallpaperDialog';
import { UserProfileDialog } from './UserProfileDialog';
import { ReportDialog } from './ReportDialog';
import { MessageSquare } from 'lucide-react';
import { ChatData, ChatMessage } from '@/hooks/useChat';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { usePresenceContext } from '@/contexts/PresenceContext';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ChatViewProps {
  chat: ChatData | null;
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string, type: 'text' | 'image' | 'video' | 'document') => void;
  onDeleteChat?: (chatId: string) => Promise<boolean>;
  onClearChat?: (chatId: string) => Promise<boolean>;
  onBlockUser?: (userId: string) => Promise<boolean>;
  onUnblockUser?: (userId: string) => Promise<boolean>;
  onReportUser?: (userId: string, reason: string, description: string) => Promise<boolean>;
  onBack?: () => void;
  showBackButton?: boolean;
  className?: string;
  onVoiceCall?: (userId: string, userName: string, userAvatar: string) => void;
  onVideoCall?: (userId: string, userName: string, userAvatar: string) => void;
}

export function ChatView({
  chat,
  messages,
  currentUserId,
  onSendMessage,
  onDeleteChat,
  onClearChat,
  onBlockUser,
  onUnblockUser,
  onReportUser,
  onBack,
  showBackButton,
  className,
  onVoiceCall,
  onVideoCall,
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isOtherUserTyping, setTyping } = useTypingIndicator(chat?.id || null);
  const { isUserOnline } = usePresenceContext();
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Dialog states
  const [contactInfoOpen, setContactInfoOpen] = useState(false);
  const [disappearingMsgOpen, setDisappearingMsgOpen] = useState(false);
  const [scheduleCallOpen, setScheduleCallOpen] = useState(false);
  const [wallpaperOpen, setWallpaperOpen] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [clearAlertOpen, setClearAlertOpen] = useState(false);
  const [blockAlertOpen, setBlockAlertOpen] = useState(false);

  // Selection mode
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  // Chat settings
  const [isMuted, setIsMuted] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [disappearingDuration, setDisappearingDuration] = useState('off');
  const [wallpaper, setWallpaper] = useState('default');

  const otherUser = chat?.participants[0];

  // Update wallpaper when chat changes
  useEffect(() => {
    if (chat?.id) {
      const savedWallpaper = localStorage.getItem(`wallpaper_${chat.id}`) || 'default';
      setWallpaper(savedWallpaper);
    }
  }, [chat?.id]);

  // Update other settings when chat changes
  useEffect(() => {
    if (chat?.id) {
      setIsMuted(localStorage.getItem(`mute_${chat.id}`) === 'true');
      setIsFavourite(localStorage.getItem(`fav_${chat.id}`) === 'true');
      setDisappearingDuration(localStorage.getItem(`disappearing_${chat.id}`) || 'off');
    }
    if (chat?.participants[0]?.id) {
      setIsBlocked(localStorage.getItem(`block_${chat.participants[0].id}`) === 'true');
    }
  }, [chat?.id, chat?.participants]);

  // Auto-scroll to bottom when new messages arrive or typing indicator appears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherUserTyping]);

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (!chat || !messages.length || hasMarkedAsRead) return;

    const socket = getSocket();
    if (!socket) return;

    // Get unread messages from other user
    const unreadMessages = messages.filter(
      msg => msg.sender_id !== currentUserId && msg.status !== 'seen'
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id);
      socket.emit('message:read', { messageIds, chatId: chat.id });
      setHasMarkedAsRead(true);
    }
  }, [chat, messages, currentUserId, hasMarkedAsRead]);

  // Reset hasMarkedAsRead when chat changes
  useEffect(() => {
    setHasMarkedAsRead(false);
  }, [chat?.id]);

  const handleTyping = useCallback((isTyping: boolean) => {
    setTyping(isTyping);
  }, [setTyping]);

  const handleSendMessage = useCallback((content: string, type: 'text' | 'image' | 'video' | 'document' = 'text') => {
    // Stop typing when sending
    setTyping(false);
    onSendMessage(content, type);
  }, [onSendMessage, setTyping]);

  // Get wallpaper styles
  const getWallpaperStyle = () => {
    if (wallpaper === 'default') {
      return {};
    }

    if (wallpaper.startsWith('color:')) {
      const colorValue = wallpaper.replace('color:', '');
      const colorMap: Record<string, string> = {
        'light-gray': '#f3f4f6',
        'warm-white': '#fff7ed',
        'cool-blue': '#eff6ff',
        'mint-green': '#f0fdf4',
        'lavender': '#faf5ff',
        'rose': '#fff1f2',
        'dark': '#111827',
      };
      return { backgroundColor: colorMap[colorValue] || '' };
    }

    if (wallpaper.startsWith('pattern:')) {
      const patternValue = wallpaper.replace('pattern:', '');
      const patternMap: Record<string, string> = {
        'dots': 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        'grid': 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M0 0h40v1H0V0zm0 10h40v1H0v-1zm0 10h40v1H0v-1zm0 10h40v1H0v-1z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        'diagonal': 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")',
        'waves': 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'20\' viewBox=\'0 0 100 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z\' fill=\'%239C92AC\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
        'bubbles': 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z\' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        'hexagons': 'url("data:image/svg+xml,%3Csvg width=\'28\' height=\'49\' viewBox=\'0 0 28 49\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      };
      return { backgroundImage: patternMap[patternValue] || '' };
    }

    if (wallpaper.startsWith('gradient:')) {
      const gradientValue = wallpaper.replace('gradient:', '');
      const gradientMap: Record<string, string> = {
        'sunset': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'ocean': 'linear-gradient(135deg, #667eea 0%, #00d4ff 100%)',
        'forest': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        'fire': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'night': 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)',
        'aurora': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'peach': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        'purple-dream': 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
      };
      return { background: gradientMap[gradientValue] || '' };
    }

    if (wallpaper.startsWith('custom:')) {
      const imageUrl = wallpaper.replace('custom:', '');
      return { 
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }

    return {};
  };

  // Menu handlers
  const handleContactInfo = () => {
    setContactInfoOpen(true);
  };

  const handleSelectMessages = () => {
    setIsSelectMode(true);
    setSelectedMessages(new Set());
  };

  const handleCancelSelect = () => {
    setIsSelectMode(false);
    setSelectedMessages(new Set());
  };

  const handleMessageSelect = (messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = () => {
    toast({
      title: 'Messages deleted',
      description: `${selectedMessages.size} message(s) deleted`,
    });
    setSelectedMessages(new Set());
    setIsSelectMode(false);
  };

  const handleCopySelected = () => {
    const selectedMsgs = messages.filter(m => selectedMessages.has(m.id));
    const text = selectedMsgs.map(m => m.content).join('\n');
    navigator.clipboard.writeText(text);
    toast({
      title: 'Messages copied',
      description: `${selectedMessages.size} message(s) copied to clipboard`,
    });
    setIsSelectMode(false);
    setSelectedMessages(new Set());
  };

  const handleForwardSelected = () => {
    toast({
      title: 'Forward messages',
      description: 'Select a chat to forward messages',
    });
  };

  const handleStarSelected = () => {
    toast({
      title: 'Messages starred',
      description: `${selectedMessages.size} message(s) starred`,
    });
    setIsSelectMode(false);
    setSelectedMessages(new Set());
  };

  const handleMuteNotifications = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem(`mute_${chat?.id}`, String(newMuted));
    toast({
      title: newMuted ? 'Notifications muted' : 'Notifications enabled',
      description: newMuted ? 'You will not receive notifications from this chat' : 'You will receive notifications from this chat',
    });
  };

  const handleDisappearingMessages = () => {
    setDisappearingMsgOpen(true);
  };

  const handleDisappearingDurationChange = (duration: string) => {
    setDisappearingDuration(duration);
    localStorage.setItem(`disappearing_${chat?.id}`, duration);
    toast({
      title: 'Disappearing messages updated',
      description: duration === 'off' ? 'Messages will not disappear' : `Messages will disappear after ${duration}`,
    });
  };

  const handleAddToFavourites = () => {
    const newFav = !isFavourite;
    setIsFavourite(newFav);
    localStorage.setItem(`fav_${chat?.id}`, String(newFav));
    toast({
      title: newFav ? 'Added to favourites' : 'Removed from favourites',
      description: newFav ? 'Chat added to favourites' : 'Chat removed from favourites',
    });
  };

  const handleCloseChat = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleSendCallLink = () => {
    const callLink = `${window.location.origin}/call/${chat?.id}`;
    navigator.clipboard.writeText(callLink);
    toast({
      title: 'Call link copied',
      description: 'Share this link to start a call',
    });
  };

  const handleScheduleCall = () => {
    setScheduleCallOpen(true);
  };

  const handleScheduleCallSubmit = (data: { date: string; time: string; type: 'voice' | 'video' }) => {
    toast({
      title: 'Call scheduled',
      description: `${data.type === 'voice' ? 'Voice' : 'Video'} call scheduled for ${data.date} at ${data.time}`,
    });
  };

  const handleNewGroupCall = () => {
    toast({
      title: 'New group call',
      description: 'Feature coming soon',
    });
  };

  const handleWallpaper = () => {
    setWallpaperOpen(true);
  };

  const handleWallpaperChange = (newWallpaper: string) => {
    setWallpaper(newWallpaper);
    localStorage.setItem(`wallpaper_${chat?.id}`, newWallpaper);
    toast({
      title: 'Wallpaper updated',
      description: 'Chat background has been changed',
    });
  };

  const handleReport = () => {
    setReportDialogOpen(true);
  };

  const handleReportSubmit = async (reason: string, description: string) => {
    if (onReportUser && otherUser) {
      await onReportUser(otherUser.id, reason, description);
    }
  };

  const handleBlock = () => {
    setBlockAlertOpen(true);
  };

  const handleBlockConfirm = async () => {
    if (onBlockUser && otherUser) {
      const success = isBlocked 
        ? await onUnblockUser?.(otherUser.id)
        : await onBlockUser(otherUser.id);
      
      if (success) {
        setIsBlocked(!isBlocked);
        localStorage.setItem(`block_${otherUser.id}`, String(!isBlocked));
      }
    }
    setBlockAlertOpen(false);
  };

  const handleClearChat = () => {
    setClearAlertOpen(true);
  };

  const handleClearChatConfirm = async () => {
    if (onClearChat && chat) {
      await onClearChat(chat.id);
    }
    setClearAlertOpen(false);
  };

  const handleDeleteChat = () => {
    setDeleteAlertOpen(true);
  };

  const handleDeleteChatConfirm = async () => {
    if (onDeleteChat && chat) {
      const success = await onDeleteChat(chat.id);
      if (success && onBack) {
        onBack();
      }
    }
    setDeleteAlertOpen(false);
  };


  const handleBlock = () => {
    setBlockAlertOpen(true);
  };

  const confirmBlock = () => {
    const newBlocked = !isBlocked;
    setIsBlocked(newBlocked);
    localStorage.setItem(`block_${otherUser?.id}`, String(newBlocked));
    toast({
      title: newBlocked ? 'User blocked' : 'User unblocked',
      description: newBlocked ? 'You will not receive messages from this user' : 'You can now receive messages from this user',
      variant: newBlocked ? 'destructive' : 'default',
    });
    setBlockAlertOpen(false);
  };

  const handleClearChat = () => {
    setClearAlertOpen(true);
  };

  const confirmClearChat = () => {
    toast({
      title: 'Chat cleared',
      description: 'All messages have been cleared',
    });
    setClearAlertOpen(false);
  };

  const handleDeleteChat = () => {
    setDeleteAlertOpen(true);
  };

  const confirmDeleteChat = () => {
    toast({
      title: 'Chat deleted',
      description: 'Chat has been permanently deleted',
      variant: 'destructive',
    });
    setDeleteAlertOpen(false);
    if (onBack) {
      onBack();
    }
  };

  if (!chat || !otherUser) {
    return (
      <div className={cn(
        'hidden lg:flex flex-col items-center justify-center h-full bg-background chat-pattern',
        className
      )}>
        <div className="text-center p-8 animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Connect Converse</h2>
          <p className="text-muted-foreground max-w-sm">
            Select a conversation from the sidebar to start chatting
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
    type: msg.type as 'text' | 'image' | 'video' | 'document',
    status: msg.status as 'sending' | 'sent' | 'delivered' | 'seen',
    createdAt: new Date(msg.created_at),
  }));

  // Group messages by date
  const groupedMessages = messagesForDisplay.reduce((groups: any, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {isSelectMode ? (
        <SelectMessagesMode
          selectedCount={selectedMessages.size}
          onCancel={handleCancelSelect}
          onDelete={handleDeleteSelected}
          onForward={handleForwardSelected}
          onCopy={handleCopySelected}
          onStar={handleStarSelected}
        />
      ) : (
        <ChatHeader
          user={userForHeader}
          isTyping={isOtherUserTyping}
          onBack={onBack}
          showBackButton={showBackButton}
          onVoiceCall={() => {
            if (chat && onVoiceCall) {
              const participant = chat.participants[0];
              onVoiceCall(participant.id, participant.name, participant.avatar_url);
            }
          }}
          onVideoCall={() => {
            if (chat && onVideoCall) {
              const participant = chat.participants[0];
              onVideoCall(participant.id, participant.name, participant.avatar_url);
            }
          }}
          onContactInfo={handleContactInfo}
          onProfileClick={() => setUserProfileOpen(true)}
          onSelectMessages={handleSelectMessages}
          onMuteNotifications={handleMuteNotifications}
          onDisappearingMessages={handleDisappearingMessages}
          onAddToFavourites={handleAddToFavourites}
          onCloseChat={handleCloseChat}
          onSendCallLink={handleSendCallLink}
          onScheduleCall={handleScheduleCall}
          onNewGroupCall={handleNewGroupCall}
          onWallpaper={handleWallpaper}
          onReport={handleReport}
          onBlock={handleBlock}
          onClearChat={handleClearChat}
          onDeleteChat={handleDeleteChat}
        />
      )}

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-thin p-4"
        style={getWallpaperStyle()}
      >
        <div className="max-w-3xl mx-auto space-y-1">
          {messagesForDisplay.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Send a message to start the conversation!</p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, msgs]: [string, any]) => (
              <div key={date} className="space-y-1">
                {/* Date Header */}
                <div className="flex items-center justify-center my-4">
                  <div className="px-3 py-1 bg-muted/50 rounded-full">
                    <span className="text-xs text-muted-foreground font-medium">
                      {formatDateHeader(date)}
                    </span>
                  </div>
                </div>
                
                {/* Messages for this date */}
                {msgs.map((message: any, index: number) => {
                  const prevMessage = index > 0 ? msgs[index - 1] : null;
                  const nextMessage = index < msgs.length - 1 ? msgs[index + 1] : null;
                  
                  const isSameSenderAsPrev = prevMessage?.senderId === message.senderId;
                  const isSameSenderAsNext = nextMessage?.senderId === message.senderId;
                  
                  const timeDiff = prevMessage 
                    ? (new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) / 1000 / 60
                    : 999;
                  
                  const showAvatar = !isSameSenderAsNext || timeDiff > 5;
                  const marginTop = !isSameSenderAsPrev || timeDiff > 5 ? 'mt-4' : 'mt-0.5';
                  
                  const isSelected = selectedMessages.has(message.id);
                  
                  return (
                    <div 
                      key={message.id} 
                      className={marginTop}
                      onClick={() => isSelectMode && handleMessageSelect(message.id)}
                    >
                      <div className={cn(
                        isSelectMode && 'cursor-pointer',
                        isSelected && 'bg-primary/10 rounded-lg p-1'
                      )}>
                        <MessageBubble
                          message={message}
                          isOwn={message.senderId === currentUserId}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          
          {isOtherUserTyping && (
            <div className="flex items-center gap-2 animate-fade-up mt-2">
              <div className="bg-chat-received rounded-2xl rounded-bl-md">
                <TypingIndicator />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {!isSelectMode && (
        <EnhancedMessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          chatId={chat?.id}
        />
      )}

      {/* Dialogs */}
      {otherUser && (
        <>
          <ContactInfoDialog
            open={contactInfoOpen}
            onOpenChange={setContactInfoOpen}
            user={otherUser}
            isOnline={online}
            isMuted={isMuted}
            isFavourite={isFavourite}
            isBlocked={isBlocked}
            onMuteToggle={handleMuteNotifications}
            onFavouriteToggle={handleAddToFavourites}
            onBlock={handleBlock}
            onDeleteChat={handleDeleteChat}
            onVoiceCall={() => {
              if (chat && onVoiceCall) {
                onVoiceCall(otherUser.id, otherUser.name, otherUser.avatar_url);
              }
              setContactInfoOpen(false);
            }}
            onVideoCall={() => {
              if (chat && onVideoCall) {
                onVideoCall(otherUser.id, otherUser.name, otherUser.avatar_url);
              }
              setContactInfoOpen(false);
            }}
          />

          <DisappearingMessagesDialog
            open={disappearingMsgOpen}
            onOpenChange={setDisappearingMsgOpen}
            currentDuration={disappearingDuration}
            onDurationChange={handleDisappearingDurationChange}
          />

          <ScheduleCallDialog
            open={scheduleCallOpen}
            onOpenChange={setScheduleCallOpen}
            onSchedule={handleScheduleCallSubmit}
          />

          <WallpaperDialog
            open={wallpaperOpen}
            onOpenChange={setWallpaperOpen}
            currentWallpaper={wallpaper}
            onWallpaperChange={handleWallpaperChange}
          />

          <UserProfileDialog
            open={userProfileOpen}
            onOpenChange={setUserProfileOpen}
            userId={otherUser.id}
            isOnline={online}
            onVoiceCall={() => {
              if (chat && onVoiceCall) {
                onVoiceCall(otherUser.id, otherUser.name, otherUser.avatar_url);
              }
              setUserProfileOpen(false);
            }}
            onVideoCall={() => {
              if (chat && onVideoCall) {
                onVideoCall(otherUser.id, otherUser.name, otherUser.avatar_url);
              }
              setUserProfileOpen(false);
            }}
            onMessage={() => {
              setUserProfileOpen(false);
            }}
          />

          <ReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            userName={otherUser.name}
            onReport={handleReportSubmit}
          />
        </>
      )}

      {/* Alert Dialogs */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat and all messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChatConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearAlertOpen} onOpenChange={setClearAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all messages from this chat. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearChatConfirm}>
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={blockAlertOpen} onOpenChange={setBlockAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isBlocked ? 'Unblock user?' : 'Block user?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isBlocked 
                ? 'You will be able to receive messages from this user again.'
                : 'You will not receive messages from this user. They will not be notified.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlockConfirm} className={!isBlocked ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
              {isBlocked ? 'Unblock' : 'Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
