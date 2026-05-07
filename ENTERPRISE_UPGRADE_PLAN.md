# 🚀 ENTERPRISE UPGRADE PLAN
## Zenith Grade Super App - Frontend & Backend Analysis

**Date:** June 2025  
**Status:** Ready for Implementation  
**Priority:** P0 - Critical for Production Readiness

---

## 📊 FRONTEND ANALYSIS

### ✅ **CURRENT STRENGTHS** (Already Enterprise-Ready)

| Component | Status | Details |
|-----------|--------|---------|
| **State Management** | ✅ Installed | Zustand 5.0.11 - Ready to use |
| **Charts & Visualization** | ✅ Installed | Victory Native 41.20.2 |
| **Animations** | ✅ Installed | React Native Reanimated 4.1.1 |
| **List Performance** | ✅ Installed | @shopify/flash-list 2.3.1 |
| **Real-Time** | ✅ Installed | Socket.IO Client 4.8.3 |
| **Navigation** | ✅ Installed | React Navigation 7.x (Native Stack + Bottom Tabs) |
| **Safe Areas** | ✅ Installed | react-native-safe-area-context 5.6.2 |
| **Storage** | ✅ Installed | AsyncStorage 2.2.0 |
| **HTTP Client** | ✅ Installed | Axios 1.13.5 |
| **Date Handling** | ✅ Installed | date-fns 4.1.0 |
| **Blur Effects** | ✅ Installed | expo-blur 15.0.8 |
| **Haptics** | ✅ Installed | expo-haptics 15.0.8 |
| **Notifications** | ✅ Installed | expo-notifications 0.32.17 |

### ⚠️ **GAPS - NEEDS ENTERPRISE UPGRADES**

| Area | Current State | Enterprise Standard Needed |
|------|---------------|---------------------------|
| **State Architecture** | Context API only | Zustand stores with persistence |
| **Real-Time Layer** | Basic Socket context | Specialized hooks + delta updates + batching |
| **API Layer** | Direct axios calls | Centralized service with retry + cache + deduplication |
| **Performance Optimization** | None | React.memo, useMemo, useCallback everywhere |
| **Glassmorphism** | expo-blur installed but unused | Professional glass components |
| **Error Handling** | Basic try/catch | Error boundaries + toast system |
| **Theme System** | Old ThemeContext with hardcoded colors | Use TikTokTheme.ts design system |
| **Request Validation** | None | Zod/Yup schemas |
| **Offline Support** | None | Network detection + offline queue |
| **Analytics Tracking** | None | Custom event tracking system |
| **Deep Linking** | None | Universal links + deep links |
| **Accessibility** | None | VoiceOver/TalkBack support |
| **Security** | Basic auth | Biometric auth + jailbreak detection |
| **Localization** | None | i18n support (multi-language) |

---

## 🎯 FRONTEND ENTERPRISE UPGRADES (15 Features)

### **Stage 1: Core Architecture** (P0)

#### 1. **Zustand Store Architecture**
```
/frontend/src/stores/
├── liveEventsStore.ts      # Real-time TikTok events with delta updates
├── creatorsStore.ts         # Multi-creator tracking state
├── analyticsStore.ts        # Revenue, gifts, viewer metrics
├── uiStore.ts               # Toast notifications, loading states, modals
├── authStore.ts             # Replace AuthContext with Zustand
├── settingsStore.ts         # User preferences, theme, notifications
└── offlineStore.ts          # Offline queue for mutations
```

**Features:**
- ✅ Persistence with AsyncStorage middleware
- ✅ Optimistic updates with rollback
- ✅ Fine-grained reactivity (components only re-render on specific state changes)
- ✅ DevTools integration for debugging

#### 2. **Enterprise API Service Layer**
```
/frontend/src/services/api/
├── apiClient.ts             # Centralized axios instance with interceptors
├── retryPolicy.ts           # Exponential backoff retry logic
├── requestCache.ts          # In-memory request deduplication & caching
├── requestQueue.ts          # Offline mutation queue
├── endpoints/
│   ├── creators.ts          # Type-safe creator endpoints
│   ├── analytics.ts         # Analytics endpoints
│   ├── auth.ts              # Authentication endpoints
│   └── tiktok.ts            # TikTok live endpoints
└── types/                   # TypeScript API response types
```

