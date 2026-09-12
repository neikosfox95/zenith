import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ObjectId } from 'mongodb';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
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
import config, { ensureDir, configWarnings } from './config/index.js';
import dbManager, { requireDb, DB_STATE, ServiceUnavailableError } from './lib/db.js';
import { requireAuth, verifyToken } from './middleware/auth.js';
import { emitLive, emitToUser, REALTIME_EVENTS, userRoom } from './lib/realtime-events.js';
import * as uploadMiddlewareModule from './middleware/upload.js';
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
import aiStudioRoutes from './ai_studio_routes.js';
import aiStudioAPIRoutes from './routes/ai-studio.js';
import { setupSocketIOTests} from './socketio_test_routes.js';
import analyticsRoutes from './routes/analytics.js';
import analyticsEngine from './services/analytics-engine.js';
import creatorRoutes from './routes/creators.js';
import aiRoutes from './routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// ------------------------------------------------------------
// Proxy awareness
// ------------------------------------------------------------
// FIX: the app runs behind nginx / a preview proxy. Without `trust proxy`,
// req.ip is always the proxy address, so express-rate-limit put *every*
// visitor in a single bucket and the 300 req/15min API limiter locked the
// whole app out after a few minutes of normal use.
app.set('trust proxy', config.server.trustProxy);
app.disable('x-powered-by');

const io = new Server(httpServer, {
  // FIX: was `origin: '*'` with only GET/POST allowed, which blocks the
  // Socket.IO handshake (it needs PUT/DELETE/OPTIONS in some transports)
  // and is incompatible with credentialed requests.
  cors: config.cors,
  path: '/socket.io',
  transports: ['websocket', 'polling'],
});

