import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ChatParticipant {
  id: string;
  username: string;
  name: string;
  avatar_url: string;
  isOnline?: boolean;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'document' | 'voice';
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  created_at: string;
  duration?: number; // For voice messages
}

export interface ChatData {
  id: string;
  participants: ChatParticipant[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updated_at: string;
}

export function useChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<ChatData[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<ChatParticipant[]>([]);

  // Load all users for starting new chats
  const loadAllUsers = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await api.get('/users');
      setAllUsers(data.map((u: any) => ({
        ...u,
        isOnline: false,
      })));
    } catch (error) {
      console.error('Error loading users:', error);
      setAllUsers([]);
    }
  }, [user]);

  // Load user's chats
  const loadChats = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('📥 Loading chats for user:', user.id);
      const { data } = await api.get('/chats');
      console.log('✅ Chats loaded:', data.length);
      setChats(data);
    } catch (error: any) {
      console.error('❌ Error loading chats:', error);
      // Don't show error toast on initial load if no chats exist
      if (error.response?.status !== 404) {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to load chats',
          variant: 'destructive',
        });
      }
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Load messages for active chat
  const loadMessages = useCallback(async (chatId: string) => {
    if (!user) return;
    
    try {
      console.log('📥 Loading messages for chat:', chatId);
      const { data } = await api.get(`/chats/${chatId}/messages`);
      console.log('✅ Messages loaded:', data.length);
      setMessages(data);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setMessages([]);
    }
  }, [user]);

  // Send a message
  const sendMessage = useCallback(async (content: string, type: 'text' | 'image' | 'video' | 'document' | 'voice' = 'text', duration?: number) => {
    if (!user || !activeChatId) return;
    
    console.log('📤 Sending message:', { type, content: content.substring(0, 80), duration });
    
    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      chat_id: activeChatId,
      sender_id: user.id,
      content,
      type,
      status: 'sending',
      created_at: new Date().toISOString(),
      duration,
    };
    
    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const { data } = await api.post(`/chats/${activeChatId}/messages`, { content, type, duration });
      console.log('✅ Message sent, received:', data);
      
      // Replace temp message with real one
      setMessages(prev => prev.map(m => 
        m.id === tempId ? data : m
      ));
      
      // Update chat list
      setChats(prev => prev.map(chat =>
        chat.id === activeChatId
          ? { ...chat, lastMessage: data, updated_at: data.created_at }
          : chat
      ).sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ));
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Remove failed message
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  }, [user, activeChatId, toast]);

  // Start a new chat with a user
  const startChat = useCallback(async (otherUserId: string) => {
    if (!user) return null;
    
    // Check if chat already exists
    const existingChat = chats.find(chat => 
      chat.participants.some(p => p.id === otherUserId)
    );
    
    if (existingChat) {
      setActiveChatId(existingChat.id);
      return existingChat.id;
    }
    
    try {
      const { data } = await api.post('/chats', { otherUserId });
      
      // Reload chats
      await loadChats();
      setActiveChatId(data.chatId);
      
      return data.chatId;
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to start chat',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, chats, loadChats, toast]);

  // Delete a chat
  const deleteChat = useCallback(async (chatId: string) => {
    if (!user) return false;
    
    try {
      await api.delete(`/chats/${chatId}`);
      
      // Remove from local state
      setChats(prev => prev.filter(c => c.id !== chatId));
      
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
      }
      
      toast({
        title: 'Success',
        description: 'Chat deleted successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chat',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, activeChatId, toast]);

  // Clear chat messages
  const clearChat = useCallback(async (chatId: string) => {
    if (!user) return false;
    
    try {
      await api.delete(`/chats/${chatId}/messages`);
      
      // Clear local messages
      setMessages([]);
      
      // Update chat list
      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, lastMessage: null, updated_at: new Date().toISOString() }
          : chat
      ));
      
      toast({
        title: 'Success',
        description: 'Chat cleared successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear chat',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Block a user
  const blockUser = useCallback(async (userId: string) => {
    if (!user) return false;
    
    try {
      await api.post(`/chats/block/${userId}`);
      
      toast({
        title: 'Success',
        description: 'User blocked successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: 'Error',
        description: 'Failed to block user',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Unblock a user
  const unblockUser = useCallback(async (userId: string) => {
    if (!user) return false;
    
    try {
      await api.delete(`/chats/block/${userId}`);
      
      toast({
        title: 'Success',
        description: 'User unblocked successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        title: 'Error',
        description: 'Failed to unblock user',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Check if user is blocked
  const checkBlockStatus = useCallback(async (userId: string) => {
    if (!user) return false;
    
    try {
      const { data } = await api.get(`/chats/block/${userId}`);
      return data.isBlocked;
    } catch (error) {
      console.error('Error checking block status:', error);
      return false;
    }
  }, [user]);

  // Report a user
  const reportUser = useCallback(async (userId: string, reason: string, description: string) => {
    if (!user) return false;
    
    try {
      await api.post(`/chats/report/${userId}`, { reason, description });
      
      toast({
        title: 'Success',
        description: 'User reported successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Error reporting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to report user',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    loadChats();
    loadAllUsers();
  }, [user, loadChats, loadAllUsers]);

  // Socket setup - separate effect
  useEffect(() => {
    if (!user) return;
    
    const socket = getSocket();
    if (!socket) {
      console.warn('Socket not connected');
      return;
    }
    
    console.log('Setting up socket listeners');
    
    // Listen for new messages
    const handleNewMessage = (newMessage: ChatMessage) => {
      console.log('New message received:', newMessage);
      
      // Update messages if it's for the active chat
      setMessages(prev => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        if (newMessage.chat_id === activeChatId) {
          return [...prev, newMessage];
        }
        return prev;
      });
      
      // Update chat list for ALL messages (including own)
      setChats(prev => {
        const updatedChats = prev.map(chat =>
          chat.id === newMessage.chat_id
            ? { 
                ...chat, 
                lastMessage: newMessage, 
                updated_at: newMessage.created_at,
                // Only increment unread if message is from other user and not in active chat
                unreadCount: newMessage.sender_id !== user.id && chat.id !== activeChatId 
                  ? chat.unreadCount + 1 
                  : chat.unreadCount,
              }
            : chat
        );
        
        // Sort by updated_at
        return updatedChats.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });

      // Mark as delivered if from other user and in active chat
      if (newMessage.sender_id !== user.id && newMessage.chat_id === activeChatId) {
        socket.emit('message:delivered', { messageIds: [newMessage.id] });
      }
    };

    // Listen for message seen updates
    const handleMessageSeen = ({ messageIds }: { messageIds: string[] }) => {
      console.log('Messages seen:', messageIds);
      setMessages(prev => prev.map(msg =>
        messageIds.includes(msg.id) ? { ...msg, status: 'seen' } : msg
      ));
    };
    
    socket.on('new-message', handleNewMessage);
    socket.on('message:seen', handleMessageSeen);
    
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message:seen', handleMessageSeen);
    };
  }, [user, activeChatId]);

  // Join chat rooms when chats change
  useEffect(() => {
    if (!user || chats.length === 0) return;
    
    const socket = getSocket();
    if (!socket) return;
    
    const chatIds = chats.map(c => c.id);
    console.log('Joining chats:', chatIds);
    socket.emit('join-chats', chatIds);
  }, [user, chats.length]);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId);
      
      // Clear unread count
      setChats(prev => prev.map(chat =>
        chat.id === activeChatId ? { ...chat, unreadCount: 0 } : chat
      ));
    }
  }, [activeChatId, loadMessages]);

  return {
    chats,
    messages,
    activeChatId,
    setActiveChatId,
    sendMessage,
    startChat,
    deleteChat,
    clearChat,
    blockUser,
    unblockUser,
    checkBlockStatus,
    reportUser,
    allUsers,
    isLoading,
    loadChats,
  };
}