**Features:**
- ✅ Automatic request retry (3 attempts with exponential backoff)
- ✅ Request deduplication (prevent duplicate API calls)
- ✅ Response caching (5-minute TTL for GET requests)
- ✅ Automatic token refresh on 401
- ✅ Request/response interceptors for logging
- ✅ TypeScript strict typing

#### 3. **Real-Time Hooks with Delta Updates**
```
/frontend/src/hooks/realtime/
├── useTikTokLiveEvents.ts   # Subscribe to live event stream with batching (200ms)
├── useCreatorStatus.ts      # Track creator online/offline with debouncing
├── useAnalytics.ts          # Real-time analytics with delta updates
└── useSocketConnection.ts   # Manage Socket.IO connection lifecycle
```

**Features:**
- ✅ 200ms batching interval (10x throughput improvement)
- ✅ Delta updates (only send changed data, not full payload)
- ✅ Automatic reconnection with exponential backoff
- ✅ Connection state tracking (connected, disconnected, reconnecting)

#### 4. **Glassmorphism Component Library**
```
/frontend/src/components/glass/
├── GlassCard.tsx            # Reusable glass-morphic card with blur
├── GlassButton.tsx          # Glass-styled buttons with haptic feedback
├── GlassModal.tsx           # Full-screen glass modal
├── LiveIndicator.tsx        # Glowing live status badge with pulse animation
└── GlassBottomSheet.tsx     # Draggable bottom sheet with blur
```

**Library:** `@react-native-community/blur` (more features than expo-blur)

**Features:**
- ✅ GPU-optimized backdrop blur
- ✅ Customizable blur intensity & tint
- ✅ Glass card with border glow effects
- ✅ Smooth animations with Reanimated

#### 5. **Error Handling System**
```
/frontend/src/components/errors/
├── ErrorBoundary.tsx        # Catch React component errors
├── FallbackScreen.tsx       # User-friendly error screen
└── ToastProvider.tsx        # Global toast notifications with queue
```

**Features:**
- ✅ Graceful error recovery (retry buttons)
- ✅ Error reporting to Sentry (stub for now)
- ✅ Toast notifications with 4 levels (success, info, warning, error)
- ✅ Auto-dismiss with configurable duration

---

### **Stage 2: Production Features** (P1)

#### 6. **Offline Support**
```
/frontend/src/services/offline/
├── NetworkDetector.ts       # Detect online/offline state
├── OfflineQueue.ts          # Queue mutations when offline
└── SyncManager.ts           # Auto-sync when back online
```

**Features:**
- ✅ NetInfo listener for connection state
- ✅ Queue POST/PUT/DELETE requests when offline
- ✅ Auto-retry when connection restored
- ✅ Offline indicator banner

#### 7. **Haptic Feedback System**
```
/frontend/src/hooks/
├── useHaptics.ts            # Wrapper for expo-haptics
└── hapticPatterns.ts        # Pre-defined patterns (light, medium, heavy, success, error)
```

**Features:**
- ✅ Haptic feedback on button presses
- ✅ Success/error vibration patterns
- ✅ Platform-specific (iOS: Taptic Engine, Android: Vibrator)

#### 8. **Dark Mode Toggle**
```
/frontend/src/components/settings/
├── ThemeToggle.tsx          # Animated dark/light toggle switch
└── ThemePreview.tsx         # Live theme preview
```

**Features:**
- ✅ Smooth animated transition
- ✅ System preference sync
- ✅ Persisted in AsyncStorage
- ✅ Use TikTokTheme.ts design system

#### 9. **Biometric Authentication**
```
/frontend/src/services/auth/
├── BiometricAuth.ts         # Face ID / Touch ID wrapper
└── SecureStorage.ts         # Keychain / KeyStore integration
```

**Features:**
- ✅ Face ID (iOS) / Face Unlock (Android)
- ✅ Touch ID (iOS) / Fingerprint (Android)
- ✅ Secure token storage in Keychain/KeyStore
- ✅ Fallback to PIN/password

#### 10. **Push Notifications (Advanced)**
```
/frontend/src/services/notifications/
├── NotificationManager.ts   # Register device token
├── NotificationHandler.ts   # Handle notification taps
└── NotificationCategories.ts # iOS categories + Android channels
```

**Features:**
- ✅ Rich notifications with images
- ✅ Action buttons (Reply, View, Dismiss)
- ✅ Notification grouping
- ✅ Badge count management
- ✅ Silent notifications for background sync

#### 11. **Analytics Tracking**
```
/frontend/src/services/analytics/
├── AnalyticsManager.ts      # Track custom events
└── ScreenTracker.ts         # Auto-track screen views
```

