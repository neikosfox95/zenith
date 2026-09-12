// ============================================================
// CENTRALIZED CONFIGURATION
// ------------------------------------------------------------
// Single source of truth for every environment-driven setting.
// Fixes the previous state where `process.env.X` was read ad-hoc
// across the codebase with no defaults and no validation, which
// made the server boot into a half-broken state (undefined
// MONGO_URL, undefined JWT_SECRET, hardcoded /app paths).
//
// Rules:
//   1. Nothing in the app reads process.env directly anymore —
//      import `config` from here instead.
//   2. Every value has a sane default so the process always boots.
//   3. Missing *critical* secrets degrade loudly (startup banner +
//      /api/health.warnings) instead of silently breaking auth.
// ============================================================

import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** backend/ */
export const BACKEND_ROOT = path.resolve(__dirname, '..');
/** repository root */
export const REPO_ROOT = path.resolve(BACKEND_ROOT, '..');

// Load .env from the backend directory (not the process CWD, which is
// unreliable under supervisor / pm2 / docker / npm workspaces).
// `override: false` keeps real environment variables authoritative.
const envFile = process.env.ENV_FILE || path.join(BACKEND_ROOT, '.env');
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile, override: false, quiet: true });
} else {
  dotenv.config({ override: false, quiet: true });
}

