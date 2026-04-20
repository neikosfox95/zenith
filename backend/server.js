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
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import archiver from 'archiver';
import { createObjectCsvWriter } from 'csv-writer';
import { apiLimiter, authLimiter, aiLimiter, speedLimiter, uploadLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { setupPhase3Routes } from './phase3_routes.js';
import { setupPhase4Routes } from './phase4_routes.js';
import { setupPhase5Routes } from './phase5_routes.js';
import { setupPhase6Routes } from './phase6_routes.js';
import { setupPhase7Routes } from './phase7_routes.js';
import { setupPhase8Routes } from './phase8_routes.js';
import { setupPhase9Routes } from './phase9_routes.js';
import { setupPhase10Routes } from './phase10_routes.js';
import { setupPhase11Routes } from './phase11_routes.js';
import { setupPhase12Routes } from './phase12_routes.js';
import { setupPhase13Routes } from './phase13_routes.js';
import { setupPhase14Routes } from './phase14_routes.js';
import { setupPhase15Routes } from './phase15_routes.js';
import { setupPhase16Routes } from './phase16_routes.js';
import { setupPhase17Routes } from './phase17_routes.js';
import { setupPhase18Routes } from './phase18_routes.js';
import { setupPhase19Routes } from './phase19_routes.js';
import { setupPhase20Routes } from './phase20_routes.js';
import phase21Routes from './phase21_routes.js';
import phase22Routes from './phase22_routes.js';
import phase23Routes from './phase23_routes.js';
import phase24Routes from './phase24_routes.js';
import phase25Routes from './phase25_routes.js';
import phase26Routes from './phase26_routes.js';
import phase27Routes from './phase27_routes.js';
import phase28Routes from './phase28_routes.js';
import phase29Routes from './phase29_routes.js';
import phase30Routes from './phase30_routes.js';

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

// NOTE: Removed global speedLimiter to prevent middleware conflicts
// Each route group now has its own specific rate limiter for 100% effectiveness

// Apply specific rate limiters to route groups (order matters!)
// Most specific routes first, broader routes last

// 1. Authentication routes - ULTRA STRICT (10 req/15min)
//    Applied at route level below

// 2. AI routes - STRICT (50 req/hour)
//    Applied via phase routes

// 3. General API routes - MODERATE (300 req/15min)
app.use('/api/', apiLimiter);

// Health check endpoints - NO RATE LIMITING
// (Already excluded in individual limiters via skip function)

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
    
    // Setup Phase routes after DB connection
    setupPhase3Routes(app, db, io, authenticateToken, sendEmailNotification, sendPushNotification, triggerWebhook, checkAlertRules, exportToCSV, generateReport, backupData, logAuditEvent, hasPermission, ObjectId);
    setupPhase4Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase5Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase6Routes(app, db, io, authenticateToken, aiLimiter, ObjectId);
    setupPhase7Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase8Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase9Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase10Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase11Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase12Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase13Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase14Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase15Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase16Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase17Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase18Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase19Routes(app, db, io, authenticateToken, ObjectId);
    setupPhase20Routes(app, db, io, authenticateToken, ObjectId);
    
    // Mount Phases 21-30 routes
    console.log('Setting up Phase 21 (Gaming & Gamification) routes...');
    app.use('/api/gaming', phase21Routes);
    console.log('✅ Phase 21 (Gaming & Gamification) routes loaded');
    
    console.log('Setting up Phase 22 (E-commerce & Shopping) routes...');
    app.use('/api/ecommerce', phase22Routes);
    console.log('✅ Phase 22 (E-commerce & Shopping) routes loaded');
    
    console.log('Setting up Phase 23 (Health & Wellness AI) routes...');
    app.use('/api/health', phase23Routes);
    console.log('✅ Phase 23 (Health & Wellness AI) routes loaded');
    
    console.log('Setting up Phase 24 (Education & Learning) routes...');
    app.use('/api/education', phase24Routes);
    console.log('✅ Phase 24 (Education & Learning) routes loaded');
    
    console.log('Setting up Phase 25 (Finance & Investment) routes...');
    app.use('/api/finance', phase25Routes);
    console.log('✅ Phase 25 (Finance & Investment) routes loaded');
    
    console.log('Setting up Phase 26 (Travel & Location) routes...');
    app.use('/api/travel', phase26Routes);
    console.log('✅ Phase 26 (Travel & Location) routes loaded');
    
    console.log('Setting up Phase 27 (Smart Home & IoT) routes...');
    app.use('/api/smarthome', phase27Routes);
    console.log('✅ Phase 27 (Smart Home & IoT) routes loaded');
    
    console.log('Setting up Phase 28 (Legal & Compliance AI) routes...');
    app.use('/api/legal', phase28Routes);
    console.log('✅ Phase 28 (Legal & Compliance AI) routes loaded');
    
    console.log('Setting up Phase 29 (Sports & Fitness Analytics) routes...');
    app.use('/api/sports', phase29Routes);
    console.log('✅ Phase 29 (Sports & Fitness Analytics) routes loaded');
    
    console.log('Setting up Phase 30 (Environmental & Sustainability) routes...');
    app.use('/api/environment', phase30Routes);
    console.log('✅ Phase 30 (Environmental & Sustainability) routes loaded');
    
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
    req.user = { userId: verified.userId }; // For compatibility with phase routes
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
app.post('/api/auth/register', authLimiter, async (req, res) => {
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

app.post('/api/auth/login', authLimiter, async (req, res) => {
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

// Alias routes for frontend compatibility
app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
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

app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = {
      email,
      username,
      password: hashedPassword,
      createdAt: new Date()
    };
    const result = await db.collection('users').insertOne(user);
    const token = jwt.sign({ userId: result.insertedId }, process.env.JWT_SECRET);
    res.status(201).json({
      token,
      user: {
        id: result.insertedId,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
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
    
    // Import pagination utilities
    const { parsePaginationParams, parseSortParams, formatPaginatedResponse } = await import('./utils/pagination.js');
    
    // Parse pagination and sort parameters
    const { page, limit, skip } = parsePaginationParams(req.query);
    const sort = parseSortParams(req.query, '-created_at');

    // Get user's creators
    const userCreators = await db.collection('user_creators')
      .find({ user_id: new ObjectId(userId) })
      .toArray();

    const creatorIds = userCreators.map(uc => uc.creator_id);
    
    // Build filter for search
    const filter = { _id: { $in: creatorIds } };
    
    // Add text search if query provided
    if (req.query.search) {
      filter.$or = [
        { tiktok_username: { $regex: req.query.search, $options: 'i' } },
        { display_name: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Get paginated creators with total count
    const [creators, total] = await Promise.all([
      db.collection('creators')
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('creators').countDocuments(filter)
    ]);

    // Format and return paginated response
    res.json(formatPaginatedResponse(creators, total, page, limit));
  } catch (error) {
    console.error('Get creators error:', error);
    res.status(500).json({ error: 'Failed to get creators' });
  }
});

// ============= ADVANCED SEARCH ENDPOINT (Sprint 2 Phase 2) =============
app.get('/api/search/creators', authenticateToken, async (req, res) => {
  try {
    const { advancedSearch } = await import('./utils/pagination.js');
    
    // Use advanced search with faceted results
    const result = await advancedSearch(
      db.collection('creators'),
      req.query,
      ['tiktok_username', 'display_name', 'bio'],
      { user_id: req.userId } // Additional filter
    );
    
    res.json(result);
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============= FILE UPLOAD ENDPOINTS (Sprint 2 Phase 3) =============
// Import upload middleware
const uploadMiddleware = await import('./middleware/upload.js');
const { uploadSingle, uploadImage, uploadVideo, uploadAudio, handleMulterError, saveFileMetadata } = uploadMiddleware.default || uploadMiddleware;

// ============= PUSH NOTIFICATION ENDPOINTS (Sprint 2 Phase 4 - EXPERT LEVEL) =============
// Import push notification service
const pushService = await import('./services/pushNotifications.js');
const {
  registerPushToken,
  removePushToken,
  sendLiveStreamAlert,
  sendGiftNotification,
  sendProgressNotification,
  sendInboxNotification,
  sendRichNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  updateNotificationPreferences,
  getUserPushTokens
} = pushService.default || pushService;

// Register push token with device info
app.post('/api/notifications/register', authenticateToken, async (req, res) => {
  try {
    const { token, deviceInfo } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Push token is required' });
    }
    
    const result = await registerPushToken(db, req.userId, token, deviceInfo);
    
    res.json({
      success: true,
      message: 'Push token registered successfully',
      token: result
    });
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Remove push token
app.delete('/api/notifications/register', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Push token is required' });
    }
    
    await removePushToken(db, token);
    
    res.json({
      success: true,
      message: 'Push token removed successfully'
    });
  } catch (error) {
    console.error('Remove push token error:', error);
    res.status(500).json({ error: 'Failed to remove push token' });
  }
});

// Get user notifications with pagination
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await getUserNotifications(db, req.userId, page, limit);
    
    res.json(result);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await markNotificationAsRead(db, req.params.id, req.userId);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
app.patch('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await markAllNotificationsAsRead(db, req.userId);
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  try {
    await deleteNotification(db, req.params.id, req.userId);
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Update notification preferences
app.patch('/api/notifications/preferences', authenticateToken, async (req, res) => {
  try {
    const preferences = req.body;
    
    await updateNotificationPreferences(db, req.userId, preferences);
    
    res.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// EXPERT: Send live stream alert (for testing)
app.post('/api/notifications/test/live-alert', authenticateToken, async (req, res) => {
  try {
    const { creatorUsername, creatorAvatar } = req.body;
    
    const result = await sendLiveStreamAlert(db, creatorUsername, creatorAvatar);
    
    res.json(result);
  } catch (error) {
    console.error('Send live alert error:', error);
    res.status(500).json({ error: 'Failed to send live alert' });
  }
});

// EXPERT: Send gift notification (for testing)
app.post('/api/notifications/test/gift', authenticateToken, async (req, res) => {
  try {
    const giftData = req.body;
    
    const result = await sendGiftNotification(db, req.userId, giftData);
    
    res.json(result);
  } catch (error) {
    console.error('Send gift notification error:', error);
    res.status(500).json({ error: 'Failed to send gift notification' });
  }
});

// EXPERT: Send custom rich notification
app.post('/api/notifications/send', authenticateToken, async (req, res) => {
  try {
    const tokens = await getUserPushTokens(db, req.userId);
    
    if (tokens.length === 0) {
      return res.status(400).json({ error: 'No push tokens registered' });
    }
    
    const notification = req.body;
    
    const result = await sendRichNotification(tokens, notification);
    
    res.json(result);
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Upload single file
app.post('/api/upload', authenticateToken, uploadLimiter, (req, res, next) => {
  uploadSingle(req, res, async (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Save file metadata to database
      const fileMetadata = await saveFileMetadata(db, req.file, req.userId);
      
      res.json({
        success: true,
        message: 'File uploaded successfully',
        file: {
          id: fileMetadata._id,
          filename: fileMetadata.filename,
          originalName: fileMetadata.originalName,
          size: fileMetadata.size,
          mimetype: fileMetadata.mimetype,
          fileType: fileMetadata.fileType,
          url: `/api/uploads/${fileMetadata.fileType}s/${fileMetadata.filename}`
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'Failed to save file' });
    }
  });
});

// Upload image
app.post('/api/upload/image', authenticateToken, uploadLimiter, (req, res, next) => {
  uploadImage(req, res, async (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
      }
      
      const fileMetadata = await saveFileMetadata(db, req.file, req.userId);
      
      res.json({
        success: true,
        message: 'Image uploaded successfully',
        image: {
          id: fileMetadata._id,
          filename: fileMetadata.filename,
          url: `/api/uploads/images/${fileMetadata.filename}`,
          size: fileMetadata.size
        }
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Failed to save image' });
    }
  });
});

// Upload video
app.post('/api/upload/video', authenticateToken, uploadLimiter, (req, res, next) => {
  uploadVideo(req, res, async (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video uploaded' });
      }
      
      const fileMetadata = await saveFileMetadata(db, req.file, req.userId);
      
      res.json({
        success: true,
        message: 'Video uploaded successfully',
        video: {
          id: fileMetadata._id,
          filename: fileMetadata.filename,
          url: `/api/uploads/videos/${fileMetadata.filename}`,
          size: fileMetadata.size,
          duration: null // Can be calculated with ffmpeg later
        }
      });
    } catch (error) {
      console.error('Video upload error:', error);
      res.status(500).json({ error: 'Failed to save video' });
    }
  });
});

// Get user's uploaded files with pagination
app.get('/api/uploads', authenticateToken, async (req, res) => {
  try {
    const { parsePaginationParams, parseSortParams, formatPaginatedResponse } = await import('./utils/pagination.js');
    
    const { page, limit, skip } = parsePaginationParams(req.query);
    const sort = parseSortParams(req.query, '-createdAt');
    
    const filter = { userId: req.userId };
    
    // Filter by file type if provided
    if (req.query.fileType) {
      filter.fileType = req.query.fileType;
    }
    
    const [files, total] = await Promise.all([
      db.collection('uploads')
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('uploads').countDocuments(filter)
    ]);
    
    // Add URL to each file
    const filesWithUrls = files.map(file => ({
      ...file,
      url: `/api/uploads/${file.fileType}s/${file.filename}`
    }));
    
    res.json(formatPaginatedResponse(filesWithUrls, total, page, limit));
  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({ error: 'Failed to get uploads' });
  }
});

// Serve uploaded files
app.get('/api/uploads/:type/:filename', authenticateToken, (req, res) => {
  const { type, filename } = req.params;
  const filePath = path.join('/app/backend/uploads', type, filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.sendFile(filePath);
});

// Delete uploaded file
app.delete('/api/uploads/:id', authenticateToken, async (req, res) => {
  try {
    const { deleteFile } = uploadMiddleware.default || uploadMiddleware;
    const fileId = req.params.id;
    
    // Find file
    const file = await db.collection('uploads').findOne({ 
      _id: new ObjectId(fileId),
      userId: req.userId
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete from disk
    await deleteFile(file.path);
    
    // Delete from database
    await db.collection('uploads').deleteOne({ _id: new ObjectId(fileId) });
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
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

// ============= ENHANCED AUTHENTICATION ROUTES =============

// Enable 2FA with Google Authenticator
app.post('/api/auth/2fa/enable', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate Google Authenticator compatible secret
    const twoFASecret = generate2FASecret(userId, user.email);
    
    // Generate QR code for easy scanning
    const qrCodeDataUrl = await generateQRCode(twoFASecret.otpauthUrl);
    
    // Store secret (not yet enabled)
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          two_fa_secret: twoFASecret.secret,
          two_fa_enabled: false,
          two_fa_setup_at: new Date()
        } 
      }
    );

    res.json({ 
      secret: twoFASecret.secret,
      qr_code: qrCodeDataUrl,
      manual_entry_key: twoFASecret.secret,
      otpauth_url: twoFASecret.otpauthUrl,
      app_name: 'TikTok Live Monitor',
      issuer: 'TikTok Live Monitor',
      message: 'Scan QR code with Google Authenticator app or enter the manual key',
      instructions: [
        '1. Open Google Authenticator app',
        '2. Tap the + button',
        '3. Choose "Scan a QR code" or "Enter a setup key"',
        '4. Scan the QR code or enter the manual key',
        '5. Verify with the 6-digit code from the app'
      ]
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

// Verify and activate 2FA with Google Authenticator
app.post('/api/auth/2fa/verify', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code || code.length !== 6) {
      return res.status(400).json({ error: 'Invalid code format. Must be 6 digits' });
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user || !user.two_fa_secret) {
      return res.status(400).json({ error: '2FA not initialized. Call /api/auth/2fa/enable first' });
    }

    // Verify code using speakeasy (Google Authenticator compatible)
    const isValid = verify2FACode(user.two_fa_secret, code);
    
    if (!isValid) {
      return res.status(400).json({ 
        error: 'Invalid verification code',
        message: 'Please check the 6-digit code in your Google Authenticator app'
      });
    }

    // Activate 2FA
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          two_fa_enabled: true,
          two_fa_verified_at: new Date()
        } 
      }
    );

    res.json({ 
      message: '2FA enabled successfully with Google Authenticator',
      status: 'active',
      backup_codes: [
        // Generate backup codes for emergency access
        Math.random().toString(36).substring(2, 10).toUpperCase(),
        Math.random().toString(36).substring(2, 10).toUpperCase(),
        Math.random().toString(36).substring(2, 10).toUpperCase()
      ]
    });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

// Verify 2FA code during login
app.post('/api/auth/2fa/validate', async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await db.collection('users').findOne({ email });
    if (!user || !user.two_fa_enabled) {
      return res.status(400).json({ error: '2FA not enabled for this user' });
    }

    const isValid = verify2FACode(user.two_fa_secret, code);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid 2FA code' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      },
      message: '2FA verification successful'
    });
  } catch (error) {
    console.error('Validate 2FA error:', error);
    res.status(500).json({ error: 'Failed to validate 2FA' });
  }
});

// Disable 2FA
app.post('/api/auth/2fa/disable', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { two_fa_enabled: false },
        $unset: { two_fa_secret: '', two_fa_setup_at: '', two_fa_verified_at: '' }
      }
    );

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// Get 2FA status
app.get('/api/auth/2fa/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    res.json({
      two_fa_enabled: user.two_fa_enabled || false,
      has_secret: !!user.two_fa_secret,
      setup_at: user.two_fa_setup_at || null,
      verified_at: user.two_fa_verified_at || null,
      method: 'Google Authenticator (TOTP)'
    });
  } catch (error) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({ error: 'Failed to get 2FA status' });
  }
});

// Request password reset
app.post('/api/auth/password-reset/request', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If email exists, reset link sent' });
    }

    const resetToken = generatePasswordResetToken();
    
    await db.collection('password_resets').insertOne({
      user_id: user._id,
      token: resetToken.token,
      expires: resetToken.expires,
      used: false,
      created_at: new Date()
    });

    // In production, send email with reset link
    res.json({ 
      message: 'Password reset link sent',
      reset_token: resetToken.token // Only for testing
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to request password reset' });
  }
});

// Reset password
app.post('/api/auth/password-reset/confirm', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const resetRequest = await db.collection('password_resets').findOne({
      token,
      used: false,
      expires: { $gt: new Date() }
    });

    if (!resetRequest) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.collection('users').updateOne(
      { _id: resetRequest.user_id },
      { $set: { password: hashedPassword } }
    );

    await db.collection('password_resets').updateOne(
      { _id: resetRequest._id },
      { $set: { used: true, used_at: new Date() } }
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ============= ENHANCED CREATOR MANAGEMENT ROUTES =============

// Add creator category/tag
app.post('/api/creators/:creatorId/tags', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const { tags } = req.body;

    await db.collection('creators').updateOne(
      { _id: new ObjectId(creatorId) },
      { $addToSet: { tags: { $each: tags } } }
    );

    res.json({ message: 'Tags added successfully' });
  } catch (error) {
    console.error('Add tags error:', error);
    res.status(500).json({ error: 'Failed to add tags' });
  }
});

// Remove creator tag
app.delete('/api/creators/:creatorId/tags/:tag', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const { tag } = req.params;

    await db.collection('creators').updateOne(
      { _id: new ObjectId(creatorId) },
      { $pull: { tags: tag } }
    );

    res.json({ message: 'Tag removed successfully' });
  } catch (error) {
    console.error('Remove tag error:', error);
    res.status(500).json({ error: 'Failed to remove tag' });
  }
});

// Favorite/unfavorite creator
app.post('/api/creators/:creatorId/favorite', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const userId = req.user.id;

    await db.collection('user_creators').updateOne(
      { user_id: new ObjectId(userId), creator_id: new ObjectId(creatorId) },
      { $set: { is_favorite: true, favorited_at: new Date() } }
    );

    res.json({ message: 'Creator favorited' });
  } catch (error) {
    console.error('Favorite creator error:', error);
    res.status(500).json({ error: 'Failed to favorite creator' });
  }
});

app.delete('/api/creators/:creatorId/favorite', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const userId = req.user.id;

    await db.collection('user_creators').updateOne(
      { user_id: new ObjectId(userId), creator_id: new ObjectId(creatorId) },
      { $set: { is_favorite: false }, $unset: { favorited_at: '' } }
    );

    res.json({ message: 'Creator unfavorited' });
  } catch (error) {
    console.error('Unfavorite creator error:', error);
    res.status(500).json({ error: 'Failed to unfavorite creator' });
  }
});

// Get favorite creators
app.get('/api/creators/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await db.collection('user_creators').aggregate([
      { $match: { user_id: new ObjectId(userId), is_favorite: true } },
      { 
        $lookup: {
          from: 'creators',
          localField: 'creator_id',
          foreignField: '_id',
          as: 'creator'
        }
      },
      { $unwind: '$creator' },
      { $replaceRoot: { newRoot: '$creator' } }
    ]).toArray();

    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

// Add creator note
app.post('/api/creators/:creatorId/notes', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const userId = req.user.id;
    const { note } = req.body;

    const noteDoc = {
      user_id: new ObjectId(userId),
      creator_id: new ObjectId(creatorId),
      note,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.collection('creator_notes').insertOne(noteDoc);

    res.json(noteDoc);
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Get creator notes
app.get('/api/creators/:creatorId/notes', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const userId = req.user.id;

    const notes = await db.collection('creator_notes')
      .find({ user_id: new ObjectId(userId), creator_id: new ObjectId(creatorId) })
      .sort({ created_at: -1 })
      .toArray();

    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to get notes' });
  }
});

// Update creator note
app.put('/api/creators/notes/:noteId', authenticateToken, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { note } = req.body;

    await db.collection('creator_notes').updateOne(
      { _id: new ObjectId(noteId) },
      { $set: { note, updated_at: new Date() } }
    );

    res.json({ message: 'Note updated' });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete creator note
app.delete('/api/creators/notes/:noteId', authenticateToken, async (req, res) => {
  try {
    const { noteId } = req.params;

    await db.collection('creator_notes').deleteOne({ _id: new ObjectId(noteId) });

    res.json({ message: 'Note deleted' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Get creator performance score
app.get('/api/creators/:creatorId/score', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    
    const score = await calculateCreatorScore(creatorId);
    
    const creator = await db.collection('creators').findOne({ _id: new ObjectId(creatorId) });

    res.json({
      creator_id: creatorId,
      performance_score: score,
      score_updated_at: creator?.score_updated_at || new Date(),
      breakdown: {
        streams: 'Based on stream count',
        revenue: 'Based on total diamonds',
        viewers: 'Based on average viewers',
        growth: 'Based on follower growth'
      }
    });
  } catch (error) {
    console.error('Get score error:', error);
    res.status(500).json({ error: 'Failed to get score' });
  }
});

// Compare creators
app.post('/api/creators/compare', authenticateToken, async (req, res) => {
  try {
    const { creatorIds } = req.body;

    const creators = await db.collection('creators')
      .find({ _id: { $in: creatorIds.map(id => new ObjectId(id)) } })
      .toArray();

    const comparisons = await Promise.all(creators.map(async (creator) => {
      const [streams, revenue, avgViewers, followers] = await Promise.all([
        db.collection('live_streams').countDocuments({ creator_id: creator._id }),
        db.collection('gifts').aggregate([
          { $match: { creator_id: creator._id } },
          { $group: { _id: null, total: { $sum: '$total_value' } } }
        ]).toArray(),
        db.collection('live_streams').aggregate([
          { $match: { creator_id: creator._id } },
          { $group: { _id: null, avg: { $avg: '$peak_viewers' } } }
        ]).toArray(),
        db.collection('follower_tracking').countDocuments({ creator_id: creator._id })
      ]);

      return {
        creator_id: creator._id,
        tiktok_username: creator.tiktok_username,
        total_streams: streams,
        total_revenue: revenue[0]?.total || 0,
        avg_viewers: Math.round(avgViewers[0]?.avg || 0),
        followers_gained: followers,
        performance_score: creator.performance_score || 0
      };
    }));

    res.json({
      comparison: comparisons,
      winner: comparisons.reduce((max, c) => c.performance_score > max.performance_score ? c : max, comparisons[0])
    });
  } catch (error) {
    console.error('Compare creators error:', error);
    res.status(500).json({ error: 'Failed to compare creators' });
  }
});

// Revenue forecasting
app.get('/api/creators/:creatorId/forecast', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const { days } = req.query;

    const forecast = await forecastRevenue(creatorId, parseInt(days) || 30);

    if (!forecast) {
      return res.status(404).json({ error: 'Insufficient data for forecast' });
    }

    res.json(forecast);
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// Gift pattern analysis
app.get('/api/creators/:creatorId/gift-patterns', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;

    const [hourlyPattern, dailyPattern, topGiftTimes] = await Promise.all([
      db.collection('gifts').aggregate([
        { $match: { creator_id: new ObjectId(creatorId) } },
        { $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 },
          value: { $sum: '$total_value' }
        } },
        { $sort: { _id: 1 } }
      ]).toArray(),
      db.collection('gifts').aggregate([
        { $match: { creator_id: new ObjectId(creatorId) } },
        { $group: {
          _id: { $dayOfWeek: '$timestamp' },
          count: { $sum: 1 },
          value: { $sum: '$total_value' }
        } },
        { $sort: { _id: 1 } }
      ]).toArray(),
      db.collection('gifts').aggregate([
        { $match: { creator_id: new ObjectId(creatorId) } },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d %H:00", date: "$timestamp" } },
          count: { $sum: 1 },
          value: { $sum: '$total_value' }
        } },
        { $sort: { value: -1 } },
        { $limit: 10 }
      ]).toArray()
    ]);

    const bestHour = hourlyPattern.reduce((max, h) => h.value > max.value ? h : max, hourlyPattern[0] || {});
    const bestDay = dailyPattern.reduce((max, d) => d.value > max.value ? d : max, dailyPattern[0] || {});

    res.json({
      hourly_pattern: hourlyPattern,
      daily_pattern: dailyPattern,
      best_hour_to_stream: bestHour._id,
      best_day_to_stream: bestDay._id,
      top_gift_times: topGiftTimes
    });
  } catch (error) {
    console.error('Gift pattern analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze gift patterns' });
  }
});