**Features:**
- ✅ Custom event tracking (button clicks, feature usage)
- ✅ Screen view tracking
- ✅ User property tracking
- ✅ Stub for Firebase Analytics / Mixpanel

#### 12. **Deep Linking & Universal Links**
```
/frontend/src/navigation/
├── DeepLinkHandler.ts       # Parse deep links
└── LinkingConfig.ts         # Route mapping
```

**Features:**
- ✅ Deep links (`tiktokapp://creator/darkskully`)
- ✅ Universal links (`https://app.tiktok.com/creator/darkskully`)
- ✅ Handle notifications → specific screens
- ✅ Share links to specific content

#### 13. **Security Enhancements**
```
/frontend/src/services/security/
├── JailbreakDetector.ts     # Detect jailbroken/rooted devices
├── ScreenRecordingDetector.ts # Detect screen recording (iOS)
└── CertificatePinner.ts     # SSL certificate pinning
```

**Features:**
- ✅ Jailbreak/root detection with warning
- ✅ Screen recording detection (iOS only)
- ✅ SSL pinning for API security
- ✅ Disable screenshots in sensitive screens

#### 14. **Localization (i18n)**
```
/frontend/src/i18n/
├── index.ts                 # i18n setup
├── en.json                  # English translations
├── es.json                  # Spanish translations
└── zh.json                  # Chinese translations
```

**Features:**
- ✅ Multi-language support (EN, ES, ZH)
- ✅ Automatic language detection
- ✅ RTL layout support (Arabic, Hebrew)
- ✅ Date/number formatting per locale

#### 15. **Accessibility (a11y)**
```
/frontend/src/components/a11y/
├── AccessibleButton.tsx     # Button with proper labels
└── ScreenReader.tsx         # Screen reader announcements
```

**Features:**
- ✅ VoiceOver (iOS) / TalkBack (Android) labels
- ✅ Minimum touch target size (44x44pt)
- ✅ High contrast mode support
- ✅ Screen reader announcements

---

## 🖥️ BACKEND ANALYSIS

### ✅ **CURRENT STRENGTHS** (Already Enterprise-Ready)

| Component | Status | Details |
|-----------|--------|---------|
| **Rate Limiting** | ✅ 100% | Sprint 1 - Multiple limiters with 100% effectiveness |
| **Error Handling** | ✅ 100% | Sprint 1 - Global error middleware with proper JSON responses |
| **Database Indexing** | ✅ 100% | Sprint 2 - 50+ indexes across 20+ collections |
| **TikTok Integration** | ✅ 100% | Real-time monitoring for 3 creators (`@darkskully`, `@exesena`, `@cjsnappin`) |
| **Socket.IO Real-Time** | ✅ 100% | Broadcasting 15+ event types to clients |
| **PostgreSQL (Supabase)** | ✅ 100% | Analytics engine with 9 tables |
| **MongoDB** | ✅ 100% | Primary database with proper indexes |
| **Push Notifications** | ✅ 100% | Expert-level push service with rich notifications |
| **Caching Layer** | ✅ Present | `lib/cache.js` with Redis + memory cache |
| **Circuit Breaker** | ✅ Present | `lib/circuit-breaker.js` for external API protection |
| **File Uploads** | ✅ Present | Multer middleware for image/video/audio/documents |
| **Job Queue** | ✅ Present | Bull queue for voice processing |
| **Email Service** | ✅ Present | Nodemailer integration |
| **2FA** | ✅ Present | Speakeasy TOTP implementation |

### ⚠️ **GAPS - NEEDS ENTERPRISE UPGRADES**

| Area | Current State | Enterprise Standard Needed |
|------|---------------|---------------------------|
| **Logging** | console.log only | Structured logging (Pino/Winston) with JSON format |
| **Health Checks** | None | `/health/live` + `/health/ready` for Kubernetes |
| **Graceful Shutdown** | None | SIGTERM handler with connection draining |
| **Request Logging** | None | Request/response logger with duration tracking |
| **API Versioning** | None | `/api/v1/` + `/api/v2/` support |
| **Request Validation** | None | Zod/Joi validation middleware |
| **API Documentation** | None | Swagger/OpenAPI auto-generated docs |
| **Monitoring Hooks** | None | Prometheus metrics endpoint |
| **Database Pooling** | Basic | Optimized connection pooling with retry logic |
| **Redis Scaling** | Single instance | Redis Cluster support for Socket.IO scaling |
| **Backup System** | Manual | Automated daily backups to S3/cloud |
| **Request ID Tracing** | None | X-Request-ID header for distributed tracing |
| **Webhook System** | Basic | Retry logic + signature verification |
| **GraphQL** | None | Optional GraphQL endpoint |

