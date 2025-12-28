import express from 'express';
import { getDB } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';
import { io } from '../server.js';

const router = express.Router();

// Get all statuses (from contacts only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;
    
    // Get user's contacts (people they've chatted with)
    const participants = await db.collection('chat_participants')
      .find({ user_id: userId })
      .toArray();
    
    const chatIds = participants.map(p => p.chat_id);
    
    // Get all participants from these chats
    const allParticipants = await db.collection('chat_participants')
      .find({ chat_id: { $in: chatIds } })
      .toArray();
    
    const contactIds = [...new Set(allParticipants
      .filter(p => p.user_id !== userId)
      .map(p => new ObjectId(p.user_id)))];
    
    // Get statuses from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const statuses = await db.collection('statuses')
      .find({
        user_id: { $in: contactIds.map(id => id.toString()) },
        created_at: { $gte: twentyFourHoursAgo },
        expires_at: { $gt: new Date() }
      })
      .sort({ created_at: -1 })
      .toArray();
    
    // Get user details
    const userIds = [...new Set(statuses.map(s => new ObjectId(s.user_id)))];
    const users = await db.collection('users')
      .find({ _id: { $in: userIds } })
      .project({ password: 0 })
      .toArray();
    
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        avatar_url: u.avatar_url
      };
    });
    
    // Group statuses by user
    const statusesByUser = {};
    statuses.forEach(status => {
      const uid = status.user_id;
      if (!statusesByUser[uid]) {
        statusesByUser[uid] = {
          user: userMap[uid],
          statuses: []
        };
      }
      statusesByUser[uid].statuses.push({
        id: status._id.toString(),
        content: status.content,
        type: status.type,
        created_at: status.created_at.toISOString(),
        expires_at: status.expires_at.toISOString(),
        views: status.views || []
      });
    });
    
    res.json(Object.values(statusesByUser));
  } catch (error) {
    console.error('Get statuses error:', error);
    res.status(500).json({ error: 'Failed to fetch statuses' });
  }
});

// Get my statuses
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const statuses = await db.collection('statuses')
      .find({
        user_id: userId,
        created_at: { $gte: twentyFourHoursAgo },
        expires_at: { $gt: new Date() }
      })
      .sort({ created_at: -1 })
      .toArray();
    
    res.json(statuses.map(s => ({
      id: s._id.toString(),
      content: s.content,
      type: s.type,
      created_at: s.created_at.toISOString(),
      expires_at: s.expires_at.toISOString(),
      views: s.views || []
    })));
  } catch (error) {
    console.error('Get my statuses error:', error);
    res.status(500).json({ error: 'Failed to fetch statuses' });
  }
});

// Create status
router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { content, type = 'text' } = req.body;
    const userId = req.user.userId;
    
    const status = {
      user_id: userId,
      content,
      type,
      views: [],
      created_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
    
    const result = await db.collection('statuses').insertOne(status);
    
    const newStatus = {
      id: result.insertedId.toString(),
      ...status,
      created_at: status.created_at.toISOString(),
      expires_at: status.expires_at.toISOString()
    };
    
    // Notify contacts
    io.emit('new-status', { userId, status: newStatus });
    
    res.json(newStatus);
  } catch (error) {
    console.error('Create status error:', error);
    res.status(500).json({ error: 'Failed to create status' });
  }
});

// View status
router.post('/:statusId/view', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { statusId } = req.params;
    const userId = req.user.userId;
    
    await db.collection('statuses').updateOne(
      { _id: new ObjectId(statusId) },
      { 
        $addToSet: { 
          views: {
            user_id: userId,
            viewed_at: new Date()
          }
        }
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('View status error:', error);
    res.status(500).json({ error: 'Failed to mark status as viewed' });
  }
});

// Delete status
router.delete('/:statusId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { statusId } = req.params;
    const userId = req.user.userId;
    
    const result = await db.collection('statuses').deleteOne({
      _id: new ObjectId(statusId),
      user_id: userId
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Status not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete status error:', error);
    res.status(500).json({ error: 'Failed to delete status' });
  }
});

export default router;
