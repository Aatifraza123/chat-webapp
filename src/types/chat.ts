export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'emoji';
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  createdAt: Date;
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: Date;
}

export interface TypingStatus {
  chatId: string;
  userId: string;
  isTyping: boolean;
}