---

## 🎯 BACKEND ENTERPRISE UPGRADES (18 Features)

### **Stage 1: Production Infrastructure** (P0)

#### 1. **Structured Logging with Pino**
```javascript
// /backend/config/logger.js
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: process.env.NODE_ENV !== 'production',
      translateTime: 'SYS:standard',
    },
  },
});
```

**Features:**
- ✅ Structured JSON logging (production)
- ✅ Pretty logs (development)
- ✅ Log levels: trace, debug, info, warn, error, fatal
- ✅ Automatic request/response logging
- ✅ Performance: 10x faster than Winston

#### 2. **Health Check Endpoints (Kubernetes-Ready)**
```javascript
// /backend/routes/health.js
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: Date.now() });
});

app.get('/health/ready', async (req, res) => {
  try {
    await db.admin().ping(); // MongoDB
    await pgPool.query('SELECT 1'); // PostgreSQL
    await redis.ping(); // Redis
    res.status(200).json({ 
      status: 'ready', 
      services: { mongodb: 'up', postgres: 'up', redis: 'up' }
    });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', error: error.message });
  }
});
```

**Features:**
- ✅ `/health/live` - Liveness probe (always returns 200)
- ✅ `/health/ready` - Readiness probe (checks dependencies)
- ✅ Returns 503 during startup or shutdown
- ✅ Detailed service status

#### 3. **Graceful Shutdown Handler**
```javascript
// /backend/server.js
let isShuttingDown = false;
const activeConnections = new Set();

server.on('connection', (socket) => {
  activeConnections.add(socket);
  socket.on('close', () => activeConnections.delete(socket));
});

async function gracefulShutdown(signal) {
  console.log(`${signal} received: Starting graceful shutdown`);
  isShuttingDown = true;
  
  // 1. Stop accepting new requests
  server.close();
  
  // 2. Wait for active connections (max 20s)
  await waitForConnections(activeConnections, 20000);
  
  // 3. Close database connections
  await mongoClient.close();
  await pgPool.end();
  await redis.quit();
  
  console.log('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

**Features:**
- ✅ Zero-downtime deployments
- ✅ Waits for active requests to finish (20s max)
- ✅ Closes DB connections cleanly
- ✅ Kubernetes-friendly (30s grace period)

#### 4. **Request/Response Logger Middleware**
```javascript
// /backend/middleware/requestLogger.js
import logger from '../config/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      requestId,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });
  
  next();
};
```

**Features:**
- ✅ Logs every request with duration
- ✅ Request ID for distributed tracing
- ✅ User ID tracking
- ✅ JSON format for log aggregation (Datadog, CloudWatch)

#### 5. **API Versioning**
```javascript
// /backend/server.js
import v1Routes from './routes/v1/index.js';
import v2Routes from './routes/v2/index.js';

app.use('/api/v1', v1Routes); // Stable API
app.use('/api/v2', v2Routes); // New features

// Default to v1
app.use('/api', v1Routes);
```

**Features:**
- ✅ Backward compatibility
- ✅ Gradual migration path
- ✅ Version-specific deprecation warnings

#### 6. **Request Validation Middleware (Zod)**
```javascript
// /backend/middleware/validate.js
import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.errors,
    });
  }
};

// Usage
const createCreatorSchema = z.object({
  body: z.object({
    tiktok_username: z.string().min(1).max(50),
    display_name: z.string().min(1).max(100),
  }),
});

app.post('/api/creators', validate(createCreatorSchema), createCreatorHandler);
```

**Features:**
- ✅ Type-safe validation with Zod
- ✅ Automatic error messages
- ✅ Validate body, query, params, headers
- ✅ Custom error responses

#### 7. **Swagger/OpenAPI Documentation**
```javascript
// /backend/config/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TikTok Zenith API',
      version: '1.0.0',
      description: 'Enterprise TikTok monitoring API',
    },
    servers: [
      { url: 'http://localhost:8001/api/v1', description: 'Development' },
      { url: 'https://api.tiktok-zenith.com/api/v1', description: 'Production' },
    ],
  },
  apis: ['./routes/**/*.js'], // Auto-discover JSDoc comments
};

