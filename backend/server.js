import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { WebcastPushConnection } from 'tiktok-live-connector';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;
let db;

const client = new MongoClient(mongoUrl);

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB');
    
    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('creators').createIndex({ tiktok_username: 1 });
    await db.collection('user_creators').createIndex({ user_id: 1, creator_id: 1 });
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

connectDB();

// Storage for active TikTok connections
const activeConnections = new Map();
const activeRecordings = new Map();

// Ensure video storage directory exists
const videoDir = path.join(__dirname, 'recorded_streams');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

// ============= AUTH MIDDLEWARE =============
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verified.userId;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};


// ============= HEALTH CHECK =============
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'TikTok Live Monitor API is running',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

// ============= AUTH ROUTES =============
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = {
      email,
      username,
      password: hashedPassword,
      created_at: new Date()
    };

    const result = await db.collection('users').insertOne(user);
    
    // Create token
    const token = jwt.sign({ userId: result.insertedId }, process.env.JWT_SECRET);

    res.json({
      token,
      user: {
        id: result.insertedId,
        email,
        username
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============= CREATOR ROUTES =============
app.post('/api/creators', authenticateToken, async (req, res) => {
  try {
    const { tiktok_username } = req.body;
    const userId = req.userId;

    // Check if creator already exists
    let creator = await db.collection('creators').findOne({ tiktok_username });
    
    if (!creator) {
      // Create new creator
      creator = {
        tiktok_username,
        is_live: false,
        current_viewers: 0,
        created_at: new Date()
      };
      const result = await db.collection('creators').insertOne(creator);
      creator._id = result.insertedId;
    }

    // Link creator to user
    const userCreator = {
      user_id: new ObjectId(userId),
      creator_id: creator._id,
      notification_enabled: true,
      created_at: new Date()
    };

    await db.collection('user_creators').insertOne(userCreator);

    // Start monitoring this creator
    startMonitoring(creator._id.toString(), tiktok_username);

    res.json({ success: true, creator });
  } catch (error) {
    console.error('Add creator error:', error);
    res.status(500).json({ error: 'Failed to add creator' });
  }
});

app.get('/api/creators', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's creators
    const userCreators = await db.collection('user_creators')
      .find({ user_id: new ObjectId(userId) })
      .toArray();

    const creatorIds = userCreators.map(uc => uc.creator_id);

    const creators = await db.collection('creators')
      .find({ _id: { $in: creatorIds } })
      .toArray();

    res.json(creators);
  } catch (error) {
    console.error('Get creators error:', error);
    res.status(500).json({ error: 'Failed to get creators' });
  }
});

app.delete('/api/creators/:creatorId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const creatorId = req.params.creatorId;

    // Remove user-creator link
    await db.collection('user_creators').deleteOne({
      user_id: new ObjectId(userId),
      creator_id: new ObjectId(creatorId)
    });

    // Check if any other users are monitoring this creator
    const otherUsers = await db.collection('user_creators')
      .findOne({ creator_id: new ObjectId(creatorId) });

    // If no other users, stop monitoring
    if (!otherUsers) {
      stopMonitoring(creatorId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete creator error:', error);
    res.status(500).json({ error: 'Failed to delete creator' });
  }
});

// ============= LIVE STREAM ROUTES =============
app.get('/api/streams', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's creators
    const userCreators = await db.collection('user_creators')
      .find({ user_id: new ObjectId(userId) })
      .toArray();

    const creatorIds = userCreators.map(uc => uc.creator_id);

    // Get recent streams for user's creators
    const streams = await db.collection('live_streams')
      .find({ creator_id: { $in: creatorIds } })
      .sort({ start_time: -1 })
      .limit(50)
      .toArray();

    res.json(streams);
  } catch (error) {
    console.error('Get streams error:', error);
    res.status(500).json({ error: 'Failed to get streams' });
  }
});

app.get('/api/streams/:streamId', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;

    const stream = await db.collection('live_streams')
      .findOne({ _id: new ObjectId(streamId) });

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    res.json(stream);
  } catch (error) {
    console.error('Get stream error:', error);
    res.status(500).json({ error: 'Failed to get stream' });
  }
});

