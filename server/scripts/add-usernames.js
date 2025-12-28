import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/connect-converse';

async function addUsernames() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      if (!user.username) {
        // Generate username from email
        const emailPrefix = user.email.split('@')[0];
        const timestamp = Date.now().toString().slice(-4);
        const username = `${emailPrefix}_${timestamp}`;
        
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { username } }
        );
        
        console.log(`✅ Added username "${username}" for user ${user.email}`);
      } else {
        console.log(`⏭️  User ${user.email} already has username: ${user.username}`);
      }
    }
    
    console.log('✅ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

addUsernames();