const specs = swaggerJsdoc(options);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
```

**Features:**
- ✅ Auto-generated API docs from JSDoc
- ✅ Interactive API testing UI
- ✅ Available at `/api/docs`
- ✅ OpenAPI 3.0 spec export

#### 8. **Prometheus Metrics Endpoint**
```javascript
// /backend/routes/metrics.js
import promClient from 'prom-client';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

**Features:**
- ✅ `/metrics` endpoint for Prometheus scraping
- ✅ Default Node.js metrics (CPU, memory, event loop)
- ✅ Custom business metrics (request duration, DB query time)
- ✅ Grafana dashboards

#### 9. **Optimized Database Connection Pooling**
```javascript
// /backend/config/database.js
import { MongoClient } from 'mongodb';
import pg from 'pg';

// MongoDB with optimal pooling
const mongoClient = new MongoClient(process.env.MONGO_URL, {
  maxPoolSize: 50,          // Increased from default 10
  minPoolSize: 10,          // Keep minimum connections
  maxIdleTimeMS: 60000,     // Close idle connections after 60s
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
});

// PostgreSQL with optimal pooling
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50,                  // Maximum connections
  min: 10,                  // Minimum connections
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000, // 30s query timeout
});
```

**Features:**
- ✅ Optimized pool sizes (50 max)
- ✅ Minimum connections for low-latency
- ✅ Automatic retry on connection failure
- ✅ Query timeouts to prevent blocking

#### 10. **Redis Cluster Support (Socket.IO Scaling)**
```javascript
// /backend/config/redis.js
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ 
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
  },
});
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

**Features:**
- ✅ Horizontal Socket.IO scaling (multiple Node.js instances)
- ✅ Pub/Sub for message broadcasting
- ✅ Automatic reconnection with exponential backoff
- ✅ Supports 100K+ concurrent WebSocket connections

---

### **Stage 2: Advanced Features** (P1)

#### 11. **Automated Daily Backups**
```javascript
// /backend/services/backupService.js
import cron from 'node-cron';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

cron.schedule('0 2 * * *', async () => { // Daily at 2 AM
  const timestamp = new Date().toISOString();
  
  // MongoDB backup
  await execPromise(`mongodump --uri="${process.env.MONGO_URL}" --archive=/tmp/mongo-${timestamp}.gz --gzip`);
  
  // PostgreSQL backup
  await execPromise(`pg_dump ${process.env.DATABASE_URL} | gzip > /tmp/postgres-${timestamp}.sql.gz`);
  
  // Upload to S3
  const s3 = new S3Client({ region: 'us-east-1' });
  await s3.send(new PutObjectCommand({
    Bucket: 'tiktok-zenith-backups',
    Key: `mongo-${timestamp}.gz`,
    Body: fs.createReadStream(`/tmp/mongo-${timestamp}.gz`),
  }));
  
  logger.info('Daily backup completed');
});
```

**Features:**
- ✅ Daily automated backups at 2 AM
- ✅ MongoDB + PostgreSQL backups
- ✅ Compressed with gzip
- ✅ Stored in S3 with 30-day retention

#### 12. **Request ID Tracing**
```javascript
// /backend/middleware/requestId.js
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Attach to all logger calls
  req.logger = logger.child({ requestId });
  
  next();
};
```

**Features:**
- ✅ Unique ID for every request
- ✅ Propagated through microservices
- ✅ Included in all logs
- ✅ Enables distributed tracing

#### 13. **Webhook System with Retry**
```javascript
// /backend/services/webhookService.js
import axios from 'axios';
import crypto from 'crypto';