// ROI Calculator
app.post('/api/roi/calculate', authenticateToken, async (req, res) => {
  try {
    const { investment, period, creatorId } = req.body;

    const revenue = await db.collection('gifts').aggregate([
      { 
        $match: { 
          creator_id: new ObjectId(creatorId),
          timestamp: { $gte: new Date(period.start), $lte: new Date(period.end) }
        }
      },
      { $group: { _id: null, total: { $sum: '$total_value' } } }
    ]).toArray();

    const totalRevenue = revenue[0]?.total || 0;
    const roi = ((totalRevenue - investment) / investment) * 100;

    res.json({
      investment,
      revenue: totalRevenue,
      profit: totalRevenue - investment,
      roi: Math.round(roi),
      period
    });
  } catch (error) {
    console.error('ROI calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate ROI' });
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

// ============= ANALYTICS & TRACKING ROUTES =============

// Get comprehensive stream analytics
app.get('/api/streams/:streamId/analytics', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    
    const stream = await db.collection('live_streams').findOne({ _id: new ObjectId(streamId) });
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const [
      totalGifts,
      totalChats,
      totalShares,
      uniqueChatters,
      uniqueGifters,
      topGifts,
      chatVelocity,
      engagementRate
    ] = await Promise.all([
      db.collection('gifts').countDocuments({ stream_id: new ObjectId(streamId) }),
      db.collection('chat_messages').countDocuments({ stream_id: new ObjectId(streamId) }),
      db.collection('shares').countDocuments({ stream_id: new ObjectId(streamId) }),
      db.collection('chat_messages').distinct('sender_username', { stream_id: new ObjectId(streamId) }),
      db.collection('gifts').distinct('sender_username', { stream_id: new ObjectId(streamId) }),
      db.collection('gifts').aggregate([
        { $match: { stream_id: new ObjectId(streamId) } },
        { $group: { _id: '$gift_name', count: { $sum: 1 }, total_value: { $sum: '$total_value' } } },
        { $sort: { total_value: -1 } },
        { $limit: 10 }
      ]).toArray(),
      stream.chat_velocity || 0,
      calculateEngagementRate(new ObjectId(streamId))
    ]);

    const analytics = {
      stream_id: streamId,
      duration: stream.end_time ? 
        Math.floor((stream.end_time - stream.start_time) / 1000 / 60) : // minutes
        Math.floor((new Date() - stream.start_time) / 1000 / 60),
      peak_viewers: stream.peak_viewers || 0,
      total_viewers: stream.total_viewers || 0,
      total_gifts: totalGifts,
      total_gifts_value: stream.total_gifts_value || 0,
      total_coins: stream.total_coins || 0,
      total_chats: totalChats,
      total_shares: totalShares,
      unique_chatters: uniqueChatters.length,
      unique_gifters: uniqueGifters.length,
      chat_velocity: chatVelocity,
      engagement_rate: engagementRate,
      top_gifts: topGifts,
      status: stream.status
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Get activity feed
app.get('/api/activity', authenticateToken, async (req, res) => {
  try {
    const { limit = 100, type } = req.query;
    
    const query = type ? { type } : {};
    
    const activities = await db.collection('activity_feed')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json(activities);
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({ error: 'Failed to get activity feed' });
  }
});

// Get milestones
app.get('/api/streams/:streamId/milestones', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    
    const milestones = await db.collection('milestones')
      .find({ stream_id: new ObjectId(streamId) })
      .sort({ achieved_at: 1 })
      .toArray();

    res.json(milestones);
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({ error: 'Failed to get milestones' });
  }
});

// Get all milestones for a creator
app.get('/api/creators/:creatorId/milestones', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    
    const milestones = await db.collection('milestones')
      .find({ creator_id: new ObjectId(creatorId) })
      .sort({ achieved_at: -1 })
      .limit(50)
      .toArray();

    res.json(milestones);
  } catch (error) {
    console.error('Get creator milestones error:', error);
    res.status(500).json({ error: 'Failed to get milestones' });
  }
});

