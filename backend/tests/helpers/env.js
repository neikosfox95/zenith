/**
 * Test environment bootstrap.
 *
 * MUST be the first import in any test file that (directly or transitively)
 * loads backend/config/index.js, because that module snapshots process.env at
 * module-evaluation time.
 *
 * `npm test` also sets NODE_ENV=test via package.json, but this file enforces
 * the values itself so a bare `node --test backend/tests` works too.
 */

import path from 'path';
import os from 'os';

process.env.NODE_ENV = 'test';

// Rate limiting makes integration tests flaky by design (the auth limiter is
// 10 requests / 15 minutes). config.rateLimit.disabled turns every limiter
// into a pass-through.
process.env.RATE_LIMIT_DISABLED = 'true';

// Quieter, faster, deterministic.
process.env.REQUEST_LOG = 'false';
process.env.HELMET_ENABLED = 'false';
process.env.COMPRESSION_ENABLED = 'false';
process.env.SOCKET_DEBUG = 'false';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-not-a-real-secret-0123456789';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_ISSUER = 'zenith';

// Point at a port nothing listens on, so "database down" is deterministic and
// fails in milliseconds rather than the 5s default.
process.env.MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:1/zenith_test';
process.env.DB_NAME = 'zenith_test';
process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS = '300';
process.env.MONGO_CONNECT_TIMEOUT_MS = '300';
process.env.MONGO_RETRY_INTERVAL_MS = '600000';
process.env.MONGO_BLOCK_STARTUP = 'false';

process.env.REDIS_ENABLED = 'false';

// Keep generated test artefacts out of the working tree.
process.env.DATA_ROOT = process.env.DATA_ROOT || path.join(os.tmpdir(), 'zenith-test-storage');

export const TEST_ENV_READY = true;
