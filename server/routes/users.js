import express from 'express';
import { getDB } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Get all users except current user - Search by username only
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const currentUserId = req.user.userId;
    const { search } = req.query;
    
    let query = { _id: { $ne: new ObjectId(currentUserId) } };
    
    // Search by username only (NOT email for security)
    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }
    
    const users = await db.collection('users')
      .find(query)
      .project({ 
        password: 0,
        email: 0  // Hide email from search results
      })
      .limit(50)
      .toArray();
    
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      avatar_url: user.avatar_url
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user profile - Hide email
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.params.userId) },
      { projection: { password: 0, email: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      avatar_url: user.avatar_url,
      bio: user.bio || ''
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