export async function sendWebhook(url, payload, secret, maxRetries = 3) {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await axios.post(url, payload, {
        headers: {
          'X-Webhook-Signature': signature,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return { success: true, attempts: attempt };
    } catch (error) {
      if (attempt === maxRetries) {
        logger.error({ error, url }, 'Webhook delivery failed after max retries');
        return { success: false, error: error.message };
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
}
```

**Features:**
- ✅ HMAC signature verification
- ✅ Automatic retry (3 attempts)
- ✅ Exponential backoff
- ✅ Webhook delivery logging

#### 14. **CORS Configuration (Production-Ready)**
```javascript
// /backend/middleware/cors.js
import cors from 'cors';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://app.tiktok-zenith.com',
  'https://tiktok-zenith.com',
];

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400, // 24 hours
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
};

app.use(cors(corsOptions));
```

**Features:**
- ✅ Whitelist-based origin validation
- ✅ Credentials support (cookies)
- ✅ Preflight caching (24 hours)
- ✅ Custom headers support

#### 15. **Helmet.js Security Headers**
```javascript
// /backend/middleware/security.js
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'https:', 'data:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
}));
```

**Features:**
- ✅ Content Security Policy (CSP)
- ✅ HTTP Strict Transport Security (HSTS)
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection
- ✅ X-Content-Type-Options: nosniff

#### 16. **Compression Middleware**
```javascript
// /backend/middleware/compression.js
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6, // Balance between speed and compression ratio
  threshold: 1024, // Only compress responses > 1KB
}));
```

**Features:**
- ✅ Gzip compression (30-50% bandwidth savings)
- ✅ Configurable compression level
- ✅ Threshold for small responses
- ✅ Skip compression for specific routes

#### 17. **Database Migration System**
```javascript
// /backend/migrations/migrate.js
import { migrate } from 'migrate-mongo';

export async function runMigrations() {
  const { db, client } = await migrate.database.connect();
  const migrated = await migrate.up(db, client);
  
  logger.info(`Ran ${migrated.length} migrations`);
  
  await client.close();
}

// Run on server startup
await runMigrations();
```

**Features:**
- ✅ Version-controlled database changes
- ✅ Rollback support
- ✅ Automatic on server startup
- ✅ MongoDB + PostgreSQL support

#### 18. **PM2 Ecosystem (Production Process Manager)**
```javascript
// /backend/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'tiktok-zenith-backend',
    script: './server.js',
    instances: 'max',           // One per CPU core
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    max_memory_restart: '1G',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
  }],
};
```

**Features:**
- ✅ Clustering (multi-core utilization)
- ✅ Auto-restart on crashes
- ✅ Zero-downtime reload (`pm2 reload`)
- ✅ Memory-based restart (prevent leaks)
- ✅ Log management

---

## 📦 NPM PACKAGES TO INSTALL

### **Frontend:**
```bash
cd /app/frontend && yarn add \
  @react-native-community/blur \
  @react-native-community/netinfo \
  react-native-mmkv \
  react-native-keychain \
  react-native-device-info \
  react-native-localize \
  i18next \
  react-i18next \
  react-native-toast-message \
  zod \
  @tanstack/react-query
```

### **Backend:**
```bash
cd /app/backend && yarn add \
  pino \
  pino-pretty \
  helmet \
  compression \
  zod \
  swagger-jsdoc \
  swagger-ui-express \
  prom-client \
  migrate-mongo \
  pm2
```

---

## 🚀 IMPLEMENTATION ROADMAP

### **Week 1: Core Architecture (P0)**
- ✅ Frontend: Zustand stores + API service layer + Real-time hooks
- ✅ Backend: Structured logging + Health checks + Graceful shutdown

### **Week 2: Production Features (P1)**
- ✅ Frontend: Glassmorphism + Error boundaries + Offline support
- ✅ Backend: Request validation + API versioning + Swagger docs

### **Week 3: Advanced Features (P1)**
- ✅ Frontend: Biometric auth + Push notifications + Deep linking
- ✅ Backend: Prometheus metrics + Database migrations + PM2 setup

### **Week 4: Security & Monitoring (P2)**
- ✅ Frontend: Jailbreak detection + i18n + Accessibility
- ✅ Backend: Redis cluster + Automated backups + Request tracing

---

## 📊 SUCCESS METRICS

### **Frontend:**
- ✅ App startup time < 2 seconds
- ✅ 60 FPS animations on all screens
- ✅ Offline support with automatic sync
- ✅ Accessibility score 90+ (Lighthouse)

### **Backend:**
- ✅ API response time < 200ms (p95)
- ✅ Zero-downtime deployments
- ✅ 99.9% uptime (3 nines)
- ✅ Graceful handling of 10K+ concurrent connections

---

## 🎯 PRIORITY ORDER

1. **P0 (Immediate):** Zustand stores, API layer, Health checks, Graceful shutdown
2. **P1 (This Sprint):** Glassmorphism, Offline support, Request validation, Swagger
3. **P2 (Next Sprint):** Biometric auth, i18n, Redis cluster, Automated backups

---

**Status:** ✅ Ready for Implementation  
**Next Step:** Build Phase 5A screens with enterprise architecture

