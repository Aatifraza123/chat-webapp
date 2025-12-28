import express from 'express';
import { getDB } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Send friend request
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const fromUserId = req.user.userId;
    const { toUsername } = req.body;

    if (!toUsername) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find target user by username
    const toUser = await db.collection('users').findOne({ username: toUsername });
    if (!toUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const toUserId = toUser._id.toString();

    // Prevent self-request
    if (fromUserId === toUserId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if already friends
    const existingFriend = await db.collection('friends').findOne({
      $or: [
        { user1: fromUserId, user2: toUserId },
        { user1: toUserId, user2: fromUserId }
      ]
    });

    if (existingFriend) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check if request already exists
    const existingRequest = await db.collection('friend_requests').findOne({
      $or: [
        { from: fromUserId, to: toUserId, status: 'pending' },
        { from: toUserId, to: fromUserId, status: 'pending' }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Create friend request
    const result = await db.collection('friend_requests').insertOne({
      from: fromUserId,
      to: toUserId,
      status: 'pending',
      created_at: new Date()
    });

    res.json({
      success: true,
      requestId: result.insertedId.toString(),
      message: 'Friend request sent'
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Get pending friend requests (received)
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;

    const requests = await db.collection('friend_requests')
      .find({ to: userId, status: 'pending' })
      .sort({ created_at: -1 })
      .toArray();

    // Get sender details
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const fromUser = await db.collection('users').findOne(
          { _id: new ObjectId(request.from) },
          { projection: { password: 0, email: 0 } }
        );
        return {
          id: request._id.toString(),
          from: {
            id: fromUser._id.toString(),
            username: fromUser.username,
            name: fromUser.name,
            avatar_url: fromUser.avatar_url
          },
          created_at: request.created_at
        };
      })
    );

    res.json(requestsWithUsers);
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to get friend requests' });
  }
});

// Get sent friend requests
router.get('/sent', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;

    const requests = await db.collection('friend_requests')
      .find({ from: userId, status: 'pending' })
      .sort({ created_at: -1 })
      .toArray();

    // Get receiver details
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const toUser = await db.collection('users').findOne(
          { _id: new ObjectId(request.to) },
          { projection: { password: 0, email: 0 } }
        );
        return {
          id: request._id.toString(),
          to: {
            id: toUser._id.toString(),
            username: toUser.username,
            name: toUser.name,
            avatar_url: toUser.avatar_url
          },
          created_at: request.created_at
        };
      })
    );

    res.json(requestsWithUsers);
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ error: 'Failed to get sent requests' });
  }
});

// Accept friend request
router.post('/accept/:requestId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;
    const { requestId } = req.params;

    // Find request
    const request = await db.collection('friend_requests').findOne({
      _id: new ObjectId(requestId),
      to: userId,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Update request status
    await db.collection('friend_requests').updateOne(
      { _id: new ObjectId(requestId) },
      { $set: { status: 'accepted', updated_at: new Date() } }
    );

    // Add to friends collection
    await db.collection('friends').insertOne({
      user1: request.from,
      user2: request.to,
      created_at: new Date()
    });

    // Create chat room
    const chatResult = await db.collection('chats').insertOne({
      participants: [request.from, request.to],
      created_at: new Date(),
      updated_at: new Date()
    });

    res.json({
      success: true,
      chatId: chatResult.insertedId.toString(),
      message: 'Friend request accepted'
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Reject friend request
router.post('/reject/:requestId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;
    const { requestId } = req.params;

    // Find request
    const request = await db.collection('friend_requests').findOne({
      _id: new ObjectId(requestId),
      to: userId,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Update request status
    await db.collection('friend_requests').updateOne(
      { _id: new ObjectId(requestId) },
      { $set: { status: 'rejected', updated_at: new Date() } }
    );

    res.json({
      success: true,
      message: 'Friend request rejected'
    });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
});

// Cancel sent friend request
router.delete('/cancel/:requestId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;
    const { requestId } = req.params;

    const result = await db.collection('friend_requests').deleteOne({
      _id: new ObjectId(requestId),
      from: userId,
      status: 'pending'
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    res.json({
      success: true,
      message: 'Friend request cancelled'
    });
  } catch (error) {
    console.error('Cancel friend request error:', error);
    res.status(500).json({ error: 'Failed to cancel friend request' });
  }
});

// Check friend request status with a user
router.get('/status/:username', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.userId;
    const { username } = req.params;

    // Find target user
    const targetUser = await db.collection('users').findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUserId = targetUser._id.toString();

    // Check if friends
    const friendship = await db.collection('friends').findOne({
      $or: [
        { user1: userId, user2: targetUserId },
        { user1: targetUserId, user2: userId }
      ]
    });

    if (friendship) {
      return res.json({ status: 'friends' });
    }

    // Check pending request
    const request = await db.collection('friend_requests').findOne({
      $or: [
        { from: userId, to: targetUserId, status: 'pending' },
        { from: targetUserId, to: userId, status: 'pending' }
      ]
    });

    if (request) {
      if (request.from === userId) {
        return res.json({ status: 'sent', requestId: request._id.toString() });
      } else {
        return res.json({ status: 'received', requestId: request._id.toString() });
      }
    }

    res.json({ status: 'none' });
  } catch (error) {
    console.error('Check friend status error:', error);
    res.status(500).json({ error: 'Failed to check friend status' });
  }
});

export default router;
