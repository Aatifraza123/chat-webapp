import express from 'express';
import { getDB } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Update profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;
    const { name, avatar_url, bio } = req.body;
    
    const updateData = {
      updated_at: new Date()
    };
    
    if (name) updateData.name = name;
    if (avatar_url) updateData.avatar_url = avatar_url;
    if (bio !== undefined) updateData.bio = bio;
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );
    
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );
    
    res.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      bio: user.bio
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get profile
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;
    
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      bio: user.bio || ''
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
