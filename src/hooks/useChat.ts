import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ChatParticipant {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  isOnline?: boolean;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'document';
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  created_at: string;
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
      const { data } = await api.get('/chats');
      setChats(data);
    } catch (error: any) {
      console.error('Error loading chats:', error);
      // Don't show error toast on initial load if no chats exist
      if (error.response?.status !== 404) {
        toast({
          title: 'Error',
          description: 'Failed to load chats',
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
      const { data } = await api.get(`/chats/${chatId}/messages`);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [user]);

  // Send a message
  const sendMessage = useCallback(async (content: string, type: 'text' | 'image' = 'text') => {
    if (!user || !activeChatId) return;
    
    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      chat_id: activeChatId,
      sender_id: user.id,
      content,
      type,
      status: 'sending',
      created_at: new Date().toISOString(),
    };
    
    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const { data } = await api.post(`/chats/${activeChatId}/messages`, { content, type });
      
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
      console.error('Error sending message:', error);
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
    if (!socket) return;
    
    // Join all chat rooms when chats change
    if (chats.length > 0) {
      const chatIds = chats.map(c => c.id);
      socket.emit('join-chats', chatIds);
    }
    
    // Listen for new messages
    const handleNewMessage = (newMessage: ChatMessage) => {
      // Add message if it's for the active chat and not from current user
      if (newMessage.sender_id !== user.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMessage.id)) return prev;
          if (newMessage.chat_id === activeChatId) {
            return [...prev, newMessage];
          }
          return prev;
        });
        
        // Update chat list
        setChats(prev => prev.map(chat =>
          chat.id === newMessage.chat_id
            ? { 
                ...chat, 
                lastMessage: newMessage, 
                updated_at: newMessage.created_at,
                unreadCount: chat.id !== activeChatId ? chat.unreadCount + 1 : 0,
              }
            : chat
        ).sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ));

        // Mark as delivered
        if (newMessage.chat_id === activeChatId) {
          socket.emit('message:delivered', { messageIds: [newMessage.id] });
        }
      }
    };

    // Listen for message seen updates
    const handleMessageSeen = ({ messageIds }: { messageIds: string[] }) => {
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
  }, [user, activeChatId, chats.length]);

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
    allUsers,
    isLoading,
    loadChats,
  };
}