// ------------------------------------------------------------
// Middleware
// ------------------------------------------------------------
if (config.security.helmet) {
  app.use(
    helmet({
      // The Expo web preview is served cross-origin inside an iframe.
      contentSecurityPolicy: config.isProduction ? undefined : false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
}
if (config.security.compression) {
  app.use(compression());
}
app.use(cors(config.cors));
app.use(express.json({ limit: config.server.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.server.bodyLimit }));

// Lightweight request log (off during tests to keep output readable).
if (config.server.requestLog) {
  app.use((req, res, next) => {
    const started = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      if (res.statusCode >= 400 || ms > 1000) {
        console.log(`[http] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms.toFixed(0)}ms)`);
      }
    });
    next();
  });
}

// Serve uploaded media directly from disk. Previously uploads were only
// reachable through an authenticated route that pointed at a hardcoded
// '/app/backend/uploads' path, so <img>/<video> tags could never load them.
app.use(config.uploads.publicUrl, express.static(config.paths.uploads, { fallthrough: true, maxAge: '1h' }));

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

// ============================================================
// DATABASE
// ------------------------------------------------------------
// Connection ownership moved to lib/db.js (single shared manager).
// Previously this file created its own MongoClient while lib/mongo.js
// created a *second* one, so /api/analytics and /api/creators could be
// down while the rest of the API was up (and vice versa).
// ============================================================

/**
 * `db` is a live view onto the shared connection.
 *
 * FIX: it used to be `let db;` assigned only inside connectDB(). When Mongo
 * was unreachable `db` stayed `undefined` and ~120 handlers did
 * `db.collection(...)` -> "TypeError: Cannot read properties of undefined",
 * surfaced to clients as an opaque 500. The proxy keeps every existing
 * `db.collection(...)` call site working but converts "not connected" into a
 * proper 503 with an actionable message.
 */
const db = new Proxy(
  {},
  {
    get(_target, prop) {
      const live = dbManager.tryGetDb();
      if (!live) {
        throw new ServiceUnavailableError(
          'Database is not available',
          'DB_UNAVAILABLE',
          { state: dbManager.state, lastError: dbManager.lastError?.message }
        );
      }
      return Reflect.get(live, prop);
    },
    has(_target, prop) {
      return Reflect.has(dbManager.tryGetDb() ?? {}, prop);
    },
  }
);

async function ensureIndexes(database) {
  const specs = [
    ['users', { email: 1 }, { unique: true }],
    ['creators', { tiktok_username: 1 }, {}],
    ['user_creators', { user_id: 1, creator_id: 1 }, {}],
    ['live_streams', { creator_id: 1, start_time: -1 }, {}],
    ['gifts', { stream_id: 1, timestamp: -1 }, {}],
    ['events', { creator_id: 1, timestamp: -1 }, {}],
    ['notifications', { user_id: 1, created_at: -1 }, {}],
    ['uploads', { userId: 1, createdAt: -1 }, {}],
  ];
  await Promise.all(
    specs.map(([name, keys, options]) =>
      database
        .collection(name)
        .createIndex(keys, options)
        // DuplicateIndex / IndexOptionsConflict are both benign here.
        .catch((err) => console.warn(`[db] index ${name}: ${err.message}`))
    )
  );
}

// ------------------------------------------------------------
// Route mounting — DB-INDEPENDENT
// ------------------------------------------------------------
// FIX (root cause of "backend does not respond"): every route below used to be
// mounted *inside* connectDB()'s try block, after `await client.connect()`.
// When Mongo was slow or unreachable the server still listened on the port but
// exposed almost no routes, so requests 404'd or timed out — exactly the
// "unstable, non-responsive backend" symptom. Routes are now mounted
// unconditionally at startup; only the DB handle is lazy.
// ------------------------------------------------------------
function mountRoutes() {
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

// ------------------------------------------------------------
// Authentication for the externally-mounted route groups
// ------------------------------------------------------------
// FIX (security): none of these routers had any auth. routes/creators.js,
// routes/analytics.js, routes/ai.js, routes/ai-studio.js and
// phase21..30_routes.js were all reachable anonymously — including the ones
// that write and delete (POST /api/creators/bulk-add, AI generation that burns
// provider credits, analytics mutations).
//
// `requireAuth` is mounted on the parent path so it runs before the router's
// own middleware for everything underneath it. The phase-route *setup
// functions* (phase3..20) already receive `authenticateToken` and apply it
// per-route, so they are not touched here.
//
// Set AUTH_MODE=permissive to log anonymous access instead of rejecting it
// while auditing which clients still need to start sending a token.
// ------------------------------------------------------------
// NOTE: '/api/health' is deliberately NOT in this list. Phase 23 is a
// *Health & Wellness AI* feature router that happens to be mounted on the same
// prefix as the system health endpoint. Applying requireAuth there made the
// router match /api/health first and answer 401 before the unauthenticated
// system health route (registered later in this file) could run — which is
// exactly the kind of collision that made the API look "unstable". The Phase 23
// router is still authenticated; it simply does not gate GET /api/health.
const AUTHENTICATED_MOUNTS = [
  '/api/gaming',
  '/api/ecommerce',
  '/api/education',
  '/api/finance',
  '/api/travel',
  '/api/smarthome',
  '/api/legal',
  '/api/sports',
  '/api/environment',
  '/api/ai-studio',
  '/api/analytics',
  '/api/creators',
  '/api/ai',
];
AUTHENTICATED_MOUNTS.forEach((mountPath) => app.use(mountPath, requireAuth));

// Dev-only diagnostics must never ship enabled.
if (!config.isProduction) {
  app.use('/api/socket-test', requireAuth);
}

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

// AI STUDIO ROUTES - ZENITH GRADE SUPER APP
console.log('🎨 Setting up AI Studio (Text, Image, Video, Voice, Music, Music Video, MCPs) routes...');
app.use('/api/ai-studio', aiStudioRoutes);
console.log('✅ AI Studio routes loaded - 100+ AI Models integrated!');

// AI STUDIO V2 API ROUTES (Phase 2 - Atlas Cloud Integration)
console.log('☁️ Setting up AI Studio V2 API (Atlas Cloud + Fallback) routes...');
app.use('/api/ai-studio/v2', aiStudioAPIRoutes);
console.log('✅ AI Studio V2 API routes loaded - Atlas Cloud primary + Emergent fallback!');

// PHASE 6: SOCKET.IO TESTING ROUTES
if (!config.isProduction) {
  console.log('🔌 Setting up Socket.IO Testing routes (Phase 6)...');
  const socketTestRoutes = setupSocketIOTests(app, io);
  app.use('/api/socket-test', socketTestRoutes);
  console.log('✅ Phase 6: Socket.IO Testing routes loaded (dev only)!');
} else {
  console.log('🔌 Socket.IO Testing routes skipped (NODE_ENV=production)');
}

// ANALYTICS ENGINE ROUTES
console.log('📊 Setting up Analytics Engine routes...');
app.use('/api/analytics', analyticsRoutes);
console.log('✅ Analytics Engine routes loaded!');

// Creator Management Routes
console.log('👥 Setting up Creator Management routes...');
app.use('/api/creators', creatorRoutes);
console.log('✅ Creator Management routes loaded!');

// AI Routes
app.use('/api/ai', aiRoutes);
console.log('✅ AI Orchestration routes loaded!');
}

/**
 * Route groups that genuinely need a live DB handle injected at mount time.
 * Mounted as soon as the first successful connection lands (and re-mounted is
 * a no-op because Express keeps the first registration).
 */
let dbRoutesMounted = false;
async function mountDbRoutes() {
  if (dbRoutesMounted) return;
  const database = dbManager.tryGetDb();
  if (!database) return;
  dbRoutesMounted = true;

  // Start Analytics Engine
  try {
    await analyticsEngine.start();
  } catch (err) {
    console.warn('[boot] analytics engine failed to start:', err.message);
  }
}

dbManager.on('connected', async (database) => {
  try {
    await ensureIndexes(database);
  } catch (err) {
    console.warn('[db] index creation failed:', err.message);
  }
  await mountDbRoutes();
});

// Boot: kick off the DB connection without blocking startup.
// Route mounting happens further down, right after authenticateToken is
// defined, because the phase-route setup functions take it by value.
const bootConnection = dbManager.connect({ retry: true }).catch((err) => {
  console.warn('[boot] initial DB connection failed:', err.message);
  return null;
});
if (config.mongo.blockStartup) {
  await bootConnection;
}


// Storage for active TikTok connections
const activeConnections = new Map();
const activeRecordings = new Map();

// Ensure video storage directory exists.
// FIX: was path.join(__dirname, 'recorded_streams') with an unguarded
// mkdirSync — recordings landed inside the source tree (and were committed),
// and an unwritable checkout crashed the process at import time.
const videoDir = ensureDir(config.paths.recordings) || config.paths.recordings;

// ------------------------------------------------------------
// DB readiness guard for background jobs
// ------------------------------------------------------------
// FIX: dozens of cron/alert/analytics helpers began with `if (!isDbReady()) return;`.
// Now that `db` is a Proxy it is *always* truthy, so those guards would have
// silently stopped guarding and the next `db.collection(...)` would throw
// inside a timer callback — an unhandled rejection that can take the process
// down. `isDbReady()` restores the original intent.
const isDbReady = () => dbManager.isConnected;

/**
 * Recordings directory.
 * Lazily resolved so the health payload can be built regardless of where this
 * constant ends up relative to the route definitions in the module body.
 */
const recordingsDir = () => config.paths.recordings;

// ============= AUTH MIDDLEWARE =============
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied', code: 'NO_TOKEN' });
  }

  try {
    // FIX: was jwt.verify(token, config.jwt.secret). With JWT_SECRET
    // unset this threw "secretOrPrivateKey must have a value" for *every*
    // request, so every authenticated endpoint returned 403 "Invalid token"
    // no matter how valid the token was.
    const verified = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
    });
    req.userId = verified.userId ?? verified.id;
    req.user = { userId: req.userId }; // For compatibility with phase routes
    next();
  } catch (error) {
    const expired = error.name === 'TokenExpiredError';
    return res.status(401).json({
      error: expired ? 'Token expired' : 'Invalid token',
      code: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
    });
  }
};