// ============= GIFTS ROUTES =============
app.get('/api/streams/:streamId/gifts', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;

    const gifts = await db.collection('gifts')
      .find({ stream_id: new ObjectId(streamId) })
      .sort({ timestamp: 1 })
      .toArray();

    res.json(gifts);
  } catch (error) {
    console.error('Get gifts error:', error);
    res.status(500).json({ error: 'Failed to get gifts' });
  }
});

// ============= CHAT ROUTES =============
app.get('/api/streams/:streamId/chats', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;

    const chats = await db.collection('chat_messages')
      .find({ stream_id: new ObjectId(streamId) })
      .sort({ timestamp: 1 })
      .limit(500)
      .toArray();

    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// ============= VIDEO ROUTES =============
app.get('/api/streams/:streamId/video', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;

    const stream = await db.collection('live_streams')
      .findOne({ _id: new ObjectId(streamId) });

    if (!stream || !stream.video_path) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const videoPath = stream.video_path;
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to get video' });
  }
});

// ============= FAN CLUB ROUTES =============
// Get all fans for a creator
app.get('/api/creators/:creatorId/fans', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const { tier, sortBy = 'total_diamonds', limit = 100 } = req.query;

    const query = { creator_id: new ObjectId(creatorId) };
    if (tier) {
      query.tier = tier.toUpperCase();
    }

    const sortOptions = {};
    sortOptions[sortBy] = -1;

    const fans = await db.collection('fans')
      .find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .toArray();

    // Enrich with tier info
    const enrichedFans = fans.map(fan => ({
      ...fan,
      tier_info: FAN_TIERS[fan.tier] || FAN_TIERS.CASUAL
    }));

    res.json(enrichedFans);
  } catch (error) {
    console.error('Get fans error:', error);
    res.status(500).json({ error: 'Failed to get fans' });
  }
});

// Get super fans (top spenders)
app.get('/api/creators/:creatorId/superfans', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const { limit = 20 } = req.query;

    const superFans = await db.collection('fans')
      .find({ 
        creator_id: new ObjectId(creatorId),
        tier: { $in: ['SUPER_FAN', 'ULTRA_FAN', 'MEGA_FAN'] }
      })
      .sort({ total_diamonds: -1 })
      .limit(parseInt(limit))
      .toArray();

    const enrichedFans = superFans.map(fan => ({
      ...fan,
      tier_info: FAN_TIERS[fan.tier] || FAN_TIERS.CASUAL
    }));

    res.json(enrichedFans);
  } catch (error) {
    console.error('Get super fans error:', error);
    res.status(500).json({ error: 'Failed to get super fans' });
  }
});

// Get fan details
app.get('/api/fans/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const { creatorId } = req.query;

    const fan = await db.collection('fans').findOne({
      username,
      creator_id: new ObjectId(creatorId)
    });

    if (!fan) {
      return res.status(404).json({ error: 'Fan not found' });
    }

    // Get fan's recent activities
    const recentGifts = await db.collection('gifts')
      .find({ sender_username: username })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    const recentChats = await db.collection('chat_messages')
      .find({ sender_username: username })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    // Enrich with badge info
    const badges = (fan.badges || []).map(badgeId => 
      BADGE_DEFINITIONS.find(b => b.id === badgeId)
    ).filter(b => b);

    res.json({
      ...fan,
      tier_info: FAN_TIERS[fan.tier] || FAN_TIERS.CASUAL,
      badges,
      recent_gifts: recentGifts,
      recent_chats: recentChats
    });
  } catch (error) {
    console.error('Get fan details error:', error);
    res.status(500).json({ error: 'Failed to get fan details' });
  }
});

// Get fan club stats
app.get('/api/creators/:creatorId/fanclub/stats', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;

    // Get tier distribution
    const tierStats = await db.collection('fans').aggregate([
      { $match: { creator_id: new ObjectId(creatorId) } },
      { $group: { _id: '$tier', count: { $sum: 1 }, total_diamonds: { $sum: '$total_diamonds' } } }
    ]).toArray();

    // Get total stats
    const totalFans = await db.collection('fans').countDocuments({ creator_id: new ObjectId(creatorId) });
    
    const topFans = await db.collection('fans')
      .find({ creator_id: new ObjectId(creatorId) })
      .sort({ total_diamonds: -1 })
      .limit(10)
      .toArray();

    res.json({
      total_fans: totalFans,
      tier_distribution: tierStats,
      top_fans: topFans.map(fan => ({
        ...fan,
        tier_info: FAN_TIERS[fan.tier]
      }))
    });
  } catch (error) {
    console.error('Get fan club stats error:', error);
    res.status(500).json({ error: 'Failed to get fan club stats' });
  }
});

