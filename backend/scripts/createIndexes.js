import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

/**
 * Sprint 2: Database Indexing Script
 * Creates optimized indexes for all collections to improve query performance
 */

// Helper function to create index with error handling
async function safeCreateIndex(collection, keys, options = {}) {
  try {
    await collection.createIndex(keys, options);
    return true;
  } catch (error) {
    if (error.code === 86) {
      // Index already exists with different specs - drop and recreate
      try {
        const indexName = options.name || Object.keys(keys).map(k => `${k}_${keys[k]}`).join('_');
        await collection.dropIndex(indexName);
        await collection.createIndex(keys, options);
        return true;
      } catch (dropError) {
        console.log(`    ⚠️  Index exists (skipping): ${JSON.stringify(keys)}`);
        return false;
      }
    } else if (error.code === 85) {
      // Index already exists - skip
      return false;
    } else {
      throw error;
    }
  }
}

async function createIndexes() {
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // ============================================
    // USER & AUTH COLLECTIONS
    // ============================================
    
    console.log('\n📊 Creating indexes for User & Auth collections...');
    
    // Users collection
    await safeCreateIndex(db.collection('users'), { email: 1 }, { unique: true });
    await safeCreateIndex(db.collection('users'), { createdAt: -1 });
    await safeCreateIndex(db.collection('users'), { role: 1 });
    console.log('  ✅ users indexes created');
    
    // Sessions collection
    await safeCreateIndex(db.collection('sessions'), { userId: 1 });
    await safeCreateIndex(db.collection('sessions'), { token: 1 });
    await safeCreateIndex(db.collection('sessions'), { expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('  ✅ sessions indexes created');
    
    // ============================================
    // TIKTOK & CREATOR COLLECTIONS
    // ============================================
    
    console.log('\n📊 Creating indexes for TikTok & Creator collections...');
    
    // Creators collection
    await safeCreateIndex(db.collection('creators'), { tiktok_username: 1 }, { unique: true });
    await safeCreateIndex(db.collection('creators'), { status: 1 });
    await safeCreateIndex(db.collection('creators'), { lastLiveAt: -1 });
    await safeCreateIndex(db.collection('creators'), { createdAt: -1 });
    console.log('  ✅ creators indexes created');
    
    // User-Creator relationship
    await safeCreateIndex(db.collection('user_creators'), { user_id: 1, creator_id: 1 }, { unique: true });
    await safeCreateIndex(db.collection('user_creators'), { user_id: 1 });
    await safeCreateIndex(db.collection('user_creators'), { creator_id: 1 });
    console.log('  ✅ user_creators indexes created');
    
    // Live events
    await safeCreateIndex(db.collection('live_events'), { creator_id: 1, timestamp: -1 });
    await safeCreateIndex(db.collection('live_events'), { type: 1 });
    await safeCreateIndex(db.collection('live_events'), { timestamp: -1 });
    await safeCreateIndex(db.collection('live_events'), { creator_id: 1, type: 1 });
    console.log('  ✅ live_events indexes created');
    
    // Gifts
    await safeCreateIndex(db.collection('gifts'), { creator_id: 1, timestamp: -1 });
    await safeCreateIndex(db.collection('gifts'), { userId: 1 });
    await safeCreateIndex(db.collection('gifts'), { giftId: 1 });
    await safeCreateIndex(db.collection('gifts'), { diamonds: -1 });
    console.log('  ✅ gifts indexes created');
    
    // Comments
    await safeCreateIndex(db.collection('comments'), { creator_id: 1, timestamp: -1 });
    await safeCreateIndex(db.collection('comments'), { userId: 1 });
    console.log('  ✅ comments indexes created');
    
    // ============================================
    // FAN CLUB COLLECTIONS
    // ============================================
    
    console.log('\n📊 Creating indexes for Fan Club collections...');
    
    // Fans
    await safeCreateIndex(db.collection('fans'), { creator_id: 1, userId: 1 }, { unique: true });
    await safeCreateIndex(db.collection('fans'), { creator_id: 1, points: -1 });
    await safeCreateIndex(db.collection('fans'), { tier: 1 });
    await safeCreateIndex(db.collection('fans'), { totalGifts: -1 });
    await safeCreateIndex(db.collection('fans'), { totalDiamonds: -1 });
    console.log('  ✅ fans indexes created');
    
    // Fan achievements
    await safeCreateIndex(db.collection('fan_achievements'), { creator_id: 1, userId: 1 });
    await safeCreateIndex(db.collection('fan_achievements'), { achievement: 1 });
    console.log('  ✅ fan_achievements indexes created');
    
    // ============================================
    // ANALYTICS COLLECTIONS
    // ============================================
    
    console.log('\n📊 Creating indexes for Analytics collections...');
    
    // Analytics events
    await safeCreateIndex(db.collection('analytics_events'), { creator_id: 1, timestamp: -1 });
    await safeCreateIndex(db.collection('analytics_events'), { event_type: 1 });
    await safeCreateIndex(db.collection('analytics_events'), { timestamp: -1 });
    console.log('  ✅ analytics_events indexes created');
    
    // Revenue tracking
    await safeCreateIndex(db.collection('revenue'), { creator_id: 1, date: -1 });
    await safeCreateIndex(db.collection('revenue'), { date: -1 });
    console.log('  ✅ revenue indexes created');
    
    // ============================================
    // AI SERVICE COLLECTIONS
    // ============================================
    
    console.log('\n📊 Creating indexes for AI Service collections...');
    
    // AI requests
    await safeCreateIndex(db.collection('ai_requests'), { userId: 1, createdAt: -1 });
    await safeCreateIndex(db.collection('ai_requests'), { model: 1 });
    await safeCreateIndex(db.collection('ai_requests'), { type: 1 });
    await safeCreateIndex(db.collection('ai_requests'), { createdAt: -1 });
    console.log('  ✅ ai_requests indexes created');
    
    // Voice transcriptions
    await safeCreateIndex(db.collection('voice_transcriptions'), { userId: 1, createdAt: -1 });
    await safeCreateIndex(db.collection('voice_transcriptions'), { language: 1 });
    console.log('  ✅ voice_transcriptions indexes created');
    
    // Voice TTS
    await safeCreateIndex(db.collection('voice_tts'), { userId: 1, createdAt: -1 });
    await safeCreateIndex(db.collection('voice_tts'), { voice: 1 });
    console.log('  ✅ voice_tts indexes created');
    
    // Code generations
    await safeCreateIndex(db.collection('code_generations'), { userId: 1, createdAt: -1 });
    await safeCreateIndex(db.collection('code_generations'), { language: 1 });
    await safeCreateIndex(db.collection('code_generations'), { task: 1 });
    console.log('  ✅ code_generations indexes created');
    
    // Image generations
    await safeCreateIndex(db.collection('image_generations'), { userId: 1, createdAt: -1 });
    await safeCreateIndex(db.collection('image_generations'), { model: 1 });
    console.log('  ✅ image_generations indexes created');
    
    // Video generations
    await safeCreateIndex(db.collection('video_generations'), { userId: 1, createdAt: -1 });
    await safeCreateIndex(db.collection('video_generations'), { model: 1 });
    console.log('  ✅ video_generations indexes created');
    
    // ============================================
    // COLLABORATION COLLECTIONS
    // ============================================
    
    console.log('\n📊 Creating indexes for Collaboration collections...');
    
    // Workspaces
    await safeCreateIndex(db.collection('workspaces'), { owner_id: 1 });
    await safeCreateIndex(db.collection('workspaces'), { members: 1 });
    await safeCreateIndex(db.collection('workspaces'), { createdAt: -1 });
    console.log('  ✅ workspaces indexes created');
    
    // Tasks
    await safeCreateIndex(db.collection('tasks'), { workspace_id: 1, status: 1 });
    await safeCreateIndex(db.collection('tasks'), { assignee: 1 });
    await safeCreateIndex(db.collection('tasks'), { priority: 1 });
    await safeCreateIndex(db.collection('tasks'), { dueDate: 1 });
    console.log('  ✅ tasks indexes created');
    
    // ============================================
    // ENTERPRISE COLLECTIONS
    // ============================================
    
    console.log('\n📊 Creating indexes for Enterprise collections...');
    
    // Organizations
    await safeCreateIndex(db.collection('organizations'), { name: 1 });
    await safeCreateIndex(db.collection('organizations'), { owner_id: 1 });
    console.log('  ✅ organizations indexes created');
    
    // Teams
    await safeCreateIndex(db.collection('teams'), { organization_id: 1 });
    await safeCreateIndex(db.collection('teams'), { members: 1 });
    console.log('  ✅ teams indexes created');
    
    // Audit logs
    await safeCreateIndex(db.collection('audit_logs'), { userId: 1, timestamp: -1 });
    await safeCreateIndex(db.collection('audit_logs'), { action: 1 });
    await safeCreateIndex(db.collection('audit_logs'), { timestamp: -1 });
    await safeCreateIndex(db.collection('audit_logs'), { organization_id: 1, timestamp: -1 });
    console.log('  ✅ audit_logs indexes created');
    
    // ============================================
    // WEB3 COLLECTIONS
    // ============================================
    
    console.log('\n📊 Creating indexes for Web3 collections...');
    
    // NFTs
    await safeCreateIndex(db.collection('nfts'), { owner: 1 });
    await safeCreateIndex(db.collection('nfts'), { creator: 1 });
    await safeCreateIndex(db.collection('nfts'), { tokenId: 1 }, { unique: true, sparse: true });
    console.log('  ✅ nfts indexes created');
    
    // Transactions
    await safeCreateIndex(db.collection('transactions'), { from: 1 });
    await safeCreateIndex(db.collection('transactions'), { to: 1 });
    await safeCreateIndex(db.collection('transactions'), { txHash: 1 }, { unique: true, sparse: true });
    await safeCreateIndex(db.collection('transactions'), { timestamp: -1 });
    console.log('  ✅ transactions indexes created');
    
    // ============================================
    // NOTIFICATION COLLECTIONS (NEW - Sprint 2)
    // ============================================
    
    console.log('\n📊 Creating indexes for Notification collections...');
    
    // Push notification tokens
    await safeCreateIndex(db.collection('push_tokens'), { userId: 1 });
    await safeCreateIndex(db.collection('push_tokens'), { token: 1 }, { unique: true, sparse: true });
    await safeCreateIndex(db.collection('push_tokens'), { platform: 1 });
    console.log('  ✅ push_tokens indexes created');
    
    // Notifications
    await safeCreateIndex(db.collection('notifications'), { userId: 1, createdAt: -1 });
    await safeCreateIndex(db.collection('notifications'), { read: 1 });
    await safeCreateIndex(db.collection('notifications'), { type: 1 });
    console.log('  ✅ notifications indexes created');
    
    // ============================================
    // FILE UPLOAD COLLECTIONS (NEW - Sprint 2)
    // ============================================
    
    console.log('\n📊 Creating indexes for File Upload collections...');
    
    // Uploaded files
    await safeCreateIndex(db.collection('uploads'), { userId: 1, createdAt: -1 });
    await safeCreateIndex(db.collection('uploads'), { fileType: 1 });
    await safeCreateIndex(db.collection('uploads'), { filename: 1 });
    await safeCreateIndex(db.collection('uploads'), { createdAt: -1 });
    console.log('  ✅ uploads indexes created');
    
    // ============================================
    // TEXT SEARCH INDEXES
    // ============================================
    
    console.log('\n📊 Creating text search indexes...');
    
    // Full-text search on creators
    await safeCreateIndex(db.collection('creators'), { 
      tiktok_username: 'text', 
      display_name: 'text',
      bio: 'text'
    }, { 
      name: 'creator_text_search',
      weights: { tiktok_username: 10, display_name: 5, bio: 1 }
    });
    console.log('  ✅ creators text search index created');
    
    // Full-text search on comments
    await safeCreateIndex(db.collection('comments'), { 
      comment: 'text' 
    }, { 
      name: 'comment_text_search'
    });
    console.log('  ✅ comments text search index created');
    
    // Full-text search on AI requests
    await safeCreateIndex(db.collection('ai_requests'), { 
      prompt: 'text',
      response: 'text'
    }, { 
      name: 'ai_request_text_search'
    });
    console.log('  ✅ AI requests text search index created');
    
    console.log('\n✅ All database indexes created successfully!');
    console.log('\n📊 Index Statistics:');
    
    // Get index statistics for some key collections
    const collections = ['users', 'creators', 'live_events', 'gifts', 'fans', 'ai_requests'];
    for (const collName of collections) {
      const indexes = await db.collection(collName).indexes();
      console.log(`  ${collName}: ${indexes.length} indexes`);
    }
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the script
createIndexes();