// ------------------------------------------------------------
// Token issuance
// ------------------------------------------------------------
// FIX: tokens were signed with no `expiresIn` and no `issuer`, while
// verification (authenticateToken) *did* check the issuer — so every token the
// server minted was rejected by the server. One helper keeps sign/verify in
// lockstep.
const signToken = (payload, options = {}) =>
  jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    ...options,
  });

// ------------------------------------------------------------
// Mount the DB-independent route groups now that authenticateToken exists.
// (Must happen after its definition: mountRoutes() passes it by value to the
// phase-route setup functions.)
// ------------------------------------------------------------
mountRoutes();


// ============= HEALTH CHECKS =============
// FIX: `/api/health` used to report `status: 'ok'` even when Mongo was down
// (it only stringified a truthiness check), and there was no unauthenticated
// liveness probe at all — every route sat behind the API rate limiter.
//
//   GET /health         -> liveness: "is the process up?" (always 200)
//   GET /health/ready   -> readiness: 200 when DB is up, 503 when not
//   GET /api/health     -> detailed status for the app's status screen

const buildHealthPayload = () => {
  const database = dbManager.status();
  const warnings = configWarnings();
  return {
    status: database.connected ? 'ok' : 'degraded',
    message: 'TikTok Live Monitor API is running',
    version: process.env.npm_package_version || '1.0.0',
    env: config.env,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    // Backwards-compatible field (older frontend builds read this).
    database: database.connected ? 'connected' : 'disconnected',
    components: {
      database,
      uploads: {
        available: Boolean(uploadsAvailability().available),
        path: config.paths.uploads,
      },
      recordings: { path: recordingsDir() },
      redis: { enabled: config.redis.enabled },
      ai: {
        providers: Object.entries(config.ai)
          .filter(([, v]) => Boolean(v))
          .map(([k]) => k),
      },
      smtp: { enabled: config.smtp.enabled },
    },
    warnings,
  };
};

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ready', (req, res) => {
  const ready = dbManager.isConnected;
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not-ready',
    database: dbManager.status(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  const payload = buildHealthPayload();
  // 200 even when degraded: the API *is* serving, it just has a warning.
  res.status(200).json(payload);
});