// Get follower growth tracking
app.get('/api/creators/:creatorId/follower-growth', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const followers = await db.collection('follower_tracking')
      .find({ 
        creator_id: new ObjectId(creatorId),
        followed_at: { $gte: startDate }
      })
      .sort({ followed_at: 1 })
      .toArray();

    // Group by date
    const dailyGrowth = {};
    followers.forEach(f => {
      const date = f.followed_at.toISOString().split('T')[0];
      dailyGrowth[date] = (dailyGrowth[date] || 0) + 1;
    });

    res.json({
      total_new_followers: followers.length,
      daily_growth: dailyGrowth,
      followers: followers
    });
  } catch (error) {
    console.error('Get follower growth error:', error);
    res.status(500).json({ error: 'Failed to get follower growth' });
  }
});

// Get revenue analytics
app.get('/api/creators/:creatorId/revenue', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const { period = 'all' } = req.query; // all, today, week, month
    
    let startDate = null;
    if (period === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const matchQuery = { creator_id: new ObjectId(creatorId) };
    if (startDate) {
      matchQuery.timestamp = { $gte: startDate };
    }

    const [totalRevenue, giftBreakdown, topSpenders] = await Promise.all([
      db.collection('gifts').aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: '$total_value' }, count: { $sum: 1 } } }
      ]).toArray(),
      db.collection('gifts').aggregate([
        { $match: matchQuery },
        { $group: { _id: '$gift_name', count: { $sum: 1 }, revenue: { $sum: '$total_value' } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]).toArray(),
      db.collection('gifts').aggregate([
        { $match: matchQuery },
        { $group: { 
          _id: '$sender_username', 
          nickname: { $first: '$sender_nickname' },
          total_spent: { $sum: '$total_value' },
          gift_count: { $sum: 1 }
        } },
        { $sort: { total_spent: -1 } },
        { $limit: 20 }
      ]).toArray()
    ]);

    res.json({
      period,
      total_revenue: totalRevenue[0]?.total || 0,
      total_gifts: totalRevenue[0]?.count || 0,
      gift_breakdown: giftBreakdown,
      top_spenders: topSpenders
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to get revenue analytics' });
  }
});

