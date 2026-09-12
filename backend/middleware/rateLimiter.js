// ============================================================
// RATE LIMITING
// ------------------------------------------------------------
// Changes from the previous version:
//   * Limits/windows come from config (env-tunable) instead of being
//     hard-coded literals duplicated in the handler bodies.
//   * A single shared `skip` covers every health endpoint — previously only
//     `/api/health` and `/health` were exempted, so the new readiness probe
//     would have been throttled by the very limiter it is trying to report on.
//   * `RATE_LIMIT_DISABLED=true` (auto-set in NODE_ENV=test) turns every
//     limiter into a pass-through, which makes integration tests deterministic
//     instead of randomly 429-ing after ~10 requests.
//   * The reported `limit` in each 429 body is derived from the same value
//     that is actually enforced, so they can never drift apart again.
// ============================================================

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import config from '../config/index.js';

/** Paths that must never be rate limited (probes, docs). */
const EXEMPT_PATHS = new Set([
  '/health',
  '/health/ready',
  '/api/health',
  '/api/version',
  '/metrics',
]);

/** Auth endpoints are exempt from the *general* limiter — they have their own. */
const AUTH_PATHS = new Set([
  '/api/login',
  '/api/register',
  '/api/auth/login',
  '/api/auth/register',
]);

const isExempt = (req) => EXEMPT_PATHS.has(req.path);

// Combine IP + user so an authenticated user is not pooled with anonymous
// traffic sharing their NAT/proxy address.
const keyGenerator = (req) => {
  const ip = req.ip ? ipKeyGenerator(req.ip) : 'unknown';
  const userId = req.user?.userId || req.userId || '';
  return `${ip}:${userId}`;
};

const baseConfig = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator,
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  validate: {
    // We set `trust proxy` explicitly in server.js; let express-rate-limit
    // validate against that instead of warning on every boot.
    xForwardedForHeader: false,
    trustProxy: false,
  },
};

const limited = (req, res, code, message, limit) =>
  res.status(429).json({
    error: 'Too many requests',
    message,
    code,
    limit,
    retryAfter: res.getHeader('Retry-After') ?? null,
    timestamp: new Date().toISOString(),
  });

/** Wrap a limiter so it can be switched off wholesale (tests, load harnesses). */
const withKillSwitch = (limiter) => {
  if (!config.rateLimit.disabled) return limiter;
  return (req, res, next) => next();
};

// General API — 300 requests / 15 minutes
const API_LIMIT = config.rateLimit.api.max;
export const apiLimiter = withKillSwitch(
  rateLimit({
    ...baseConfig,
    windowMs: config.rateLimit.api.windowMs,
    max: API_LIMIT,
    handler: (req, res) =>
      limited(
        req,
        res,
        'API_RATE_LIMIT_EXCEEDED',
        `API rate limit exceeded. Please try again after ${Math.round(
          config.rateLimit.api.windowMs / 60000
        )} minutes.`,
        API_LIMIT
      ),
    skip: (req) => isExempt(req) || AUTH_PATHS.has(req.path),
  })
);

// Authentication — 10 requests / 15 minutes, per IP *and* path so a failed
// login cannot lock out registration on the same device.
const AUTH_LIMIT = config.rateLimit.auth.max;
export const authLimiter = withKillSwitch(
  rateLimit({
    ...baseConfig,
    windowMs: config.rateLimit.auth.windowMs,
    max: AUTH_LIMIT,
    keyGenerator: (req) => {
      const ip = req.ip ? ipKeyGenerator(req.ip) : 'unknown';
      return `auth:${ip}:${req.path || ''}`;
    },
    handler: (req, res) =>
      limited(
        req,
        res,
        'AUTH_RATE_LIMIT_EXCEEDED',
        'You have exceeded the maximum number of authentication attempts. Please try again later.',
        AUTH_LIMIT
      ),
    requestPropertyName: 'rateLimit',
    skipSuccessfulRequests: false,
    requestWasSuccessful: (req, res) => res.statusCode < 400,
    skip: isExempt,
  })
);

// AI generation — 50 requests / hour
const AI_LIMIT = config.rateLimit.ai.max;
export const aiLimiter = withKillSwitch(
  rateLimit({
    ...baseConfig,
    windowMs: config.rateLimit.ai.windowMs,
    max: AI_LIMIT,
    handler: (req, res) =>
      limited(
        req,
        res,
        'AI_RATE_LIMIT_EXCEEDED',
        'You have reached your AI request limit. Please try again later or upgrade your plan.',
        AI_LIMIT
      ),
    skip: isExempt,
  })
);

// General throughput guard — 100 requests / 15 minutes
export const speedLimiter = withKillSwitch(
  rateLimit({
    ...baseConfig,
    windowMs: 15 * 60 * 1000,
    max: 100,
    handler: (req, res) =>
      limited(req, res, 'RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please slow down.', 100),
    skip: isExempt,
  })
);

// Uploads — 10 / hour
export const uploadLimiter = withKillSwitch(
  rateLimit({
    ...baseConfig,
    windowMs: 60 * 60 * 1000,
    max: config.rateLimit.upload.max,
    handler: (req, res) =>
      limited(
        req,
        res,
        'UPLOAD_RATE_LIMIT_EXCEEDED',
        'You have reached your file upload limit. Please try again in an hour.',
        config.rateLimit.upload.max
      ),
    skip: isExempt,
  })
);

// Webhooks — 100 / minute
export const webhookLimiter = withKillSwitch(
  rateLimit({
    ...baseConfig,
    windowMs: 60 * 1000,
    max: 100,
    handler: (req, res) =>
      limited(
        req,
        res,
        'WEBHOOK_RATE_LIMIT_EXCEEDED',
        'Too many webhook requests. Please slow down.',
        100
      ),
    skip: isExempt,
  })
);

export const rateLimitInternals = { EXEMPT_PATHS, AUTH_PATHS, keyGenerator };

export default {
  apiLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter,
  speedLimiter,
  webhookLimiter,
};
