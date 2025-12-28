import express from 'express';
import { getDB } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';
import { io } from '../server.js';

const router = express.Router();

// Get all chats for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;
    
    // Get all chat_ids where user is a participant
    const participants = await db.collection('chat_participants')
      .find({ user_id: userId })
      .toArray();
    
    if (participants.length === 0) {
      return res.json([]);
    }
    
    const chatIds = participants.map(p => p.chat_id);
    
    // Get chat details
    const chatsData = await Promise.all(chatIds.map(async (chatId) => {
      // Get all participants
      const chatParticipants = await db.collection('chat_participants')
        .find({ chat_id: chatId })
        .toArray();
      
      const participantIds = chatParticipants
        .filter(p => p.user_id !== userId)
        .map(p => new ObjectId(p.user_id));
      
      const users = await db.collection('users')
        .find({ _id: { $in: participantIds } })
        .project({ password: 0 })
        .toArray();
      
      // Get last message
      const lastMessage = await db.collection('messages')
        .findOne({ chat_id: chatId }, { sort: { created_at: -1 } });
      
      return {
        id: chatId,
        participants: users.map(u => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          avatar_url: u.avatar_url
        })),
        lastMessage: lastMessage ? {
          id: lastMessage._id.toString(),
          chat_id: lastMessage.chat_id,
          sender_id: lastMessage.sender_id,
          content: lastMessage.content,
          type: lastMessage.type,
          status: lastMessage.status,
          created_at: lastMessage.created_at.toISOString()
        } : null,
        unreadCount: 0,
        updated_at: lastMessage ? lastMessage.created_at.toISOString() : new Date().toISOString()
      };
    }));
    
    // Sort by last message time
    chatsData.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    res.json(chatsData);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { chatId } = req.params;
    
    const messages = await db.collection('messages')
      .find({ chat_id: chatId })
      .sort({ created_at: 1 })
      .toArray();
    
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      chat_id: msg.chat_id,
      sender_id: msg.sender_id,
      content: msg.content,
      type: msg.type,
      status: msg.status,
      created_at: msg.created_at.toISOString()
    }));
    
    res.json(formattedMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { chatId } = req.params;
    const { content, type = 'text' } = req.body;
    const userId = req.user.userId;
    
    console.log('📤 Sending message:', { chatId, userId, type, content: content.substring(0, 80) });
    
    const message = {
      chat_id: chatId,
      sender_id: userId,
      content,
      type,
      status: 'sent',
      created_at: new Date()
    };
    
    const result = await db.collection('messages').insertOne(message);
    
    const newMessage = {
      id: result.insertedId.toString(),
      ...message,
      created_at: message.created_at.toISOString()
    };
    
    console.log('📡 Emitting to room:', chatId);
    
    // Emit to all users in the chat room
    io.to(chatId).emit('new-message', newMessage);
    
    console.log('✅ Message sent and emitted');
    
    res.json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Create a new chat
router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { otherUserId } = req.body;
    const userId = req.user.userId;
    
    // Check if chat already exists
    const existingParticipants = await db.collection('chat_participants')
      .find({ user_id: { $in: [userId, otherUserId] } })
      .toArray();
    
    const chatIdCounts = {};
    existingParticipants.forEach(p => {
      chatIdCounts[p.chat_id] = (chatIdCounts[p.chat_id] || 0) + 1;
    });
    
    const existingChatId = Object.keys(chatIdCounts).find(id => chatIdCounts[id] === 2);
    
    if (existingChatId) {
      return res.json({ chatId: existingChatId });
    }
    
    // Create new chat
    const chatId = new ObjectId().toString();
    
    await db.collection('chat_participants').insertMany([
      { chat_id: chatId, user_id: userId, joined_at: new Date() },
      { chat_id: chatId, user_id: otherUserId, joined_at: new Date() }
    ]);
    
    res.json({ chatId });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

export default router;