// Get chat analytics
app.get('/api/streams/:streamId/chat-analytics', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    
    const [totalChats, uniqueChatters, topChatters, chatTimeline] = await Promise.all([
      db.collection('chat_messages').countDocuments({ stream_id: new ObjectId(streamId) }),
      db.collection('chat_messages').distinct('sender_username', { stream_id: new ObjectId(streamId) }),
      db.collection('chat_messages').aggregate([
        { $match: { stream_id: new ObjectId(streamId) } },
        { $group: { 
          _id: '$sender_username',
          nickname: { $first: '$sender_nickname' },
          message_count: { $sum: 1 }
        } },
        { $sort: { message_count: -1 } },
        { $limit: 10 }
      ]).toArray(),
      db.collection('chat_messages').aggregate([
        { $match: { stream_id: new ObjectId(streamId) } },
        { $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d %H:%M", date: "$timestamp" }
          },
          count: { $sum: 1 }
        } },
        { $sort: { _id: 1 } }
      ]).toArray()
    ]);

    res.json({
      total_messages: totalChats,
      unique_chatters: uniqueChatters.length,
      top_chatters: topChatters,
      chat_timeline: chatTimeline,
      average_messages_per_user: totalChats / (uniqueChatters.length || 1)
    });
  } catch (error) {
    console.error('Get chat analytics error:', error);
    res.status(500).json({ error: 'Failed to get chat analytics' });
  }
});

// Get coin analytics
app.get('/api/creators/:creatorId/coins', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const { period = 'all' } = req.query;
    
    let startDate = null;
    if (period === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const matchQuery = { creator_id: new ObjectId(creatorId) };
    if (startDate) {
      matchQuery.timestamp = { $gte: startDate };
    }

    const [totalCoins, coinByGift, topCoinSpenders] = await Promise.all([
      db.collection('gifts').aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: '$coin_value' }, count: { $sum: 1 } } }
      ]).toArray(),
      db.collection('gifts').aggregate([
        { $match: matchQuery },
        { $group: { _id: '$gift_name', count: { $sum: 1 }, coins: { $sum: '$coin_value' } } },
        { $sort: { coins: -1 } },
        { $limit: 10 }
      ]).toArray(),
      db.collection('gifts').aggregate([
        { $match: matchQuery },
        { $group: { 
          _id: '$sender_username',
          nickname: { $first: '$sender_nickname' },
          total_coins: { $sum: '$coin_value' },
          gift_count: { $sum: 1 }
        } },
        { $sort: { total_coins: -1 } },
        { $limit: 20 }
      ]).toArray()
    ]);

    res.json({
      period,
      total_coins: totalCoins[0]?.total || 0,
      total_gifts: totalCoins[0]?.count || 0,
      coin_by_gift: coinByGift,
      top_coin_spenders: topCoinSpenders
    });
  } catch (error) {
    console.error('Get coin analytics error:', error);
    res.status(500).json({ error: 'Failed to get coin analytics' });
  }
});


// ============= GIFT FEATURES ROUTES =============

// Get gift combos
app.get('/api/streams/:streamId/gift-combos', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    
    const combos = await db.collection('gift_combos')
      .find({ stream_id: new ObjectId(streamId), active: true })
      .sort({ combo_count: -1 })
      .limit(20)
      .toArray();

    res.json(combos);
  } catch (error) {
    console.error('Get gift combos error:', error);
    res.status(500).json({ error: 'Failed to get gift combos' });
  }
});

// Get gift streaks
app.get('/api/creators/:creatorId/gift-streaks', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    
    const streaks = await db.collection('gift_streaks')
      .find({ creator_id: new ObjectId(creatorId) })
      .sort({ streak_count: -1 })
      .limit(20)
      .toArray();

    res.json(streaks);
  } catch (error) {
    console.error('Get gift streaks error:', error);
    res.status(500).json({ error: 'Failed to get gift streaks' });
  }
});

// Get user gift streak
app.get('/api/users/:username/gift-streak', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const { creatorId } = req.query;
    
    const streak = await db.collection('gift_streaks').findOne({
      username,
      creator_id: new ObjectId(creatorId)
    });

    res.json(streak || { streak_count: 0, longest_streak: 0 });
  } catch (error) {
    console.error('Get user streak error:', error);
    res.status(500).json({ error: 'Failed to get user streak' });
  }
});

// Get gift analytics
app.get('/api/creators/:creatorId/gift-analytics', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    
    const [topGifts, rareGifts, giftTrends] = await Promise.all([
      db.collection('gifts').aggregate([
        { $match: { creator_id: new ObjectId(creatorId) } },
        { $group: { 
          _id: '$gift_name',
          count: { $sum: 1 },
          total_value: { $sum: '$total_value' },
          total_coins: { $sum: '$coin_value' }
        } },
        { $sort: { total_value: -1 } },
        { $limit: 20 }
      ]).toArray(),
      db.collection('gifts').aggregate([
        { $match: { creator_id: new ObjectId(creatorId), total_value: { $gte: 1000 } } },
        { $group: { _id: '$gift_name', count: { $sum: 1 }, total_value: { $sum: '$total_value' } } },
        { $sort: { total_value: -1 } }
      ]).toArray(),
      db.collection('gifts').aggregate([
        { $match: { creator_id: new ObjectId(creatorId) } },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 },
          value: { $sum: '$total_value' }
        } },
        { $sort: { _id: -1 } },
        { $limit: 30 }
      ]).toArray()
    ]);

    res.json({
      top_gifts: topGifts,
      rare_gifts: rareGifts,
      gift_trends: giftTrends
    });
  } catch (error) {
    console.error('Get gift analytics error:', error);
    res.status(500).json({ error: 'Failed to get gift analytics' });
  }
});

// ============= SUBSCRIPTION ROUTES =============

// Subscribe to creator
app.post('/api/subscriptions', authenticateToken, async (req, res) => {
  try {
    const { creatorId, tier, duration } = req.body;
    const userId = req.user.id;

    if (!['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const subscription = await manageSubscription(userId, creatorId, tier, duration || 'monthly');
    
    res.json(subscription);
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Get user subscriptions
app.get('/api/users/:userId/subscriptions', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const subscriptions = await db.collection('subscriptions')
      .find({ user_id: new ObjectId(userId), status: 'active' })
      .toArray();

    res.json(subscriptions);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
});

// Get creator subscribers
app.get('/api/creators/:creatorId/subscribers', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const { tier } = req.query;
    
    const query = { creator_id: new ObjectId(creatorId), status: 'active' };
    if (tier) {
      query.tier = tier;
    }

    const subscribers = await db.collection('subscriptions')
      .find(query)
      .sort({ start_date: -1 })
      .toArray();

    // Get tier distribution
    const tierDistribution = await db.collection('subscriptions').aggregate([
      { $match: { creator_id: new ObjectId(creatorId), status: 'active' } },
      { $group: { _id: '$tier', count: { $sum: 1 }, revenue: { $sum: '$price' } } }
    ]).toArray();

    res.json({
      subscribers,
      total_count: subscribers.length,
      tier_distribution: tierDistribution
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ error: 'Failed to get subscribers' });
  }
});

// Get subscription tiers
app.get('/api/subscription-tiers', authenticateToken, async (req, res) => {
  try {
    res.json(SUBSCRIPTION_TIERS);
  } catch (error) {
    console.error('Get subscription tiers error:', error);
    res.status(500).json({ error: 'Failed to get subscription tiers' });
  }
});

// ============= TREASURE BOX ROUTES =============

// Open treasure box
app.post('/api/treasure-boxes/open', authenticateToken, async (req, res) => {
  try {
    const { boxType, creatorId } = req.body;
    const userId = req.user.id;

    if (!['BASIC', 'SILVER', 'GOLD', 'PLATINUM', 'LEGENDARY'].includes(boxType)) {
      return res.status(400).json({ error: 'Invalid treasure box type' });
    }

    const reward = await openTreasureBox(new ObjectId(userId), boxType, new ObjectId(creatorId));
    
    if (!reward) {
      return res.status(500).json({ error: 'Failed to open treasure box' });
    }

    res.json(reward);
  } catch (error) {
    console.error('Open treasure box error:', error);
    res.status(500).json({ error: 'Failed to open treasure box' });
  }
});

// Get treasure box history
app.get('/api/users/:userId/treasure-boxes', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const history = await db.collection('treasure_box_history')
      .find({ user_id: new ObjectId(userId) })
      .sort({ opened_at: -1 })
      .limit(50)
      .toArray();

    const stats = await db.collection('user_rewards').findOne({
      user_id: new ObjectId(userId)
    });

    res.json({
      history,
      stats: stats || { total_diamonds_from_boxes: 0, total_coins_from_boxes: 0, boxes_opened: 0 }
    });
  } catch (error) {
    console.error('Get treasure box history error:', error);
    res.status(500).json({ error: 'Failed to get treasure box history' });
  }
});

