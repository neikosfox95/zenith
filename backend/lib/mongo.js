// ============================================================
// SHARED MONGODB ACCESS - Analytics, Creator Management, AI
// ------------------------------------------------------------
// This module used to create its *own* MongoClient, separate from the
// one in server.js. That meant two connection pools and — critically —
// routes under /api/analytics and /api/creators failed independently of
// the main connection state. Everything now goes through the single
// dbManager so connection state is consistent app-wide.
// ============================================================

import dbManager, { ObjectId, ServiceUnavailableError } from './db.js';

/**
 * Returns the shared Db handle, connecting on first use if needed.
 * Throws ServiceUnavailableError (→ HTTP 503) when Mongo is unreachable.
 */
export async function getDb() {
  if (dbManager.isConnected) return dbManager.getDb();
  const db = await dbManager.connect({ retry: true });
  if (!db) {
    throw new ServiceUnavailableError(
      'Database is not available',
      'DB_UNAVAILABLE'
    );
  }
  return db;
}

/** Non-throwing variant for background jobs. */
export function tryGetDb() {
  return dbManager.tryGetDb();
}

export { ObjectId, ServiceUnavailableError, dbManager };
export default dbManager;
