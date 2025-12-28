import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  type: 'text' | 'image';
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
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .neq('id', user.id);
    
    if (error) {
      console.error('Error loading users:', error);
      return;
    }
    
    setAllUsers(data.map(u => ({
      ...u,
      name: u.name || u.email?.split('@')[0] || 'User',
      avatar_url: u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
      isOnline: false,
    })));
  }, [user]);

  // Load user's chats
  const loadChats = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Get all chats the user participates in
      const { data: participantData, error: participantError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);
      
      if (participantError) throw participantError;
      
      if (!participantData || participantData.length === 0) {
        setChats([]);
        setIsLoading(false);
        return;
      }
      
      const chatIds = participantData.map(p => p.chat_id);
      
      // Get chat details with participants and last message
      const chatDataPromises = chatIds.map(async (chatId) => {
        // Get all participants
        const { data: participants } = await supabase
          .from('chat_participants')
          .select('user_id, profiles(id, name, email, avatar_url)')
          .eq('chat_id', chatId);
        
        // Get last message
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        const otherParticipants = participants
          ?.filter(p => p.user_id !== user.id)
          .map(p => ({
            id: (p.profiles as any)?.id || p.user_id,
            name: (p.profiles as any)?.name || (p.profiles as any)?.email?.split('@')[0] || 'User',
            email: (p.profiles as any)?.email || '',
            avatar_url: (p.profiles as any)?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`,
            isOnline: false,
          })) || [];
        
        return {
          id: chatId,
          participants: otherParticipants,
          lastMessage: lastMessages?.[0] as ChatMessage | null,
          unreadCount: 0,
          updated_at: lastMessages?.[0]?.created_at || new Date().toISOString(),
        };
      });
      
      const chatData = await Promise.all(chatDataPromises);
      
      // Sort by last message time
      chatData.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      
      setChats(chatData);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chats',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Load messages for active chat
  const loadMessages = useCallback(async (chatId: string) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error loading messages:', error);
      return;
    }
    
    setMessages(data as ChatMessage[]);
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
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: activeChatId,
        sender_id: user.id,
        content,
        type,
        status: 'sent',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error sending message:', error);
      // Remove failed message
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      return;
    }
    
    // Replace temp message with real one
    setMessages(prev => prev.map(m => 
      m.id === tempId ? (data as ChatMessage) : m
    ));
    
    // Update chat list
    setChats(prev => prev.map(chat =>
      chat.id === activeChatId
        ? { ...chat, lastMessage: data as ChatMessage, updated_at: data.created_at }
        : chat
    ).sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ));
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
      // Create new chat
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({})
        .select()
        .single();
      
      if (chatError) throw chatError;
      
      // Add both participants
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: chatData.id, user_id: user.id },
          { chat_id: chatData.id, user_id: otherUserId },
        ]);
      
      if (participantError) throw participantError;
      
      // Reload chats
      await loadChats();
      setActiveChatId(chatData.id);
      
      return chatData.id;
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
    if (!user) return;
    
    loadChats();
    loadAllUsers();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          
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
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChatId, loadChats, loadAllUsers]);

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