// Get badges info
app.get('/api/badges', authenticateToken, async (req, res) => {
  try {
    res.json(BADGE_DEFINITIONS);
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ error: 'Failed to get badges' });
  }
});

// Get leaderboard
app.get('/api/creators/:creatorId/leaderboard', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const { type = 'diamonds', limit = 50 } = req.query;

    const sortField = type === 'diamonds' ? 'total_diamonds' : 
                     type === 'gifts' ? 'total_gifts' :
                     type === 'chats' ? 'chat_count' : 'total_diamonds';

    const leaderboard = await db.collection('fans')
      .find({ creator_id: new ObjectId(creatorId) })
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .toArray();

    const enrichedLeaderboard = leaderboard.map((fan, index) => ({
      rank: index + 1,
      ...fan,
      tier_info: FAN_TIERS[fan.tier],
      badges: (fan.badges || []).map(badgeId => 
        BADGE_DEFINITIONS.find(b => b.id === badgeId)
      ).filter(b => b)
    }));

    res.json(enrichedLeaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// ============= FAN CLUB & BADGES SYSTEM =============
app.get('/api/streams/:streamId/video', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;

    const stream = await db.collection('live_streams')
      .findOne({ _id: new ObjectId(streamId) });

    if (!stream || !stream.video_path) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const videoPath = stream.video_path;
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to get video' });
  }
});

// ============= ADVANCED TRACKING & ANALYTICS =============

// Track stream metrics in real-time
async function updateStreamMetrics(streamId, metricType, data) {
  if (!db || !streamId) return;

  try {
    const updateData = {};
    
    if (metricType === 'viewer_peak') {
      updateData.peak_viewers = data.count;
      updateData.peak_viewers_time = new Date();
    } else if (metricType === 'engagement') {
      updateData.total_engagement_count = data.count;
    } else if (metricType === 'unique_chatters') {
      updateData.unique_chatters = data.count;
    } else if (metricType === 'unique_gifters') {
      updateData.unique_gifters = data.count;
    }

    await db.collection('live_streams').updateOne(
      { _id: streamId },
      { $set: updateData }
    );
  } catch (error) {
    console.error('Error updating stream metrics:', error);
  }
}

// Track follower growth
async function trackFollowerGrowth(creatorId, streamId, followerUsername) {
  if (!db) return;

  try {
    await db.collection('follower_tracking').insertOne({
      creator_id: creatorId,
      stream_id: streamId,
      follower_username: followerUsername,
      followed_at: new Date()
    });

    // Update creator total followers
    await db.collection('creators').updateOne(
      { _id: creatorId },
      { $inc: { total_followers_gained: 1 } }
    );
  } catch (error) {
    console.error('Error tracking follower:', error);
  }
}

// Track stream milestones
async function checkStreamMilestones(streamId, creatorId, metricType, currentValue) {
  if (!db) return;

  const milestones = {
    viewers: [100, 500, 1000, 5000, 10000, 50000, 100000],
    gifts: [10, 50, 100, 500, 1000, 5000],
    diamonds: [1000, 5000, 10000, 50000, 100000, 500000, 1000000],
    followers: [10, 50, 100, 500, 1000, 5000, 10000]
  };

  const relevantMilestones = milestones[metricType] || [];
  
  for (const milestone of relevantMilestones) {
    if (currentValue >= milestone) {
      // Check if milestone already recorded
      const existing = await db.collection('milestones').findOne({
        stream_id: streamId,
        metric_type: metricType,
        milestone_value: milestone
      });

      if (!existing) {
        const milestoneDoc = {
          stream_id: streamId,
          creator_id: creatorId,
          metric_type: metricType,
          milestone_value: milestone,
          achieved_at: new Date(),
          current_value: currentValue
        };

        await db.collection('milestones').insertOne(milestoneDoc);

        // Emit milestone achievement
        io.emit('milestone_achieved', {
          stream_id: streamId.toString(),
          creator_id: creatorId.toString(),
          metric_type: metricType,
          milestone: milestone,
          current_value: currentValue
        });
      }
    }
  }
}

