/**
 * Boots the real Express app for integration tests.
 *
 * `server.js` only calls listen() when it is the process entrypoint, so
 * importing it here gives us the fully-configured app (all 30 phase route
 * groups, AI Studio, analytics, creators) with no port bound.
 *
 * EXITING
 * -------
 * Importing server.js pulls in every third-party integration the app has
 * (tiktok-live-connector, socket.io, ioredis, bull, the AI SDKs). A couple of
 * those keep a timer or an IPC channel alive for the lifetime of the process
 * and expose no way to release it. That is fine for a server — it is supposed
 * to stay up — but it means `node --test` would hang after the last assertion
 * passes. So teardown() closes what we own and then exits explicitly once the
 * runner has flushed its report.
 */

import './env.js';

const serverModule = await import('../../server.js');

export const app = serverModule.app;
export const httpServer = serverModule.httpServer;
export const io = serverModule.io;
export const dbManager = serverModule.dbManager;
export const config = serverModule.config;

let tornDown = false;

/** Close everything the app opened, then let the test runner exit. */
export async function teardown() {
  if (tornDown) return;
  tornDown = true;

  const closeQuietly = async (label, fn) => {
    try {
      await fn();
    } catch (err) {
      console.warn(`[teardown] ${label}: ${err.message}`);
    }
  };

  await closeQuietly('socket.io', () => new Promise((resolve) => io.close(resolve)));
  await closeQuietly('http server', () => new Promise((resolve) => httpServer.close(resolve)));
  await closeQuietly('mongodb', () => dbManager.close());

  // Give the TAP reporter a tick to flush, then stop the process. Third-party
  // handles we do not own would otherwise keep the runner alive forever.
  setTimeout(() => process.exit(0), 100).unref();
}
