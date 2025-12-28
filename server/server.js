import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ObjectId } from 'mongodb';
import { connectDB, getDB } from './db.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import statusRoutes from './routes/status.js';
import profileRoutes from './routes/profile.js';
import profilePictureRoutes from './routes/profilePicture.js';
import fileAttachmentRoutes from './routes/fileAttachment.js';
import { authenticateSocket } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/profile-picture', profilePictureRoutes);
app.use('/api/file-attachment', fileAttachmentRoutes);

// Socket.IO connection
const onlineUsers = new Map();
const activeCalls = new Map(); // Store active call sessions

io.use(authenticateSocket);

io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`✅ User connected: ${userId}`);
  
  // Add user to online users
  onlineUsers.set(userId, socket.id);
  io.emit('user-online', { userId, onlineUsers: Array.from(onlineUsers.keys()) });
  
  // Join user's chat rooms
  socket.on('join-chats', async (chatIds) => {
    chatIds.forEach(chatId => socket.join(chatId));
  });
  
  // Typing indicator
  socket.on('typing', ({ chatId, isTyping }) => {
    socket.to(chatId).emit('user-typing', { userId, chatId, isTyping });
  });

  // Read receipts
  socket.on('message:read', async ({ messageIds, chatId }) => {
    try {
      const db = getDB();
      
      // Update message status to 'seen'
      await db.collection('messages').updateMany(
        { 
          _id: { $in: messageIds.map(id => new ObjectId(id)) },
          sender_id: { $ne: userId }
        },
        { $set: { status: 'seen' } }
      );

      // Notify sender
      socket.to(chatId).emit('message:seen', { messageIds, readBy: userId });
    } catch (error) {
      console.error('Error updating read status:', error);
    }
  });

  // Message delivered
  socket.on('message:delivered', async ({ messageIds }) => {
    try {
      const db = getDB();
      
      await db.collection('messages').updateMany(
        { _id: { $in: messageIds.map(id => new ObjectId(id)) } },
        { $set: { status: 'delivered' } }
      );
    } catch (error) {
      console.error('Error updating delivered status:', error);
    }
  });

  // WebRTC Signaling for Voice/Video Calls
  socket.on('call:initiate', ({ to, offer, callType }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      const callId = `${userId}-${to}-${Date.now()}`;
      activeCalls.set(callId, { caller: userId, receiver: to, callType });
      
      io.to(targetSocketId).emit('call:incoming', {
        from: userId,
        offer,
        callType,
        callId
      });
    }
  });

  socket.on('call:answer', ({ to, answer, callId }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:answered', {
        from: userId,
        answer,
        callId
      });
    }
  });

  socket.on('call:ice-candidate', ({ to, candidate }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:ice-candidate', {
        from: userId,
        candidate
      });
    }
  });

  socket.on('call:reject', ({ to, callId }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:rejected', { from: userId, callId });
    }
    activeCalls.delete(callId);
  });

  socket.on('call:end', ({ to, callId }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:ended', { from: userId, callId });
    }
    activeCalls.delete(callId);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${userId}`);
    onlineUsers.delete(userId);
    
    // End any active calls
    activeCalls.forEach((call, callId) => {
      if (call.caller === userId || call.receiver === userId) {
        const otherUser = call.caller === userId ? call.receiver : call.caller;
        const targetSocketId = onlineUsers.get(otherUser);
        if (targetSocketId) {
          io.to(targetSocketId).emit('call:ended', { from: userId, callId });
        }
        activeCalls.delete(callId);
      }
    });
    
    io.emit('user-offline', { userId, onlineUsers: Array.from(onlineUsers.keys()) });
  });
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

export { io };