// Calculate engagement rate
async function calculateEngagementRate(streamId) {
  if (!db) return 0;

  try {
    const stream = await db.collection('live_streams').findOne({ _id: streamId });
    if (!stream) return 0;

    const [giftCount, chatCount] = await Promise.all([
      db.collection('gifts').countDocuments({ stream_id: streamId }),
      db.collection('chat_messages').countDocuments({ stream_id: streamId })
    ]);

    const totalEngagement = giftCount + chatCount;
    const viewers = stream.peak_viewers || stream.total_viewers || 1;
    
    return (totalEngagement / viewers) * 100;
  } catch (error) {
    console.error('Error calculating engagement rate:', error);
    return 0;
  }
}

// Track chat velocity (messages per minute)
async function updateChatVelocity(streamId) {
  if (!db) return;

  try {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    
    const recentChatCount = await db.collection('chat_messages').countDocuments({
      stream_id: streamId,
      timestamp: { $gte: oneMinuteAgo }
    });

    await db.collection('live_streams').updateOne(
      { _id: streamId },
      { $set: { chat_velocity: recentChatCount } }
    );
  } catch (error) {
    console.error('Error updating chat velocity:', error);
  }
}

// Track activity for real-time feed
async function logActivity(activityType, data) {
  if (!db) return;

  try {
    const activity = {
      type: activityType,
      data: data,
      timestamp: new Date()
    };

    await db.collection('activity_feed').insertOne(activity);

    // Emit to real-time feed
    io.emit('new_activity', activity);

    // Keep only last 1000 activities
    const count = await db.collection('activity_feed').countDocuments();
    if (count > 1000) {
      const oldActivities = await db.collection('activity_feed')
        .find()
        .sort({ timestamp: 1 })
        .limit(count - 1000)
        .toArray();
      
      const idsToDelete = oldActivities.map(a => a._id);
      await db.collection('activity_feed').deleteMany({ _id: { $in: idsToDelete } });
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// ============= FAN CLUB & BADGES SYSTEM =============
// Fan tiers based on total diamonds spent
const FAN_TIERS = {
  CASUAL: { min: 0, max: 99, name: 'Casual Fan', color: '#808080' },
  SUPPORTER: { min: 100, max: 499, name: 'Supporter', color: '#4CAF50' },
  DEDICATED: { min: 500, max: 1999, name: 'Dedicated Fan', color: '#2196F3' },
  SUPER_FAN: { min: 2000, max: 9999, name: 'Super Fan', color: '#9C27B0' },
  ULTRA_FAN: { min: 10000, max: 49999, name: 'Ultra Fan', color: '#FF9800' },
  MEGA_FAN: { min: 50000, max: Infinity, name: 'Mega Fan', color: '#F44336' }
};

// Badge definitions
const BADGE_DEFINITIONS = [
  { id: 'first_gift', name: 'First Gift', description: 'Sent their first gift', icon: '🎁', condition: { type: 'gift_count', value: 1 } },
  { id: 'generous', name: 'Generous', description: 'Sent 10 gifts', icon: '💎', condition: { type: 'gift_count', value: 10 } },
  { id: 'big_spender', name: 'Big Spender', description: 'Spent 1000 diamonds', icon: '💰', condition: { type: 'total_diamonds', value: 1000 } },
  { id: 'chatterbox', name: 'Chatterbox', description: 'Sent 50 messages', icon: '💬', condition: { type: 'chat_count', value: 50 } },
  { id: 'loyal', name: 'Loyal Fan', description: 'Attended 10 streams', icon: '⭐', condition: { type: 'stream_count', value: 10 } },
  { id: 'early_bird', name: 'Early Bird', description: 'Joined 5 streams in first minute', icon: '🐦', condition: { type: 'early_joins', value: 5 } },
  { id: 'whale', name: 'Whale', description: 'Spent 10,000 diamonds', icon: '🐋', condition: { type: 'total_diamonds', value: 10000 } }
];

// Track fan engagement across all activities
async function trackFanEngagement(username, nickname, streamId, activityType, value) {
  if (!db) return;

  try {
    const creatorId = (await db.collection('live_streams').findOne({ _id: streamId }))?.creator_id;
    if (!creatorId) return;

    // Update or create fan profile
    const updateData = {
      username,
      nickname,
      last_seen: new Date(),
      last_stream_id: streamId
    };

    // Increment specific counters based on activity
    const incrementData = {};
    if (activityType === 'gift') {
      incrementData.total_gifts = 1;
      incrementData.total_diamonds = value;
    } else if (activityType === 'chat') {
      incrementData.chat_count = value;
    } else if (activityType === 'like') {
      incrementData.like_count = value;
    } else if (activityType === 'join') {
      incrementData.stream_joins = 1;
    }

    await db.collection('fans').updateOne(
      { username, creator_id: creatorId },
      {
        $set: updateData,
        $inc: incrementData,
        $setOnInsert: {
          creator_id: creatorId,
          created_at: new Date(),
          total_gifts: 0,
          total_diamonds: 0,
          chat_count: 0,
          like_count: 0,
          stream_joins: 0,
          tier: 'CASUAL'
        }
      },
      { upsert: true }
    );

    // Update fan tier based on total diamonds
    const fan = await db.collection('fans').findOne({ username, creator_id: creatorId });
    if (fan) {
      const newTier = calculateFanTier(fan.total_diamonds || 0);
      if (newTier !== fan.tier) {
        await db.collection('fans').updateOne(
          { _id: fan._id },
          { $set: { tier: newTier, tier_updated_at: new Date() } }
        );

        // Emit tier upgrade event
        io.emit('fan_tier_upgrade', {
          username,
          nickname,
          old_tier: fan.tier,
          new_tier: newTier,
          total_diamonds: fan.total_diamonds
        });
      }
    }
  } catch (error) {
    console.error('Error tracking fan engagement:', error);
  }
}

function calculateFanTier(totalDiamonds) {
  for (const [tierKey, tierData] of Object.entries(FAN_TIERS)) {
    if (totalDiamonds >= tierData.min && totalDiamonds <= tierData.max) {
      return tierKey;
    }
  }
  return 'CASUAL';
}

// Check and award badges based on fan activity
async function checkAndAwardBadges(username, creatorId) {
  if (!db) return;

  try {
    const fan = await db.collection('fans').findOne({ username, creator_id: creatorId });
    if (!fan) return;

    const currentBadges = fan.badges || [];

    for (const badge of BADGE_DEFINITIONS) {
      // Skip if already has badge
      if (currentBadges.includes(badge.id)) continue;

      let earned = false;
      
      // Check badge conditions
      if (badge.condition.type === 'gift_count' && fan.total_gifts >= badge.condition.value) {
        earned = true;
      } else if (badge.condition.type === 'total_diamonds' && fan.total_diamonds >= badge.condition.value) {
        earned = true;
      } else if (badge.condition.type === 'chat_count' && fan.chat_count >= badge.condition.value) {
        earned = true;
      } else if (badge.condition.type === 'stream_count' && fan.stream_joins >= badge.condition.value) {
        earned = true;
      }

      if (earned) {
        await db.collection('fans').updateOne(
          { _id: fan._id },
          { 
            $addToSet: { badges: badge.id },
            $push: { 
              badge_history: {
                badge_id: badge.id,
                earned_at: new Date()
              }
            }
          }
        );

        // Emit badge earned event
        io.emit('badge_earned', {
          username,
          nickname: fan.nickname,
          badge: badge,
          creator_id: creatorId.toString()
        });
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error);
  }
}

// ============= TIKTOK MONITORING FUNCTIONS =============
async function startMonitoring(creatorId, tiktokUsername) {
  // If already monitoring, skip
  if (activeConnections.has(creatorId)) {
    console.log(`Already monitoring ${tiktokUsername}`);
    return;
  }

  console.log(`Starting monitoring for ${tiktokUsername}`);

  const connection = new WebcastPushConnection(tiktokUsername, {
    enableExtendedGiftInfo: true,
    enableWebsocketUpgrade: true,
    requestPollingIntervalMs: 2000
  });

  let currentStreamId = null;

  // Connected event
  connection.on('connected', async (state) => {
    console.log(`Connected to ${tiktokUsername}'s stream, Room ID: ${state.roomId}`);

    // Create new stream record
    currentStreamId = new ObjectId();
    const stream = {
      _id: currentStreamId,
      creator_id: new ObjectId(creatorId),
      tiktok_username: tiktokUsername,
      room_id: state.roomId,
      start_time: new Date(),
      end_time: null,
      total_viewers: 0,
      peak_viewers: 0,
      total_gifts_value: 0,
      status: 'live'
    };

    await db.collection('live_streams').insertOne(stream);

    // Update creator status
    await db.collection('creators').updateOne(
      { _id: new ObjectId(creatorId) },
      { $set: { is_live: true } }
    );

    // Emit to all connected clients
    io.emit('creator_live', {
      creator_id: creatorId,
      tiktok_username: tiktokUsername,
      stream_id: currentStreamId.toString()
    });

    // Try to get HLS stream URL and start recording
    try {
      const roomInfo = await connection.getRoomInfo();
      if (roomInfo && roomInfo.stream_url) {
        const hlsUrl = roomInfo.stream_url.hls_pull_url || roomInfo.stream_url.rtmp_pull_url;
        if (hlsUrl) {
          startRecording(currentStreamId.toString(), hlsUrl, tiktokUsername);
        }
      }
    } catch (error) {
      console.error('Failed to get stream URL:', error);
    }
  });

  // Disconnected event
  connection.on('disconnected', async () => {
    console.log(`Disconnected from ${tiktokUsername}'s stream`);

    if (currentStreamId) {
      // Update stream end time
      await db.collection('live_streams').updateOne(
        { _id: currentStreamId },
        { $set: { end_time: new Date(), status: 'ended' } }
      );

      // Stop recording
      stopRecording(currentStreamId.toString());

      // Emit to clients
      io.emit('creator_offline', {
        creator_id: creatorId,
        tiktok_username: tiktokUsername,
        stream_id: currentStreamId.toString()
      });

      currentStreamId = null;
    }

    // Update creator status
    await db.collection('creators').updateOne(
      { _id: new ObjectId(creatorId) },
      { $set: { is_live: false, current_viewers: 0 } }
    );
  });

  // Chat message event - Track engagement
  connection.on('chat', async (data) => {
    if (!currentStreamId) return;

    const chatMessage = {
      stream_id: currentStreamId,
      sender_username: data.uniqueId,
      sender_nickname: data.nickname,
      message: data.comment,
      timestamp: new Date()
    };

    await db.collection('chat_messages').insertOne(chatMessage);

    // Track fan engagement
    await trackFanEngagement(data.uniqueId, data.nickname, currentStreamId, 'chat', 1);

    // Emit to clients
    io.emit('new_chat', {
      stream_id: currentStreamId.toString(),
      ...chatMessage
    });
  });

  // Gift event - Enhanced with fan tracking
  connection.on('gift', async (data) => {
    if (!currentStreamId) return;

    const giftValue = (data.diamondCount || 0) * (data.repeatCount || 1);
    
    const gift = {
      stream_id: currentStreamId,
      creator_id: new ObjectId(creatorId),
      sender_username: data.uniqueId,
      sender_nickname: data.nickname,
      gift_id: data.giftId,
      gift_name: data.giftName,
      gift_type: data.giftType,
      diamond_count: data.diamondCount || 0,
      repeat_count: data.repeatCount || 1,
      repeat_end: data.repeatEnd || false,
      total_value: giftValue,
      timestamp: new Date()
    };

    await db.collection('gifts').insertOne(gift);

    // Update stream total gifts value
    await db.collection('live_streams').updateOne(
      { _id: currentStreamId },
      { $inc: { total_gifts_value: giftValue } }
    );

    // Track fan engagement and update fan tier based on gift value
    await trackFanEngagement(data.uniqueId, data.nickname, currentStreamId, 'gift', giftValue);
    
    // Check and award badges
    await checkAndAwardBadges(data.uniqueId, creatorId);

    // Emit to clients
    io.emit('new_gift', {
      stream_id: currentStreamId.toString(),
      ...gift
    });
  });

  // Viewer count update
  connection.on('roomUser', async (data) => {
    if (!currentStreamId) return;

    const viewerCount = data.viewerCount || 0;

    // Update creator and stream
    await db.collection('creators').updateOne(
      { _id: new ObjectId(creatorId) },
      { $set: { current_viewers: viewerCount } }
    );

    await db.collection('live_streams').updateOne(
      { _id: currentStreamId },
      {
        $set: { total_viewers: viewerCount },
        $max: { peak_viewers: viewerCount }
      }
    );

    // Emit to clients
    io.emit('viewer_update', {
      stream_id: currentStreamId.toString(),
      creator_id: creatorId,
      viewer_count: viewerCount
    });
  });

  // Member join event - Track for fan club
  connection.on('member', async (data) => {
    if (!currentStreamId) return;

    // Track fan engagement
    await trackFanEngagement(data.uniqueId, data.nickname, currentStreamId, 'join', 1);

    io.emit('member_join', {
      stream_id: currentStreamId.toString(),
      username: data.uniqueId,
      nickname: data.nickname
    });
  });

  // Like event - Track engagement
  connection.on('like', async (data) => {
    if (!currentStreamId) return;

    // Track fan engagement
    await trackFanEngagement(data.uniqueId, data.nickname, currentStreamId, 'like', data.likeCount || 1);

    io.emit('new_like', {
      stream_id: currentStreamId.toString(),
      username: data.uniqueId,
      like_count: data.likeCount
    });
  });

  // Share event
  connection.on('share', async (data) => {
    if (!currentStreamId) return;

    io.emit('new_share', {
      stream_id: currentStreamId.toString(),
      username: data.uniqueId
    });
  });

  // Follow event
  connection.on('follow', async (data) => {
    if (!currentStreamId) return;

    io.emit('new_follow', {
      stream_id: currentStreamId.toString(),
      username: data.uniqueId,
      nickname: data.nickname
    });
  });

  // Error handling
  connection.on('error', (error) => {
    console.error(`Error for ${tiktokUsername}:`, error);
  });

  // Try to connect
  connection.connect().catch((err) => {
    console.error(`Failed to connect to ${tiktokUsername}:`, err);
    // Will retry on next check
  });

  activeConnections.set(creatorId, connection);
}

function stopMonitoring(creatorId) {
  const connection = activeConnections.get(creatorId);
  if (connection) {
    connection.disconnect();
    activeConnections.delete(creatorId);
    console.log(`Stopped monitoring creator ${creatorId}`);
  }
}

// ============= VIDEO RECORDING FUNCTIONS =============
function startRecording(streamId, hlsUrl, tiktokUsername) {
  if (activeRecordings.has(streamId)) {
    console.log(`Already recording stream ${streamId}`);
    return;
  }

  const filename = `${tiktokUsername}_${Date.now()}.mp4`;
  const outputPath = path.join(videoDir, filename);

  console.log(`Starting recording for ${tiktokUsername} to ${outputPath}`);

  const command = ffmpeg(hlsUrl)
    .outputOptions([
      '-c copy',
      '-bsf:a aac_adtstoasc',
      '-max_muxing_queue_size 1024'
    ])
    .output(outputPath)
    .on('start', (commandLine) => {
      console.log('FFmpeg command: ' + commandLine);
    })
    .on('error', (err) => {
      console.error('Recording error:', err);
      activeRecordings.delete(streamId);
    })
    .on('end', async () => {
      console.log('Recording finished');
      // Update stream with video path
      await db.collection('live_streams').updateOne(
        { _id: new ObjectId(streamId) },
        { $set: { video_path: outputPath } }
      );
      activeRecordings.delete(streamId);
    });

  command.run();
  activeRecordings.set(streamId, command);
}

function stopRecording(streamId) {
  const command = activeRecordings.get(streamId);
  if (command) {
    command.kill('SIGINT');
    activeRecordings.delete(streamId);
    console.log(`Stopped recording stream ${streamId}`);
  }
}

// ============= SOCKET.IO =============
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ============= STARTUP =============
const PORT = process.env.PORT || 8001;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  
  // Stop all monitoring
  for (const [creatorId, connection] of activeConnections.entries()) {
    connection.disconnect();
  }
  
  // Stop all recordings
  for (const [streamId, command] of activeRecordings.entries()) {
    command.kill('SIGINT');
  }
  
  await client.close();
  process.exit(0);
});
