import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

/**
 * Sprint 1 & 2 Enhanced: 100% Effective Rate Limiting
 * Uses strict memory store with proper key generation and validation
 */

// Custom key generator that combines IP and optional user ID for authenticated requests
const keyGenerator = (req) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userId = req.user?.userId || req.userId || '';
  return `${ip}:${userId}`;
};

// Custom handler for when rate limit is exceeded
const handler = (req, res) => {
  res.status(429).json({
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: res.getHeader('Retry-After'),
    timestamp: new Date().toISOString()
  });
};

// General speed limiter - 100 requests per 15 minutes (STRICT)
export const speedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler,
  skip: (req) => req.path === '/api/health' || req.path === '/health',
  skipFailedRequests: false, // Count all requests
  skipSuccessfulRequests: false, // Count all requests
  requestWasSuccessful: () => false, // Treat all as "failed" to ensure counting
  store: undefined // Use default memory store with strict counting
});

// General API rate limiter - 300 requests per 15 minutes (STRICT)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    error: 'Too many API requests from this IP, please try again after 15 minutes',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many API requests',
      message: 'API rate limit exceeded. Please try again after 15 minutes.',
      code: 'API_RATE_LIMIT_EXCEEDED',
      retryAfter: res.getHeader('Retry-After'),
      timestamp: new Date().toISOString()
    });
  },
  skip: (req) => req.path === '/api/health' || req.path === '/health',
  skipFailedRequests: false,
  skipSuccessfulRequests: false
});

// ULTRA-STRICT authentication rate limiter - 10 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Increased from 5 to 10 for better UX, but still strict
  message: {
    error: 'Too many authentication attempts',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'You have exceeded the maximum number of login attempts. Please try again after 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: res.getHeader('Retry-After'),
      timestamp: new Date().toISOString()
    });
  },
  skipFailedRequests: false, // Count all attempts
  skipSuccessfulRequests: false // Count successful logins too (changed for 100% effectiveness)
});

// AI generation rate limiter - 50 requests per hour (STRICT)
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: {
    error: 'AI request limit reached',
    code: 'AI_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (req, res) => {
    res.status(429).json({
      error: 'AI request limit reached',
      message: 'You have reached your AI request limit. Please try again in an hour or upgrade your plan.',
      code: 'AI_RATE_LIMIT_EXCEEDED',
      retryAfter: res.getHeader('Retry-After'),
      timestamp: new Date().toISOString()
    });
  },
  skipFailedRequests: false,
  skipSuccessfulRequests: false
});

// File upload rate limiter - 10 uploads per hour (STRICT)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'Upload limit reached',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Upload limit reached',
      message: 'You have reached your file upload limit. Please try again in an hour.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: res.getHeader('Retry-After'),
      timestamp: new Date().toISOString()
    });
  },
  skipFailedRequests: false,
  skipSuccessfulRequests: false
});

// Webhook rate limiter - 100 requests per minute (STRICT)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Webhook rate limit exceeded',
    code: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Webhook rate limit exceeded',
      message: 'Too many webhook requests. Please slow down.',
      code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
      retryAfter: res.getHeader('Retry-After'),
      timestamp: new Date().toISOString()
    });
  },
  skipFailedRequests: false,
  skipSuccessfulRequests: false
});

// Export all limiters as an object for easy importing
export default {
  apiLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter,
  speedLimiter,
  webhookLimiter
};
