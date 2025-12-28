import express from 'express';
import { getDB } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Get all users except current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const currentUserId = new ObjectId(req.user.userId);
    
    const users = await db.collection('users')
      .find({ _id: { $ne: currentUserId } })
      .project({ password: 0 })
      .toArray();
    
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user profile
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.params.userId) },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
