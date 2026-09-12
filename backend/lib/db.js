// ============================================================
// DATABASE CONNECTION MANAGER
// ------------------------------------------------------------
// Replaces the old pattern in server.js where `connectDB()` both
// opened the Mongo connection *and* mounted every route inside its
// try block. The consequence: if Mongo was slow or unreachable, the
// server still listened on the port but exposed almost no routes, so
// every request 404'd or hung — the "unstable, non-responsive
// backend" symptom.
//
// New contract:
//   * Routes are ALWAYS mounted, independent of DB state.
//   * `getDb()` throws a ServiceUnavailableError when disconnected,
//     which the error middleware turns into a clean 503.
//   * `requireDb` middleware short-circuits DB routes with 503 before
//     the handler runs.
//   * The connection is retried in the background forever, and the
//     driver's own topology reconnection handles drops.
// ============================================================

import { MongoClient, ObjectId } from 'mongodb';
import { EventEmitter } from 'events';
import config from '../config/index.js';

export class ServiceUnavailableError extends Error {
  constructor(message = 'Service temporarily unavailable', code = 'SERVICE_UNAVAILABLE', details) {
    super(message);
    this.name = 'ServiceUnavailableError';
    this.statusCode = 503;
    this.code = code;
    this.details = details;
  }
}

export const DB_STATE = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
};

class DatabaseManager extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.db = null;
    this.state = DB_STATE.DISCONNECTED;
    this.lastError = null;
    this.connectedAt = null;
    this.attempts = 0;
    this.retryTimer = null;
    this.closed = false;
  }

  /**
   * Best-effort connect. Resolves to the Db on success and to `null` on
   * failure — it never rejects, so callers cannot accidentally create an
   * unhandled rejection by not awaiting it.
   */
  async connect({ retry = true } = {}) {
    if (this.state === DB_STATE.CONNECTED) return this.db;
    if (this.state === DB_STATE.CONNECTING) return this.db;

    this.state = DB_STATE.CONNECTING;
    this.emit('state', this.state);

    try {
      this.client = new MongoClient(config.mongo.url, {
        serverSelectionTimeoutMS: config.mongo.serverSelectionTimeoutMS,
        connectTimeoutMS: config.mongo.connectTimeoutMS,
        maxPoolSize: config.mongo.maxPoolSize,
        retryReads: true,
        retryWrites: true,
      });

      await this.client.connect();
      this.db = this.client.db(config.mongo.dbName);
      // Round-trip to prove the connection is actually usable.
      await this.db.command({ ping: 1 });

      this.state = DB_STATE.CONNECTED;
      this.lastError = null;
      this.connectedAt = new Date();
      this.attempts += 1;
      console.log(`[db] connected to ${config.mongo.dbName}`);
      this.emit('state', this.state);
      this.emit('connected', this.db);
      return this.db;
    } catch (err) {
      this.attempts += 1;
      this.lastError = err;
      this.state = DB_STATE.DISCONNECTED;
      this.db = null;
      console.warn(
        `[db] connection failed (attempt ${this.attempts}): ${err.message}`
      );
      this.emit('state', this.state);
      // NOTE: deliberately *not* `emit('error', ...)`. EventEmitter treats an
      // 'error' event with no registered listener as a fatal throw, which would
      // escape this catch block and reject connect() with the original Mongo
      // error — bypassing the retry scheduling below and surfacing as an
      // unhandled rejection at startup.
      this.emit('connection-error', err);

      try {
        await this.client?.close();
      } catch {
        /* ignore */
      }
      this.client = null;

      if (retry && !this.closed) this.scheduleRetry();
      return null;
    }
  }

  scheduleRetry() {
    if (this.retryTimer || this.closed) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (!this.closed) {
        this.connect({ retry: true }).catch((err) => {
          console.warn(`[db] retry failed: ${err.message}`);
        });
      }
    }, config.mongo.retryIntervalMs);
    // Don't keep the event loop alive just for a retry.
    this.retryTimer.unref?.();
  }

  /**
   * Returns the live Db handle or throws a 503.
   * Use inside route handlers.
   */
  getDb() {
    if (this.state !== DB_STATE.CONNECTED || !this.db) {
      throw new ServiceUnavailableError(
        'Database is not available',
        'DB_UNAVAILABLE',
        { lastError: this.lastError?.message }
      );
    }
    return this.db;
  }

  /** Returns null instead of throwing — for optional/background work. */
  tryGetDb() {
    return this.state === DB_STATE.CONNECTED ? this.db : null;
  }

  get isConnected() {
    return this.state === DB_STATE.CONNECTED;
  }

  status() {
    return {
      state: this.state,
      connected: this.isConnected,
      attempts: this.attempts,
      connectedAt: this.connectedAt,
      lastError: this.lastError ? this.lastError.message : null,
      database: config.mongo.dbName,
      // Never leak credentials that may be embedded in the connection string.
      host: safeHost(config.mongo.url),
    };
  }

  async close() {
    this.closed = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.client) {
      try {
        await this.client.close();
      } catch (err) {
        console.warn(`[db] error while closing: ${err.message}`);
      }
    }
    this.client = null;
    this.db = null;
    this.state = DB_STATE.DISCONNECTED;
    this.emit('state', this.state);
  }
}

export function safeHost(url) {
  try {
    const u = new URL(url);
    return u.host;
  } catch {
    return 'unknown';
  }
}

export const dbManager = new DatabaseManager();

/** Express middleware: 503 when the DB is down, otherwise attach the handle. */
export function requireDb(req, res, next) {
  if (!dbManager.isConnected) {
    const retryAfter = Math.round(config.mongo.retryIntervalMs / 1000);
    const message =
      'The database is not reachable. The API is up, but this endpoint needs persistence.';
    // One envelope for the whole API: `error` is always an OBJECT carrying
    // message/code/statusCode. The flat `message`/`code`/`retryAfter` fields
    // are duplicated at the top level because a lot of existing screens read
    // `body.error` as a string and `body.code` directly.
    return res.status(503).json({
      error: {
        message,
        code: 'DB_UNAVAILABLE',
        statusCode: 503,
        retryAfter,
        timestamp: new Date().toISOString(),
      },
      message,
      code: 'DB_UNAVAILABLE',
      retryAfter,
      timestamp: new Date().toISOString(),
    });
  }
  req.db = dbManager.getDb();
  res.locals.db = req.db;
  next();
}

export { ObjectId };
export default dbManager;
