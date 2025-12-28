import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/connect-converse';
const client = new MongoClient(uri);

let db;

export async function connectDB() {
  try {
    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB');
    
    // Create indexes for existing collections
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('messages').createIndex({ chat_id: 1, created_at: -1 });
    await db.collection('chat_participants').createIndex({ user_id: 1 });
    await db.collection('chat_participants').createIndex({ chat_id: 1 });
    
    // Create indexes for new collections
    await db.collection('profile_pictures').createIndex({ user_id: 1 }, { unique: true });
    await db.collection('file_attachments').createIndex({ message_id: 1 });
    await db.collection('file_attachments').createIndex({ uploaded_by: 1 });
    await db.collection('file_attachments').createIndex({ created_at: -1 });
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

export { client };