// Get available treasure boxes for user
app.get('/api/users/:userId/available-boxes', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { creatorId } = req.query;
    
    // Check subscription benefits
    const benefits = await getSubscriptionBenefits(userId, creatorId);
    
    const availableBoxes = [];
    
    // All users get basic boxes
    availableBoxes.push({ type: 'BASIC', available: true, from: 'Free' });
    
    // Subscription-based boxes
    if (benefits.tier === 'PLATINUM' || benefits.tier === 'DIAMOND') {
      availableBoxes.push({ type: 'GOLD', available: true, from: 'Subscription' });
    }
    if (benefits.tier === 'DIAMOND') {
      availableBoxes.push({ type: 'PLATINUM', available: true, from: 'Subscription' });
      availableBoxes.push({ type: 'LEGENDARY', available: true, from: 'Subscription' });
    }

    res.json({
      subscription_tier: benefits.tier,
      available_boxes: availableBoxes
    });
  } catch (error) {
    console.error('Get available boxes error:', error);
    res.status(500).json({ error: 'Failed to get available boxes' });
  }
});

// Get gift rarity info
app.get('/api/gift-rarity', authenticateToken, async (req, res) => {
  try {
    res.json(GIFT_RARITY);
  } catch (error) {
    console.error('Get gift rarity error:', error);
    res.status(500).json({ error: 'Failed to get gift rarity' });
  }
});

// ============= STREAM HEALTH & QUALITY ROUTES =============

// Get stream health metrics
app.get('/api/streams/:streamId/health', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    
    const [latestHealth, healthHistory, stream] = await Promise.all([
      db.collection('stream_health')
        .findOne({ stream_id: new ObjectId(streamId) }, { sort: { timestamp: -1 } }),
      db.collection('stream_health')
        .find({ stream_id: new ObjectId(streamId) })
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray(),
      db.collection('live_streams').findOne({ _id: new ObjectId(streamId) })
    ]);

    res.json({
      current: latestHealth,
      history: healthHistory,
      stream_info: {
        health_score: stream?.health_score || 0,
        latency_ms: stream?.latency_ms || 0,
        connection_quality: stream?.connection_quality || 'unknown',
        retention_rate: stream?.retention_rate || 0
      }
    });
  } catch (error) {
    console.error('Get stream health error:', error);
    res.status(500).json({ error: 'Failed to get stream health' });
  }
});

// Get viewer demographics
app.get('/api/streams/:streamId/demographics', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    
    const [countryDistribution, deviceDistribution, totalViewers] = await Promise.all([
      db.collection('viewer_demographics').aggregate([
        { $match: { stream_id: new ObjectId(streamId) } },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),
      db.collection('viewer_demographics').aggregate([
        { $match: { stream_id: new ObjectId(streamId) } },
        { $group: { _id: '$device_type', count: { $sum: 1 } } }
      ]).toArray(),
      db.collection('viewer_demographics').countDocuments({ stream_id: new ObjectId(streamId) })
    ]);

    res.json({
      total_viewers: totalViewers,
      by_country: countryDistribution,
      by_device: deviceDistribution
    });
  } catch (error) {
    console.error('Get demographics error:', error);
    res.status(500).json({ error: 'Failed to get demographics' });
  }
});

// Get sentiment analysis
app.get('/api/streams/:streamId/sentiment', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    
    const [latestSentiment, sentimentHistory] = await Promise.all([
      db.collection('stream_sentiment')
        .findOne({ stream_id: new ObjectId(streamId) }, { sort: { timestamp: -1 } }),
      db.collection('stream_sentiment')
        .find({ stream_id: new ObjectId(streamId) })
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray()
    ]);

    res.json({
      current: latestSentiment,
      history: sentimentHistory
    });
  } catch (error) {
    console.error('Get sentiment error:', error);
    res.status(500).json({ error: 'Failed to get sentiment' });
  }
});

// Get stream highlights
app.get('/api/streams/:streamId/highlights', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    
    const highlights = await db.collection('stream_highlights')
      .find({ stream_id: new ObjectId(streamId) })
      .sort({ value: -1 })
      .toArray();

    res.json(highlights);
  } catch (error) {
    console.error('Get highlights error:', error);
    res.status(500).json({ error: 'Failed to get highlights' });
  }
});

// Create stream clip
app.post('/api/streams/:streamId/clips', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    const { startTime, endTime, title } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Start time and end time required' });
    }

    const clipId = await createStreamClip(
      new ObjectId(streamId),
      new Date(startTime),
      new Date(endTime),
      title
    );

    if (!clipId) {
      return res.status(500).json({ error: 'Failed to create clip' });
    }

    res.json({ clip_id: clipId.toString(), status: 'processing' });
  } catch (error) {
    console.error('Create clip error:', error);
    res.status(500).json({ error: 'Failed to create clip' });
  }
});

// Get stream clips
app.get('/api/streams/:streamId/clips', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    
    const clips = await db.collection('stream_clips')
      .find({ stream_id: new ObjectId(streamId) })
      .sort({ created_at: -1 })
      .toArray();

    res.json(clips);
  } catch (error) {
    console.error('Get clips error:', error);
    res.status(500).json({ error: 'Failed to get clips' });
  }
});

// Get viewer engagement score
app.get('/api/streams/:streamId/engagement-score', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    
    const stream = await db.collection('live_streams').findOne({ _id: new ObjectId(streamId) });
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const [giftCount, chatCount, likeCount, shareCount] = await Promise.all([
      db.collection('gifts').countDocuments({ stream_id: new ObjectId(streamId) }),
      db.collection('chat_messages').countDocuments({ stream_id: new ObjectId(streamId) }),
      db.collection('fans').aggregate([
        { $match: { last_stream_id: new ObjectId(streamId) } },
        { $group: { _id: null, total_likes: { $sum: '$like_count' } } }
      ]).toArray(),
      db.collection('shares').countDocuments({ stream_id: new ObjectId(streamId) })
    ]);

    const totalLikes = likeCount[0]?.total_likes || 0;
    const viewers = stream.peak_viewers || stream.total_viewers || 1;

    // Calculate engagement score (0-100)
    const giftScore = Math.min((giftCount / viewers) * 30, 30);
    const chatScore = Math.min((chatCount / viewers) * 25, 25);
    const likeScore = Math.min((totalLikes / (viewers * 5)) * 25, 25);
    const shareScore = Math.min((shareCount / viewers) * 20, 20);

    const engagementScore = giftScore + chatScore + likeScore + shareScore;

    res.json({
      engagement_score: Math.round(engagementScore),
      breakdown: {
        gifts: Math.round(giftScore),
        chats: Math.round(chatScore),
        likes: Math.round(likeScore),
        shares: Math.round(shareScore)
      },
      metrics: {
        total_gifts: giftCount,
        total_chats: chatCount,
        total_likes: totalLikes,
        total_shares: shareCount,
        viewers: viewers
      }
    });
  } catch (error) {
    console.error('Get engagement score error:', error);
    res.status(500).json({ error: 'Failed to get engagement score' });
  }
});

// Trigger stream health check
app.post('/api/streams/:streamId/health-check', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    const result = await trackStreamHealth(new ObjectId(streamId));
    res.json(result || { message: 'Health check completed' });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Failed to perform health check' });
  }
});

// Trigger sentiment analysis
app.post('/api/streams/:streamId/analyze-sentiment', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    const result = await analyzeChatSentiment(new ObjectId(streamId));
    res.json(result || { message: 'Sentiment analysis completed' });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// Detect highlights
app.post('/api/streams/:streamId/detect-highlights', authenticateToken, async (req, res) => {
  try {
    const streamId = req.params.streamId;
    await detectStreamHighlights(new ObjectId(streamId));
    res.json({ message: 'Highlights detection completed' });
  } catch (error) {
    console.error('Detect highlights error:', error);
    res.status(500).json({ error: 'Failed to detect highlights' });
  }
});

// Get historical comparison
app.get('/api/creators/:creatorId/historical', authenticateToken, async (req, res) => {
  try {
    const creatorId = req.params.creatorId;
    const { limit = 10 } = req.query;
    
    const streams = await db.collection('live_streams')
      .find({ creator_id: new ObjectId(creatorId), status: 'ended' })
      .sort({ start_time: -1 })
      .limit(parseInt(limit))
      .toArray();

    const streamIds = streams.map(s => s._id);
    
    // Get stats for each stream
    const streamStats = await Promise.all(streams.map(async (stream) => {
      const [giftCount, chatCount, uniqueViewers] = await Promise.all([
        db.collection('gifts').countDocuments({ stream_id: stream._id }),
        db.collection('chat_messages').countDocuments({ stream_id: stream._id }),
        db.collection('fans').countDocuments({ last_stream_id: stream._id })
      ]);

      return {
        ...stream,
        total_gifts: giftCount,
        total_chats: chatCount,
        unique_viewers: uniqueViewers,
        duration: Math.floor((stream.end_time - stream.start_time) / 1000 / 60)
      };
    }));

    res.json({
      total_streams: streams.length,
      streams: streamStats
    });
  } catch (error) {
    console.error('Get historical data error:', error);
    res.status(500).json({ error: 'Failed to get historical data' });
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

// ============= ENHANCED AUTHENTICATION & USER MANAGEMENT =============

// Generate 2FA secret using speakeasy (Google Authenticator compatible)
function generate2FASecret(userId, userEmail) {
  const secret = speakeasy.generateSecret({
    name: `TikTok Monitor (${userEmail})`,
    issuer: 'TikTok Live Monitor',
    length: 32
  });
  
  return {
    userId,
    secret: secret.base32, // Base32 encoded secret for Google Authenticator
    otpauthUrl: secret.otpauth_url // URL for QR code
  };
}

// Verify 2FA code using speakeasy (Google Authenticator)
function verify2FACode(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps (60 seconds) tolerance
  });
}

// Generate QR code for Google Authenticator
async function generateQRCode(otpauthUrl) {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
}

// Password reset token generation
function generatePasswordResetToken() {
  return {
    token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    expires: new Date(Date.now() + 3600000) // 1 hour
  };
}

// ============= NOTIFICATION & ALERT SYSTEM =============

// Email notification system
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'noreply@tiktokmonitor.com',
    pass: process.env.SMTP_PASS || 'password'
  }
});

