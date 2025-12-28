import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { getDB } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for profile pictures
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures'));
    }
  }
});

// Upload profile picture
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.userId;
    const db = getDB();

    // Check if user already has a profile picture
    const existingPicture = await db.collection('profile_pictures').findOne({ user_id: userId });

    // If exists, delete old image from Cloudinary
    if (existingPicture && existingPicture.cloudinary_public_id) {
      try {
        await cloudinary.uploader.destroy(existingPicture.cloudinary_public_id);
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
      }
    }

    // Upload new image to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'connect-converse/profile-pictures',
          resource_type: 'image',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    // Save to database
    const profilePictureData = {
      user_id: userId,
      url: result.secure_url,
      cloudinary_public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: req.file.size,
      uploaded_at: new Date(),
      updated_at: new Date()
    };

    await db.collection('profile_pictures').updateOne(
      { user_id: userId },
      { $set: profilePictureData },
      { upsert: true }
    );

    // Update user's avatar_url
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { avatar_url: result.secure_url, updated_at: new Date() } }
    );

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// Get profile picture
router.get('/:userId', async (req, res) => {
  try {
    const db = getDB();
    const profilePicture = await db.collection('profile_pictures').findOne({
      user_id: req.params.userId
    });

    if (!profilePicture) {
      return res.status(404).json({ error: 'Profile picture not found' });
    }

    res.json({
      url: profilePicture.url,
      uploaded_at: profilePicture.uploaded_at
    });
  } catch (error) {
    console.error('Get profile picture error:', error);
    res.status(500).json({ error: 'Failed to get profile picture' });
  }
});

// Delete profile picture
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = getDB();

    const profilePicture = await db.collection('profile_pictures').findOne({ user_id: userId });

    if (!profilePicture) {
      return res.status(404).json({ error: 'Profile picture not found' });
    }

    // Delete from Cloudinary
    if (profilePicture.cloudinary_public_id) {
      await cloudinary.uploader.destroy(profilePicture.cloudinary_public_id);
    }

    // Delete from database
    await db.collection('profile_pictures').deleteOne({ user_id: userId });

    // Reset user's avatar_url to default
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { avatar_url: defaultAvatar, updated_at: new Date() } }
    );

    res.json({ success: true, message: 'Profile picture deleted' });
  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({ error: 'Failed to delete profile picture' });
  }
});

export default router;