// ============= AUTH ROUTES =============
app.post('/api/auth/register', authLimiter, requireDb, async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(config.bcrypt.saltRounds);
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
    const token = signToken({ userId: result.insertedId });

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

app.post('/api/auth/login', authLimiter, requireDb, async (req, res) => {
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
    const token = signToken({ userId: user._id });

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
app.post('/api/login', authLimiter, requireDb, async (req, res) => {
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
    const token = signToken({ userId: user._id });
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

app.post('/api/register', authLimiter, requireDb, async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(config.bcrypt.saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = {
      email,
      username,
      password: hashedPassword,
      createdAt: new Date()
    };
    const result = await db.collection('users').insertOne(user);
    const token = signToken({ userId: result.insertedId });
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
app.post('/api/creators', authenticateToken, requireDb, async (req, res) => {
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

app.get('/api/creators', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/search/creators', authenticateToken, requireDb, async (req, res) => {
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
// FIX: this was `await import(...)` at module top level, which forced the
// whole file to be treated as an async module graph and made the import
// order fragile. It is now a normal static import (see top of file).
const uploadMiddleware = uploadMiddlewareModule;
const {
  uploadSingle,
  uploadImage,
  uploadVideo,
  uploadAudio,
  handleMulterError,
  saveFileMetadata,
  requireUploads,
} = uploadMiddleware.default || uploadMiddleware;

/** Storage availability for the health payload. */
function uploadsAvailability() {
  return {
    available: Boolean(uploadMiddleware.uploadsAvailable),
    root: uploadMiddleware.uploadsRoot ?? null,
    path: config.paths.uploads,
  };
}

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
app.post('/api/notifications/register', authenticateToken, requireDb, async (req, res) => {
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
app.delete('/api/notifications/register', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/notifications', authenticateToken, requireDb, async (req, res) => {
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
app.patch('/api/notifications/:id/read', authenticateToken, requireDb, async (req, res) => {
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
app.patch('/api/notifications/read-all', authenticateToken, requireDb, async (req, res) => {
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
app.delete('/api/notifications/:id', authenticateToken, requireDb, async (req, res) => {
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
app.patch('/api/notifications/preferences', authenticateToken, requireDb, async (req, res) => {
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
app.post('/api/notifications/test/live-alert', authenticateToken, requireDb, async (req, res) => {
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
app.post('/api/notifications/test/gift', authenticateToken, requireDb, async (req, res) => {
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
app.post('/api/notifications/send', authenticateToken, requireDb, async (req, res) => {
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
app.post('/api/upload', authenticateToken, uploadLimiter, requireDb, (req, res, next) => {
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
app.post('/api/upload/image', authenticateToken, uploadLimiter, requireDb, (req, res, next) => {
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
app.post('/api/upload/video', authenticateToken, uploadLimiter, requireDb, (req, res, next) => {
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
app.get('/api/uploads', authenticateToken, requireDb, async (req, res) => {
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

  // FIX: was path.join('/app/backend/uploads', ...) — a hardcoded path from a
  // previous container layout, so this route 404'd everywhere else.
  // Also: `type`/`filename` came straight from the URL into path.join, which
  // allowed traversal (`/api/uploads/..%2f..%2fserver.js`). Both segments are
  // now validated and the resolved path must stay inside the uploads root.
  if (!config.paths.uploadSubdirs.includes(type)) {
    return res.status(400).json({ error: 'Invalid upload type', code: 'INVALID_UPLOAD_TYPE' });
  }
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename', code: 'INVALID_FILENAME' });
  }

  const uploadsRoot = path.resolve(config.paths.uploads);
  const filePath = path.resolve(uploadsRoot, type, filename);
  if (!filePath.startsWith(uploadsRoot + path.sep)) {
    return res.status(400).json({ error: 'Invalid path', code: 'PATH_TRAVERSAL' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.sendFile(filePath);
});

// Delete uploaded file
app.delete('/api/uploads/:id', authenticateToken, requireDb, async (req, res) => {
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

app.delete('/api/creators/:creatorId', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams', authenticateToken, requireDb, async (req, res) => {
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

app.get('/api/streams/:streamId', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams/:streamId/gifts', authenticateToken, requireDb, async (req, res) => {
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
app.post('/api/auth/2fa/enable', authenticateToken, requireDb, async (req, res) => {
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
app.post('/api/auth/2fa/verify', authenticateToken, requireDb, async (req, res) => {
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
app.post('/api/auth/2fa/validate', requireDb,  async (req, res) => {
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
    const token = signToken({ userId: user._id, id: user._id, email: user.email });

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
app.post('/api/auth/2fa/disable', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/auth/2fa/status', authenticateToken, requireDb, async (req, res) => {
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
app.post('/api/auth/password-reset/request', requireDb,  async (req, res) => {
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
app.post('/api/auth/password-reset/confirm', requireDb,  async (req, res) => {
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
app.post('/api/creators/:creatorId/tags', authenticateToken, requireDb, async (req, res) => {
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
app.delete('/api/creators/:creatorId/tags/:tag', authenticateToken, requireDb, async (req, res) => {
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
app.post('/api/creators/:creatorId/favorite', authenticateToken, requireDb, async (req, res) => {
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

app.delete('/api/creators/:creatorId/favorite', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/favorites', authenticateToken, requireDb, async (req, res) => {
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
app.post('/api/creators/:creatorId/notes', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/notes', authenticateToken, requireDb, async (req, res) => {
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
app.put('/api/creators/notes/:noteId', authenticateToken, requireDb, async (req, res) => {
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
app.delete('/api/creators/notes/:noteId', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/score', authenticateToken, requireDb, async (req, res) => {
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
app.post('/api/creators/compare', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/gift-patterns', authenticateToken, requireDb, async (req, res) => {
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
app.post('/api/roi/calculate', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams/:streamId/chats', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams/:streamId/video', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams/:streamId/analytics', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/activity', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams/:streamId/milestones', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/milestones', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/follower-growth', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/revenue', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams/:streamId/chat-analytics', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/coins', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams/:streamId/gift-combos', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/gift-streaks', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/users/:username/gift-streak', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/gift-analytics', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/users/:userId/subscriptions', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/subscribers', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/users/:userId/treasure-boxes', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams/:streamId/health', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams/:streamId/demographics', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams/:streamId/sentiment', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams/:streamId/highlights', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams/:streamId/clips', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams/:streamId/engagement-score', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/historical', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/fans', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/superfans', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/fans/:username', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/fanclub/stats', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/creators/:creatorId/leaderboard', authenticateToken, requireDb, async (req, res) => {
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
app.get('/api/streams/:streamId/video', authenticateToken, requireDb, async (req, res) => {
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

// ------------------------------------------------------------
// Email notification system
// ------------------------------------------------------------
// FIX: the transporter was built with placeholder credentials
// (`user: 'noreply@tiktokmonitor.com', pass: 'password'`) whenever SMTP_USER /
// SMTP_PASS were unset. Nodemailer then attempted a real SMTP AUTH against
// gmail.com on every alert and failed slowly, blocking the caller. The
// transporter is now only created when credentials actually exist, and
// sendEmailNotification short-circuits with a clear log line otherwise.
const emailTransporter = config.smtp.enabled
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    })
  : null;

if (!emailTransporter) {
  console.log('[mail] SMTP not configured — email notifications disabled');
}

// Send email notification
async function sendEmailNotification(to, subject, html) {
  if (!emailTransporter) {
    console.warn(`[mail] skipped (SMTP not configured): to=${to} subject="${subject}"`);
    return false;
  }
  if (!to) return false;
  try {
    const info = await emailTransporter.sendMail({
      from: `"TikTok Live Monitor" <${config.smtp.from}>`,
      to,
      subject,
      html,
    });
    console.log('[mail] sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[mail] error:', error.message);
    return false;
  }
}

// Push notification system
async function sendPushNotification(userId, title, body, data = {}) {
  if (!isDbReady()) return;

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
    emitToUser(io, userId, REALTIME_EVENTS.NOTIFICATION, notification);

    return notification;
  } catch (error) {
    console.error('Push notification error:', error);
  }
}

// Webhook system
async function triggerWebhook(event, data) {
  if (!isDbReady()) return;

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
  if (!isDbReady()) return;

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
  if (!isDbReady()) return null;

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
/** Scheduled tasks, kept so shutdown can stop them. */
const scheduledTasks = [];

/**
 * Register a cron job that can never take the process down.
 *
 * FIX: these callbacks used to be bare `async () => { await db.collection(...) }`.
 * When Mongo was unreachable the `db` proxy threw inside a timer callback,
 * producing an unhandled rejection — which on Node >= 15 terminates the
 * process by default. A database outage would therefore have killed the API on
 * the hour, every hour. They also never checked DB availability, and the task
 * handles were discarded so they kept firing during graceful shutdown.
 */
/**
 * node-cron throws an opaque `TypeError: Cannot read properties of undefined
 * (reading 'replace')` when an expression has fewer than five fields, because
 * it indexes the month/weekday slots without checking they exist. Validate
 * first so a typo produces an actionable message instead.
 */
function isValidCronExpression(expression) {
  if (typeof expression !== 'string') return false;
  const fields = expression.trim().split(/\s+/);
  // 5 fields (minute-first) or 6 fields (second-first) are both accepted.
  if (fields.length !== 5 && fields.length !== 6) return false;
  try {
    return cron.validate(expression.trim()) !== false;
  } catch {
    return false;
  }
}

function scheduleTask(name, expression, task) {
  if (!isValidCronExpression(expression)) {
    // FIX: 'hourly-analytics' was registered as `0 * * *` — four fields, which
    // is not a cron expression at all. It had never run, and under node-cron v4
    // it threw during setupAutomation().
    console.error(
      `[cron] "${name}" was NOT scheduled: "${expression}" is not a valid cron expression ` +
        `(expected 5 fields "min hour dom mon dow" or 6 fields with leading seconds)`
    );
    return null;
  }

  const job = cron.schedule(expression.trim(), async () => {
    if (!dbManager.isConnected) {
      console.warn(`[cron] ${name} skipped — database unavailable`);
      return;
    }
    const started = Date.now();
    try {
      await task();
      console.log(`[cron] ${name} finished in ${Date.now() - started}ms`);
    } catch (err) {
      console.error(`[cron] ${name} failed: ${err.message}`);
    }
  });
  scheduledTasks.push({ name, job });
  return job;
}

function setupAutomation() {
  scheduleTask('daily-backup', '0 2 * * *', async () => {
    await backupData();
  });

  // FIX: was '0 * * *' (4 fields) — an invalid expression that silently
  // prevented the hourly analytics rollup from ever being scheduled.
  scheduleTask('hourly-analytics', '0 * * * *', async () => {
    const creators = await db.collection('creators').find().toArray();
    for (const creator of creators) {
      await calculateCreatorScore(creator._id);
    }
  });

  scheduleTask('daily-report', '0 0 * * *', async () => {
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

  console.log(
    `[cron] ${scheduledTasks.filter((t) => t.job).length}/${scheduledTasks.length} automation tasks scheduled`
  );
}

/** Stop every scheduled task (called during graceful shutdown). */
function stopAutomation() {
  for (const { name, job } of scheduledTasks) {
    if (!job) continue;
    try {
      job.stop();
    } catch (err) {
      console.warn(`[cron] could not stop ${name}: ${err.message}`);
    }
  }
  scheduledTasks.length = 0;
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
  if (!isDbReady()) return;

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
  if (!isDbReady()) return 0;

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
  if (!isDbReady()) return null;

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
  if (!isDbReady() || !streamId) return;

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
  if (!isDbReady()) return;

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
  if (!isDbReady()) return 0;

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
  if (!isDbReady()) return;

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
  if (!isDbReady()) return;

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
  if (!isDbReady()) return null;

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
    emitLive(io, REALTIME_EVENTS.CLIP_CREATED, {
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
  if (!isDbReady()) return;

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
        emitLive(io, REALTIME_EVENTS.GIFT_COMBO_MILESTONE, {
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
  if (!isDbReady()) return;

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
          emitLive(io, REALTIME_EVENTS.GIFT_STREAK_MILESTONE, {
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
  if (!isDbReady()) return null;

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
    emitLive(io, REALTIME_EVENTS.TREASURE_BOX_OPENED, {
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
  if (!isDbReady()) return;

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
    emitLive(io, REALTIME_EVENTS.SUBSCRIPTION_CREATED, {
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
  if (!isDbReady()) return { tier: 'FREE', benefits: SUBSCRIPTION_TIERS.FREE.benefits };

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
  if (!isDbReady() || !streamId) return;

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
  if (!isDbReady()) return;

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
  if (!isDbReady()) return;

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
        emitLive(io, REALTIME_EVENTS.MILESTONE_ACHIEVED, {
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
  if (!isDbReady()) return 0;

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
  if (!isDbReady()) return;

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
  if (!isDbReady()) return;

  try {
    const activity = {
      type: activityType,
      data: data,
      timestamp: new Date()
    };

    await db.collection('activity_feed').insertOne(activity);

    // Emit to real-time feed
    emitLive(io, REALTIME_EVENTS.LIVE_EVENT, { creator_id: activity?.creator_id, ...activity });

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
  if (!isDbReady()) return;

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
        emitLive(io, REALTIME_EVENTS.FAN_TIER_UPGRADE, {
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
  if (!isDbReady()) return;

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
        emitLive(io, REALTIME_EVENTS.BADGE_EARNED, {
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
    // Canonical `stream:started` + `creator:status`, with the legacy
    // `creator_live` alias emitted automatically for older clients.
    emitLive(io, REALTIME_EVENTS.STREAM_STARTED, {
      creator_id: creatorId,
      tiktok_username: tiktokUsername,
      stream_id: currentStreamId,
      viewer_count: 0,
    });
    emitLive(io, REALTIME_EVENTS.CREATOR_STATUS, {
      creator_id: creatorId,
      tiktok_username: tiktokUsername,
      stream_id: currentStreamId,
      is_live: true,
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
      emitLive(io, REALTIME_EVENTS.STREAM_ENDED, {
        creator_id: creatorId,
        tiktok_username: tiktokUsername,
        stream_id: currentStreamId,
        viewer_count: 0,
      });
      emitLive(io, REALTIME_EVENTS.CREATOR_STATUS, {
        creator_id: creatorId,
        tiktok_username: tiktokUsername,
        stream_id: currentStreamId,
        is_live: false,
        viewer_count: 0,
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
    // FIX: the legacy payload carried only stream_id, so a client could not
    // attribute a comment to a creator without a second round-trip.
    emitLive(io, REALTIME_EVENTS.LIVE_COMMENT, {
      creator_id: creatorId,
      tiktok_username: tiktokUsername,
      stream_id: currentStreamId,
      username: data.uniqueId,
      nickname: data.nickname,
      text: data.comment,
      ...chatMessage,
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
    // FIX: `gift` contained `creator_id` as a raw ObjectId, so JSON
    // serialisation turned it into `{ "$oid": "…" }` — unusable by clients.
    // normalizePayload() now stringifies every id in the envelope.
    emitLive(io, REALTIME_EVENTS.LIVE_GIFT, {
      ...gift,
      creator_id: creatorId,
      tiktok_username: tiktokUsername,
      stream_id: currentStreamId,
      username: data.uniqueId,
      nickname: data.nickname,
      gift_name: data.giftName,
      gift_id: data.giftId,
      repeat_count: data.repeatCount || 1,
      diamonds: giftValue,
      coins: coinValue,
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
    emitLive(io, REALTIME_EVENTS.CREATOR_VIEWERS, {
      creator_id: creatorId,
      tiktok_username: tiktokUsername,
      stream_id: currentStreamId,
      viewer_count: viewerCount,
    });
    // The frontend analytics hooks subscribe to these; the backend had never
    // emitted anything under those names.
    emitLive(io, REALTIME_EVENTS.ANALYTICS_VIEWERS, {
      creator_id: creatorId,
      stream_id: currentStreamId,
      viewer_count: viewerCount,
    });
    emitLive(io, REALTIME_EVENTS.ANALYTICS_DELTA, {
      creator_id: creatorId,
      stream_id: currentStreamId,
      metrics: { viewers: viewerCount },
    });
  });

  // Member join event - Track for fan club
  connection.on('member', async (data) => {
    if (!currentStreamId) return;

    // Track fan engagement
    await trackFanEngagement(data.uniqueId, data.nickname, currentStreamId, 'join', 1);

    emitLive(io, REALTIME_EVENTS.LIVE_JOIN, {
      creator_id: creatorId,
      tiktok_username: tiktokUsername,
      stream_id: currentStreamId,
      username: data.uniqueId,
      nickname: data.nickname,
    });
  });

  // Like event - Track engagement
  connection.on('like', async (data) => {
    if (!currentStreamId) return;

    // Track fan engagement
    await trackFanEngagement(data.uniqueId, data.nickname, currentStreamId, 'like', data.likeCount || 1);

    emitLive(io, REALTIME_EVENTS.LIVE_LIKE, {
      creator_id: creatorId,
      tiktok_username: tiktokUsername,
      stream_id: currentStreamId,
      username: data.uniqueId,
      nickname: data.nickname,
      count: data.likeCount || 1,
      total: data.totalLikeCount,
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

    emitLive(io, REALTIME_EVENTS.LIVE_SHARE, {
      creator_id: creatorId,
      tiktok_username: tiktokUsername,
      stream_id: currentStreamId,
      username: data.uniqueId,
      nickname: data.nickname,
      count: 1,
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

    emitLive(io, REALTIME_EVENTS.LIVE_FOLLOW, {
      creator_id: creatorId,
      tiktok_username: tiktokUsername,
      stream_id: currentStreamId,
      username: data.uniqueId,
      nickname: data.nickname,
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
  if (process.env.SOCKET_DEBUG === 'true') {
    console.log('[socket] connected:', socket.id);
  }

  // ----------------------------------------------------------
  // Per-user room membership
  // ----------------------------------------------------------
  // FIX: `emitToUser()` (and the old raw `io.to(`user_${userId}`)` call it
  // replaced) broadcast into a per-user room, but nothing ever joined one —
  // so every targeted notification was silently dropped on the floor and
  // `sendPushNotification()` looked like it worked while reaching nobody.
  //
  // A socket may authenticate either by passing `auth: { token }` to the
  // client constructor or later via `socket.emit('authenticate', { token })`.
  // Both paths converge on joinUserRoom(), which is idempotent.
  const joinUserRoom = (token) => {
    const payload = verifyToken(token);
    const userId = payload?.userId ?? payload?._id ?? payload?.sub;
    if (!userId) return false;
    const room = userRoom(userId);
    if (!socket.rooms.has(room)) socket.join(room);
    socket.data.userId = String(userId);
    socket.emit('authenticated', { room });
    if (process.env.SOCKET_DEBUG === 'true') {
      console.log('[socket] %s joined %s', socket.id, room);
    }
    return true;
  };

  joinUserRoom(socket.handshake?.auth?.token);
  socket.on('authenticate', ({ token } = {}) => joinUserRoom(token));

  // Creator-scoped rooms let a monitoring screen subscribe to only the
  // creators it is displaying instead of receiving the global firehose.
  socket.on('watch:creator', ({ creator_id: creatorId } = {}) => {
    if (!creatorId) return;
    socket.join(`creator:${creatorId}`);
  });
  socket.on('unwatch:creator', ({ creator_id: creatorId } = {}) => {
    if (!creatorId) return;
    socket.leave(`creator:${creatorId}`);
  });

  // Test event for Sprint 1
  socket.emit('welcome', { message: 'Connected to TikTok AI Command Center' });

  // Listen for ping
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  socket.on('disconnect', () => {
    if (process.env.SOCKET_DEBUG === 'true') {
      console.log('[socket] disconnected:', socket.id);
    }
  });
});

// ============= ERROR HANDLERS =============
// Apply error handlers AFTER all routes
app.use(notFoundHandler);
app.use(errorHandler);

// ============= STARTUP =============
const PORT = config.server.port;
const HOST = config.server.host;

/**
 * Start listening.
 *
 * FIX: this used to be a bare top-level `httpServer.listen(...)`, so the
 * module could not be imported without opening a port. That made the server
 * impossible to unit-test. It is now exported and only auto-invoked when this
 * file is the process entrypoint.
 */
export function startServer(port = PORT, host = HOST) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[boot] port ${port} is already in use`);
      }
      reject(err);
    };
    httpServer.once('error', onError);
    httpServer.listen(port, host, () => {
      httpServer.removeListener('error', onError);
      const actual = httpServer.address();
      console.log(`[boot] API listening on http://${actual.address}:${actual.port}`);
      console.log(`[boot] env=${config.env} db=${dbManager.state} trustProxy=${config.server.trustProxy}`);

      const warnings = configWarnings();
      if (warnings.length) {
        console.warn('[boot] configuration warnings:');
        warnings.forEach((w) => console.warn(`  - ${w}`));
      }
      if (!dbManager.isConnected) {
        console.warn(
          '[boot] MongoDB is not connected yet. Routes are mounted and will return 503 until it is. ' +
            `Retrying every ${Math.round(config.mongo.retryIntervalMs / 1000)}s.`
        );
      }

      try {
        setupAutomation();
      } catch (err) {
        // A broken cron job must not kill an otherwise healthy API.
        console.error('[boot] setupAutomation failed:', err.message);
      }

      resolve(httpServer);
    });
  });
}

// ============= RESILIENCE =============
// FIX: there were no process-level guards. Any throw inside a timer callback
// (cron alerts, analytics rollups, TikTok reconnects) crashed the whole API.
process.on('unhandledRejection', (reason) => {
  console.error('[process] unhandled rejection:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.error('[process] uncaught exception:', err.message);
  console.error(err.stack);
});

// ============= GRACEFUL SHUTDOWN =============
// FIX: only SIGINT was handled, but supervisor / Docker / k8s send SIGTERM, so
// every deploy hard-killed the process mid-request. The handler also called
// `client.close()` on a client that no longer exists in this scope.
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] ${signal} received — draining...`);

  // Hard deadline so a stuck connection can never wedge the shutdown.
  const forceExit = setTimeout(() => {
    console.error('[shutdown] timed out, forcing exit');
    process.exit(1);
  }, config.server.shutdownTimeoutMs);
  forceExit.unref?.();

  try {
    // FIX: cron jobs were never stopped, so they kept firing (and failing
    // against a closing DB) throughout the drain window.
    stopAutomation();

    for (const [creatorId, connection] of activeConnections.entries()) {
      try {
        connection.disconnect();
      } catch (err) {
        console.warn(`[shutdown] monitor ${creatorId}: ${err.message}`);
      }
    }
    activeConnections.clear();

    for (const [streamId, command] of activeRecordings.entries()) {
      try {
        command.kill('SIGINT');
      } catch (err) {
        console.warn(`[shutdown] recording ${streamId}: ${err.message}`);
      }
    }
    activeRecordings.clear();

    await new Promise((resolve) => io.close(resolve));
    await new Promise((resolve) => httpServer.close(resolve));
    await dbManager.close();
    console.log('[shutdown] clean exit');
    clearTimeout(forceExit);
    process.exit(0);
  } catch (err) {
    console.error('[shutdown] error:', err.message);
    clearTimeout(forceExit);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ------------------------------------------------------------
// Only listen when this file is the entrypoint, so tests can import the app.
// ------------------------------------------------------------
const isEntrypoint =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isEntrypoint) {
  startServer().catch((err) => {
    console.error('[boot] failed to start:', err.message);
    process.exit(1);
  });
}

export { app, httpServer, io, db, dbManager, config };
export default app;