// Send email notification
async function sendEmailNotification(to, subject, html) {
  try {
    const info = await emailTransporter.sendMail({
      from: '"TikTok Live Monitor" <noreply@tiktokmonitor.com>',
      to,
      subject,
      html
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

// Push notification system
async function sendPushNotification(userId, title, body, data = {}) {
  if (!db) return;

  try {
    const notification = {
      user_id: new ObjectId(userId),
      title,
      body,
      data,
      read: false,
      created_at: new Date()
    };

    await db.collection('notifications').insertOne(notification);

    // Emit real-time notification
    io.to(`user_${userId}`).emit('notification', notification);

    return notification;
  } catch (error) {
    console.error('Push notification error:', error);
  }
}

// Webhook system
async function triggerWebhook(event, data) {
  if (!db) return;

  try {
    const webhooks = await db.collection('webhooks')
      .find({ events: event, active: true })
      .toArray();

    for (const webhook of webhooks) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': webhook.secret
          },
          body: JSON.stringify({
            event,
            data,
            timestamp: new Date().toISOString()
          })
        });

        // Log webhook delivery
        await db.collection('webhook_logs').insertOne({
          webhook_id: webhook._id,
          event,
          status: response.status,
          response_time: Date.now(),
          delivered_at: new Date()
        });
      } catch (error) {
        console.error(`Webhook delivery failed for ${webhook.url}:`, error);
      }
    }
  } catch (error) {
    console.error('Trigger webhook error:', error);
  }
}