const env = process.env;

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const toInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const toList = (value, fallback = []) => {
  if (!value) return fallback;
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const NODE_ENV = env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

// ------------------------------------------------------------
// JWT
// ------------------------------------------------------------
// Previously `jwt.sign(payload, process.env.JWT_SECRET)` was called with
// JWT_SECRET undefined, which makes jsonwebtoken throw
// "secretOrPrivateKey must have a value" — i.e. *every* register / login
// request 500'd. In non-production we now derive a stable per-install
// fallback secret so auth works out of the box; in production a missing
// secret is a hard, visible failure.
const DEV_SECRET_FILE = path.join(BACKEND_ROOT, '.dev-jwt-secret');

function resolveJwtSecret() {
  if (env.JWT_SECRET && env.JWT_SECRET.trim().length > 0) {
    return { secret: env.JWT_SECRET, generated: false };
  }
  if (isProduction) {
    // Fail fast rather than silently invalidating every session on each boot.
    console.error(
      '[config] FATAL: JWT_SECRET must be set in production. Refusing to start with an ephemeral secret.'
    );
    throw new Error('JWT_SECRET is required when NODE_ENV=production');
  }
  // Persist a dev secret so tokens survive restarts.
  try {
    if (fs.existsSync(DEV_SECRET_FILE)) {
      const existing = fs.readFileSync(DEV_SECRET_FILE, 'utf8').trim();
      if (existing) return { secret: existing, generated: true };
    }
    const generated = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(DEV_SECRET_FILE, generated, { mode: 0o600 });
    return { secret: generated, generated: true };
  } catch {
    // Read-only filesystem: fall back to an ephemeral secret.
    return { secret: crypto.randomBytes(48).toString('hex'), generated: true };
  }
}

const jwtSecretInfo = resolveJwtSecret();

// ------------------------------------------------------------
// Storage paths
// ------------------------------------------------------------
// Previously hardcoded to `/app/backend/uploads` and `/app/storage`, which
// crashed the whole process with EACCES outside that exact container layout.
// Everything is now derived from BACKEND_ROOT and overridable via env.
const DATA_ROOT = env.DATA_ROOT
  ? path.resolve(env.DATA_ROOT)
  : path.join(BACKEND_ROOT, 'storage');

const UPLOADS_DIR = env.UPLOADS_DIR
  ? path.resolve(env.UPLOADS_DIR)
  : path.join(DATA_ROOT, 'uploads');

const paths = {
  backendRoot: BACKEND_ROOT,
  repoRoot: REPO_ROOT,
  dataRoot: DATA_ROOT,
  uploads: UPLOADS_DIR,
  uploadSubdirs: ['images', 'videos', 'documents', 'audio'],
  audio: env.AUDIO_STORAGE_DIR
    ? path.resolve(env.AUDIO_STORAGE_DIR)
    : path.join(DATA_ROOT, 'audio'),
  recordings: env.RECORDINGS_DIR
    ? path.resolve(env.RECORDINGS_DIR)
    : path.join(DATA_ROOT, 'recorded_streams'),
  logs: env.LOG_DIR ? path.resolve(env.LOG_DIR) : path.join(DATA_ROOT, 'logs'),
};

/**
 * Create a directory without ever taking the process down.
 * Returns null when the directory is unusable so callers can degrade
 * gracefully (e.g. refuse uploads) instead of crashing on import.
 */
export function ensureDir(target) {
  try {
    fs.mkdirSync(target, { recursive: true });
    fs.accessSync(target, fs.constants.W_OK);
    return target;
  } catch (err) {
    console.warn(`[config] directory unavailable: ${target} (${err.code || err.message})`);
    return null;
  }
}

// ------------------------------------------------------------
// CORS
// ------------------------------------------------------------
// `origin: '*'` combined with credentials is rejected by browsers and is a
// security smell. We now support an explicit allow-list while staying
// permissive by default in development.
const corsOrigins = toList(env.CORS_ORIGINS, isProduction ? [] : ['*']);

const corsOptions = {
  origin(origin, callback) {
    // Same-origin / non-browser clients (curl, mobile app) send no Origin.
    if (!origin) return callback(null, true);
    if (corsOrigins.includes('*')) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: toList(env.CORS_METHODS, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
  allowedHeaders: toList(env.CORS_ALLOWED_HEADERS, [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Request-Id',
  ]),
  credentials: toBool(env.CORS_CREDENTIALS, true),
  maxAge: toInt(env.CORS_MAX_AGE, 86400),
};

// ------------------------------------------------------------
// The config object
// ------------------------------------------------------------
export const config = {
  env: NODE_ENV,
  isProduction,
  isTest,

  server: {
    port: toInt(env.PORT, 8001),
    host: env.HOST || '0.0.0.0',
    // Behind nginx / the preview proxy, req.ip is the proxy's address unless
    // trust proxy is set. Without it, express-rate-limit buckets *every* user
    // into one IP and the 300 req/15min API limiter locks out the whole app.
    trustProxy: env.TRUST_PROXY
      ? env.TRUST_PROXY === 'true'
        ? true
        : env.TRUST_PROXY
      : isProduction
        ? 1
        : true,
    bodyLimit: env.BODY_LIMIT || '10mb',
    shutdownTimeoutMs: toInt(env.SHUTDOWN_TIMEOUT_MS, 10000),
    requestLog: toBool(env.REQUEST_LOG, !isTest),
  },

  mongo: {
    url: env.MONGO_URL || env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
    dbName: env.DB_NAME || 'zenith',
    // Never let a slow/unreachable Mongo block startup forever.
    serverSelectionTimeoutMS: toInt(env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 5000),
    connectTimeoutMS: toInt(env.MONGO_CONNECT_TIMEOUT_MS, 5000),
    maxPoolSize: toInt(env.MONGO_MAX_POOL_SIZE, 20),
    retryIntervalMs: toInt(env.MONGO_RETRY_INTERVAL_MS, 15000),
    // When true the HTTP server waits for Mongo before accepting traffic.
    // Default false: the API boots and reports 503 on DB routes, which is far
    // better than the old behaviour of mounting *no routes at all* on failure.
    blockStartup: toBool(env.MONGO_BLOCK_STARTUP, false),
  },

  redis: {
    url: env.REDIS_URL || 'redis://127.0.0.1:6379',
    enabled: toBool(env.REDIS_ENABLED, true),
  },

  jwt: {
    secret: jwtSecretInfo.secret,
    /** true when we had to synthesise a secret because JWT_SECRET was unset */
    generated: jwtSecretInfo.generated,
    expiresIn: env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: env.JWT_ISSUER || 'zenith',
  },

  bcrypt: {
    saltRounds: toInt(env.BCRYPT_SALT_ROUNDS, 10),
  },

  cors: corsOptions,
  corsOrigins,

  paths,

  uploads: {
    maxFileSize: toInt(env.UPLOAD_MAX_FILE_SIZE_MB, 100) * 1024 * 1024,
    maxFiles: toInt(env.UPLOAD_MAX_FILES, 10),
    // Serve uploads straight from disk (previously they were only reachable
    // through an authenticated route that pointed at the hardcoded path).
    publicUrl: env.UPLOADS_PUBLIC_URL || '/uploads',
  },

  ai: {
    emergentKey: env.EMERGENT_LLM_KEY || '',
    atlasKey: env.ATLAS_CLOUD_API_KEY || '',
    openaiKey: env.OPENAI_API_KEY || '',
    googleKey: env.GOOGLE_API_KEY || env.GEMINI_API_KEY || '',
    anthropicKey: env.ANTHROPIC_API_KEY || '',
  },

  smtp: {
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: toInt(env.SMTP_PORT, 587),
    secure: toBool(env.SMTP_SECURE, false),
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.SMTP_FROM || 'noreply@tiktokmonitor.com',
    get enabled() {
      return Boolean(this.user && this.pass);
    },
  },

  minio: {
    endpoint: env.MINIO_ENDPOINT || 'localhost',
    port: toInt(env.MINIO_PORT, 9000),
    accessKey: env.MINIO_ACCESS_KEY || '',
    secretKey: env.MINIO_SECRET_KEY || '',
    useSSL: toBool(env.MINIO_USE_SSL, false),
    bucket: env.MINIO_BUCKET || 'voice-audio',
    get enabled() {
      return Boolean(this.accessKey && this.secretKey);
    },
  },

  rateLimit: {
    api: { windowMs: toInt(env.RL_API_WINDOW_MS, 15 * 60 * 1000), max: toInt(env.RL_API_MAX, 300) },
    auth: { windowMs: toInt(env.RL_AUTH_WINDOW_MS, 15 * 60 * 1000), max: toInt(env.RL_AUTH_MAX, 10) },
    ai: { windowMs: toInt(env.RL_AI_WINDOW_MS, 60 * 60 * 1000), max: toInt(env.RL_AI_MAX, 50) },
    upload: {
      windowMs: toInt(env.RL_UPLOAD_WINDOW_MS, 15 * 60 * 1000),
      max: toInt(env.RL_UPLOAD_MAX, 30),
    },
    // Tests hammer a single IP; disabling avoids false 429s.
    disabled: toBool(env.RATE_LIMIT_DISABLED, isTest),
  },

  security: {
    helmet: toBool(env.HELMET_ENABLED, true),
    compression: toBool(env.COMPRESSION_ENABLED, true),
  },
};

/**
 * Human-readable list of configuration problems that do not prevent boot but
 * do prevent full functionality. Surfaced on /api/health so operators (and the
 * frontend status screen) can see exactly what is missing.
 */
export function configWarnings() {
  const warnings = [];

  if (config.jwt.generated) {
    warnings.push(
      config.isProduction
        ? 'JWT_SECRET is not set — an ephemeral secret was generated, all sessions will be invalidated on restart'
        : 'JWT_SECRET is not set — using a generated development secret (backend/.dev-jwt-secret)'
    );
  }
  if (!env.MONGO_URL && !env.MONGODB_URI) {
    warnings.push('MONGO_URL is not set — defaulting to mongodb://127.0.0.1:27017');
  }
  if (!config.ai.emergentKey && !config.ai.openaiKey && !config.ai.atlasKey) {
    warnings.push('No AI provider key configured (EMERGENT_LLM_KEY / OPENAI_API_KEY / ATLAS_CLOUD_API_KEY) — AI endpoints return 503');
  }
  if (!config.smtp.enabled) {
    warnings.push('SMTP credentials not set — email notifications are disabled');
  }
  if (config.corsOrigins.includes('*') && config.isProduction) {
    warnings.push('CORS is wide open in production — set CORS_ORIGINS to an explicit allow-list');
  }
  if (!ensureDir(config.paths.dataRoot)) {
    warnings.push(`Data directory ${config.paths.dataRoot} is not writable — uploads and recordings will fail`);
  }

  return warnings;
}

export default config;
