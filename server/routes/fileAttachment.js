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
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, documents
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload file attachment
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.userId;
    const { chatId, messageId } = req.body;
    const db = getDB();

    // Determine file type and folder
    const fileType = req.body.type || 'documents';
    let folder = 'connect-converse/attachments';
    let resourceType = 'auto';

    if (fileType === 'images') {
      folder = 'connect-converse/chat-images';
      resourceType = 'image';
    } else if (fileType === 'videos') {
      folder = 'connect-converse/chat-videos';
      resourceType = 'video';
    } else {
      folder = 'connect-converse/chat-documents';
      resourceType = 'raw';
    }

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          transformation: fileType === 'images' ? [
            { width: 1920, height: 1920, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ] : undefined,
          // Disable eager transformation to avoid URL suffix
          eager_async: false,
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
    const attachmentData = {
      _id: new ObjectId(),
      message_id: messageId || null,
      chat_id: chatId || null,
      uploaded_by: userId,
      original_filename: req.file.originalname,
      file_type: fileType,
      mime_type: req.file.mimetype,
      size: req.file.size,
      url: result.secure_url,
      cloudinary_public_id: result.public_id,
      cloudinary_format: result.format,
      width: result.width || null,
      height: result.height || null,
      duration: result.duration || null,
      created_at: new Date(),
    };

    await db.collection('file_attachments').insertOne(attachmentData);

    res.json({
      id: attachmentData._id.toString(),
      url: result.secure_url,
      publicId: result.public_id,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      type: fileType,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error('File attachment upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get file attachment by ID
router.get('/:attachmentId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const attachment = await db.collection('file_attachments').findOne({
      _id: new ObjectId(req.params.attachmentId)
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.json({
      id: attachment._id.toString(),
      url: attachment.url,
      filename: attachment.original_filename,
      size: attachment.size,
      type: attachment.file_type,
      uploaded_at: attachment.created_at
    });
  } catch (error) {
    console.error('Get attachment error:', error);
    res.status(500).json({ error: 'Failed to get attachment' });
  }
});

// Get all attachments for a chat
router.get('/chat/:chatId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const attachments = await db.collection('file_attachments')
      .find({ chat_id: req.params.chatId })
      .sort({ created_at: -1 })
      .toArray();

    const formattedAttachments = attachments.map(att => ({
      id: att._id.toString(),
      url: att.url,
      filename: att.original_filename,
      size: att.size,
      type: att.file_type,
      uploaded_at: att.created_at,
      uploaded_by: att.uploaded_by
    }));

    res.json(formattedAttachments);
  } catch (error) {
    console.error('Get chat attachments error:', error);
    res.status(500).json({ error: 'Failed to get attachments' });
  }
});

// Delete file attachment
router.delete('/:attachmentId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = getDB();

    const attachment = await db.collection('file_attachments').findOne({
      _id: new ObjectId(req.params.attachmentId)
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Only uploader can delete
    if (attachment.uploaded_by !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete from Cloudinary
    if (attachment.cloudinary_public_id) {
      const resourceType = attachment.file_type === 'videos' ? 'video' : 
                          attachment.file_type === 'images' ? 'image' : 'raw';
      await cloudinary.uploader.destroy(attachment.cloudinary_public_id, { resource_type: resourceType });
    }

    // Delete from database
    await db.collection('file_attachments').deleteOne({ _id: new ObjectId(req.params.attachmentId) });

    res.json({ success: true, message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Get storage statistics for user
router.get('/stats/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = getDB();

    const stats = await db.collection('file_attachments').aggregate([
      { $match: { uploaded_by: userId } },
      {
        $group: {
          _id: '$file_type',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      }
    ]).toArray();

    const totalStats = {
      totalFiles: 0,
      totalSize: 0,
      byType: {}
    };

    stats.forEach(stat => {
      totalStats.totalFiles += stat.count;
      totalStats.totalSize += stat.totalSize;
      totalStats.byType[stat._id] = {
        count: stat.count,
        size: stat.totalSize
      };
    });

    res.json(totalStats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

export default router;
