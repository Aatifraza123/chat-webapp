import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const db = getDB();
    
    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      username: email.split('@')[0] + '_' + Date.now().toString().slice(-4), // Generate unique username
      name: name || email.split('@')[0],
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const userId = result.insertedId.toString();
    
    // Generate token
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: userId,
        email,
        username: name || email.split('@')[0],
        name: name || email.split('@')[0],
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Signin attempt:', { email, hasPassword: !!password });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const db = getDB();
    
    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = jwt.sign({ userId: user._id.toString(), email }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('Signin successful:', email);
    
    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        name: user.name,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to sign in. Please try again.' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDB();
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      name: user.name,
      avatar_url: user.avatar_url
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Delete account
router.delete('/account', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDB();
    const userId = decoded.userId;
    
    // Delete user's messages
    await db.collection('messages').deleteMany({ sender_id: userId });
    
    // Delete user's chat participations
    const userChats = await db.collection('chat_participants')
      .find({ user_id: userId })
      .toArray();
    
    await db.collection('chat_participants').deleteMany({ user_id: userId });
    
    // Clean up empty chats
    for (const chat of userChats) {
      const remainingParticipants = await db.collection('chat_participants')
        .countDocuments({ chat_id: chat.chat_id });
      
      if (remainingParticipants === 0) {
        await db.collection('messages').deleteMany({ chat_id: chat.chat_id });
      }
    }
    
    // Delete user's friend requests
    await db.collection('friend_requests').deleteMany({
      $or: [{ from_user_id: userId }, { to_user_id: userId }]
    });
    
    // Delete user's blocks
    await db.collection('blocked_users').deleteMany({
      $or: [{ user_id: userId }, { blocked_user_id: userId }]
    });
    
    // Delete user's reports
    await db.collection('reports').deleteMany({
      $or: [{ reporter_id: userId }, { reported_user_id: userId }]
    });
    
    // Delete user's status
    await db.collection('status').deleteMany({ user_id: userId });
    
    // Finally, delete the user
    await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