// Alert rules engine
async function checkAlertRules(metricType, value, streamId, creatorId) {
  if (!db) return;

  try {
    const rules = await db.collection('alert_rules')
      .find({ metric: metricType, active: true })
      .toArray();

    for (const rule of rules) {
      let triggered = false;

      if (rule.condition === 'greater_than' && value > rule.threshold) {
        triggered = true;
      } else if (rule.condition === 'less_than' && value < rule.threshold) {
        triggered = true;
      } else if (rule.condition === 'equals' && value === rule.threshold) {
        triggered = true;
      }

      if (triggered) {
        // Send notification
        const users = await db.collection('user_creators')
          .find({ creator_id: new ObjectId(creatorId) })
          .toArray();

        for (const userCreator of users) {
          await sendPushNotification(
            userCreator.user_id,
            `Alert: ${rule.name}`,
            `${metricType} reached ${value}`,
            { rule_id: rule._id, stream_id: streamId }
          );
        }

        // Log alert trigger
        await db.collection('alert_history').insertOne({
          rule_id: rule._id,
          metric: metricType,
          value,
          threshold: rule.threshold,
          stream_id: streamId,
          creator_id: creatorId,
          triggered_at: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Check alert rules error:', error);
  }
}

// ============= EXPORT & REPORTING SYSTEM =============

// Export data to CSV
async function exportToCSV(collection, query, fields, filename) {
  try {
    const data = await db.collection(collection).find(query).toArray();

    const csvWriter = createObjectCsvWriter({
      path: `/tmp/${filename}`,
      header: fields.map(f => ({ id: f, title: f }))
    });

    await csvWriter.writeRecords(data);

    return `/tmp/${filename}`;
  } catch (error) {
    console.error('Export CSV error:', error);
    return null;
  }
}

// Generate report
async function generateReport(creatorId, startDate, endDate, reportType) {
  if (!db) return null;

  try {
    const query = {
      creator_id: new ObjectId(creatorId),
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    const report = {
      creator_id: creatorId,
      report_type: reportType,
      start_date: startDate,
      end_date: endDate,
      generated_at: new Date()
    };

    if (reportType === 'revenue') {
      const revenue = await db.collection('gifts').aggregate([
        { $match: query },
        { 
          $group: {
            _id: null,
            total_diamonds: { $sum: '$total_value' },
            total_coins: { $sum: '$coin_value' },
            total_gifts: { $sum: 1 }
          }
        }
      ]).toArray();

      report.data = revenue[0] || { total_diamonds: 0, total_coins: 0, total_gifts: 0 };
    } else if (reportType === 'engagement') {
      const [gifts, chats, streams] = await Promise.all([
        db.collection('gifts').countDocuments(query),
        db.collection('chat_messages').countDocuments(query),
        db.collection('live_streams').countDocuments({
          creator_id: new ObjectId(creatorId),
          start_time: { $gte: new Date(startDate), $lte: new Date(endDate) }
        })
      ]);

      report.data = { total_gifts: gifts, total_chats: chats, total_streams: streams };
    }

    // Save report
    const result = await db.collection('reports').insertOne(report);
    report._id = result.insertedId;

    return report;
  } catch (error) {
    console.error('Generate report error:', error);
    return null;
  }
}

// Backup data
async function backupData() {
  try {
    const backupDir = `/tmp/backup_${Date.now()}`;
    fs.mkdirSync(backupDir, { recursive: true });

    const collections = ['users', 'creators', 'live_streams', 'gifts', 'fans', 'subscriptions'];

    for (const collection of collections) {
      const data = await db.collection(collection).find().toArray();
      fs.writeFileSync(
        `${backupDir}/${collection}.json`,
        JSON.stringify(data, null, 2)
      );
    }

    // Create archive
    const output = fs.createWriteStream(`/tmp/backup_${Date.now()}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve(`/tmp/backup_${Date.now()}.zip`);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(backupDir, false);
      archive.finalize();
    });
  } catch (error) {
    console.error('Backup error:', error);
    return null;
  }
}

// ============= AUTOMATION & SCHEDULING =============

// Schedule automated tasks
function setupAutomation() {
  // Daily backup at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily backup...');
    await backupData();
  });

  // Hourly analytics update
  cron.schedule('0 * * * *', async () => {
    console.log('Updating analytics...');
    const creators = await db.collection('creators').find().toArray();
    for (const creator of creators) {
      await calculateCreatorScore(creator._id);
    }
  });

  // Daily report generation
  cron.schedule('0 0 * * *', async () => {
    console.log('Generating daily reports...');
    const creators = await db.collection('creators').find().toArray();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    for (const creator of creators) {
      await generateReport(
        creator._id,
        yesterday.toISOString(),
        new Date().toISOString(),
        'revenue'
      );
    }
  });

  console.log('Automation tasks scheduled');
}

// ============= TEAM COLLABORATION SYSTEM =============

// Role-based access control
const ROLES = {
  ADMIN: { level: 100, permissions: ['*'] },
  MANAGER: { level: 50, permissions: ['read', 'write', 'manage_creators'] },
  ANALYST: { level: 30, permissions: ['read', 'export'] },
  VIEWER: { level: 10, permissions: ['read'] }
};

function hasPermission(userRole, requiredPermission) {
  const role = ROLES[userRole];
  if (!role) return false;
  
  return role.permissions.includes('*') || role.permissions.includes(requiredPermission);
}

// Audit log system
async function logAuditEvent(userId, action, resource, details = {}) {
  if (!db) return;

  try {
    await db.collection('audit_logs').insertOne({
      user_id: new ObjectId(userId),
      action,
      resource,
      details,
      ip_address: details.ip || 'unknown',
      user_agent: details.userAgent || 'unknown',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

// Creator performance scoring
async function calculateCreatorScore(creatorId) {
  if (!db) return 0;

  try {
    const [streams, totalRevenue, avgViewers, followerGrowth] = await Promise.all([
      db.collection('live_streams').countDocuments({ creator_id: new ObjectId(creatorId) }),
      db.collection('gifts').aggregate([
        { $match: { creator_id: new ObjectId(creatorId) } },
        { $group: { _id: null, total: { $sum: '$total_value' } } }
      ]).toArray(),
      db.collection('live_streams').aggregate([
        { $match: { creator_id: new ObjectId(creatorId) } },
        { $group: { _id: null, avg: { $avg: '$peak_viewers' } } }
      ]).toArray(),
      db.collection('follower_tracking').countDocuments({ creator_id: new ObjectId(creatorId) })
    ]);

    const revenue = totalRevenue[0]?.total || 0;
    const viewers = avgViewers[0]?.avg || 0;

    // Score formula (0-100)
    const streamScore = Math.min((streams / 10) * 20, 20);
    const revenueScore = Math.min((revenue / 10000) * 30, 30);
    const viewerScore = Math.min((viewers / 1000) * 30, 30);
    const growthScore = Math.min((followerGrowth / 100) * 20, 20);

    const totalScore = streamScore + revenueScore + viewerScore + growthScore;

    await db.collection('creators').updateOne(
      { _id: new ObjectId(creatorId) },
      { $set: { performance_score: Math.round(totalScore), score_updated_at: new Date() } }
    );

    return Math.round(totalScore);
  } catch (error) {
    console.error('Error calculating creator score:', error);
    return 0;
  }
}

// Revenue forecasting
async function forecastRevenue(creatorId, days = 30) {
  if (!db) return null;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const historicalRevenue = await db.collection('gifts').aggregate([
      { 
        $match: { 
          creator_id: new ObjectId(creatorId),
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          daily_revenue: { $sum: '$total_value' }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    if (historicalRevenue.length === 0) return null;

    // Simple linear regression for forecasting
    const revenues = historicalRevenue.map(r => r.daily_revenue);
    const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    
    // Calculate trend (increasing/decreasing)
    const recentAvg = revenues.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, revenues.length);
    const trend = recentAvg > avgRevenue ? 'increasing' : 'decreasing';
    const trendPercentage = ((recentAvg - avgRevenue) / avgRevenue) * 100;

    // Forecast next 7 days
    const forecast = [];
    for (let i = 1; i <= 7; i++) {
      const projectedRevenue = avgRevenue * (1 + (trendPercentage / 100) * i);
      forecast.push({
        day: i,
        projected_revenue: Math.round(projectedRevenue)
      });
    }

    return {
      historical_avg: Math.round(avgRevenue),
      recent_avg: Math.round(recentAvg),
      trend,
      trend_percentage: Math.round(trendPercentage),
      forecast
    };
  } catch (error) {
    console.error('Error forecasting revenue:', error);
    return null;
  }
}

// ============= STREAM QUALITY & HEALTH MONITORING =============

// Track stream health metrics
async function trackStreamHealth(streamId) {
  if (!db || !streamId) return;

  try {
    const stream = await db.collection('live_streams').findOne({ _id: streamId });
    if (!stream || stream.status !== 'live') return;

    const streamDuration = (new Date() - stream.start_time) / 1000 / 60; // minutes
    
    const [giftCount, chatCount, viewerCount] = await Promise.all([
      db.collection('gifts').countDocuments({ stream_id: streamId }),
      db.collection('chat_messages').countDocuments({ stream_id: streamId }),
      Promise.resolve(stream.total_viewers || 0)
    ]);

    // Calculate health score (0-100)
    const engagementRate = viewerCount > 0 ? ((giftCount + chatCount) / viewerCount) * 100 : 0;
    const viewerScore = Math.min((viewerCount / 100) * 25, 25); // Max 25 points for viewers
    const giftScore = Math.min((giftCount / 10) * 25, 25); // Max 25 points for gifts
    const chatScore = Math.min((chatCount / 50) * 25, 25); // Max 25 points for chats
    const durationScore = Math.min((streamDuration / 60) * 25, 25); // Max 25 points for duration

    const healthScore = Math.min(viewerScore + giftScore + chatScore + durationScore, 100);

    // Calculate latency (simulated - in real scenario would measure actual latency)
    const latency = 150 + Math.random() * 100; // 150-250ms

    // Calculate connection quality
    let connectionQuality = 'excellent';
    if (latency > 300) connectionQuality = 'poor';
    else if (latency > 200) connectionQuality = 'good';

    await db.collection('stream_health').insertOne({
      stream_id: streamId,
      health_score: healthScore,
      engagement_rate: engagementRate,
      latency_ms: latency,
      connection_quality: connectionQuality,
      viewer_count: viewerCount,
      gift_count: giftCount,
      chat_count: chatCount,
      bandwidth_mbps: 2.5 + Math.random() * 2, // Simulated bandwidth
      timestamp: new Date()
    });

    // Update stream with latest health
    await db.collection('live_streams').updateOne(
      { _id: streamId },
      { 
        $set: { 
          health_score: healthScore,
          latency_ms: latency,
          connection_quality: connectionQuality,
          last_health_check: new Date()
        }
      }
    );

    return { healthScore, latency, connectionQuality };
  } catch (error) {
    console.error('Error tracking stream health:', error);
  }
}

// Track viewer demographics and behavior
async function trackViewerDemographics(streamId, username, data) {
  if (!db) return;

  try {
    // Simulated demographics (in real scenario would get from TikTok API)
    const demographics = {
      stream_id: streamId,
      username: username,
      country: data.country || 'Unknown',
      device_type: data.deviceType || 'mobile',
      session_start: new Date(),
      session_duration: 0,
      engagement_count: 0, // gifts + chats + likes
      is_active: true
    };

    await db.collection('viewer_demographics').updateOne(
      { stream_id: streamId, username: username },
      { 
        $set: demographics,
        $setOnInsert: { created_at: new Date() }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error tracking viewer demographics:', error);
  }
}

// Calculate viewer retention rate
async function calculateRetentionRate(streamId) {
  if (!db) return 0;

  try {
    const stream = await db.collection('live_streams').findOne({ _id: streamId });
    if (!stream) return 0;

    const streamDuration = (new Date() - stream.start_time) / 1000 / 60; // minutes
    
    // Get unique viewers who stayed for significant time
    const totalViewers = await db.collection('viewer_demographics').countDocuments({ stream_id: streamId });
    const engagedViewers = await db.collection('viewer_demographics').countDocuments({
      stream_id: streamId,
      session_duration: { $gte: streamDuration * 0.3 } // Stayed for 30%+ of stream
    });

    const retentionRate = totalViewers > 0 ? (engagedViewers / totalViewers) * 100 : 0;
    
    await db.collection('live_streams').updateOne(
      { _id: streamId },
      { $set: { retention_rate: retentionRate } }
    );

    return retentionRate;
  } catch (error) {
    console.error('Error calculating retention rate:', error);
    return 0;
  }
}

// AI-powered sentiment analysis on chat messages
async function analyzeChatSentiment(streamId) {
  if (!db) return;

  try {
    // Get recent chat messages
    const recentChats = await db.collection('chat_messages')
      .find({ stream_id: streamId })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    if (recentChats.length === 0) return;

    // Simple sentiment analysis (in production would use Gemini AI)
    const positiveWords = ['love', 'great', 'awesome', 'amazing', 'cool', 'best', 'nice', '❤️', '😍', '🔥', '👍'];
    const negativeWords = ['hate', 'bad', 'boring', 'worst', 'terrible', 'annoying', '👎', '😡', '💔'];

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    recentChats.forEach(chat => {
      const message = chat.message.toLowerCase();
      const hasPositive = positiveWords.some(word => message.includes(word));
      const hasNegative = negativeWords.some(word => message.includes(word));

      if (hasPositive && !hasNegative) positiveCount++;
      else if (hasNegative && !hasPositive) negativeCount++;
      else neutralCount++;
    });

    const sentimentScore = ((positiveCount - negativeCount) / recentChats.length) * 100;

    await db.collection('stream_sentiment').insertOne({
      stream_id: streamId,
      positive_count: positiveCount,
      negative_count: negativeCount,
      neutral_count: neutralCount,
      sentiment_score: sentimentScore,
      total_analyzed: recentChats.length,
      timestamp: new Date()
    });

    return { sentimentScore, positiveCount, negativeCount, neutralCount };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
  }
}

// Auto-detect stream highlights
async function detectStreamHighlights(streamId) {
  if (!db) return;

  try {
    // Detect highlights based on activity spikes
    const timeWindows = await db.collection('gifts').aggregate([
      { $match: { stream_id: streamId } },
      { $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d %H:%M", date: "$timestamp" }
        },
        gift_count: { $sum: 1 },
        total_value: { $sum: '$total_value' }
      } },
      { $sort: { total_value: -1 } },
      { $limit: 5 }
    ]).toArray();

    for (const window of timeWindows) {
      if (window.total_value > 500) { // Significant gift activity
        await db.collection('stream_highlights').insertOne({
          stream_id: streamId,
          type: 'gift_spike',
          timestamp: new Date(window._id),
          value: window.total_value,
          gift_count: window.gift_count,
          detected_at: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Error detecting highlights:', error);
  }
}

// Create clip from stream
async function createStreamClip(streamId, startTime, endTime, title) {
  if (!db) return null;

  try {
    const clip = {
      stream_id: streamId,
      title: title || 'Highlight Clip',
      start_time: startTime,
      end_time: endTime,
      duration: (endTime - startTime) / 1000, // seconds
      created_at: new Date(),
      status: 'processing'
    };

    const result = await db.collection('stream_clips').insertOne(clip);

    // Emit clip creation event
    io.emit('clip_created', {
      clip_id: result.insertedId.toString(),
      stream_id: streamId.toString(),
      title: title
    });

    return result.insertedId;
  } catch (error) {
    console.error('Error creating clip:', error);
    return null;
  }
}

// ============= ADVANCED GIFT, SUBSCRIPTION & TIER SYSTEMS =============

// Gift categories and rarity levels
const GIFT_RARITY = {
  COMMON: { level: 1, multiplier: 1, color: '#808080', emoji: '🎁' },
  RARE: { level: 2, multiplier: 1.5, color: '#4CAF50', emoji: '💝' },
  EPIC: { level: 3, multiplier: 2, color: '#2196F3', emoji: '🎀' },
  LEGENDARY: { level: 4, multiplier: 3, color: '#9C27B0', emoji: '👑' },
  MYTHIC: { level: 5, multiplier: 5, color: '#FF9800', emoji: '✨' }
};

// Subscription tiers
const SUBSCRIPTION_TIERS = {
  FREE: { 
    level: 0, 
    name: 'Free', 
    price: 0, 
    benefits: ['View streams', 'Send messages', 'Basic emojis'],
    color: '#808080'
  },
  BRONZE: { 
    level: 1, 
    name: 'Bronze', 
    price: 4.99, 
    benefits: ['All Free benefits', 'Bronze badge', 'Custom emojis', '5% gift bonus'],
    color: '#CD7F32'
  },
  SILVER: { 
    level: 2, 
    name: 'Silver', 
    price: 9.99, 
    benefits: ['All Bronze benefits', 'Silver badge', 'Priority chat', '10% gift bonus', 'Ad-free'],
    color: '#C0C0C0'
  },
  GOLD: { 
    level: 3, 
    name: 'Gold', 
    price: 19.99, 
    benefits: ['All Silver benefits', 'Gold badge', 'Exclusive emotes', '15% gift bonus', 'Member-only streams'],
    color: '#FFD700'
  },
  PLATINUM: { 
    level: 4, 
    name: 'Platinum', 
    price: 49.99, 
    benefits: ['All Gold benefits', 'Platinum badge', 'Custom badges', '25% gift bonus', 'Direct messaging', 'Monthly treasure box'],
    color: '#E5E4E2'
  },
  DIAMOND: { 
    level: 5, 
    name: 'Diamond', 
    price: 99.99, 
    benefits: ['All Platinum benefits', 'Diamond badge', 'VIP lounge access', '50% gift bonus', 'Priority support', 'Weekly treasure boxes', 'Exclusive content'],
    color: '#b9f2ff'
  }
};

// Track gift combos and streaks
async function trackGiftCombo(username, creatorId, streamId, giftName) {
  if (!db) return;

  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

    // Find active combo
    const activeCombo = await db.collection('gift_combos').findOne({
      username,
      creator_id: creatorId,
      stream_id: streamId,
      gift_name: giftName,
      last_gift_time: { $gte: fiveMinutesAgo },
      active: true
    });

    if (activeCombo) {
      // Update existing combo
      const newCount = activeCombo.combo_count + 1;
      await db.collection('gift_combos').updateOne(
        { _id: activeCombo._id },
        { 
          $set: { 
            combo_count: newCount, 
            last_gift_time: now,
            total_value: activeCombo.total_value + activeCombo.gift_value
          } 
        }
      );

      // Check for combo milestones
      if ([5, 10, 25, 50, 100].includes(newCount)) {
        io.emit('gift_combo_milestone', {
          username,
          gift_name: giftName,
          combo_count: newCount,
          stream_id: streamId.toString()
        });
      }
    } else {
      // Start new combo
      const giftData = await db.collection('gifts').findOne({
        sender_username: username,
        gift_name: giftName
      });

      await db.collection('gift_combos').insertOne({
        username,
        creator_id: creatorId,
        stream_id: streamId,
        gift_name: giftName,
        combo_count: 1,
        total_value: giftData?.total_value || 0,
        gift_value: giftData?.total_value || 0,
        start_time: now,
        last_gift_time: now,
        active: true
      });
    }
  } catch (error) {
    console.error('Error tracking gift combo:', error);
  }
}

// Track gift streaks (consecutive days)
async function trackGiftStreak(username, creatorId) {
  if (!db) return;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const streak = await db.collection('gift_streaks').findOne({
      username,
      creator_id: creatorId
    });

    if (streak) {
      const lastGiftDate = new Date(streak.last_gift_date);
      lastGiftDate.setHours(0, 0, 0, 0);

      if (lastGiftDate.getTime() === yesterday.getTime()) {
        // Continue streak
        const newCount = streak.streak_count + 1;
        await db.collection('gift_streaks').updateOne(
          { _id: streak._id },
          { 
            $set: { 
              streak_count: newCount, 
              last_gift_date: today,
              longest_streak: Math.max(streak.longest_streak || 0, newCount)
            } 
          }
        );

        // Emit streak milestone
        if ([7, 14, 30, 60, 100, 365].includes(newCount)) {
          io.emit('gift_streak_milestone', {
            username,
            streak_count: newCount,
            creator_id: creatorId.toString()
          });
        }
      } else if (lastGiftDate.getTime() !== today.getTime()) {
        // Streak broken, reset
        await db.collection('gift_streaks').updateOne(
          { _id: streak._id },
          { $set: { streak_count: 1, last_gift_date: today } }
        );
      }
    } else {
      // Start new streak
      await db.collection('gift_streaks').insertOne({
        username,
        creator_id: creatorId,
        streak_count: 1,
        longest_streak: 1,
        last_gift_date: today,
        created_at: new Date()
      });
    }
  } catch (error) {
    console.error('Error tracking gift streak:', error);
  }
}

// Handle treasure box opening
async function openTreasureBox(userId, treasureBoxType, creatorId) {
  if (!db) return null;

  try {
    // Treasure box rewards based on type
    const treasureBoxRewards = {
      BASIC: { diamonds: [10, 50], coins: [20, 100], probability: 0.8 },
      SILVER: { diamonds: [50, 200], coins: [100, 400], probability: 0.6 },
      GOLD: { diamonds: [200, 500], coins: [400, 1000], probability: 0.4 },
      PLATINUM: { diamonds: [500, 1500], coins: [1000, 3000], probability: 0.2 },
      LEGENDARY: { diamonds: [1500, 5000], coins: [3000, 10000], probability: 0.1 }
    };

    const boxConfig = treasureBoxRewards[treasureBoxType];
    if (!boxConfig) return null;

    // Random reward
    const diamondsWon = Math.floor(
      Math.random() * (boxConfig.diamonds[1] - boxConfig.diamonds[0]) + boxConfig.diamonds[0]
    );
    const coinsWon = diamondsWon * 2;

    const reward = {
      user_id: userId,
      creator_id: creatorId,
      box_type: treasureBoxType,
      diamonds_won: diamondsWon,
      coins_won: coinsWon,
      opened_at: new Date()
    };

    await db.collection('treasure_box_history').insertOne(reward);

    // Update user rewards
    await db.collection('user_rewards').updateOne(
      { user_id: userId },
      { 
        $inc: { 
          total_diamonds_from_boxes: diamondsWon,
          total_coins_from_boxes: coinsWon,
          boxes_opened: 1
        },
        $setOnInsert: { created_at: new Date() }
      },
      { upsert: true }
    );

    // Emit treasure box reward
    io.emit('treasure_box_opened', {
      user_id: userId.toString(),
      box_type: treasureBoxType,
      diamonds: diamondsWon,
      coins: coinsWon
    });

    return reward;
  } catch (error) {
    console.error('Error opening treasure box:', error);
    return null;
  }
}

// Track subscription
async function manageSubscription(userId, creatorId, tier, duration = 'monthly') {
  if (!db) return;

  try {
    const tierConfig = SUBSCRIPTION_TIERS[tier];
    if (!tierConfig) return;

    const now = new Date();
    const expiresAt = new Date(now);
    if (duration === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (duration === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      // Yearly gets 2 months free
      expiresAt.setMonth(expiresAt.getMonth() + 2);
    }

    const subscription = {
      user_id: new ObjectId(userId),
      creator_id: new ObjectId(creatorId),
      tier,
      tier_level: tierConfig.level,
      price: tierConfig.price,
      duration,
      start_date: now,
      expires_at: expiresAt,
      auto_renew: true,
      status: 'active'
    };

    await db.collection('subscriptions').insertOne(subscription);

    // Update creator subscriber count
    await db.collection('creators').updateOne(
      { _id: new ObjectId(creatorId) },
      { $inc: { total_subscribers: 1, [`subscribers_${tier.toLowerCase()}`]: 1 } }
    );

    // Emit subscription event
    io.emit('new_subscription', {
      user_id: userId.toString(),
      creator_id: creatorId.toString(),
      tier,
      tier_level: tierConfig.level
    });

    return subscription;
  } catch (error) {
    console.error('Error managing subscription:', error);
  }
}

// Get active subscription benefits
async function getSubscriptionBenefits(userId, creatorId) {
  if (!db) return { tier: 'FREE', benefits: SUBSCRIPTION_TIERS.FREE.benefits };

  try {
    const subscription = await db.collection('subscriptions').findOne({
      user_id: new ObjectId(userId),
      creator_id: new ObjectId(creatorId),
      status: 'active',
      expires_at: { $gt: new Date() }
    });

    if (subscription) {
      return {
        tier: subscription.tier,
        benefits: SUBSCRIPTION_TIERS[subscription.tier].benefits,
        expires_at: subscription.expires_at,
        gift_bonus: SUBSCRIPTION_TIERS[subscription.tier].benefits.find(b => b.includes('gift bonus'))
      };
    }

    return { tier: 'FREE', benefits: SUBSCRIPTION_TIERS.FREE.benefits };
  } catch (error) {
    console.error('Error getting subscription benefits:', error);
    return { tier: 'FREE', benefits: SUBSCRIPTION_TIERS.FREE.benefits };
  }
}

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
    viewers: [100, 500, 1000, 5000, 10000, 25000, 50000, 75000, 100000, 250000, 500000, 1000000],
    gifts: [10, 50, 100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000],
    diamonds: [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 750000, 1000000, 2500000, 5000000, 10000000],
    coins: [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000],
    followers: [10, 50, 100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 75000, 100000]
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
      total_gifts_count: 0,
      total_coins: 0,
      total_shares: 0,
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

    // Update chat velocity
    await updateChatVelocity(currentStreamId);

    // Log activity
    await logActivity('chat', {
      stream_id: currentStreamId.toString(),
      username: data.uniqueId,
      nickname: data.nickname,
      message: data.comment
    });

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
    const coinValue = giftValue * 2; // Coins are typically 2x diamonds
    
    const gift = {
      stream_id: currentStreamId,
      creator_id: new ObjectId(creatorId),
      sender_username: data.uniqueId,
      sender_nickname: data.nickname,
      gift_id: data.giftId,
      gift_name: data.giftName,
      gift_type: data.giftType,
      diamond_count: data.diamondCount || 0,
      coin_value: coinValue,
      repeat_count: data.repeatCount || 1,
      repeat_end: data.repeatEnd || false,
      total_value: giftValue,
      timestamp: new Date()
    };

    await db.collection('gifts').insertOne(gift);

    // Update stream total gifts value and coins
    await db.collection('live_streams').updateOne(
      { _id: currentStreamId },
      { 
        $inc: { 
          total_gifts_value: giftValue, 
          total_gifts_count: 1,
          total_coins: coinValue
        } 
      }
    );

    // Track fan engagement and update fan tier based on gift value
    await trackFanEngagement(data.uniqueId, data.nickname, currentStreamId, 'gift', giftValue);
    
    // Track gift combo and streak
    await trackGiftCombo(data.uniqueId, new ObjectId(creatorId), currentStreamId, data.giftName);
    await trackGiftStreak(data.uniqueId, new ObjectId(creatorId));
    
    // Check and award badges
    await checkAndAwardBadges(data.uniqueId, creatorId);

    // Check milestones
    const stream = await db.collection('live_streams').findOne({ _id: currentStreamId });
    if (stream) {
      await checkStreamMilestones(currentStreamId, new ObjectId(creatorId), 'diamonds', stream.total_gifts_value || 0);
      await checkStreamMilestones(currentStreamId, new ObjectId(creatorId), 'gifts', stream.total_gifts_count || 0);
      await checkStreamMilestones(currentStreamId, new ObjectId(creatorId), 'coins', stream.total_coins || 0);
    }

    // Log activity
    await logActivity('gift', {
      stream_id: currentStreamId.toString(),
      username: data.uniqueId,
      nickname: data.nickname,
      gift_name: data.giftName,
      diamonds: giftValue,
      coins: coinValue
    });

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

    // Check viewer milestones
    await checkStreamMilestones(currentStreamId, new ObjectId(creatorId), 'viewers', viewerCount);

    // Update stream metrics
    await updateStreamMetrics(currentStreamId, 'viewer_peak', { count: viewerCount });

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

    // Log share event
    await db.collection('shares').insertOne({
      stream_id: currentStreamId,
      sender_username: data.uniqueId,
      timestamp: new Date()
    });

    // Update stream shares count
    await db.collection('live_streams').updateOne(
      { _id: currentStreamId },
      { $inc: { total_shares: 1 } }
    );

    // Log activity
    await logActivity('share', {
      stream_id: currentStreamId.toString(),
      username: data.uniqueId
    });

    io.emit('new_share', {
      stream_id: currentStreamId.toString(),
      username: data.uniqueId
    });
  });

  // Follow event
  connection.on('follow', async (data) => {
    if (!currentStreamId) return;

    // Track follower
    await trackFollowerGrowth(new ObjectId(creatorId), currentStreamId, data.uniqueId);

    // Check follower milestones
    const creator = await db.collection('creators').findOne({ _id: new ObjectId(creatorId) });
    if (creator && creator.total_followers_gained) {
      await checkStreamMilestones(currentStreamId, new ObjectId(creatorId), 'followers', creator.total_followers_gained);
    }

    // Log activity
    await logActivity('follow', {
      stream_id: currentStreamId.toString(),
      username: data.uniqueId,
      nickname: data.nickname
    });

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

  // Test event for Sprint 1
  socket.emit('welcome', { message: 'Connected to TikTok AI Command Center' });

  // Listen for ping
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ============= ERROR HANDLERS =============
// Apply error handlers AFTER all routes
app.use(notFoundHandler);
app.use(errorHandler);

// ============= STARTUP =============
const PORT = process.env.PORT || 8001;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize automation tasks
  setupAutomation();
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
