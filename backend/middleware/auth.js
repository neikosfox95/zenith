// ============================================================
// SHARED AUTHENTICATION MIDDLEWARE
// ============================================================
//
// Before this file existed, `authenticateToken` was a closure inside
// server.js. That had a consequence nobody noticed: the route groups mounted
// from separate files — routes/creators.js, routes/analytics.js, routes/ai.js,
// routes/ai-studio.js and the 30 phaseN_routes.js files — had NO way to
// authenticate a request, and none of them tried. Every one of those endpoints
// was reachable anonymously, including ones that write and delete data.
//
// This module is the single implementation, importable by any route file, and
// it is byte-for-byte consistent with the verification in server.js (same
// secret, same issuer, same claim handling).
//
// AUTH_MODE
//   enforce    (default) — 401 when the token is missing or invalid.
//   permissive           — attach the user when a valid token is present,
//                          otherwise continue anonymously and log a warning.
//                          Use this only to audit which clients are still
//                          unauthenticated; never in production.
// ============================================================

import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const MODE = (process.env.AUTH_MODE || 'enforce').toLowerCase();
const PERMISSIVE = MODE === 'permissive';

let warnedPaths = new Set();

function extractToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) {
    const value = header.slice(7).trim();
    if (value) return value;
  }
  // Socket.IO handshake and some query-string clients.
  if (typeof req.query?.token === 'string' && req.query.token) return req.query.token;
  if (typeof req.handshake?.auth?.token === 'string') return req.handshake.auth.token;
  return null;
}

/**
 * Verify a token and return the claims, or null when invalid/absent.
 * Never throws.
 */
export function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwt.secret, { issuer: config.jwt.issuer });
  } catch {
    return null;
  }
}

/** Attach req.userId / req.user when a valid token is present; never blocks. */
export function attachUser(req, _res, next) {
  const claims = verifyToken(extractToken(req));
  if (claims) {
    req.userId = claims.userId ?? claims.id;
    req.user = { userId: req.userId, email: claims.email };
    req.authenticated = true;
  } else {
    req.authenticated = false;
  }
  next();
}

/** Require a valid token. 401 otherwise (or warn-and-continue if permissive). */
export function requireAuth(req, res, next) {
  const token = extractToken(req);
  const claims = verifyToken(token);

  if (claims) {
    req.userId = claims.userId ?? claims.id;
    req.user = { userId: req.userId, email: claims.email };
    req.authenticated = true;
    return next();
  }

  if (PERMISSIVE) {
    req.authenticated = false;
    // Log each distinct path once so the audit output stays readable.
    if (!warnedPaths.has(req.baseUrl || req.path)) {
      warnedPaths.add(req.baseUrl || req.path);
      console.warn(
        `[auth] ANONYMOUS access allowed (AUTH_MODE=permissive): ${req.method} ${req.baseUrl || req.path}` +
          (token ? ' — token present but invalid/expired' : ' — no token')
      );
    }
    return next();
  }

  const code = !token ? 'NO_TOKEN' : tokenExpired(token) ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';

  // Same shape as `authenticateToken` in server.js. Two auth middlewares that
  // answer 401 differently is how clients end up with per-screen error
  // handling and users end up seeing "Authentication required" for what is
  // really an expired session.
  const message =
    code === 'NO_TOKEN'
      ? 'This endpoint requires a bearer token.'
      : code === 'TOKEN_EXPIRED'
        ? 'Token expired'
        : 'Invalid token';

  return res.status(401).json({
    error: message,
    message,
    code,
    timestamp: new Date().toISOString(),
  });
}

function tokenExpired(token) {
  try {
    jwt.verify(token, config.jwt.secret, { issuer: config.jwt.issuer });
    return false;
  } catch (err) {
    return err.name === 'TokenExpiredError';
  }
}

/** Reset the permissive-mode warning dedupe (used by tests). */
export function resetAuthWarnings() {
  warnedPaths = new Set();
}

export const authMode = MODE;

export default { requireAuth, attachUser, verifyToken, authMode };
